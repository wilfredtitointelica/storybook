import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { Observable, of, tap } from "rxjs";
import { ClientInformationResponse } from "../common/DTO/client-response";
import { ClientFeeRelationCommand, FeeLibraryFilter } from "./DTO/request";
import {
	EntityProductModel,
	FeeExcluded,
	FeeGroupView,
	FeeLibraryMaster,
	FeePaginationResult,
	FeeRefund,
	FeeResponse,
	FeeUnallocatedPaginationResult,
	GroupNameOption,
	InvoiceOption,
	LibraryDatesResponse,
	PaginationResponse,
	PeriodDatesModel,
	ResumeFee,
} from "./DTO/response";
import { LibraryConstants } from "./common/constants";
import { CommonService } from "./domain/common.service";

@Injectable({
	providedIn: "root",
})
export class LibraryService {
	private readonly http = inject(HttpClient);
	private readonly commonService = inject(CommonService);

	private get baseUrl(): string {
		return this.commonService.apiUrl;
	}

	private readonly modalCache = new Map<string, FeeRefund[] | FeeExcluded[] | FeeGroupView[]>();

	private buildModalCacheKey(filter: FeeLibraryFilter): string {
		return `${filter.startDate}|${filter.endDate}|${filter.bankId}|${filter.groupId ?? ""}`;
	}

	getMasters(bankId: string, allocated: boolean): Observable<FeeLibraryMaster> {
		return this.http.get<FeeLibraryMaster>(`${this.baseUrl}/${LibraryConstants.MASTERS}/${bankId}/${allocated}`);
	}

	listPeriodDates(bankId: string, allocated: boolean): Observable<PeriodDatesModel[]> {
		return this.http.get<PeriodDatesModel[]>(`${this.baseUrl}/${LibraryConstants.PERIOD_DATES}/${bankId}/${allocated}`);
	}

	getLibraryDates(): Observable<LibraryDatesResponse> {
		return this.http.get<LibraryDatesResponse>(`${this.baseUrl}/${LibraryConstants.LIBRARY_DATES}`);
	}

	getClientInformation(): Observable<ClientInformationResponse> {
		return this.http.get<ClientInformationResponse>(`${this.baseUrl}/${LibraryConstants.CLIENT_INFORMATION}`);
	}

	getFeeUnallocated(filter: FeeLibraryFilter): Observable<FeeUnallocatedPaginationResult> {
		return this.http.request<FeeUnallocatedPaginationResult>("QUERY", `${this.baseUrl}/${LibraryConstants.FEE_UNALLOCATED}`, { body: this.toRequestBody(filter) });
	}

	getResumeFeeUnallocated(filter: FeeLibraryFilter): Observable<ResumeFee> {
		return this.http.request<ResumeFee>("QUERY", `${this.baseUrl}/${LibraryConstants.RESUME_FEE_UNALLOCATED}`, { body: this.toRequestBody(filter) });
	}

	downloadFeeUnallocated(filter: FeeLibraryFilter): Observable<Blob> {
		return this.http.request("QUERY", `${this.baseUrl}/${LibraryConstants.FILE_FEE_UNALLOCATED}`, {
			body: this.toRequestBody(filter),
			responseType: "blob",
		});
	}

	getFeeAllocated(filter: FeeLibraryFilter): Observable<FeePaginationResult> {
		return this.http.request<FeePaginationResult>("QUERY", `${this.baseUrl}/${LibraryConstants.FEE_ALLOCATED}`, { body: this.toRequestBody(filter) });
	}

	getResumeFeeAllocated(filter: FeeLibraryFilter): Observable<ResumeFee> {
		return this.http.request<ResumeFee>("QUERY", `${this.baseUrl}/${LibraryConstants.RESUME_FEE_ALLOCATED}`, { body: this.toRequestBody(filter) });
	}

	downloadFeeAllocated(filter: FeeLibraryFilter): Observable<Blob> {
		return this.http.request("QUERY", `${this.baseUrl}/${LibraryConstants.FILE_FEE_ALLOCATED}`, {
			body: this.toRequestBody(filter),
			responseType: "blob",
		});
	}

	private toRequestBody(filter: FeeLibraryFilter): Record<string, unknown> {
		return {
			...filter,
			sortOrder: filter.sortOrder != null ? Number(filter.sortOrder) : filter.sortOrder,
		};
	}

