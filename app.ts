const API_BASE = 'http://localhost:2050';

let columns: string[] = [];
let totalRecords = 0;
let currentPage = 0;
let currentTopRecordIndex = 0;
let currentData: any[][] = [];
let pageSize = 20;

let $tableHead: JQuery<HTMLElement>;
let $tableBody: JQuery<HTMLElement>;
let $pageInfo: JQuery<HTMLElement>;
let $prevBtn: JQuery<HTMLElement>;
let $nextBtn: JQuery<HTMLElement>;
let $loading: JQuery<HTMLElement>;
let $pageJump: JQuery<HTMLInputElement>;
let $goBtn: JQuery<HTMLElement>;
let $wrapper: JQuery<HTMLElement>;

function calculatePageSize(): number {
    let wrapper = document.querySelector('.table-wrapper') as HTMLElement;
    if (!wrapper) return 20;

    let thead = document.querySelector('#data-table thead') as HTMLElement;
    let headerHeight = thead ? thead.offsetHeight : 40;

    let firstRow = document.querySelector('#data-table tbody tr') as HTMLElement;
    if (!firstRow) return 20;

    let rowHeight = firstRow.offsetHeight;
    let availableHeight = wrapper.clientHeight - headerHeight;
    let fittingRows = Math.floor(availableHeight / rowHeight);
    let calculatedSize = Math.max(1, fittingRows);

    return totalRecords > 0 ? Math.min(calculatedSize, totalRecords) : calculatedSize;
}

async function fetchTotalRecords(): Promise<number> {
    let url = `${API_BASE}/recordCount`;
    let count = await $.get(url);
    return Number(count);
}

async function fetchColumns(): Promise<string[]> {
    let url = `${API_BASE}/columns`;
    let cols = await $.get(url);
    if (typeof cols === 'string')
        return JSON.parse(cols);
    return cols;
}

async function fetchCurrentPageRecords(from: number, to: number): Promise<any[][]> {
    let url = `${API_BASE}/records?from=${from}&to=${to}`;
    let data = await $.get(url);
    if (typeof data === 'string')
        return JSON.parse(data);
    return data;
}

function renderHeaders() {
    if (!Array.isArray(columns)) {
        console.error('Columns is not an array:', columns);
        return;
    }
    let html = '<tr>';
    for (let cell of columns)
        html += `<th>${cell}</th>`;
    html += '</tr>';
    $tableHead.html(html);
}

function renderBody(data: any[][]) {
    let html = '';
    for (let row of data) {
        html += '<tr>';
        for (let cell of row)
            html += `<td>${cell}</td>`;
        html += '</tr>';
    }
    $tableBody.html(html);
}

function renderPaginationInfo() {
    let totalPages = Math.ceil(totalRecords / pageSize);
    let fromIndex = currentPage * pageSize + 1;
    let toIndex = Math.min((currentPage + 1) * pageSize, totalRecords);

    $pageInfo.text(
        `Page ${currentPage + 1} of ${totalPages} ` +
        `(showing ${fromIndex - 1} to ${toIndex - 1} of ${totalRecords} records)`
    );

    $prevBtn.prop('disabled', currentPage === 0);
    $nextBtn.prop('disabled', currentPage >= totalPages - 1);
    $pageJump.attr('max', totalPages);
}

async function loadPage(page: number, updateAnchor: boolean = true) {
    let from = page * pageSize;
    let to = Math.min(from + pageSize - 1, totalRecords - 1);

    if (from >= totalRecords) {
        let totalPages = Math.ceil(totalRecords / pageSize);
        page = Math.max(0, totalPages - 1);
        from = page * pageSize;
        to = Math.min(from + pageSize - 1, totalRecords - 1);
    }

	if(updateAnchor)
    	currentTopRecordIndex = from;

    let data = await fetchCurrentPageRecords(from, to);
    currentData = data;
    currentPage = page;

    renderBody(data);
    renderPaginationInfo();
    $pageJump.val(currentPage + 1);
}

async function loadPageContainingRecord(recordIndex: number) {
    let index = Math.max(0, Math.min(recordIndex, totalRecords - 1));
    let page = Math.floor(index / pageSize);
    await loadPage(page, false);
}

async function handleResize() {
    let newSize = calculatePageSize();
    if (newSize !== pageSize) {
        pageSize = newSize;
        await loadPageContainingRecord(currentTopRecordIndex);
    }
}

jQuery(async ($) => {
    $tableHead = $('#table-head');
    $tableBody = $('#table-body');
    $pageInfo = $('#page-info');
    $prevBtn = $('#prev-btn');
    $nextBtn = $('#next-btn');
    $pageJump = $('#page-jump') as JQuery<HTMLInputElement>;
    $goBtn = $('#go-btn');
    $loading = $('#loading');
    $wrapper = $('.table-wrapper');

    try {

        let [cols, count, sampleData] = await Promise.all([
            fetchColumns(),
            fetchTotalRecords(),
            fetchCurrentPageRecords(0, 0)]);
        columns = cols;
        totalRecords = count;

        renderHeaders();

        renderBody(sampleData);

        pageSize = calculatePageSize();

        await loadPage(0);

        $prevBtn.on('click', async () => {
            $prevBtn.prop('disabled', true);
            $nextBtn.prop('disabled', true);
			$pageJump.prop('readonly', true);

            if (currentPage > 0)
                await loadPage(currentPage - 1);

            $prevBtn.prop('disabled', currentPage === 0);
            $nextBtn.prop('disabled', currentPage >= Math.ceil(totalRecords / pageSize) - 1);
			$pageJump.prop('readonly', false);
        });

        $nextBtn.on('click', async () => {
            $prevBtn.prop('disabled', true);
            $nextBtn.prop('disabled', true);
			$pageJump.prop('readonly', true);

            let totalPages = Math.ceil(totalRecords / pageSize);
            if (currentPage < totalPages - 1)
                await loadPage(currentPage + 1);

            $prevBtn.prop('disabled', currentPage === 0);
            $nextBtn.prop('disabled', currentPage >= totalPages - 1);
			$pageJump.prop('readonly', false);
        });

        $goBtn.on('click', jumpToPage);

        $pageJump.on('keypress', (e) => {
            if (e.key === 'Enter')
                jumpToPage();
        });

        function jumpToPage() {
            let val = parseInt($pageJump.val() as string, 10);
            let totalPages = Math.ceil(totalRecords / pageSize);
            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                let targetPage = val - 1;
                if (targetPage !== currentPage)
                    loadPage(currentPage = targetPage);
            } else {
                $pageJump.val(currentPage + 1);
                alert(`Please enter a number between 1 and ${totalPages}.`);
            }
        }

        let resizeTimer: number;
        $(window).on('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(async () => {
                await handleResize();
            }, 200);
        });

    } catch (error) {
        console.error('Failed to populate grid:', error);
        alert('Couldn\'t load data from server. Please retry.');
    }
});
