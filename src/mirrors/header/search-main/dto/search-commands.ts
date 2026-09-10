export interface SearchCommand {
	type: SearchType;
	text: string;
}

export interface SearchRecentCreateCommand {
	type: SearchType;
	entityId: number;
	title: string;
	action: any;
}

export enum SearchType {
	FEES = "fees",
	REPORTS = "reports",
	DASHBOARDS = "dashboards",
	ALL = "",
}

export enum FeeSection {
	Core = "CORE_FEES",
	NonCore = "NON_CORE_FEES",
	Category = "FEE_CATEGORY",
}
