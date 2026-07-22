import { PaginationState } from '../models/types.js';

let state: PaginationState = {
	currentPage: 0,
	pageSize: 20,
	totalRecords: 0,
	currentStart: 0,
	currentTopRecordIndex: 0,
	currentData: []
};

export function getPaginationState(): PaginationState {
    return state;
}

export function setPaginationState(newState: Partial<PaginationState>) {
    Object.assign(state, newState);
}

export function calculatePageSize(wrapperElement: HTMLElement | null): number {
    if (!wrapperElement) return 20;

    let thead = document.querySelector('#data-table thead') as HTMLElement;
    let headerHeight = thead ? thead.offsetHeight : 40;

    let firstRow = document.querySelector('#data-table tbody tr') as HTMLElement;
    if (!firstRow) return 20;

    let rowHeight = firstRow.offsetHeight;
    let availableHeight = wrapperElement.clientHeight - headerHeight;
    let fittingRows = Math.floor(availableHeight / rowHeight);
    let calculatedSize = Math.max(1, fittingRows);

    return state.totalRecords > 0 ? Math.min(calculatedSize, state.totalRecords) : calculatedSize;
}

export function findPageForRecord(recordIndex: number): number {
    let totalPages = Math.ceil(state.totalRecords / state.pageSize);
    if (totalPages === 0) return 0;

    let low = 0;
    let high = totalPages - 1;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let start = mid * state.pageSize;
        let end = Math.min(start + state.pageSize - 1, state.totalRecords - 1);

        if (recordIndex >= start && recordIndex <= end)
            return mid;
        else if (recordIndex < start)
            high = mid - 1;
        else
            low = mid + 1;
    }

    let fallbackPage = Math.floor(recordIndex / state.pageSize);
    return Math.max(0, Math.min(totalPages - 1, fallbackPage));
}

export function calculateLastPageStart(): number {
    return Math.max(0, state.totalRecords - state.pageSize);
}

export function clampPage(page: number): number {
    let totalPages = Math.ceil(state.totalRecords / state.pageSize);
    return Math.max(0, Math.min(page, totalPages - 1));
}
