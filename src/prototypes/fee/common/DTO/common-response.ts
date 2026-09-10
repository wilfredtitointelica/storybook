export interface PaginationResponse<T> {
	items: T[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	summary: T;
}

export interface BasicItemResponse {
	id: number;
	name: string;
}
