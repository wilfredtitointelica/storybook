import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { forkJoin } from "rxjs";
import { ConfigService, IntelicaAlertComponent } from "intelica-library-base";
import { AddFavoritesComponent, FormatAmountPipe } from "intelica-library-project";
import { ClientInformationResponse } from "../common/DTO/client-response";
import { Header } from "./header/header";
import { Original } from "./original/original";
import { Allocated } from "./allocated/allocated";
import { Skeleton } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { LibraryService } from "./library.service";
import { CommonService } from "./domain/common.service";
import { ModuleFilterStateService } from "../common/services/module-filter-state.service";
import { AppliedAdvancedFilterKey, BusinessTransaction, FeeLibraryFilter, FeeLibraryGlobalFilter } from "./DTO/request";
import { FeeLibraryMaster, LibraryDatesResponse, ResumeFee, ResumeFeeAmount } from "./DTO/response";
import { FinancialCategoryEnum, LibraryTabEnum } from "./common/enums";
import { FEE_LIBRARY_SEARCH_HANDOFF_KEY, LIBRARY_TERM } from "./common/constants";
import { FeeLibrarySearchHandoff, LibraryFilterState } from "./common/types";
import { CommonGlobalService } from "../common/services/common.service";
import { PeriodType } from "../common/enums/common.enum";

type PortfolioAmountView = {
	code: string;
	totalAmount: number | null;
	hasValue: boolean;
};

@Component({
	selector: "fee-library",
	imports: [Header, Original, Allocated, Skeleton, TabsModule, ButtonModule, CommonModule, CardModule, ToastModule, TooltipModule, FormatAmountPipe, IntelicaAlertComponent, AddFavoritesComponent],
	templateUrl: "./library.html",
	styleUrl: "./library.css",
})
export class Library implements OnDestroy {
	private readonly route = inject(ActivatedRoute);
	private readonly libraryService = inject(LibraryService);
	private readonly config = inject(ConfigService);
	private readonly moduleFilters = inject(ModuleFilterStateService);
	readonly commonService = inject(CommonService);
	readonly commonGlobalService = inject(CommonGlobalService);
	readonly isAdmin = this.config.SessionInformation?.isAdmin ?? false;
	readonly libraryTerm = LIBRARY_TERM;

	private pageRoot = "";

	readonly originalTab = LibraryTabEnum.Original;
	readonly allocatedTab = LibraryTabEnum.Allocated;

	loading = signal(true);
	loadingPortfolio = signal(false);
	loadingTable = signal(false);
	isBusy = computed(() => this.loadingPortfolio() || this.loadingTable());
	activeTab = signal<LibraryTabEnum>(this.originalTab);
	initializedTabs = new Set<string>([this.originalTab]);
	clientInfo = signal<ClientInformationResponse | null>(null);
	masters = signal<FeeLibraryMaster | null>(null);
	dateBoundaries = signal<LibraryDatesResponse | null>(null);
	filter = signal<FeeLibraryFilter | null>(null);
	initialFilter = signal<FeeLibraryFilter | null>(null);
	originalTabFilter = signal<FeeLibraryFilter | null>(null);
	allocatedTabFilter = signal<FeeLibraryFilter | null>(null);
	originalBusinessSelection = signal<number[]>([]);
	allocatedBusinessSelection = signal<number[]>([]);
	originalBusinessTransactionSelection = signal<BusinessTransaction[]>([]);
	allocatedBusinessTransactionSelection = signal<BusinessTransaction[]>([]);
	lastOriginalPortfolioFilterKey = signal<string>("");
	lastAllocatedPortfolioFilterKey = signal<string>("");
	resumeUnallocated = signal<ResumeFee | null>(null);
	resumeAllocated = signal<ResumeFee | null>(null);

	activeResume = computed(() => (this.activeTab() === this.originalTab ? this.resumeUnallocated() : this.resumeAllocated()));
	cardGross = computed(() => this.getGrossAmount());
	cardReturns = computed(() => this.getReturnsAmount());
	cardExclusions = computed(() => this.getExclusionsAmount());
	cardNetExpenses = computed(() => this.getNetExpensesAmount());
	cardCurrency = computed(() => this.getGrossCurrency());
	grossCurrencyItems = computed(() => this.getGrossCurrencyItems());
	returnsCurrencyItems = computed(() => this.getReturnsCurrencyItems());
	exclusionsCurrencyItems = computed(() => this.getExclusionsCurrencyItems());
	netExpensesCurrencyItems = computed(() => this.getNetExpensesCurrencyItems());
	showGrossCard = computed(() => this.hasVisiblePortfolioValues(this.grossCurrencyItems()));
	showReturnsCard = computed(() => this.hasVisiblePortfolioValues(this.returnsCurrencyItems()));
	showExclusionsCard = computed(() => this.hasVisiblePortfolioValues(this.exclusionsCurrencyItems()));
	showNetExpensesCard = computed(() => this.hasVisiblePortfolioValues(this.netExpensesCurrencyItems()));

