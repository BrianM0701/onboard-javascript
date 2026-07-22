import {
    getPaginationState,
    setPaginationState,
    calculatePageSize,
    findPageForRecord,
    calculateLastPageStart,
    clampPage
} from '../services/paginationServices.js';
import { loadPage } from '../app.js';

export function setupPrevButton($prevBtn: JQuery<HTMLElement>, $nextBtn: JQuery<HTMLElement>, $pageJump: JQuery<HTMLInputElement>) {
    $prevBtn.on('click', async () => {
        $prevBtn.prop('disabled', true);
        $nextBtn.prop('disabled', true);
        $pageJump.prop('readonly', true);

        let state = getPaginationState();

        if (state.currentPage > 0) {
            let newStart = state.currentStart - state.pageSize;
            if (newStart < 0) newStart = 0;
            setPaginationState({ currentStart: newStart });
            await loadPage(state.currentPage - 1, true);
        }

        let updatedState = getPaginationState();
        let totalPages = Math.ceil(updatedState.totalRecords / updatedState.pageSize);

        $prevBtn.prop('disabled', updatedState.currentPage === 0);
        $nextBtn.prop('disabled', updatedState.currentPage >= totalPages - 1);
        $pageJump.prop('readonly', false);
    });
}

export function setupNextButton($prevBtn: JQuery<HTMLElement>, $nextBtn: JQuery<HTMLElement>, $pageJump: JQuery<HTMLInputElement>) {
    $nextBtn.on('click', async () => {
        $prevBtn.prop('disabled', true);
        $nextBtn.prop('disabled', true);
        $pageJump.prop('readonly', true);

        let state = getPaginationState();
        let totalPages = Math.ceil(state.totalRecords / state.pageSize);

        if (state.currentPage < totalPages - 1) {
            let newStart = state.currentStart + state.pageSize;
            let lastPageStart = calculateLastPageStart();

            if (newStart > lastPageStart)
                newStart = lastPageStart;

            setPaginationState({ currentStart: newStart });
            await loadPage(state.currentPage + 1, true);
        }

        let updatedState = getPaginationState();
        let totalPagesUpdated = Math.ceil(updatedState.totalRecords / updatedState.pageSize);

        $prevBtn.prop('disabled', updatedState.currentPage === 0);
        $nextBtn.prop('disabled', updatedState.currentPage >= totalPagesUpdated - 1);
        $pageJump.prop('readonly', false);
    });
}

export function setupJumpHandler($goBtn: JQuery<HTMLElement>, $pageJump: JQuery<HTMLInputElement>) {
    function jumpToPage() {
        let val = parseInt($pageJump.val() as string, 10);
        let state = getPaginationState();
        let totalPages = Math.ceil(state.totalRecords / state.pageSize);

        if (!isNaN(val) && val >= 1 && val <= totalPages) {
            let targetPage = val - 1;
            if (targetPage !== state.currentPage) {
                let jumpCount = targetPage - state.currentPage;
                let newStart = state.currentStart + state.pageSize * jumpCount;
                let lastPageStart = calculateLastPageStart();
                if (newStart < 0) newStart = 0;
                if (newStart > lastPageStart) newStart = lastPageStart;

                setPaginationState({
                    currentStart: newStart,
                    currentPage: targetPage
                });
                loadPage(targetPage, true);
            }
        } else {
            $pageJump.val(state.currentPage + 1);
            alert(`Please enter a number between 1 and ${totalPages}.`);
        }
    }

    $goBtn.on('click', jumpToPage);
    $pageJump.on('keypress', (e) => {
        if (e.key === 'Enter') jumpToPage();
    });
}

export function setupResizeHandler() {
    let resizeTimer: number;
    $(window).on('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(async () => {
            await handleResize();
        }, 200);
    });
}

export async function handleResize() {
    let wrapper = document.querySelector('.table-wrapper') as HTMLElement;
    let newSize = calculatePageSize(wrapper);

    let state = getPaginationState();
    if (newSize === state.pageSize) return;

    setPaginationState({ pageSize: newSize });

    let lastPageStart = calculateLastPageStart();
    let isOnLastPage = state.currentTopRecordIndex >= lastPageStart;

    if (isOnLastPage) {
        setPaginationState({ currentStart: lastPageStart });
        await loadPage(0, false, true);
    } else {
        let newPage = findPageForRecord(state.currentTopRecordIndex);
        newPage = clampPage(newPage);
        setPaginationState({
            currentStart: newPage * state.pageSize,
            currentPage: newPage
        });
        await loadPage(newPage, false);
    }
}