	getFeeRefund(filter: FeeLibraryFilter): Observable<FeeRefund[]> {
		const key = `refund|${this.buildModalCacheKey(filter)}`;
		const cached = this.modalCache.get(key) as FeeRefund[] | undefined;
		if (cached) return of(cached);
		const params = this.commonService.createFilterParams(filter);
		return this.http.get<FeeRefund[]>(`${this.baseUrl}/${LibraryConstants.FEE_REFUND}`, { params }).pipe(tap(data => this.modalCache.set(key, data)));
	}

	downloadFeeRefund(filter: FeeLibraryFilter): Observable<Blob> {
		const params = this.commonService.createFilterParams(filter);
		return this.http.get(`${this.baseUrl}/${LibraryConstants.FILE_FEE_REFUND}`, {
			params,
			responseType: "blob",
		});
	}

	exportIncentivesFromList(command: { items: any[]; startDate: string; endDate: string; bankId: string; groupId: number; flagGroup: boolean; searchText?: string }): Observable<Blob> {
		return this.http.post(`${this.baseUrl}/${LibraryConstants.FILE_INCENTIVES}`, command, { responseType: "blob" });
	}

	getFeeExcluded(filter: FeeLibraryFilter): Observable<FeeExcluded[]> {
		const key = `excluded|${this.buildModalCacheKey(filter)}`;
		const cached = this.modalCache.get(key) as FeeExcluded[] | undefined;
		if (cached) return of(cached);
		const params = this.commonService.createFilterParams(filter);
		return this.http.get<FeeExcluded[]>(`${this.baseUrl}/${LibraryConstants.FEE_EXCLUDED}`, { params }).pipe(tap(data => this.modalCache.set(key, data)));
	}

	exportExcludedFromList(command: { items: any[]; startDate: string; endDate: string; bankId: string; groupId: number; flagGroup: boolean; searchText?: string }): Observable<Blob> {
		return this.http.post(`${this.baseUrl}/${LibraryConstants.FILE_EXCLUDED}`, command, { responseType: "blob" });
	}

	downloadFeeExcluded(filter: FeeLibraryFilter): Observable<Blob> {
		const params = this.commonService.createFilterParams(filter);
		return this.http.get(`${this.baseUrl}/${LibraryConstants.FILE_FEE_EXCLUDED}`, {
			params,
			responseType: "blob",
		});
	}

	getFeeGroupView(filter: FeeLibraryFilter): Observable<FeeGroupView[]> {
		const key = `groupview|${this.buildModalCacheKey(filter)}`;
		const cached = this.modalCache.get(key) as FeeGroupView[] | undefined;
		if (cached) return of(cached);
		const params = this.commonService.createFilterParams(filter);
		return this.http.get<FeeGroupView[]>(`${this.baseUrl}/${LibraryConstants.FEE_GROUP_VIEW}`, { params }).pipe(tap(data => this.modalCache.set(key, data)));
	}

	downloadFeeGroupView(filter: FeeLibraryFilter): Observable<Blob> {
		const params = this.commonService.createFilterParams(filter);
		return this.http.get(`${this.baseUrl}/${LibraryConstants.FILE_FEE_GROUP_VIEW}`, {
			params,
			responseType: "blob",
		});
	}

	getInvoices(bankId: string, startDate: string, endDate: string, brandIds: number[] = []): Observable<InvoiceOption[]> {
		let params = new HttpParams();
		if (brandIds.length > 0) {
			params = params.set("brandId", brandIds.join("|"));
		}

		return this.http.get<InvoiceOption[]>(`${this.baseUrl}/${LibraryConstants.INVOICES}/${bankId}/${startDate}/${endDate}`, { params });
	}

	getProducts(bankId: string, categoryId: number, entity: number): Observable<EntityProductModel[]> {
		return this.http.get<EntityProductModel[]>(`${this.baseUrl}/${LibraryConstants.PRODUCTS}/${bankId}/${categoryId}/${entity}`);
	}

	searchGroupNames(bankId: string, allocated: boolean, search: string): Observable<GroupNameOption[]> {
		const params = new HttpParams().set("search", search);
		return this.http.get<GroupNameOption[]>(`${this.baseUrl}/${LibraryConstants.GROUP_NAMES}/${bankId}/${allocated}`, { params });
	}

	saveClientFeeRelation(command: ClientFeeRelationCommand): Observable<unknown> {
		return this.http.post(`${this.baseUrl}/${LibraryConstants.CLIENT_FEE_RELATION}`, command);
	}
}
