import { computed, inject, Injectable, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { finalize } from "rxjs";
import { filter } from "rxjs/operators";
import { OptOutServiceFilter } from "../../../dto/opt-out-service-commands.dto";
import { OptOutServicesService } from "../../../opt-out-service.service";
import { OptOutServicesFilterResponse } from "../../../dto/opt-out-service-responses.dto";
import { PeriodFilterTypeEnum } from "../../../common/enums/opt-out-service.enum";
import { PeriodType } from "../../../../common/enums/common.enum";
import { ModuleFilterStateService } from "../../../../common/services/module-filter-state.service";
import { FEE_DETAIL_RETURN_SEGMENT } from "../../../../library/common/constants";

export interface OptOutTableState {
	currentPage: number;
	searchText: string | null;
}

type StoredOptOutFilter = Omit<OptOutServiceFilter, "dates"> & { dates: string[] };

const OPT_OUT_SERVICE_PAGE_ROOT = "OptOutServicesExternalNew";
const OPT_OUT_SERVICE_FILTER_STATE_KEY = `${OPT_OUT_SERVICE_PAGE_ROOT}.filter`;
const optOutTableStateKey = (tableKey: string) => `${OPT_OUT_SERVICE_PAGE_ROOT}.table.${tableKey}`;

@Injectable({
	providedIn: "root",
})
export class OptOutServiceFilterService {
	private readonly optOutService = inject(OptOutServicesService);
	private readonly moduleFilterState = inject(ModuleFilterStateService);
	private readonly router = inject(Router);

	loadingFilters: boolean = true;
	filters: OptOutServicesFilterResponse | null = null;

	private start = new Date(new Date().getFullYear(), 0, 1);
	private end = new Date(new Date().getFullYear(), 11, 31);

	private sessionFilter = this.moduleFilterState.get<StoredOptOutFilter>(OPT_OUT_SERVICE_FILTER_STATE_KEY);
	private filtersLoaded = false;

	private _filter = signal<OptOutServiceFilter>({
		bankId: [],
		brandId: [],
		businessId: [],
		dates: [this.start, this.end],
		dateTypeId: PeriodFilterTypeEnum.CurrentYear,
	});
	private _filterTemp = signal<OptOutServiceFilter>({
		bankId: [],
		brandId: [],
		businessId: [],
		dates: [this.start, this.end],
		dateTypeId: PeriodFilterTypeEnum.CurrentYear,
	});
	private _initialFilter = structuredClone(this._filter());
	private _filterOptions = signal<OptOutServicesFilterResponse>({ clients: [], brands: [], business: [], periods: [], currency: { id: 0, name: "", code: "" } });
	private _isLoadingFilters = signal<boolean>(false);
	private _applyTrigger = signal(0);

	public filter = this._filter.asReadonly();
	public filterTemp = this._filterTemp.asReadonly();
	public filterOptions = this._filterOptions.asReadonly();
	public isLoadingFilters = computed(() => this._isLoadingFilters());
	public applyTrigger = this._applyTrigger.asReadonly();
	public currencyCode = computed(() => this._filterOptions()?.currency?.code ?? "-");

	public readonly periodTypeMap: Record<PeriodFilterTypeEnum, PeriodType> = {
		[PeriodFilterTypeEnum.CurrentYear]: PeriodType.CurrentYear,
		[PeriodFilterTypeEnum.CurrentMonth]: PeriodType.CurrentMonth,
		[PeriodFilterTypeEnum.Last12Months]: PeriodType.Last12Months,
		[PeriodFilterTypeEnum.Custom]: PeriodType.Customized,
	};

	constructor() {
		this.getFilters();
		this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
			this.consumeReturnFilterIfLanding();
		});
	}

	public getFilters() {
		this._isLoadingFilters.set(true);
		this.optOutService
			.getFilters()
			.pipe(finalize(() => this._isLoadingFilters.set(false)))
			.subscribe({
				next: filters => {
					this._filterOptions.set(filters);

					const bankIds = filters.clients?.map(x => x.bankId) ?? [];
					const brandIds = filters.brands?.map(x => x.id) ?? [];
					const businessIds = filters.business?.map(x => x.id) ?? [];

					const patch: Partial<OptOutServiceFilter> = {
						bankId: bankIds,
						brandId: brandIds,
						businessId: businessIds,
					};

					this._filter.set({
						...this._filter(),
						...patch,
					});

					this._filterTemp.set({
						...this._filterTemp(),
						...patch,
					});

					this._initialFilter = structuredClone(this._filter());
					this.filtersLoaded = true;
					const isReturningFromDetail = this.router.url.split("?")[0].endsWith(`/${FEE_DETAIL_RETURN_SEGMENT}`);
					if (isReturningFromDetail) {
						this.consumeReturnFilter(this.sessionFilter, bankIds, brandIds, businessIds);
					}
					this.sessionFilter = null;

					this.optOutService.setFilterOptions(filters);
				},
			});
	}

	private consumeReturnFilterIfLanding(): void {
		if (!this.filtersLoaded) return;

		const isReturningFromDetail = this.router.url.split("?")[0].endsWith(`/${FEE_DETAIL_RETURN_SEGMENT}`);
		if (!isReturningFromDetail) return;

		const saved = this.moduleFilterState.get<StoredOptOutFilter>(OPT_OUT_SERVICE_FILTER_STATE_KEY);
		const filters = this._filterOptions();
		const bankIds = filters.clients?.map(x => x.bankId) ?? [];
		const brandIds = filters.brands?.map(x => x.id) ?? [];
		const businessIds = filters.business?.map(x => x.id) ?? [];
		this.consumeReturnFilter(saved, bankIds, brandIds, businessIds);
	}

	private consumeReturnFilter(saved: StoredOptOutFilter | null, bankIds: number[], brandIds: number[], businessIds: number[]): void {
		if (!saved) return;
		this.moduleFilterState.clear(OPT_OUT_SERVICE_FILTER_STATE_KEY);

		const restored = this.resolveSessionFilter(saved, bankIds, brandIds, businessIds);
		if (restored) {
			this._filter.set(restored);
			this._filterTemp.set(structuredClone(restored));
		}
	}

	private resolveSessionFilter(saved: StoredOptOutFilter, bankIds: number[], brandIds: number[], businessIds: number[]): OptOutServiceFilter | null {
		const dates = this.parseDates(saved.dates);
		const bankId = (saved.bankId ?? []).filter(id => bankIds.includes(id));
		const brandId = (saved.brandId ?? []).filter(id => brandIds.includes(id));
		const businessId = (saved.businessId ?? []).filter(id => businessIds.includes(id));

		if (!dates || !brandId.length || !businessId.length) return null;

		return { bankId, brandId, businessId, dates, dateTypeId: saved.dateTypeId };
	}

	private parseDates(dates: unknown): Date[] | null {
		if (!Array.isArray(dates) || dates.length !== 2) return null;
		const [start, end] = dates.map(d => new Date(d));
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
		return [start, end];
	}

	private persistFilter(): void {
		const filter = this._filter();
		const stored: StoredOptOutFilter = { ...filter, dates: filter.dates.map(d => d.toISOString()) };
		this.moduleFilterState.save(OPT_OUT_SERVICE_FILTER_STATE_KEY, stored);
	}

	public restoreFilterTemp(): void {
		this._filterTemp.set(structuredClone(this._filter()));
	}

	public resetToInitial(): void {
		this._filterTemp.set(structuredClone(this._initialFilter));
		this._filter.set(structuredClone(this._filterTemp()));
		this.moduleFilterState.clear(OPT_OUT_SERVICE_FILTER_STATE_KEY);
	}

	public updateFilterTemp(patch: Partial<OptOutServiceFilter>): void {
		this._filterTemp.update(current => ({
			...current,
			...structuredClone(patch),
		}));
	}

	public applyFilters(): void {
		this._filter.set(structuredClone(this._filterTemp()));
		this.moduleFilterState.clear(OPT_OUT_SERVICE_FILTER_STATE_KEY);
	}

	public captureFilterForDetail(): void {
		this.persistFilter();
	}

	public saveTableState(tableKey: string, state: OptOutTableState): void {
		this.moduleFilterState.save(optOutTableStateKey(tableKey), state);
	}

	public getTableState(tableKey: string): OptOutTableState | null {
		const key = optOutTableStateKey(tableKey);
		const state = this.moduleFilterState.get<OptOutTableState>(key);
		if (state) {
			this.moduleFilterState.clear(key);
		}
		return state;
	}

	public clearTableState(tableKey: string): void {
		this.moduleFilterState.clear(optOutTableStateKey(tableKey));
	}
}
