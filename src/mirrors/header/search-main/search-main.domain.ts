import { BrandType } from "../common/enums/brand.enum";
import { FeeSection, SearchType } from "./dto/search-commands";
import { SearchResultItemResponse } from "./dto/search-responses";

const ICON_BASE_CLASS = "icon";

const BRAND_ICON_CLASS: Partial<Record<BrandType, string>> = {
	[BrandType.Mastercard]: "icon-mastercard icon--outlined",
	[BrandType.Visa]: "icon-visa icon--outlined",
	[BrandType.Amex]: "icon-amex icon--outlined",
};

export function resolveBrandIconClass(brandId?: number): string | null {
	const iconClass = brandId ? BRAND_ICON_CLASS[brandId as BrandType] : undefined;
	return iconClass ? `${ICON_BASE_CLASS} ${iconClass}` : null;
}

const REPORT_ICON_CLASS = "icon-file";
const DASHBOARD_ICON_CLASS = "icon-incontrol-panel";
const FEE_CATEGORY_ICON_CLASS = "icon-file";

export function resolveResultIconClass(item: SearchResultItemResponse, sectionTitle?: string): string | null {
	if (item.type === SearchType.FEES) {
		if (sectionTitle === FeeSection.Category) return `${ICON_BASE_CLASS} ${FEE_CATEGORY_ICON_CLASS}`;
		return resolveBrandIconClass(item.brandId);
	}
	if (item.type === SearchType.REPORTS) return `${ICON_BASE_CLASS} ${REPORT_ICON_CLASS}`;
	if (item.type === SearchType.DASHBOARDS) return `${ICON_BASE_CLASS} ${DASHBOARD_ICON_CLASS}`;
	return null;
}
