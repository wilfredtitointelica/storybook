import { DatePeriodEnum } from "../common/enums";

export interface QueryParametersModel {
	FilterBy?: string;
	FilterValue?: string;
	FilterOperator?: string;
	OrderBy?: string;
	SortDirection?: string;
	PageNumber?: number;
	PageSize?: number;
}

export interface FeeUpdatesPageChangeEvent {
	pageNumber: number;
	rowsPerPage: number;
	sortField: string;
	sortOrder: number;
	search: string;
}

export interface FeeUpdatesFilterOutput {
	entityIds: number[];
	brandIds: number[];
	businessIds: number[];
	period: DatePeriodEnum;
	startDate: string;
	endDate: string;
}