	private userChangedTabDuringLoad = false;
	private searchHandoffWatchHandle: ReturnType<typeof setInterval> | null = null;
	private lastSeenSearchHandoffSnapshot: string | null = null;
	private static readonly SEARCH_HANDOFF_POLL_MS = 1000;

	ngOnInit(): void {
		this.pageRoot = this.route.snapshot.data["pageRoot"] ?? "";
		const allocatedParam = this.route.snapshot.queryParamMap.get("allocated") ?? this.route.snapshot.paramMap.get("allocated");
		const initialTab: LibraryTabEnum = allocatedParam === this.allocatedTab || allocatedParam === "true" ? this.allocatedTab : this.originalTab;
		this.setActiveTab(initialTab);
		this.initPage();
	}

	ngOnDestroy(): void {
		this.stopSearchHandoffWatch();
	}

	onTabChange(tab: string | number | undefined): void {
		if (tab === undefined || tab === null) {
			return;
		}
		if (this.loading()) {
			this.userChangedTabDuringLoad = true;
		}
		const normalizedTab = String(tab) === this.allocatedTab ? this.allocatedTab : this.originalTab;
		this.setActiveTab(normalizedTab);
		this.refreshPortfolioSummary();
		// this.persistState();
	}

	isTabInitialized(tab: string): boolean {
		return this.initializedTabs.has(tab);
	}

	private hydrateFromSavedState(state: LibraryFilterState): void {
		this.originalTabFilter.set(state.originalTabFilter);
		this.allocatedTabFilter.set(state.allocatedTabFilter);
		this.originalBusinessSelection.set([...state.originalBusinessSelection]);
		this.allocatedBusinessSelection.set([...state.allocatedBusinessSelection]);
		this.originalBusinessTransactionSelection.set([...state.originalBusinessTransactionSelection]);
		this.allocatedBusinessTransactionSelection.set([...state.allocatedBusinessTransactionSelection]);
		this.initializedTabs.add(state.tab);

		if (!this.userChangedTabDuringLoad) {
			this.activeTab.set(state.tab);
		}

		this.filter.set(this.activeTab() === this.allocatedTab ? this.allocatedTabFilter() : this.originalTabFilter());
	}

	private applySearchHandoffIfPresent(): void {
		const handoff = this.moduleFilters.get<FeeLibrarySearchHandoff>(FEE_LIBRARY_SEARCH_HANDOFF_KEY);
		const searchText = handoff?.searchText?.trim();
		if (!searchText) {
			return;
		}

		this.moduleFilters.clear(FEE_LIBRARY_SEARCH_HANDOFF_KEY);

		const isAllocatedActive = this.activeTab() === this.allocatedTab;
		const activeTabFilter = isAllocatedActive ? this.allocatedTabFilter() : this.originalTabFilter();
		if (!activeTabFilter) {
			return;
		}

		const nextActiveFilter: FeeLibraryFilter = { ...activeTabFilter, codeNameFee: searchText, pageNumber: 1 };

		if (isAllocatedActive) {
			this.allocatedTabFilter.set(nextActiveFilter);
		} else {
			this.originalTabFilter.set(nextActiveFilter);
		}
		this.filter.set(nextActiveFilter);
		// this.persistState();
	}

	private startSearchHandoffWatch(): void {
		if (this.searchHandoffWatchHandle !== null) {
			return;
		}

		this.lastSeenSearchHandoffSnapshot = null;
		this.searchHandoffWatchHandle = setInterval(() => {
			const handoff = this.moduleFilters.get<FeeLibrarySearchHandoff>(FEE_LIBRARY_SEARCH_HANDOFF_KEY);
			const snapshot = handoff ? JSON.stringify(handoff) : null;
			if (snapshot !== null && snapshot !== this.lastSeenSearchHandoffSnapshot) {
				this.applySearchHandoffIfPresent();
			}
			this.lastSeenSearchHandoffSnapshot = snapshot;
		}, Library.SEARCH_HANDOFF_POLL_MS);
	}

	private stopSearchHandoffWatch(): void {
		if (this.searchHandoffWatchHandle === null) {
			return;
		}

		clearInterval(this.searchHandoffWatchHandle);
		this.searchHandoffWatchHandle = null;
	}

	private persistState(): void {
		const originalTabFilter = this.originalTabFilter();
		const allocatedTabFilter = this.allocatedTabFilter();
		if (!originalTabFilter || !allocatedTabFilter) {
			return;
		}

		this.moduleFilters.save<LibraryFilterState>(this.pageRoot, {
			tab: this.activeTab(),
			originalTabFilter,
			allocatedTabFilter,
			originalBusinessSelection: this.originalBusinessSelection(),
			allocatedBusinessSelection: this.allocatedBusinessSelection(),
			originalBusinessTransactionSelection: this.originalBusinessTransactionSelection(),
			allocatedBusinessTransactionSelection: this.allocatedBusinessTransactionSelection(),
		});
	}

	onTableLoadingChange(value: boolean): void {
		this.loadingTable.set(value);
	}

