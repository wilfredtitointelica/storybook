export enum UnitCostTab {
	Fixed = "Fixed",
	Variable = "Variable",
}

export interface UnitCostByProductTable {
	brandIndId: number;
	scopeId: number;
	brandIndDesc: string;
	scopeDesc: string;
	col1: number;
	col2: number;
	col3: number;
	col4: number;
	col5: number;
	qoq: number;
	qoqState: string;
	qoqIcon: string;
}
