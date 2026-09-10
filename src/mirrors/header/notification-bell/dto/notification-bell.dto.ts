export enum NotificationTab {
	Brand = 0,
	Incontrol = 1,
}
export interface Option {
	key: string;
	name: string;
}
export interface ActionResult {
	recipientId: string;
	isRead: boolean;
	readAt?: string | null;
	isHidden: boolean;
	hiddenAt?: string | null;
}

export type NotificationStatus = "approved" | "rejected" | "pending";