	onTableSortChange(tab: LibraryTabEnum, sort: { sortField: string | null; sortOrder: string; pageNumber: number; searchText: string }): void {
		const tabFilter = tab === this.allocatedTab ? this.allocatedTabFilter() : this.originalTabFilter();
		if (!tabFilter) {
			return;
		}

		if (tabFilter.sortField === sort.sortField && tabFilter.sortOrder === sort.sortOrder && tabFilter.pageNumber === sort.pageNumber && tabFilter.codeNameFee === sort.searchText) {
			return;
		}

		const updated: FeeLibraryFilter = {
			...tabFilter,
			sortField: sort.sortField,
			sortOrder: sort.sortOrder,
			pageNumber: sort.pageNumber,
			codeNameFee: sort.searchText,
		};

		if (tab === this.allocatedTab) {
			this.allocatedTabFilter.set(updated);
		} else {
			this.originalTabFilter.set(updated);
		}

		if (this.activeTab() === tab) {
			this.filter.set(updated);
		}

		// this.persistState();
	}

	private setActiveTab(tab: LibraryTabEnum): void {
		this.activeTab.set(tab);
		this.initializedTabs.add(tab);
		this.syncFilterForActiveTab();
	}

	private initPage(): void {
		this.loading.set(true);

		forkJoin({
			masters: this.libraryService.getMasters("-1", false),
			clientInfo: this.libraryService.getClientInformation(),
			dateBoundaries: this.libraryService.getLibraryDates(),
		}).subscribe({
			next: ({ masters, clientInfo, dateBoundaries }) => {
				this.clientInfo.set(clientInfo);
				this.masters.set(masters);
				this.dateBoundaries.set(dateBoundaries);

				const bankId = clientInfo.banks.length === 1 ? String(clientInfo.banks[0].bankId) : "-1";
				const groupScope = this.commonService.resolveGroupScope(clientInfo);
				const dates = this.commonService.setDates(PeriodType.Last12Months, []);
				let startDate = dates.startDate;
				let endDate = dates.endDate;
				if (dateBoundaries?.maxDate) {
					const maxDate = new Date(`${dateBoundaries.maxDate}T00:00:00`);
					const maxEndOfMonth = this.commonService.formatEndOfMonth(maxDate);
					const maxStartOfMonth = this.commonService.formatStartOfMonth(maxDate);
					if (endDate > maxEndOfMonth) endDate = maxEndOfMonth;
					if (startDate > maxEndOfMonth) startDate = maxStartOfMonth;
				}
				if (dateBoundaries?.minDate) {
					const minStartOfMonth = this.commonService.formatStartOfMonth(new Date(`${dateBoundaries.minDate}T00:00:00`));
					if (startDate < minStartOfMonth) startDate = minStartOfMonth;
				}
				const initialFilter: FeeLibraryFilter = {
					...this.commonService.buildDefaultFilter(bankId, groupScope),
					startDate,
					endDate,
					typePeriod: PeriodType.Last12Months,
					regionId: this.commonService.returnIdRegionDefault(clientInfo.regions ?? []),
				};

				this.filter.set(initialFilter);
				this.initialFilter.set(initialFilter);
				this.originalTabFilter.set(initialFilter);
				this.allocatedTabFilter.set(initialFilter);
				this.originalBusinessSelection.set([...initialFilter.businessId]);
				this.allocatedBusinessSelection.set([...initialFilter.businessId]);
				this.originalBusinessTransactionSelection.set([...initialFilter.businessTransaction]);
				this.allocatedBusinessTransactionSelection.set([...initialFilter.businessTransaction]);

				const savedState = this.moduleFilters.get<LibraryFilterState>(this.pageRoot);
				if (savedState) {
					this.hydrateFromSavedState(savedState);
				}

				this.applySearchHandoffIfPresent();
				this.startSearchHandoffWatch();

				this.refreshPortfolioSummary(this.getFilterForActiveTab() ?? initialFilter);
				this.loading.set(false);
			},
			error: () => {
				this.loading.set(false);
			},
		});
	}

	onApplyGlobalFilters(globalFilter: FeeLibraryGlobalFilter): void {
		const currentOriginal = this.originalTabFilter();
		const currentAllocated = this.allocatedTabFilter();
		if (!currentOriginal || !currentAllocated) {
			return;
		}

		this.persistBusinessSelection(globalFilter.businessId, globalFilter.businessTransaction);
		const sharedFilter = {
			brandId: globalFilter.brandId,
			bankId: globalFilter.bankId,
			startDate: globalFilter.startDate,
			endDate: globalFilter.endDate,
			typePeriod: globalFilter.typePeriod,
		};

		const nextOriginalFilter: FeeLibraryFilter = this.cleanupInvalidAdvancedFilters(
			{
				...currentOriginal,
				...sharedFilter,
				businessId: this.originalBusinessSelection(),
				businessTransaction: this.originalBusinessTransactionSelection(),
				codeNameFee: "",
				pageNumber: 1,
			},
			currentOriginal,
			globalFilter
		);
		const nextAllocatedFilter: FeeLibraryFilter = this.cleanupInvalidAdvancedFilters(
			{
				...currentAllocated,
				...sharedFilter,
				businessId: this.allocatedBusinessSelection(),
				businessTransaction: this.allocatedBusinessTransactionSelection(),
				codeNameFee: "",
				pageNumber: 1,
			},
			currentAllocated,
			globalFilter
		);

		this.originalTabFilter.set(nextOriginalFilter);
		this.allocatedTabFilter.set(nextAllocatedFilter);
		this.filter.set(this.activeTab() === this.allocatedTab ? nextAllocatedFilter : nextOriginalFilter);
		this.refreshPortfolioSummary(this.activeTab() === this.allocatedTab ? nextAllocatedFilter : nextOriginalFilter);
		this.persistState();
	}

