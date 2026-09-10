import { ColumnDefinition } from "../common/table.types";

export const ORIGINAL_GROUP_COLUMNS: ColumnDefinition[] = [
	{
		field: "clientName",
		headerTerm: "INSTITUTION",
		sortable: true,
		minWidth: "220px",
		className: "text-start",
		defaultVisible: true,
	},
];

export const ORIGINAL_FIXED_COLUMNS: ColumnDefinition[] = [
	{
		field: "feeCode",
		headerTerm: "FeeCode",
		sortable: true,
		minWidth: "120px",
		className: "text-center",
	},
	{
		field: "feeName",
		headerTerm: "FeeName",
		sortable: true,
		minWidth: "240px",
		className: "text-start",
	},
];

export const ORIGINAL_CONFIGURABLE_COLUMNS: ColumnDefinition[] = [
	{
		field: "typeOfRate",
		headerTerm: "TypeOfRate",
		sortable: true,
		minWidth: "140px",
		className: "text-center",
		defaultVisible: true,
	},
	{
		field: "category",
		headerTerm: "Category",
		sortable: true,
		minWidth: "150px",
		className: "text-center",
		defaultVisible: true,
	},
	{
		field: "subCategory",
		headerTerm: "LBL_SUBCATEGORY",
		sortable: true,
		minWidth: "160px",
		className: "text-center",
		defaultVisible: false,
	},
	{
		field: "businessDescription",
		headerTerm: "LBL_BUSINESS",
		sortable: true,
		minWidth: "120px",
		className: "text-center",
		defaultVisible: true,
	},
	{
		field: "brandDescription",
		headerTerm: "Brand",
		sortable: true,
		minWidth: "100px",
		className: "text-center",
		defaultVisible: true,
	},
	{
		field: "lastBillingDate",
		headerTerm: "LastBillingDate",
		sortable: true,
		minWidth: "140px",
		className: "text-center",
		defaultVisible: true,
	},
	{
		field: "customCategory",
		headerTerm: "LBL_CUSTOM_CATEGORY",
		minWidth: "160px",
		className: "text-center",
		defaultVisible: false,
	},
	{
		field: "costCenter",
		headerTerm: "LBL_COST_CENTER",
		minWidth: "140px",
		className: "text-center",
		defaultVisible: false,
	},
	{
		field: "generalAccount",
		headerTerm: "LBL_GENERAL_ACCOUNT",
		minWidth: "160px",
		className: "text-center",
		defaultVisible: false,
	},
];
