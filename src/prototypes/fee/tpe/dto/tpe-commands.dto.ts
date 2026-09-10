export interface TpeRangeParams {
	client: number;
	from: string;
	to: string;
}

export interface TpeRangeIcasParams extends TpeRangeParams {
	icas?: string[] | null;
}

export interface TpeSelectionParams extends TpeRangeIcasParams {
	fees?: number[] | null;
	merchant?: string;
}

export interface TpeReportParams extends TpeRangeIcasParams {
	fees?: number[] | null;
	pageNumber?: number;
	pageSize?: number;
	searchText?: string | null;
	searchType?: number | string | null;
	searchField?: string | null;
	sortField?: string | null;
	sortOrder?: number | string | null;
	includeTerminalId?: boolean | null;
	includeSubprogramId?: boolean | null;
	includeResponseCode?: boolean | null;
}

export interface SendMailCommand {
	subject: string;
	body: string;
	blindCopy: string[];
}
