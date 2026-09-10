import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, output, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { MultiSelectModule } from "primeng/multiselect";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ClientBankResponse } from "../../common/DTO/client-response";
import {
	BusinessTransaction as SelectedBusinessTransaction,
	FeeLibraryFilter,
	FeeLibraryGlobalFilter,
	AppliedAdvancedFilterKey,
	AppliedAdvancedFilterPill,
	CurrentBusinessOption,
} from "../DTO/request";
import { AllocatedProductTypeBrandGroup, FeeLibraryMaster, LibraryDatesResponse } from "../DTO/response";
import { LibraryTabEnum } from "../common/enums";
import { LIBRARY_TERM } from "../common/constants";
import { CommonService } from "../domain/common.service";
import { AdvancedFilterPayload, ModalAdvancedFilter } from "../modal-advanced-filter/modal-advanced-filter";
import { DATE_PERIOD, DatePeriod, DateRangeOutput, DatepickerRange } from "../../common/datepicker-range/datepicker-range";
import { CommonGlobalService } from "../../common/services/common.service";
import { PeriodType } from "../../common/enums/common.enum";

@Component({
	selector: "fee-header",
	imports: [CommonModule, FormsModule, ButtonModule, MultiSelectModule, SkeletonModule, TagModule, ModalAdvancedFilter, DatepickerRange],
	templateUrl: "./header.html",
	styleUrl: "./header.css",
})
export class Header {
	private readonly messageService = inject(MessageService);
	private readonly commonService = inject(CommonService);
	readonly commonGlobalService = inject(CommonGlobalService);
	readonly libraryTerm = LIBRARY_TERM;
	loading = input(true);
	busy = input(false);
	clientOptions = input<ClientBankResponse[]>([]);
	masters = input<FeeLibraryMaster | null>(null);
	activeTab = input<LibraryTabEnum>(LibraryTabEnum.Original);
	filter = input<FeeLibraryFilter | null>(null);
	boundaryDates = input<LibraryDatesResponse | null>(null);
	applyGlobalFilters = output<FeeLibraryGlobalFilter>();
	resetGlobalFilters = output<void>();
	applyAdvancedFilters = output<AdvancedFilterPayload>();
	applyGlobalAndAdvancedFilters = output<{ global: FeeLibraryGlobalFilter; advanced: AdvancedFilterPayload }>();
	resetAdvancedFilters = output<void>();
	removeAdvancedFilter = output<AppliedAdvancedFilterKey>();
	removeAdvancedFilterWithGlobal = output<{ global: FeeLibraryGlobalFilter; key: AppliedAdvancedFilterKey }>();
	private readonly datepicker = viewChild(DatepickerRange);

	// MULTISELECTS
	selectedBrands: number[] = [];
	selectedEntities: number[] = [];
	selectedBusinesses: number[] = [];
	selectedPeriodType = PeriodType.Last12Months;
	advancedFilterVisible = false;
	private lastAppliedGlobalFilterKey = "";
	readonly periodType = PeriodType;
	readonly originalTab = LibraryTabEnum.Original;
	readonly allocatedTab = LibraryTabEnum.Allocated;

	// DATE PICKER (shared fee-datepicker-range)
	appliedRangeDates: [Date, Date] | null = null;
	minDate = computed<Date | null>(() => {
		const [y, m] = (this.boundaryDates()?.minDate ?? "").split("-").map(Number);
		return y && m ? new Date(y, m - 1, 1) : null;
	});
	maxDate = computed<Date | null>(() => {
		const [y, m] = (this.boundaryDates()?.maxDate ?? "").split("-").map(Number);
		return y && m ? new Date(y, m, 0) : null;
	});

	// Restauracion one-shot del datepicker al abrir el modulo (filtros persistidos):
	// preset -> initPeriod (se ve normal); custom -> initialRange (se ve custom).
	readonly restorePreset = signal<DatePeriod>(DATE_PERIOD.Last12Months);
	readonly restoreCustomRange = signal<{ start: Date; end: Date } | null>(null);
	private hasAppliedRestore = false;

