const API_BASE = 'http://localhost:2050';

let columns: string[] = [];
let totalRecords = 0;
let currentPage = 0;
let currentTopRecordIndex = 0;
let currentData: any[][] = [];
let pageSize = 5;

let isForwardNavigation = true;
let hasRemainder: boolean = false;

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

function getPageStart(page: number): number {
    let totalPages = Math.ceil(totalRecords / pageSize);
    let remainder = totalRecords % pageSize;

    if (remainder === 0)
        return page * pageSize;

    if (isForwardNavigation) {
        if (page === totalPages - 1)
            return Math.max(0, totalRecords - pageSize);

        return page * pageSize;
    }

    if (page === 0)
        return 0;
    else if (page === 1) {
        let overlap = pageSize - remainder;
        return Math.max(0, pageSize - overlap);
    }

    return page * pageSize;
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

    let actualStart = getPageStart(currentPage);
    let actualEnd = Math.min(actualStart + pageSize - 1, totalRecords - 1);

    $pageInfo.text(
        `Page ${currentPage + 1} of ${totalPages} ` +
        `(showing ${actualStart} to ${actualEnd} of ${totalRecords} records)`
    );

    $prevBtn.prop('disabled', currentPage === 0);
    $nextBtn.prop('disabled', currentPage >= totalPages - 1);
    $pageJump.attr('max', totalPages);
}

async function loadPage(page: number, updateAnchor: boolean = true) {
    let totalPages = Math.ceil(totalRecords / pageSize);

    if (page >= totalPages)
        page = totalPages - 1;
    else if (page < 0)
        page = 0;

    let from = getPageStart(page);
    let to = Math.min(from + pageSize - 1, totalRecords - 1);

    if (from > to) {
        from = 0;
        to = Math.min(pageSize - 1, totalRecords - 1);
    }

    if (updateAnchor)
        currentTopRecordIndex = from;

    let data = await fetchCurrentPageRecords(from, to);
    currentData = data;
    currentPage = page;

    renderBody(data);
    renderPaginationInfo();
    $pageJump.val(currentPage + 1);
}

function findPageForRecord(recordIndex: number): number {
    let totalPages = Math.ceil(totalRecords / pageSize);
    if (totalPages === 0) return 0;

    let low = 0;
    let high = totalPages - 1;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let start = getPageStart(mid);
        let end = Math.min(start + pageSize - 1, totalRecords - 1);

        if (recordIndex >= start && recordIndex <= end)
            return mid;
        else if (recordIndex < start)
            high = mid - 1;
        else
            low = mid + 1;

    }

    let fallbackPage = Math.floor(recordIndex / pageSize);
    return Math.max(0, Math.min(totalPages - 1, fallbackPage));
}

async function handleResize() {
    let newSize = calculatePageSize();
    if (newSize !== pageSize) {
        pageSize = newSize;
        hasRemainder = (totalRecords % pageSize) !== 0;

        let page = findPageForRecord(currentTopRecordIndex);
        await loadPage(page, false);
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
            fetchCurrentPageRecords(0, 0)
        ]);
        columns = cols;
        totalRecords = count;

        renderHeaders();
        renderBody(sampleData);
        pageSize = calculatePageSize();
        hasRemainder = (totalRecords % pageSize) !== 0;
        isForwardNavigation = true;

        await loadPage(0, true);

        $prevBtn.on('click', async () => {
            $prevBtn.prop('disabled', true);
            $nextBtn.prop('disabled', true);
            $pageJump.prop('readonly', true);

            if (currentPage > 0) {
                isForwardNavigation = false;
                await loadPage(currentPage - 1, true);
            }

            $prevBtn.prop('disabled', currentPage === 0);
            $nextBtn.prop('disabled', currentPage >= Math.ceil(totalRecords / pageSize) - 1);
            $pageJump.prop('readonly', false);
        });

        $nextBtn.on('click', async () => {
            $prevBtn.prop('disabled', true);
            $nextBtn.prop('disabled', true);
            $pageJump.prop('readonly', true);

            let totalPages = Math.ceil(totalRecords / pageSize);
            if (currentPage < totalPages - 1) {
                isForwardNavigation = true;
                await loadPage(currentPage + 1, true);
            }

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
                if (targetPage !== currentPage) {
                    if (targetPage > currentPage)
                        isForwardNavigation = true;
                    else if (targetPage < currentPage)
                        isForwardNavigation = false;

					currentPage = targetPage;
                    loadPage(currentPage, true);
                }
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
