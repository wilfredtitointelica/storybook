import { QueryParametersModel } from "intelica-library-project";
import { PaginationRequest } from "../../common/DTO/common-requests";
import { SortOrderEnum } from "../../common/enums/common.enum";

export class OptOutServiceFilterCommand extends PaginationRequest {
	bankId: number[] = [];
	brandId: number[] = [];
	businessId: number[] = [];
	PeriodType: number = 0;
	startDate: string = "";
	endDate: string = "";
	__refresh: number = 0;

	constructor(init?: Partial<OptOutServiceFilterCommand>) {
		super();
		Object.assign(this, init);
	}

	applyQueryParameters(params: QueryParametersModel): void {
		this.searchField = params.FilterBy;
		this.searchText = params.FilterValue;
		this.searchType = params.FilterOperator ? parseInt(params.FilterOperator) : undefined;
		this.sortOrder = params.SortDirection === "asc" ? SortOrderEnum.Ascending : SortOrderEnum.Descending;
		this.sortField = params.OrderBy;
		this.pageNumber = params.PageNumber ?? 1;
		this.pageSize = params.PageSize ?? 10;
	}
}

export interface OptOutServiceFilter {
	bankId: number[];
	brandId: number[];
	businessId: number[];
	dates: Date[];
	dateTypeId: number;
}

export interface OptOutSteps {
	bankId: number;
	opcId: number;
	isBill: boolean;
}

export interface OptOutUnsubscribedDto {
	clientId: number;
	opcId: number;
}
