import { DatePeriodEnum } from "../common/enums";

export interface FeeDetailHistoryQuery {
	feeId: string;
	bankId: number;
	brandId: number;
	startDate: string;
	endDate: string;
	period: DatePeriodEnum;
	pageNumber: number;
	pageSize: number;
	sortField: string;
	sortOrder: number;
}

export interface FeeDetailChartQuery {
	feeId: string;
	bankId: number;
	startDate: string;
	endDate: string;
	period: DatePeriodEnum;
}

export interface FeeDetailKpiQuery {
	feeId: string;
	bankId: number;
	brandId: number;
	startDate: string;
	endDate: string;
	period: DatePeriodEnum;
}

export interface FeeDetailFilterOutput {
	period: DatePeriodEnum;
	startDate: string;
	endDate: string;
}

export interface FeeDetailPageChangeEvent {
	pageNumber: number;
	rowsPerPage: number;
	sortField: string;
	sortOrder: number;
}