	onResetGlobalFilters(): void {
		const initial = this.initialFilter();
		const currentOriginal = this.originalTabFilter();
		const currentAllocated = this.allocatedTabFilter();
		if (!initial || !currentOriginal || !currentAllocated) {
			return;
		}

		this.originalBusinessSelection.set([...initial.businessId]);
		this.allocatedBusinessSelection.set([...initial.businessId]);
		this.originalBusinessTransactionSelection.set([...initial.businessTransaction]);
		this.allocatedBusinessTransactionSelection.set([...initial.businessTransaction]);

		const globalDefaults = {
			brandId: initial.brandId,
			bankId: initial.bankId,
			startDate: initial.startDate,
			endDate: initial.endDate,
			typePeriod: initial.typePeriod,
			regionId: initial.regionId,
			businessId: [...initial.businessId],
			businessTransaction: [...initial.businessTransaction],
			category: -1,
			subCategory: -1,
			subCategoryIds: [],
			rateId: [],
			customCategoryId: [],
			parentFeeCodeText: null,
			productId: [],
			productIdLabels: [],
			entity1: null,
			entity2: null,
			entity3: [],
			entity3Labels: [],
			invoice: null,
			minAmount: null,
			maxAmount: null,
			codeNameFee: "",
			pageNumber: 1,
		};

		const nextOriginalFilter = { ...currentOriginal, ...globalDefaults };
		const nextAllocatedFilter = { ...currentAllocated, ...globalDefaults };

		this.originalTabFilter.set(nextOriginalFilter);
		this.allocatedTabFilter.set(nextAllocatedFilter);
		this.filter.set(this.activeTab() === this.allocatedTab ? nextAllocatedFilter : nextOriginalFilter);
		this.refreshPortfolioSummary(this.activeTab() === this.allocatedTab ? nextAllocatedFilter : nextOriginalFilter);
		this.persistState();
	}

	onApplyAdvancedFilters(
		advancedFilter: Pick<
			FeeLibraryFilter,
			| "category"
			| "subCategory"
			| "subCategoryIds"
			| "rateId"
			| "customCategoryId"
			| "parentFeeCodeText"
			| "minAmount"
			| "maxAmount"
			| "productId"
			| "productIdLabels"
			| "entity1"
			| "entity2"
			| "entity3"
			| "entity3Labels"
			| "invoice"
		>
	): void {
		const current = this.getFilterForActiveTab();
		if (!current) {
			return;
		}

		const nextFilter = {
			...current,
			...advancedFilter,
			codeNameFee: "",
			pageNumber: 1,
		};

		if (!this.hasEffectiveFilterChange(current, nextFilter)) {
			return;
		}

		this.setFilterForActiveTab(nextFilter);
		this.refreshPortfolioSummary(nextFilter);
		this.persistState();
	}

	onApplyGlobalAndAdvancedFilters(payload: { global: FeeLibraryGlobalFilter; advanced: Parameters<Library["onApplyAdvancedFilters"]>[0] }): void {
		const currentOriginal = this.originalTabFilter();
		const currentAllocated = this.allocatedTabFilter();
		if (!currentOriginal || !currentAllocated) {
			return;
		}

		const { global: globalFilter, advanced: advancedFilter } = payload;

		this.persistBusinessSelection(globalFilter.businessId, globalFilter.businessTransaction);
		const sharedFilter = {
			brandId: globalFilter.brandId,
			bankId: globalFilter.bankId,
			startDate: globalFilter.startDate,
			endDate: globalFilter.endDate,
			typePeriod: globalFilter.typePeriod,
		};

		const nextOriginalFilter: FeeLibraryFilter = this.cleanupInvalidAdvancedFilters(
			{
				...currentOriginal,
				...sharedFilter,
				businessId: this.originalBusinessSelection(),
				businessTransaction: this.originalBusinessTransactionSelection(),
				codeNameFee: "",
				pageNumber: 1,
			},
			currentOriginal,
			globalFilter
		);
		const nextAllocatedFilter: FeeLibraryFilter = this.cleanupInvalidAdvancedFilters(
			{
				...currentAllocated,
				...sharedFilter,
				businessId: this.allocatedBusinessSelection(),
				businessTransaction: this.allocatedBusinessTransactionSelection(),
				codeNameFee: "",
				pageNumber: 1,
			},
			currentAllocated,
			globalFilter
		);

		const isAllocatedActive = this.activeTab() === this.allocatedTab;
		const baseForActive = isAllocatedActive ? nextAllocatedFilter : nextOriginalFilter;

		const finalActive: FeeLibraryFilter = {
			...baseForActive,
			...advancedFilter,
			codeNameFee: "",
			pageNumber: 1,
		};

		if (isAllocatedActive) {
			this.allocatedTabFilter.set(finalActive);
			this.originalTabFilter.set(nextOriginalFilter);
		} else {
			this.originalTabFilter.set(finalActive);
			this.allocatedTabFilter.set(nextAllocatedFilter);
		}
		this.filter.set(finalActive);
		this.refreshPortfolioSummary(finalActive);
		this.persistState();
	}

