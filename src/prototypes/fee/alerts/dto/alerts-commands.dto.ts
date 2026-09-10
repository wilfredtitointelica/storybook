export enum AlertsTab {
	Inbox = "inbox",
	Read = "read",
}

export interface AlertsQueryParams {
	tab: "inbox" | "read";
	alertType?: number;
	startDate?: string;
	endDate?: string;
	searchText?: string;
	lang?: string;
	bankIds?: string;
}

export interface AlertDetailQueryParams {
	alertType: number;
	createdRealDate: string;
	clientId?: number;
	alertId?: number;
}

export interface MarkAsReadCommand {
	alertIds: number[];
	alertType: number;
	clientId?: number;
	createdRealDate: string;
}

export interface MarkAsViewedCommand {
	alertType: number;
	clientId?: number;
	createdRealDate: string;
	alertId?: number;
}

export interface AlertExportParams {
	tab: "inbox" | "read";
	alertType?: number[];
	startDate?: string;
	endDate?: string;
	searchText?: string;
	pageNumber?: number;
	pageSize?: number;
	bankIds?: string;
}
