export type DateFilter = "last12" | "month" | "year" | null;

export enum AlertType {
	NewFees = "newfees",
	Custom = "custom",
	Penalties = "penalties",
	OptOuts = "optouts",
}

export function getDefaultDateRange(): { start: Date; end: Date } {
	const today = new Date();
	const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
	return { start, end };
}

export function toIsoDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}