	onResetAdvancedFilters(): void {
		const current = this.getFilterForActiveTab();
		if (!current) {
			return;
		}

		const hasAdvancedApplied =
			current.category !== -1 ||
			current.subCategory !== -1 ||
			(current.subCategoryIds?.length ?? 0) > 0 ||
			(current.rateId?.length ?? 0) > 0 ||
			(current.customCategoryId?.length ?? 0) > 0 ||
			(current.parentFeeCodeText?.trim() ?? "") !== "" ||
			(current.productId?.length ?? 0) > 0 ||
			current.entity1 != null ||
			current.entity2 != null ||
			(current.entity3?.length ?? 0) > 0 ||
			current.invoice != null ||
			current.minAmount != null ||
			current.maxAmount != null;

		if (!hasAdvancedApplied) {
			return;
		}

		const nextFilter = {
			...current,
			category: -1,
			subCategory: -1,
			subCategoryIds: [],
			rateId: [],
			customCategoryId: [],
			parentFeeCodeText: null,
			productId: [],
			productIdLabels: [],
			entity1: null,
			entity2: null,
			entity3: [],
			entity3Labels: [],
			invoice: null,
			minAmount: null,
			maxAmount: null,
			codeNameFee: "",
			pageNumber: 1,
		};

		this.setFilterForActiveTab(nextFilter);
		this.refreshPortfolioSummary(nextFilter);
		this.persistState();
	}

	onRemoveAdvancedFilter(key: AppliedAdvancedFilterKey): void {
		const current = this.getFilterForActiveTab();
		if (!current) {
			return;
		}

		const nextFilter = this.buildFilterWithoutAppliedPill(current, key);
		if (!this.hasEffectiveFilterChange(current, nextFilter)) {
			return;
		}

		this.setFilterForActiveTab(nextFilter);
		this.refreshPortfolioSummary(nextFilter);
		this.persistState();
	}

	onRemoveAdvancedFilterWithGlobal(payload: { global: FeeLibraryGlobalFilter; key: AppliedAdvancedFilterKey }): void {
		const currentOriginal = this.originalTabFilter();
		const currentAllocated = this.allocatedTabFilter();
		if (!currentOriginal || !currentAllocated) {
			return;
		}

		const { global: globalFilter, key } = payload;

		this.persistBusinessSelection(globalFilter.businessId, globalFilter.businessTransaction);
		const sharedFilter = {
			brandId: globalFilter.brandId,
			bankId: globalFilter.bankId,
			startDate: globalFilter.startDate,
			endDate: globalFilter.endDate,
			typePeriod: globalFilter.typePeriod,
		};

		const nextOriginalFilter: FeeLibraryFilter = this.cleanupInvalidAdvancedFilters(
			{
				...currentOriginal,
				...sharedFilter,
				businessId: this.originalBusinessSelection(),
				businessTransaction: this.originalBusinessTransactionSelection(),
				codeNameFee: "",
				pageNumber: 1,
			},
			currentOriginal,
			globalFilter
		);
		const nextAllocatedFilter: FeeLibraryFilter = this.cleanupInvalidAdvancedFilters(
			{
				...currentAllocated,
				...sharedFilter,
				businessId: this.allocatedBusinessSelection(),
				businessTransaction: this.allocatedBusinessTransactionSelection(),
				codeNameFee: "",
				pageNumber: 1,
			},
			currentAllocated,
			globalFilter
		);

		const isAllocatedActive = this.activeTab() === this.allocatedTab;
		const baseForActive = isAllocatedActive ? nextAllocatedFilter : nextOriginalFilter;
		const finalActive = this.buildFilterWithoutAppliedPill(baseForActive, key);

		if (isAllocatedActive) {
			this.allocatedTabFilter.set(finalActive);
			this.originalTabFilter.set(nextOriginalFilter);
		} else {
			this.originalTabFilter.set(finalActive);
			this.allocatedTabFilter.set(nextAllocatedFilter);
		}
		this.filter.set(finalActive);
		this.refreshPortfolioSummary(finalActive);
		this.persistState();
	}

