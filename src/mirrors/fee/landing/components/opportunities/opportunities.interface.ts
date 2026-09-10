export enum FeeOpportunitiesTab {
	Penalties = "Penalties",
	OptOutServices = "OptOutServices",
}

export interface BrandMetric {
	brandId: number;
	brandIcon: string;
	monthAmount: number;
	yearAmount: number;
	monthShort: string;
	yearShort: string;
}
