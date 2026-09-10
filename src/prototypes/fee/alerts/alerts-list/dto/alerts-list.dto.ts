import { AlertsTab } from "../../dto/alerts-commands.dto";
import { AlertType } from "../../alerts-filter/dto/alerts-filter.dto";
import { BrandBreakdown } from "../../dto/alerts-responses.dto";

export interface ListItem {
	id: string;
	alertType: number;
	createdRealDate: string;
	billingDate: string;
	titleTermKey: string;
	type: AlertType;
	title: string;
	badge: Badge;
	brands: Brand[];
	date: string;
	totalCount: number;
	brandBreakdown: BrandBreakdown[] | null;
	totalAmount: number | null;
	currencyCode: string | null;
	klass: string;
	folder: AlertsTab;
	isUnread: boolean;
	isViewed: boolean;
	alertIds: number[];
	// Custom-only fields
	customAlertId?: number;
	feeCode?: string;
	configurationType?: number;
	thresholdValue?: number;
	thresholdUnit?: number;
	// Group profile fields (DRF-009)
	bankid?: number;
	bankName?: string;
}

export type Brand = "visa" | "mastercard" | "amex";

interface Badge {
	icon: string;
	termKey: string;
}

export interface TotalItemsEvent {
	type: AlertsTab;
	total: number;
}