	private refreshPortfolioSummary(filterOverride?: FeeLibraryFilter): void {
		const currentFilter = filterOverride ?? this.filter();
		if (!currentFilter) {
			return;
		}

		const portfolioFilter = this.buildPortfolioFilter(currentFilter);
		const portfolioFilterKey = JSON.stringify(portfolioFilter);
		if (!this.shouldRefreshPortfolio(portfolioFilterKey)) {
			this.loadingPortfolio.set(false);
			return;
		}

		const requestedTab = this.activeTab();
		this.loadingPortfolio.set(true);

		const request = requestedTab === this.allocatedTab ? this.libraryService.getResumeFeeAllocated(portfolioFilter) : this.libraryService.getResumeFeeUnallocated(portfolioFilter);

		request.subscribe({
			next: resume => {
				if (requestedTab === this.allocatedTab) {
					this.resumeAllocated.set(resume);
				} else {
					this.resumeUnallocated.set(resume);
				}

				if (requestedTab === this.activeTab()) {
					this.loadingPortfolio.set(false);
				}
			},
			error: error => {
				console.error("[Fee Library] total portfolio load error", error);
				if (requestedTab === this.allocatedTab) {
					this.resumeAllocated.set(null);
				} else {
					this.resumeUnallocated.set(null);
				}

				if (requestedTab === this.activeTab()) {
					this.loadingPortfolio.set(false);
				}
			},
		});
	}

	private buildPortfolioFilter(filter: FeeLibraryFilter): FeeLibraryFilter {
		return {
			...filter,
			businessId: [],
			businessTransaction: [],
			category: -1,
			subCategory: -1,
			subCategoryIds: [],
			rateId: [],
			customCategoryId: [],
			productId: [],
			productIdLabels: [],
			entity1: null,
			entity2: null,
			entity3: [],
			entity3Labels: [],
			invoice: null,
			minAmount: null,
			maxAmount: null,
			parentFeeCodeText: null,
			codeNameFee: "",
			feeName: false,
			feeCode: false,
			matchType: 0,
			pageNumber: 1,
		};
	}

	private shouldRefreshPortfolio(filterKey: string): boolean {
		if (this.activeTab() === this.allocatedTab) {
			if (this.lastAllocatedPortfolioFilterKey() === filterKey) {
				return false;
			}

			this.lastAllocatedPortfolioFilterKey.set(filterKey);
			return true;
		}

		if (this.lastOriginalPortfolioFilterKey() === filterKey) {
			return false;
		}

		this.lastOriginalPortfolioFilterKey.set(filterKey);
		return true;
	}

	private persistBusinessSelection(selection: number[], businessTransactions: BusinessTransaction[]): void {
		if (this.activeTab() === this.allocatedTab) {
			this.allocatedBusinessSelection.set([...selection]);
			this.allocatedBusinessTransactionSelection.set([...businessTransactions]);
			return;
		}

		this.originalBusinessSelection.set([...selection]);
		this.originalBusinessTransactionSelection.set([]);
	}

	private getBusinessSelectionForActiveTab(fallback: number[] = []): number[] {
		const selection = this.activeTab() === this.allocatedTab ? this.allocatedBusinessSelection() : this.originalBusinessSelection();

		return selection.length ? [...selection] : [...fallback];
	}

	private getBusinessTransactionsForActiveTab(fallback: BusinessTransaction[] = []): BusinessTransaction[] {
		const selection = this.activeTab() === this.allocatedTab ? this.allocatedBusinessTransactionSelection() : this.originalBusinessTransactionSelection();

		return selection.length ? selection.map(item => ({ ...item })) : fallback.map(item => ({ ...item }));
	}

	private syncFilterForActiveTab(): void {
		const activeFilter = this.getFilterForActiveTab();
		if (!activeFilter) {
			return;
		}

		const nextFilter = { ...activeFilter, pageNumber: 1 };
		this.setFilterForActiveTab(nextFilter);
	}

	private getFilterForActiveTab(): FeeLibraryFilter | null {
		return this.activeTab() === this.allocatedTab ? this.allocatedTabFilter() : this.originalTabFilter();
	}

	private setFilterForActiveTab(nextFilter: FeeLibraryFilter): void {
		if (this.activeTab() === this.allocatedTab) {
			this.allocatedTabFilter.set(nextFilter);
		} else {
			this.originalTabFilter.set(nextFilter);
		}

		this.filter.set(nextFilter);
	}

	private hasEffectiveFilterChange(current: FeeLibraryFilter, next: FeeLibraryFilter): boolean {
		return this.commonService.createFilterParams(current).toString() !== this.commonService.createFilterParams(next).toString();
	}

