import { SearchTypeEnum, SortOrderEnum } from "../enums/common.enum";

export class PaginationRequest {
	pageNumber: number = 1;
	pageSize: number = 10;

	searchText?: string;
	searchType?: SearchTypeEnum;
	searchField?: string;
	sortField?: string;
	sortOrder?: SortOrderEnum = SortOrderEnum.Ascending;

	clearPagination(): void {
		this.pageNumber = 1;
		this.pageSize = 10;
		this.searchText = undefined;
		this.searchType = undefined;
		this.searchField = undefined;
		this.sortField = undefined;
		this.sortOrder = undefined;
	}
	changePageNumber(pageNumber: number): void {
		this.pageNumber = pageNumber;
	}
}

export interface SendMailCommand {
	blindCopy: string[];
	subject: string;
	body: string;
}