	constructor() {
		this.applyLast12Range();

		effect(() => {
			const clientOptions = this.clientOptions();
			const filter = this.filter();

			if (clientOptions.length > 0 && filter) {
				this.syncEntitiesFromFilter();
			}
		});

		effect(() => {
			const filter = this.filter();
			this.masters();
			this.activeTab();

			if (!filter) {
				return;
			}

			this.syncBrandsFromFilter();
			this.syncBusinessesFromFilter();
			this.selectedPeriodType = filter.typePeriod ?? PeriodType.Last12Months;
			this.syncAppliedRangeFromFilter(filter);
			this.lastAppliedGlobalFilterKey = this.buildGlobalFilterKey(this.buildGlobalFilterPayload());
		});

		// One-shot: al primer filtro no-nulo (defaults o estado restaurado), empuja el rango al datepicker.
		effect(() => {
			const filter = this.filter();
			if (!filter || this.hasAppliedRestore) {
				return;
			}
			this.hasAppliedRestore = true;
			this.applyRestoreToDatepicker(filter);
		});
	}

	private applyRestoreToDatepicker(filter: FeeLibraryFilter): void {
		const preset = this.mapPeriodTypeToDatePeriod(filter.typePeriod);
		if (preset) {
			this.restorePreset.set(preset);
			this.restoreCustomRange.set(null);
			return;
		}

		const start = filter.startDate ? new Date(`${filter.startDate}T00:00:00`) : null;
		const end = filter.endDate ? new Date(`${filter.endDate}T00:00:00`) : null;
		if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
			this.restoreCustomRange.set({ start, end });
		}
	}

	private mapPeriodTypeToDatePeriod(period: PeriodType | undefined): DatePeriod | null {
		switch (period) {
			case PeriodType.Last12Months:
				return DATE_PERIOD.Last12Months;
			case PeriodType.CurrentYear:
				return DATE_PERIOD.CurrentYear;
			case PeriodType.CurrentMonth:
				return DATE_PERIOD.CurrentMonth;
			default:
				return null;
		}
	}

	// TOGGLE PARA BOTONES
	toggleBrand(brandId: number) {
		const index = this.selectedBrands.indexOf(brandId);

		if (index > -1) {
			this.selectedBrands.splice(index, 1);
		} else {
			this.selectedBrands.push(brandId);
		}
	}

	// DATE PICKER
	onDatepickerChanged(range: DateRangeOutput): void {
		this.appliedRangeDates = [range.start, range.end];
		this.selectedPeriodType = this.mapDatePeriod(range.period);
	}

	private applyLast12Range(): void {
		const end = this.commonService.getCurrentMonthStart();
		const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
		this.appliedRangeDates = [start, end];
		this.selectedPeriodType = PeriodType.Last12Months;
	}

	private mapDatePeriod(period: DatePeriod): PeriodType {
		switch (period) {
			case DATE_PERIOD.CurrentYear:
				return PeriodType.CurrentYear;
			case DATE_PERIOD.CurrentMonth:
				return PeriodType.CurrentMonth;
			case DATE_PERIOD.Last12Months:
				return PeriodType.Last12Months;
			default:
				return PeriodType.Customized;
		}
	}

	private syncRangeFromDatepicker(): void {
		const range = this.datepicker()?.getCurrentRange();
		if (!range) {
			return;
		}
		this.appliedRangeDates = [range.start, range.end];
		this.selectedPeriodType = this.mapDatePeriod(range.period);
	}

	private readDatepickerRange(): [Date, Date] | null {
		const range = this.datepicker()?.getCurrentRange();
		return range ? [range.start, range.end] : null;
	}

	// ACTIONS
	applyFilters() {
		this.syncRangeFromDatepicker();

		if (!this.appliedRangeDates) {
			return;
		}

		if (!this.hasValidRequiredSelections()) {
			return;
		}

		const payload = this.buildGlobalFilterPayload();
		const key = this.buildGlobalFilterKey(payload);
		if (key === this.lastAppliedGlobalFilterKey) {
			return;
		}

		this.lastAppliedGlobalFilterKey = key;
		this.applyGlobalFilters.emit(payload);
	}

	resetFilters() {
		this.datepicker()?.applyPreset(DATE_PERIOD.Last12Months);
		this.syncRangeFromDatepicker();
		this.selectedBrands = this.brands.map(brand => brand.id);
		this.selectedEntities = this.clientOptions().map(client => client.bankId);
		this.selectedBusinesses = this.currentBusinesses.map(business => business.id);

		const payload = this.buildGlobalFilterPayload();
		const key = this.buildGlobalFilterKey(payload);
		if (key === this.lastAppliedGlobalFilterKey && this.advancedFilterPills.length === 0) {
			return;
		}

		this.lastAppliedGlobalFilterKey = key;
		this.resetGlobalFilters.emit();
	}

	private buildGlobalFilterKey(payload: FeeLibraryGlobalFilter): string {
		return JSON.stringify({
			bankId: payload.bankId,
			brandId: [...payload.brandId].sort(),
			businessId: [...payload.businessId].sort(),
			businessTransaction: [...payload.businessTransaction].map(transaction => `${transaction.businessId}-${transaction.transactionId}`).sort(),
			startDate: payload.startDate,
			endDate: payload.endDate,
			typePeriod: payload.typePeriod,
		});
	}

	get currentBusinesses(): CurrentBusinessOption[] {
		if (this.activeTab() === this.allocatedTab) {
			return (this.masters()?.businessTransaction ?? []).map(business => ({
				id: business.id,
				name: business.name,
				businessId: business.businessId,
				transactionId: business.transactionId,
			}));
		}

		return (this.masters()?.business ?? []).map(business => ({
			id: business.id,
			name: business.name,
			businessId: business.id,
			transactionId: 0,
		}));
	}

	get clientList(): ClientBankResponse[] {
		return this.clientOptions();
	}

	get brands() {
		return this.masters()?.brands ?? [];
	}

	get entitySelectionLabel(): string {
		if (this.clientList.length > 0 && this.selectedEntities.length >= this.clientList.length) return this.commonGlobalService.termText(this.libraryTerm.ALL_INSTITUTIONS);
		return this.commonGlobalService.termText(this.libraryTerm.CLIENT_SELECTED);
	}

	get brandSelectionLabel(): string {
		if (this.brands.length > 0 && this.selectedBrands.length >= this.brands.length) return this.commonGlobalService.termText(this.libraryTerm.ALL_BRANDS);
		return this.commonGlobalService.termText(this.libraryTerm.BRAND_SELECTED);
	}

	get businessSelectionLabel(): string {
		if (this.currentBusinesses.length > 0 && this.selectedBusinesses.length >= this.currentBusinesses.length) return this.commonGlobalService.termText(this.libraryTerm.ALL_BUSINESSES);
		return this.commonGlobalService.termText(this.libraryTerm.BUSINESS_SELECTED);
	}

	get selectedBankIdPreview(): string {
		return this.resolveBankIdFilter();
	}

	get selectedBrandIdsPreview(): number[] {
		return this.selectedBrands;
	}

	get selectedStartDatePreview(): string {
		const [start] = this.resolvePreviewRange();
		return this.commonService.formatStartOfMonth(start);
	}

	get selectedEndDatePreview(): string {
		const [, end] = this.resolvePreviewRange();
		return this.commonService.formatEndOfMonth(end);
	}

	get advancedFilterPills(): AppliedAdvancedFilterPill[] {
		const filter = this.filter();
		const masters = this.masters();
		if (!filter || !masters) {
			return [];
		}

		const pills: AppliedAdvancedFilterPill[] = [];

		const categorizationSummary = this.commonService.buildCategorizationSummary(filter, masters.categories, masters.subCategories, {
			allLabel: this.commonGlobalService.termText(this.libraryTerm.ALL_CATEGORIES_AND_SUBCATEGORIES),
			multiSuffixLabel: this.commonGlobalService.termText(this.libraryTerm.SELECTED),
		});
		if (categorizationSummary !== this.commonGlobalService.termText(this.libraryTerm.ALL_CATEGORIES_AND_SUBCATEGORIES)) {
			pills.push({
				key: "categorization",
				label: `${this.commonGlobalService.termText(this.libraryTerm.CATEGORIZATION)}: ${categorizationSummary}`,
			});
		}

		if (filter.rateId?.length) {
			pills.push({
				key: "rate",
				label: `${this.commonGlobalService.termText(this.libraryTerm.RATE_TYPE)}: ${this.commonService.formatSelectionSummary(filter.rateId, masters.typeOfRates)}`,
			});
		}

		if (filter.customCategoryId?.length) {
			pills.push({
				key: "customCategory",
				label: `${this.commonGlobalService.termText(this.libraryTerm.CUSTOM_CATEGORY)}: ${this.commonService.formatSelectionSummary(filter.customCategoryId, masters.customCategories)}`,
			});
		}

		if (filter.parentFeeCodeText?.trim()) {
			pills.push({
				key: "parentFeeCode",
				label: `${this.commonGlobalService.termText(this.libraryTerm.PARENT_FEE_CODE)}: ${filter.parentFeeCodeText.trim()}`,
			});
		}

		if (filter.parentFeeName?.trim()) {
			pills.push({
				key: "groupName",
				label: `${this.commonGlobalService.termText(this.libraryTerm.GROUP_NAME)}: ${filter.parentFeeName.trim()}`,
			});
		}

		if (filter.minAmount != null || filter.maxAmount != null) {
			pills.push({
				key: "amount",
				label: `${this.commonGlobalService.termText(this.libraryTerm.AMOUNT_LABEL)}: ${this.commonService.buildAmountRangeSummary(filter.minAmount ?? null, filter.maxAmount ?? null, 2)}`,
			});
		}

		if (this.activeTab() === this.allocatedTab) {
			if (filter.productId?.length) {
				const creditOptions = masters.productTypes?.credit ?? [];
				const debitOptions = masters.productTypes?.debitPrepaid ?? [];
				const creditLabel = this.commonGlobalService.termText(this.libraryTerm.CREDIT);
				const debitLabel = this.commonGlobalService.termText(this.libraryTerm.DEBIT_PREPAID);
				const selectedLabel = this.commonGlobalService.termText(this.libraryTerm.SELECTED);

				const creditSummary = this.buildProductGroupSummary(filter.productId, creditOptions, selectedLabel);
				if (creditSummary) {
					pills.push({
						key: "productTypeCredit",
						label: `${creditLabel}: ${creditSummary}`,
					});
				}

				const debitSummary = this.buildProductGroupSummary(filter.productId, debitOptions, selectedLabel);
				if (debitSummary) {
					pills.push({
						key: "productTypeDebitPrepaid",
						label: `${debitLabel}: ${debitSummary}`,
					});
				}
			}

			return pills;
		}

		if (filter.entity1) {
			const entityType = this.resolveEntityTypeOption(filter.entity1);
			if (entityType) {
				pills.push({
					key: "entityType",
					label: `${this.commonGlobalService.termText(this.libraryTerm.ENTITY_TYPE)}: ${entityType.name}`,
				});
			}
		}

		if (filter.entity2 != null && filter.entity2 !== -1) {
			const entityLevelTwo = this.commonService.getEntityLevelTwoOptions().find(item => item.id === filter.entity2);
			if (entityLevelTwo) {
				pills.push({
					key: "entityDetail",
					label: `${this.commonGlobalService.termText(this.libraryTerm.ENTITY_DETAIL)}: ${this.commonService.resolveTermText(entityLevelTwo.termKey, entityLevelTwo.name)}`,
				});
			}
		}

		if (filter.entity3?.length) {
			const entityValuesSummary =
				filter.entity3.length === 1 && filter.entity3Labels?.length === 1 ? filter.entity3Labels[0] : `${filter.entity3.length} ${this.commonGlobalService.termText(this.libraryTerm.SELECTED)}`;
			pills.push({
				key: "entityValues",
				label: `${this.commonGlobalService.termText(this.libraryTerm.ENTITY_VALUES)}: ${entityValuesSummary}`,
			});
		}

		if (filter.invoice) {
			pills.push({
				key: "invoice",
				label: `${this.commonGlobalService.termText(this.libraryTerm.INVOICE)}: ${this.commonService.buildInvoiceSelectionSummary(
					filter.invoice,
					this.commonGlobalService.termText(this.libraryTerm.SELECTED)
				)}`,
			});
		}

		return pills;
	}

	onRemoveAdvancedFilter(key: AppliedAdvancedFilterKey): void {
		const globalPayload = this.buildGlobalFilterPayload();
		const globalKey = this.buildGlobalFilterKey(globalPayload);
		if (globalKey !== this.lastAppliedGlobalFilterKey) {
			this.lastAppliedGlobalFilterKey = globalKey;
			this.removeAdvancedFilterWithGlobal.emit({ global: globalPayload, key });
			return;
		}
		this.removeAdvancedFilter.emit(key);
	}

	private buildProductGroupSummary(selectedIds: number[], options: AllocatedProductTypeBrandGroup[], selectedLabel: string): string {
		if (options.length === 0) return "";
		const allIds = options.flatMap(b => b.items.map(i => i.id));
		const groupSelected = selectedIds.filter(id => allIds.includes(id));
		if (groupSelected.length === 0 || groupSelected.length === allIds.length) return "";

		if (groupSelected.length === 1) {
			const id = groupSelected[0];
			const brand = options.find(b => b.items.some(i => i.id === id));
			const product = brand?.items.find(i => i.id === id);
			if (brand && product) return `${brand.brandName} / ${product.name}`;
		}

		const fullySelectedBrand = options.find(b => {
			const brandIds = b.items.map(i => i.id);
			return brandIds.length > 0 && brandIds.every(id => groupSelected.includes(id)) && brandIds.length === groupSelected.length;
		});
		if (fullySelectedBrand) return fullySelectedBrand.brandName;

		return `${groupSelected.length} ${selectedLabel}`;
	}

	private buildGlobalFilterPayload(): FeeLibraryGlobalFilter {
		const range = this.appliedRangeDates ?? this.readDatepickerRange();
		const [start, end] = range ?? [this.commonService.getCurrentMonthStart(), this.commonService.getCurrentMonthStart()];
		const selectedBusinessOptions = this.currentBusinesses.filter(business => this.selectedBusinesses.includes(business.id));
		const allBusinessesSelected = this.selectedBusinesses.length === this.currentBusinesses.length;

		return {
			brandId: this.selectedBrands.length === this.brands.length ? [] : [...this.selectedBrands],
			businessId: allBusinessesSelected ? [] : [...new Set(selectedBusinessOptions.map(business => business.businessId))],
			businessTransaction: this.activeTab() === this.allocatedTab && !allBusinessesSelected ? selectedBusinessOptions.map(this.toSelectedBusinessTransaction) : [],
			bankId: this.resolveBankIdFilter(),
			startDate: this.commonService.formatStartOfMonth(start),
			endDate: this.commonService.formatEndOfMonth(end),
			typePeriod: this.selectedPeriodType,
		};
	}

	private syncEntitiesFromFilter() {
		const clientOptions = this.clientOptions();
		if (clientOptions.length === 0) {
			return;
		}

		const bankId = this.filter()?.bankId ?? "-1";
		if (bankId === "-1" || bankId.length === 0) {
			this.selectedEntities = clientOptions.map(client => client.bankId);
			return;
		}

		this.selectedEntities = bankId
			.split("|")
			.map(value => Number(value))
			.filter(value => !Number.isNaN(value));
	}

	private syncAppliedRangeFromFilter(filter: FeeLibraryFilter): void {
		if (!filter.startDate || !filter.endDate) {
			return;
		}

		const start = new Date(`${filter.startDate}T00:00:00`);
		const end = new Date(`${filter.endDate}T00:00:00`);
		this.appliedRangeDates = [new Date(start.getFullYear(), start.getMonth(), 1), new Date(end.getFullYear(), end.getMonth(), 1)];
	}

	private resolvePreviewRange(): [Date, Date] {
		const range = this.readDatepickerRange() ?? this.appliedRangeDates;
		if (range?.[0] && range?.[1]) {
			return [range[0], range[1]];
		}

		const currentMonth = this.commonService.getCurrentMonthStart();
		return [currentMonth, currentMonth];
	}

	private syncBrandsFromFilter() {
		if (this.brands.length === 0) {
			this.selectedBrands = [];
			return;
		}

		const filter = this.filter();
		this.selectedBrands = filter?.brandId?.length ? [...filter.brandId] : this.brands.map(brand => brand.id);
	}

	private syncBusinessesFromFilter() {
		if (this.currentBusinesses.length === 0) {
			this.selectedBusinesses = [];
			return;
		}

		const filter = this.filter();
		if (this.activeTab() === this.allocatedTab) {
			const selectedTransactions = filter?.businessTransaction ?? [];
			this.selectedBusinesses = selectedTransactions.length
				? this.currentBusinesses
						.filter(business => selectedTransactions.some(transaction => transaction.businessId === business.businessId && transaction.transactionId === business.transactionId))
						.map(business => business.id)
				: this.currentBusinesses.map(business => business.id);
			return;
		}

		this.selectedBusinesses = filter?.businessId?.length
			? this.currentBusinesses.filter(business => filter.businessId.includes(business.businessId)).map(business => business.id)
			: this.currentBusinesses.map(business => business.id);
	}

	private toSelectedBusinessTransaction(business: CurrentBusinessOption): SelectedBusinessTransaction {
		return {
			businessId: business.businessId,
			transactionId: business.transactionId,
		};
	}

	private resolveBankIdFilter(): string {
		if (this.selectedEntities.length === 0) {
			return "-1";
		}
		if (this.selectedEntities.length === this.clientOptions().length && this.clientOptions().length > 1) {
			return "-1";
		}

		return this.selectedEntities.join("|");
	}

	private hasValidRequiredSelections(): boolean {
		if (this.selectedBrands.length === 0) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.libraryTerm.BRAND));
			return false;
		}

		if (this.clientList.length > 1 && this.selectedEntities.length === 0) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.libraryTerm.INSTITUTION));
			return false;
		}

		if (this.currentBusinesses.length > 0 && this.selectedBusinesses.length === 0) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.libraryTerm.BUSINESS));
			return false;
		}

		return true;
	}

	private showRequiredFilterToast(filterName: string): void {
		this.messageService.add({
			severity: "warn",
			summary: this.commonGlobalService.termText(this.libraryTerm.REQUIRED_FILTER),
			detail: `${this.commonGlobalService.termText(this.libraryTerm.SELECT_AT_LEAST_ONE_BEFORE_APPLYING)} ${filterName}.`,
		});
	}

	showDialog() {
		this.advancedFilterVisible = true;
	}

	onAdvancedFilterVisibleChange(visible: boolean): void {
		this.advancedFilterVisible = visible;
	}

	onApplyAdvancedFilters(payload: AdvancedFilterPayload): void {
		const globalPayload = this.buildGlobalFilterPayload();
		const globalKey = this.buildGlobalFilterKey(globalPayload);
		if (globalKey !== this.lastAppliedGlobalFilterKey) {
			this.lastAppliedGlobalFilterKey = globalKey;
			this.applyGlobalAndAdvancedFilters.emit({ global: globalPayload, advanced: payload });
			return;
		}
		this.applyAdvancedFilters.emit(payload);
	}

	onResetAdvancedFilters(): void {
		this.resetAdvancedFilters.emit();
	}

	onClearAllAdvanced(): void {
		this.resetAdvancedFilters.emit();
	}

	private resolveEntityTypeOption(entityTypeId: number): { id: number; name: string; brandName: string } | null {
		const option = this.masters()
			?.entityTypes.flatMap(entityType =>
				entityType.categories
					.filter(category => category.id > 0)
					.map(category => ({
						id: category.id,
						name: category.name,
						brandName: entityType.brandName,
					}))
			)
			.find(entityType => entityType.id === entityTypeId);

		return option ?? null;
	}
}
