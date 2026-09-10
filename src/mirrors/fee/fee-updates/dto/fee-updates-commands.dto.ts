import { FeeUpdatesTabEnum } from "../common/enums";

export interface FeeUpdatesSummaryQuery {
	entityIds: number[];
	brandIds: number[];
	businessIds: number[];
	startDate: string;
	endDate: string;
}

export interface FeeUpdatesTableQuery {
	tab: FeeUpdatesTabEnum;
	entityIds: number[];
	brandIds: number[];
	businessIds: number[];
	startDate: string;
	endDate: string;
	pageNumber: number;
	pageSize: number;
	sortField: string;
	sortOrder: number;
	search: string;
}

export interface FeeUpdatesExportCommand {
	tab: FeeUpdatesTabEnum;
	entityIds: number[];
	brandIds: number[];
	businessIds: number[];
	startDate: string;
	endDate: string;
	sortField: string;
	sortOrder: number;
	search: string;
}