	private buildFilterWithoutAppliedPill(current: FeeLibraryFilter, key: AppliedAdvancedFilterKey): FeeLibraryFilter {
		const baseFilter: FeeLibraryFilter = {
			...current,
			pageNumber: 1,
		};

		switch (key) {
			case "categorization":
				return {
					...baseFilter,
					category: -1,
					subCategory: -1,
					subCategoryIds: [],
				};
			case "rate":
				return {
					...baseFilter,
					rateId: [],
				};
			case "customCategory":
				return {
					...baseFilter,
					customCategoryId: [],
				};
			case "parentFeeCode":
				return {
					...baseFilter,
					parentFeeCodeText: null,
				};
			case "groupName":
				return {
					...baseFilter,
					parentFeeName: null,
				};
			case "amount":
				return {
					...baseFilter,
					minAmount: null,
					maxAmount: null,
				};
			case "productType":
				return {
					...baseFilter,
					productId: [],
					productIdLabels: [],
				};
			case "productTypeCredit": {
				const creditIds = (this.masters()?.productTypes?.credit ?? []).flatMap(b => b.items.map(i => i.id));
				const remainingIds = (baseFilter.productId ?? []).filter(id => !creditIds.includes(id));
				const remainingLabels = (baseFilter.productIdLabels ?? []).filter((_, idx) => !creditIds.includes((baseFilter.productId ?? [])[idx]));
				return { ...baseFilter, productId: remainingIds, productIdLabels: remainingLabels };
			}
			case "productTypeDebitPrepaid": {
				const debitIds = (this.masters()?.productTypes?.debitPrepaid ?? []).flatMap(b => b.items.map(i => i.id));
				const remainingIds = (baseFilter.productId ?? []).filter(id => !debitIds.includes(id));
				const remainingLabels = (baseFilter.productIdLabels ?? []).filter((_, idx) => !debitIds.includes((baseFilter.productId ?? [])[idx]));
				return { ...baseFilter, productId: remainingIds, productIdLabels: remainingLabels };
			}
			case "entityType":
				return {
					...baseFilter,
					entity1: null,
					entity2: null,
					entity3: [],
					entity3Labels: [],
				};
			case "entityDetail":
				return {
					...baseFilter,
					entity2: null,
					entity3: [],
					entity3Labels: [],
				};
			case "entityValues":
				return {
					...baseFilter,
					entity3: [],
					entity3Labels: [],
				};
			case "invoice":
				return {
					...baseFilter,
					invoice: null,
				};
			default:
				return baseFilter;
		}
	}

	private getResumeAmount(category: FinancialCategoryEnum): number {
		const amounts = this.activeResume()?.resumeFeeAmounts ?? [];
		return amounts.find((amount: ResumeFeeAmount) => amount.financialCategory === category)?.totalAmount ?? 0;
	}

	private getGrossAmount(): number {
		const activeResume = this.activeResume();
		if (this.activeTab() === this.originalTab) {
			return activeResume?.grossAmounts?.[0]?.totalAmount ?? 0;
		}

		return this.getResumeAmount(FinancialCategoryEnum.Fee);
	}

	private getGrossCurrency(): string {
		const activeResume = this.activeResume();
		if (this.activeTab() === this.originalTab) {
			return activeResume?.grossAmounts?.[0]?.code ?? activeResume?.resumeFeeAmounts?.[0]?.code ?? "USD";
		}

		return activeResume?.resumeFeeAmounts?.[0]?.code ?? "USD";
	}

	private getExclusionsAmount(): number {
		const activeResume = this.activeResume();
		if (this.activeTab() === this.originalTab) {
			return activeResume?.exclusionAmounts?.[0]?.totalAmount ?? 0;
		}

		return this.getResumeAmount(FinancialCategoryEnum.ExcludedFee);
	}

	private getReturnsAmount(): number {
		const activeResume = this.activeResume();
		if (this.activeTab() === this.originalTab) {
			return activeResume?.returnsAmounts?.[0]?.totalAmount ?? 0;
		}

		return this.getResumeAmount(FinancialCategoryEnum.Refund);
	}

	private getNetExpensesAmount(): number {
		if (this.activeTab() !== this.originalTab) {
			return this.getGrossAmount() + this.getReturnsAmount() + this.getExclusionsAmount();
		}

		return this.getGrossAmount() + this.getReturnsAmount() - this.getExclusionsAmount();
	}

	private getGrossCurrencyItems(): PortfolioAmountView[] {
		const items = this.activeTab() === this.originalTab ? this.mapCurrencyAmounts(this.activeResume()?.grossAmounts) : this.getSingleCurrencyItem(this.getGrossCurrency(), this.getGrossAmount());

		return this.normalizePortfolioCurrencyItems(items);
	}

	private getReturnsCurrencyItems(): PortfolioAmountView[] {
		const items = this.activeTab() === this.originalTab ? this.mapCurrencyAmounts(this.activeResume()?.returnsAmounts) : this.getSingleCurrencyItem(this.cardCurrency(), this.cardReturns());

		return this.normalizePortfolioCurrencyItems(items);
	}

	private getExclusionsCurrencyItems(): PortfolioAmountView[] {
		const items = this.activeTab() === this.originalTab ? this.mapCurrencyAmounts(this.activeResume()?.exclusionAmounts) : this.getSingleCurrencyItem(this.cardCurrency(), this.cardExclusions());

		return this.normalizePortfolioCurrencyItems(items);
	}

	private getNetExpensesCurrencyItems(): PortfolioAmountView[] {
		let items: PortfolioAmountView[];

		if (this.activeTab() !== this.originalTab) {
			items = this.getSingleCurrencyItem(this.cardCurrency(), this.cardNetExpenses());
			return this.normalizePortfolioCurrencyItems(items);
		}

		const grossMap = this.toAmountMap(this.activeResume()?.grossAmounts);
		const returnsMap = this.toAmountMap(this.activeResume()?.returnsAmounts);
		const exclusionsMap = this.toAmountMap(this.activeResume()?.exclusionAmounts);
		const codes = Array.from(new Set([...grossMap.keys(), ...returnsMap.keys(), ...exclusionsMap.keys()]));

		items = codes.map(code => ({
			code,
			totalAmount: (grossMap.get(code) ?? 0) + (returnsMap.get(code) ?? 0) - (exclusionsMap.get(code) ?? 0),
			hasValue: true,
		}));

		return this.normalizePortfolioCurrencyItems(items);
	}

