export enum FeeExpenseTab {
	CurrentMonth = "CurrentMonth",
	LastMonth = "LastMonth",
	Last12Months = "Last12Months",
}

export interface NetworkItem {
	brandId: number;
	brandIcon: string;
	amount: number;
	checked: boolean;
}

export interface BusinessItem {
	businessTransactionId: number;
	businessId: number;
	transactionId: number;
	term: string;
	amount: number;
}
