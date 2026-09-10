import { SearchType } from "./search-commands";

export interface SearchActionResponse {
	kind: string;
	route: string;
	params?: any;
}

export interface SearchSectionResponse {
	title: string;
	items: BasicItemResponse[];
}

export interface BasicItemResponse {
	id: number;
	name: string;
}

export interface SearchResultItemResponse {
	type: SearchType;
	entityId: number;
	title: string;
	action: SearchActionResponse;
	selectedAt?: string;
	brandId?: number;
}