	private getPortfolioCurrencyOrder(): string[] {
		const activeResume = this.activeResume();
		const codes: string[] = [];
		const pushCode = (code?: string | null) => {
			const normalizedCode = code?.trim();
			if (!normalizedCode || codes.includes(normalizedCode)) {
				return;
			}

			codes.push(normalizedCode);
		};

		(activeResume?.resumeFeeAmounts ?? []).forEach(amount => pushCode(amount.code));
		(activeResume?.grossAmounts ?? []).forEach(amount => pushCode(amount.code));
		(activeResume?.returnsAmounts ?? []).forEach(amount => pushCode(amount.code));
		(activeResume?.exclusionAmounts ?? []).forEach(amount => pushCode(amount.code));
		pushCode(this.getGrossCurrency());

		return codes;
	}

	private normalizePortfolioCurrencyItems(items: PortfolioAmountView[]): PortfolioAmountView[] {
		const itemMap = new Map(items.map(item => [item.code, item]));
		return this.getPortfolioCurrencyOrder().map(code => itemMap.get(code) ?? { code, totalAmount: null, hasValue: false });
	}

	private mapCurrencyAmounts(amounts?: ResumeFeeAmount[]): PortfolioAmountView[] {
		return (amounts ?? []).map(amount => ({
			code: amount.code ?? "USD",
			totalAmount: amount.totalAmount,
			hasValue: true,
		}));
	}

	private getSingleCurrencyItem(code: string, totalAmount: number): PortfolioAmountView[] {
		return [{ code, totalAmount, hasValue: true }];
	}

	private toAmountMap(amounts?: ResumeFeeAmount[], useAbsolute = false): Map<string, number> {
		return new Map((amounts ?? []).map(amount => [amount.code ?? "USD", useAbsolute ? Math.abs(amount.totalAmount) : amount.totalAmount]));
	}

	private hasVisiblePortfolioValues(items: PortfolioAmountView[]): boolean {
		return items.some(item => item.totalAmount != null && item.totalAmount !== 0);
	}

	private cleanupInvalidAdvancedFilters(filter: FeeLibraryFilter, previousFilter: FeeLibraryFilter, globalFilter: FeeLibraryGlobalFilter): FeeLibraryFilter {
		const masters = this.masters();
		if (!masters) {
			return filter;
		}

		let cleaned = { ...filter };
		const newBrandIds = globalFilter.brandId;
		const scopedBrandIds = newBrandIds.length > 0 ? new Set(newBrandIds) : null;
		const brandsChanged = JSON.stringify([...newBrandIds].sort()) !== JSON.stringify([...(previousFilter.brandId ?? [])].sort());
		const bankChanged = globalFilter.bankId !== previousFilter.bankId;
		const datesChanged = globalFilter.startDate !== previousFilter.startDate || globalFilter.endDate !== previousFilter.endDate;

		if (filter.entity1) {
			const availableEntityIds = (masters.entityTypes ?? []).filter(et => !scopedBrandIds || scopedBrandIds.has(et.brandId)).flatMap(et => et.categories.filter(c => c.id > 0).map(c => c.id));

			if (!availableEntityIds.includes(filter.entity1)) {
				cleaned = { ...cleaned, entity1: null, entity2: null, entity3: [], entity3Labels: [] };
			}
		}

		if (filter.invoice && (brandsChanged || bankChanged || datesChanged)) {
			cleaned = { ...cleaned, invoice: null };
		}

		if (filter.productId?.length) {
			const availableProductIds = [...(masters.productTypes?.credit ?? []), ...(masters.productTypes?.debitPrepaid ?? [])]
				.filter(group => !scopedBrandIds || scopedBrandIds.has(group.brandId))
				.flatMap(group => group.items.map(item => item.id));

			const validProductIds = filter.productId.filter(id => availableProductIds.includes(id));
			if (validProductIds.length !== filter.productId.length) {
				cleaned = { ...cleaned, productId: validProductIds.length === availableProductIds.length ? [] : validProductIds, productIdLabels: [] };
			}
		}

		if (filter.customCategoryId?.length && bankChanged) {
			const clientInfo = this.clientInfo();
			const scopedClientIds = this.commonService.resolveScopedClientIds(clientInfo?.banks ?? [], globalFilter.bankId);
			const availableCustomCategoryIds = this.commonService.filterClientCatalogItemsByClientIds(masters.customCategories ?? [], scopedClientIds).map(item => item.id);

			const validIds = filter.customCategoryId.filter(id => availableCustomCategoryIds.includes(id));
			if (validIds.length !== filter.customCategoryId.length) {
				cleaned = { ...cleaned, customCategoryId: validIds };
			}
		}

		return cleaned;
	}
}
