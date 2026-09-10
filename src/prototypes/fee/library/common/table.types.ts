import { FeeLibraryMaster } from "../DTO/response";
import { CATALOG_FIELDS, CATALOG_ID_FIELDS, CATALOG_MASTER_KEYS } from "./constants";

export type ColumnDefinition = {
	field: string;
	headerTerm: string;
	headerLiteral?: boolean;
	label?: string;
	sortable?: boolean;
	minWidth: string;
	className: string;
	defaultVisible?: boolean;
};

export type QueryParametersModel = {
	FilterBy?: string;
	FilterValue?: string;
	FilterOperator?: string;
	OrderBy?: string;
	SortDirection?: string;
	PageNumber?: number;
	PageSize?: number;
};

export type CatalogField = (typeof CATALOG_FIELDS)[number];

export type CatalogIdField = (typeof CATALOG_ID_FIELDS)[number];

export function isCatalogField(field: string): field is CatalogField {
	return CATALOG_FIELDS.includes(field as CatalogField);
}

export type CatalogMasterKey = (typeof CATALOG_MASTER_KEYS)[CatalogField];
