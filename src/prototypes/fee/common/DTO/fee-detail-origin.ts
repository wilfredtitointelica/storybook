// Descriptor del breadcrumb cuando un modulo navega a Fee Detail (self-describing).
export interface FeeDetailOrigin {
	labelKey: string;
	path: string;
}

// Rango de fechas que viaja a Fee Detail para que muestre el mismo periodo del modulo origen.
export interface FeeDetailDateRange {
	startDate: string; // yyyy-MM-dd
	endDate: string; // yyyy-MM-dd
	period?: string; // hint opcional del preset/custom
}

// Contrato unico que CUALQUIER modulo usa para navegar a Fee Detail (ordenado y tipado).
export interface FeeDetailNavigation {
	feeId: number | string;
	bankId: number;
	origin: FeeDetailOrigin | FeeDetailOrigin[];
	dateRange?: FeeDetailDateRange;
}
