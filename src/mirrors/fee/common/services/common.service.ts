import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { RequestCacheService } from "intelica-library-project";
import { Observable } from "rxjs";
import { BRAND_ICON_CLASS } from "../constants/brand";
import { FeeDetailNavigation } from "../DTO/fee-detail-origin";
import { PeriodType } from "../enums/common.enum";

@Injectable({
	providedIn: "root",
})
export class CommonGlobalService {
	private readonly http = inject(HttpClient);
	private readonly requestCache = inject(RequestCacheService);
	private readonly router = inject(Router);
	private readonly globalTermService = inject(GlobalTermService);
	constructor(private readonly termPipe: TermPipe) {}
	public navigateToFeeDetail(nav: FeeDetailNavigation, openInNewTab = false): void {
		const trail = Array.isArray(nav.origin) ? nav.origin : [nav.origin];
		const queryParams: Record<string, string> = {
			originLabelKey: trail.map(level => level.labelKey).join("|"),
			originPath: trail.map(level => level.path).join("|"),
		};

		if (nav.dateRange?.startDate && nav.dateRange?.endDate) {
			queryParams["startDate"] = nav.dateRange.startDate;
			queryParams["endDate"] = nav.dateRange.endDate;
			if (nav.dateRange.period) {
				queryParams["period"] = nav.dateRange.period;
			}
		}

		const urlTree = this.router.createUrlTree(["/fee/detail", nav.feeId, nav.bankId], { queryParams });
		if (openInNewTab) {
			window.open(this.router.serializeUrl(urlTree), "_blank");
			return;
		}

		this.router.navigateByUrl(urlTree);
	}
	mapPeriodToDetailPeriod(period: PeriodType | undefined): string {
		switch (period) {
			case PeriodType.Last12Months:
				return "Last12Months";
			case PeriodType.CurrentYear:
				return "CurrentYear";
			case PeriodType.CurrentMonth:
				return "CurrentMonth";
			default:
				return "Custom";
		}
	}
	public cachedGet<T>(url: string, params: HttpParams | undefined, ttlMs?: number): Observable<T> {
		const key = this.buildCacheKey(url, params);
		return this.requestCache.getOrSet(key, () => this.http.get<T>(url, { params }), ttlMs);
	}

	public cachedPost<T>(url: string, body: unknown, ttlMs?: number): Observable<T> {
		const key = `${url}::${JSON.stringify(body ?? {})}::${this.globalTermService.languageCode}`;
		return this.requestCache.getOrSet(key, () => this.http.post<T>(url, body), ttlMs);
	}

	public cachedQuery<T>(url: string, body: unknown, ttlMs?: number): Observable<T> {
		const key = `${url}::${JSON.stringify(body ?? {})}::${this.globalTermService.languageCode}`;
		return this.requestCache.getOrSet(key, () => this.http.request<T>("QUERY", url, { body }), ttlMs);
	}

	private buildCacheKey(url: string, params?: HttpParams): string {
		const paramsKey = params?.toString() ?? "";
		return `${url}::${paramsKey}::${this.globalTermService.languageCode}`;
	}

	public buildParams<T extends object>(query: T): HttpParams {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
			if (value === null || value === undefined) continue;

			if (Array.isArray(value)) {
				const serialized = value
					.filter(item => item !== null && item !== undefined)
					.map(item => {
						if (item instanceof Date) return this.formatDateOnly(item);
						return this.isPrimitiveValue(item) ? String(item) : null;
					})
					.filter((item): item is string => item !== null);
				if (serialized.length === 0) continue;
				params = params.set(key, serialized.join("|"));
				continue;
			}

			if (value instanceof Date) {
				params = params.set(key, this.formatDateOnly(value));
				continue;
			}

			if (this.isPrimitiveValue(value)) {
				params = params.set(key, String(value));
			}
		}

