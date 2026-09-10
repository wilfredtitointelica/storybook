import { BRAND_ICONS } from "../constants/common.constants";
import { BrandEnum } from "../enums/common.enum";
import { Color } from "intelica-library-base";

export class BrandHelper {
	static getIcon(brandId: number): string {
		return BRAND_ICONS[brandId] ?? "default";
	}
	static getColor(brandId: number): string {
		switch (brandId) {
			case BrandEnum.Visa:
				return Color.visa; // old "#5D86DF";
			case BrandEnum.Mastercard:
				return Color.mastercard; // old "#5CB39D";
			case BrandEnum.Amex:
				return Color.amex; // "#91BE82";
			default:
				return Color.grey200; // "#999999";
		}
	}
}
