const API_BASE = 'http://localhost:2050';
const PAGE_SIZE = 20;

let columns: string[] = [];
let totalRecords = 0;
let currentPage = 0;
let currentData: any[][] = [];

let $tableHead: JQuery<HTMLElement>;
let $tableBody: JQuery<HTMLElement>;
let $pageInfo: JQuery<HTMLElement>;
let $prevBtn: JQuery<HTMLElement>;
let $nextBtn: JQuery<HTMLElement>;
let $loading: JQuery<HTMLElement>;
let $pageJump: JQuery<HTMLInputElement>;
let $goBtn: JQuery<HTMLElement>;

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
        console.error('columns is not an array:', columns);
        return;
    }

    let html = '<tr>';
    for (const col of columns)
        html += `<th>${col}</th>`;
    
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
    let totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    
    let fromIndex = currentPage * PAGE_SIZE + 1;
    let toIndex = Math.min((currentPage + 1) * PAGE_SIZE, totalRecords);

    $pageInfo.text(
        `Page ${currentPage + 1} of ${totalPages} ` +
        `(showing ${fromIndex - 1} to ${toIndex - 1} of ${totalRecords} records)`
    );

    $prevBtn.prop('disabled', currentPage === 0);
    $nextBtn.prop('disabled', currentPage >= totalPages - 1);

    $pageJump.attr('max', totalPages);
}

async function loadPage(page: number) {
    let from = page * PAGE_SIZE;
    let to = Math.min(from + PAGE_SIZE - 1, totalRecords - 1);

    if (from >= totalRecords) 
        return loadPage(currentPage = 0);

    let data = await fetchCurrentPageRecords(from, to);
    currentData = data;
    currentPage = page;

    renderBody(data);
    renderPaginationInfo();
    $('#data-table tbody').scrollTop(0);

    $pageJump.val(currentPage + 1);
}

$(document).ready(async () => {
    $tableHead = $('#table-head');
    $tableBody = $('#table-body');
    $pageInfo = $('#page-info');
    $prevBtn = $('#prev-btn');
    $nextBtn = $('#next-btn');
    $pageJump = $('#page-jump') as JQuery<HTMLInputElement>;
    $goBtn = $('#go-btn');
    $loading = $('#loading');

    try {
        $loading.show();
        $tableBody.hide();
        let [cols, count] = await Promise.all([fetchColumns(), fetchTotalRecords()]);
        columns = cols;
        totalRecords = count;

        renderHeaders();

        await loadPage(currentPage = 0);
        
        $loading.hide();
        $tableBody.show();

        $prevBtn.on('click', () => {
            if (currentPage > 0)
                loadPage(currentPage - 1);
        });

        $nextBtn.on('click', () => {
            const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
            if (currentPage < totalPages - 1)
                loadPage(currentPage + 1);
        });

        $goBtn.on('click', () => {
            jumpToPage();
        });

        $pageJump.on('keypress', (e) => {
            if (e.key === 'Enter')
                jumpToPage();
        });

        function jumpToPage() {
            let val = parseInt($pageJump.val() as string, 10);
            let totalPages = Math.ceil(totalRecords / PAGE_SIZE);
            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                let targetPage = val - 1;
                if (targetPage !== currentPage)
                    loadPage(targetPage);                
            } else {
                $pageJump.val(currentPage + 1);
                alert(`Please enter a number between 1 and ${totalPages}.`);
            }
        }

    } catch (error) {
        console.error('Failed to initialize grid:', error);
        alert('Couldn\'t load data from server. Please retry.');
    }
});
