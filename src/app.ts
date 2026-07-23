import {
	fetchTotalRecords,
	fetchColumns,
	fetchCurrentPageRecords
} from './api/dataServices.js';
import {
    getPaginationState,
    setPaginationState,
    calculatePageSize,
    calculateLastPageStart,
    clampPage
} from './services/paginationServices.js';
import {
    renderHeaders,
    renderBody,
    renderPaginationInfo,
    setRenderingDependencies
} from './services/renderingServices.js';
import {
    setupPrevButton,
    setupNextButton,
    setupJumpHandler,
    setupResizeHandler
} from './handlers/eventHandlers.js';

let $tableHead: JQuery<HTMLElement>;
let $tableBody: JQuery<HTMLElement>;
let $pageInfo: JQuery<HTMLElement>;
let $prevBtn: JQuery<HTMLElement>;
let $nextBtn: JQuery<HTMLElement>;
let $pageJump: JQuery<HTMLInputElement>;
let $goBtn: JQuery<HTMLElement>;

export async function loadPage(page: number, updateAnchor: boolean = true, forceLastPage: boolean = false) {
    let state = getPaginationState();
    let totalPages = Math.ceil(state.totalRecords / state.pageSize);
    let from: number;
    let to: number;

    page = clampPage(page);

    if (forceLastPage) {
        from = Math.max(0, state.totalRecords - state.pageSize);
        to = Math.min(from + state.pageSize - 1, state.totalRecords - 1);
        page = totalPages - 1;
    } else {
        let lastPageStart = calculateLastPageStart();
        if (state.currentStart < 0) setPaginationState({ currentStart: 0 });
        if (state.currentStart > lastPageStart) setPaginationState({ currentStart: lastPageStart });

        from = state.currentStart;
        to = Math.min(from + state.pageSize - 1, state.totalRecords - 1);

        if (from > to) {
            from = page * state.pageSize;
            to = Math.min(from + state.pageSize - 1, state.totalRecords - 1);
            setPaginationState({ currentStart: from });
        }
    }

    if (updateAnchor)
        setPaginationState({ currentTopRecordIndex: from });

    let data = await fetchCurrentPageRecords(from, to);

	setPaginationState({ currentPage: page, currentData: data });

    renderBody(data);
    renderPaginationInfo();
    $pageJump.val(page + 1);
}

jQuery(async ($) => {
    $tableHead = $('#table-head');
    $tableBody = $('#table-body');
    $pageInfo = $('#page-info');
    $prevBtn = $('#prev-btn');
    $nextBtn = $('#next-btn');
    $pageJump = $('#page-jump') as JQuery<HTMLInputElement>;
    $goBtn = $('#go-btn');

    setRenderingDependencies($tableHead, $tableBody, $pageInfo, $prevBtn, $nextBtn, $pageJump);

    try {
        let [cols, count, sampleData] = await Promise.all([
            fetchColumns(),
			fetchTotalRecords(),
            fetchCurrentPageRecords(0, 0)
        ]);

        renderHeaders(cols);
        renderBody(sampleData);

        let wrapper = document.querySelector('.table-wrapper') as HTMLElement;
        let pageSize = calculatePageSize(wrapper);
        setPaginationState({ totalRecords: count, pageSize, currentStart: 0 });

        await loadPage(0, true);

        setupPrevButton($prevBtn, $nextBtn, $pageJump);
        setupNextButton($prevBtn, $nextBtn, $pageJump);
        setupJumpHandler($goBtn, $pageJump);
        setupResizeHandler();

    } catch (error) {
        console.error('Failed to populate grid:', error);
        alert('Couldn\'t load data from server. Please retry.');
    }
});
