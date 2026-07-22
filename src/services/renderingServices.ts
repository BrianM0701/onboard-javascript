import { getPaginationState } from './paginationServices.js';

let $tableHead: JQuery<HTMLElement>;
let $tableBody: JQuery<HTMLElement>;
let $pageInfo: JQuery<HTMLElement>;
let $prevBtn: JQuery<HTMLElement>;
let $nextBtn: JQuery<HTMLElement>;
let $pageJump: JQuery<HTMLInputElement>;

export function setRenderingDependencies(
    tableHead: JQuery<HTMLElement>,
    tableBody: JQuery<HTMLElement>,
    pageInfo: JQuery<HTMLElement>,
    prevBtn: JQuery<HTMLElement>,
    nextBtn: JQuery<HTMLElement>,
    pageJump: JQuery<HTMLInputElement>
) {
    $tableHead = tableHead;
    $tableBody = tableBody;
    $pageInfo = pageInfo;
    $prevBtn = prevBtn;
    $nextBtn = nextBtn;
    $pageJump = pageJump;
}

export function renderHeaders(columns: string[]) {
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

export function renderBody(data: any[][]) {
    let html = '';
    for (let row of data) {
        html += '<tr>';
        for (let cell of row)
            html += `<td>${cell}</td>`;
        html += '</tr>';
    }
    $tableBody.html(html);
}

export function renderPaginationInfo(from: number = 0, to: number = 0) {
    let state = getPaginationState();
    let totalPages = Math.ceil(state.totalRecords / state.pageSize);
    let fromIndex = from === 0 ? state.currentStart : from;
    let toIndex = to === 0 ? Math.min(fromIndex + state.pageSize - 1, state.totalRecords - 1) : to;

    $pageInfo.text(
        `Page ${state.currentPage + 1} of ${totalPages} ` +
        `(showing ${fromIndex} to ${toIndex} of ${state.totalRecords} records)`
    );

    $prevBtn.prop('disabled', state.currentPage === 0);
    $nextBtn.prop('disabled', state.currentPage >= totalPages - 1);
    $pageJump.attr('max', totalPages);
}
