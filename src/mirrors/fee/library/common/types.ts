import { BusinessTransaction, FeeLibraryFilter } from "../DTO/request";
import { LibraryTabEnum } from "./enums";

export type LibraryFilterState = {
	tab: LibraryTabEnum;
	originalTabFilter: FeeLibraryFilter;
	allocatedTabFilter: FeeLibraryFilter;
	originalBusinessSelection: number[];
	allocatedBusinessSelection: number[];
	originalBusinessTransactionSelection: BusinessTransaction[];
	allocatedBusinessTransactionSelection: BusinessTransaction[];
};

export type FeeLibrarySearchHandoff = {
	searchText: string;
};

export type EntityTypeOption = {
	id: number;
	name: string;
	brandId: number;
	brandName: string;
	brandIconClass: string | null;
};

export type InvoiceOptionViewModel = {
	invoiceNumber: string;
	brandId: number;
	brandName: string;
	brandIconClass: string | null;
	feeDate: Date;
	relativeDateLabel: string;
	groupLabel: string;
};

export type InvoiceOptionGroup = {
	label: string;
	items: InvoiceOptionViewModel[];
};

export type AdvancedFilterPill = {
	key: string;
	label: string;
};

export type AllocatedRowViewModel = {
	id: number;
	feeId: number;
	feeCode: string;
	feeName: string;
	feeDescription: string;
	lastBillingDate: string;
	brandCode: string;
	brandDescription: string;
	countryCode: string;
	businessDescription: string;
	category: string;
	subCategory: string;
	clientId: number | null;
	clientName: string;
	customCategoryId: number | null;
	customCategory: string;
	costCenterId: number | null;
	costCenter: string;
	generalAccountId: number | null;
	generalAccount: string;
	typeOfRate: string;
	consecutiveMonths: string | number;
	feeAmount: number;
	amountPercent: number | null;
};