		return params;
	}

	public formatDateOnly(value: Date): string {
		const year = value.getFullYear();
		const month = String(value.getMonth() + 1).padStart(2, "0");
		const day = String(value.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	// Nombre de descargable estandar: [YYYYMMDD_HHMM]_[module-name]_[content-type].xlsx
	public buildExportFileName(moduleName: string, contentType: string, reference: Date = new Date()): string {
		const pad = (value: number) => String(value).padStart(2, "0");
		const stamp = `${reference.getFullYear()}${pad(reference.getMonth() + 1)}${pad(reference.getDate())}_${pad(reference.getHours())}${pad(reference.getMinutes())}`;
		return `${[stamp, moduleName, contentType].filter(part => !!part).join("_")}.xlsx`;
	}

	public parseIso(value: string | null | undefined): Date | null {
		if (!value) return null;
		const [y, m, d] = value.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	}

	public get dateLocale(): string {
		return this.globalTermService.languageCode?.toUpperCase() === "ES" ? "es-ES" : "en-US";
	}

	public formatMonthYearShort(year: number | null | undefined, month: number | null | undefined): string {
		if (!year || !month) return "";
		const date = new Date(Date.UTC(year, month - 1, 1));
		return `${this.monthShortLocalized(date, "UTC")} ${String(year).slice(-2)}`;
	}

	public formatMonthYear(value: Date): string {
		return `${this.monthShortLocalized(value)} ${value.getFullYear()}`;
	}

	public formatDayMonthYear(value: string | Date | null | undefined): string {
		if (!value) return "";
		const date = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(date.getTime())) return "";
		const day = String(date.getUTCDate()).padStart(2, "0");
		return `${day} ${this.monthShortLocalized(date, "UTC")}, ${date.getUTCFullYear()}`;
	}

	public formatDateRangeShort(startIso: string | null | undefined, endIso: string | null | undefined): string {
		const start = this.parseIso(startIso);
		const end = this.parseIso(endIso);
		if (!start || !end) return "";
		const day = (value: Date) => String(value.getDate()).padStart(2, "0");
		const shortYear = (value: Date) => String(value.getFullYear()).slice(-2);
		const sameYear = start.getFullYear() === end.getFullYear();
		const startPart = sameYear ? `${day(start)} ${this.monthShortLocalized(start)}` : `${day(start)} ${this.monthShortLocalized(start)} ${shortYear(start)}`;
		const endPart = `${day(end)} ${this.monthShortLocalized(end)} ${shortYear(end)}`;
		return `${startPart} - ${endPart}`;
	}

	private monthShortLocalized(date: Date, timeZone?: string): string {
		const options: Intl.DateTimeFormatOptions = { month: "short" };
		if (timeZone) options.timeZone = timeZone;
		const raw = new Intl.DateTimeFormat(this.dateLocale, options).format(date).replace(/\./g, "");
		return raw.charAt(0).toUpperCase() + raw.slice(1);
	}

	public resolveBrandIconClass(brand?: string | null, brandCode?: string | null): string | null {
		const normalized = `${brandCode ?? ""} ${brand ?? ""}`.trim().toLowerCase();
		const centerIconClass = "u-mx-auto";
		if (!normalized) return null;
		if (normalized.includes("visa")) return `${BRAND_ICON_CLASS.BASE} ${BRAND_ICON_CLASS.VISA} ${centerIconClass}`;
		if (normalized.includes("master")) return `${BRAND_ICON_CLASS.BASE} ${BRAND_ICON_CLASS.MASTERCARD} ${centerIconClass}`;
		if (normalized.includes("amex") || normalized.includes("american express")) return `${BRAND_ICON_CLASS.BASE} ${BRAND_ICON_CLASS.AMEX} ${centerIconClass}`;
		return null;
	}

	private isPrimitiveValue(value: unknown): value is PrimitiveValue {
		const valueType = typeof value;
		return valueType === "string" || valueType === "number" || valueType === "boolean";
	}
	public get languageCode(): string {
		return this.globalTermService.languageCode;
	}
	public termText(key: string): string {
		return this.termPipe.transform(key, this.globalTermService.languageCode);
	}
}
type PrimitiveValue = string | number | boolean | Date;
