export interface PaginationState {
	currentPage: number;
	pageSize: number;
	totalRecords: number;
	currentStart: number;
	currentTopRecordIndex: number;
	currentData: any[][];
}
