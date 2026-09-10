import { BasicItemResponse } from "../../dto/landing-responses.dto";

export type Brand = "visa" | "mastercard" | "amex";

export interface AnnouncementItem {
	documentId: number;
	brandId: number;
	brandIcon: string;
	finantialTitle: string;
	financialImpactType: BasicItemResponse[];
	business: BasicItemResponse[];
	effectiveDateShort: string;
	finantialDescription: string;
}
