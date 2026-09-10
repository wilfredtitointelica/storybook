import { CommonModule } from "@angular/common";
import { Component, DestroyRef, computed, effect, inject, input, output, signal, viewChild, ViewEncapsulation } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { EMPTY, Subject, debounceTime, map, switchMap, takeUntil } from "rxjs";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { TreeSelect } from "primeng/treeselect";
import { TreeNode } from "primeng/api";
import { Select, SelectModule } from "primeng/select";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ClientBankResponse } from "../../common/DTO/client-response";
import { AppliedAdvancedFilterKey, FeeLibraryFilter } from "../DTO/request";
import { AllocatedProductTypeBrandGroup, BasicItemResponse, ClientCatalogItem, EntityProductModel, FeeCategory, FeeLibraryMaster, FeeSubCategory, GroupNameOption } from "../DTO/response";
import { AutoComplete, AutoCompleteModule, AutoCompleteCompleteEvent } from "primeng/autocomplete";
import { LIBRARY_TERM } from "../common/constants";
import { LibraryTabEnum } from "../common/enums";
import { CommonService } from "../domain/common.service";
import { LibraryService } from "../library.service";
import { AdvancedFilterPill, EntityTypeOption, InvoiceOptionGroup, InvoiceOptionViewModel } from "../common/types";
import { ModalAdvancedFilterService } from "./modal-advanced-filter.service";
import { AlertService, AlertType } from "intelica-library-base";
import { CommonGlobalService } from "../../common/services/common.service";

export type AdvancedFilterPayload = Pick<
	FeeLibraryFilter,
	| "category"
	| "subCategory"
	| "subCategoryIds"
	| "rateId"
	| "customCategoryId"
	| "parentFeeCodeText"
	| "parentFeeName"
	| "minAmount"
	| "maxAmount"
	| "productId"
	| "productIdLabels"
	| "entity1"
	| "entity2"
	| "entity3"
	| "entity3Labels"
	| "invoice"
>;

type ProductTypeGroupKey = "credit" | "debitPrepaid";

@Component({
	selector: "fee-modal-advanced-filter",
	imports: [CommonModule, FormsModule, DialogModule, ButtonModule, CheckboxModule, InputTextModule, MultiSelectModule, TreeSelect, SelectModule, Select, TagModule, TabsModule, TooltipModule, AutoCompleteModule],
	templateUrl: "./modal-advanced-filter.html",
	styleUrl: "./modal-advanced-filter.css",
	encapsulation: ViewEncapsulation.None,
})
export class ModalAdvancedFilter {
	private readonly messageService = inject(MessageService);
	private readonly destroyRef = inject(DestroyRef);
	readonly commonService = inject(CommonService);
	private readonly libraryService = inject(LibraryService);
	readonly commonGlobalService = inject(CommonGlobalService);
	private readonly helper = inject(ModalAdvancedFilterService);
	private readonly alertService = inject(AlertService);
	readonly libraryTerm = LIBRARY_TERM;
	private readonly amountDecimals = 2;
	private readonly amountMaxLength = 11;
	private readonly groupNameSearchLimit = 20;
	private groupNameSearchCache: { query: string; results: GroupNameOption[] } | null = null;
	private readonly groupNameQuery$ = new Subject<string | null>();
	private readonly groupNameCancel$ = new Subject<void>();
	private readonly groupNameAutoComplete = viewChild(AutoComplete);
	private hasInitialized = false;
	private lastInvoicesScopeKey = "";
	private pendingInvoicesScopeKey = "";
	private lastEntityProductsScopeKey = "";
	private invoiceLoadTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly TREESELECT_SELECT_ALL_KEY = "__select_all__";

	visible = input(false);
	busy = input(false);
	activeTab = input<LibraryTabEnum>(LibraryTabEnum.Original);
	clientList = input<ClientBankResponse[]>([]);
	selectedBankId = input("-1");
	selectedBrandIds = input<number[]>([]);
	selectedStartDate = input("");
	selectedEndDate = input("");
	masters = input<FeeLibraryMaster | null>(null);
	filter = input<FeeLibraryFilter | null>(null);
	hasSelectedBrands = input(true);
	hasSelectedBusinesses = input(true);
	requireBusinessSelection = input(false);

	visibleChange = output<boolean>();
	applyAdvancedFilters = output<AdvancedFilterPayload>();
	resetAdvancedFilters = output<void>();
	removeAdvancedFilter = output<AppliedAdvancedFilterKey>();

	dialogVisible = false;
	selectedCategoryId: number | null = null;
	selectedSubCategoryId: number | null = null;
	treeSelectedCategoryIds: number[] = [];
	treeSelectedSubCategoryIds: number[] = [];
	selectedCustomCategoryIds: number[] = [];
	selectedRateIds: number[] = [];
	selectedCreditProductIds: number[] = [];
	selectedDebitPrepaidProductIds: number[] = [];
	minAmount: number | null = null;
	maxAmount: number | null = null;
	selectedInvoiceNumbers: string[] = [];
	selectedEntityTypeId: number | null = null;
	selectedEntityLevelTwoId = -1;
	selectedEntityProductIds: number[] = [];
	minAmountInput = "";
	maxAmountInput = "";
	appliedCustomCategoryIds: number[] = [];
	categoryTreeSelectedNodes = signal<TreeNode[]>([]);
	creditTreeSelectedNodes = signal<TreeNode[]>([]);
	debitPrepaidTreeSelectedNodes = signal<TreeNode[]>([]);
	selectedParentFeeCodeText = "";
	selectedParentFeeName = "";
	groupNameSuggestions: string[] = [];
	invoiceOptions: InvoiceOptionGroup[] = [];

	get groupNameResultsTruncated(): boolean {
		return this.groupNameSuggestions.length >= this.groupNameSearchLimit;
	}

	get invoiceOptionsCount(): number {
		return this.invoiceOptions.reduce((total, group) => total + (group.items?.length ?? 0), 0);
	}
	private _flatInvoiceOptions: InvoiceOptionViewModel[] = [];
	entityProductOptions: EntityProductModel[] = [];
	loadingInvoices = false;
	loadingEntityProducts = false;
	readonly originalTab = LibraryTabEnum.Original;
	readonly allocatedTab = LibraryTabEnum.Allocated;

	constructor() {
		effect(() => {
			const nextVisible = this.visible();
			const filter = this.filter();
			this.masters();
			this.activeTab();
			this.selectedBankId();
			this.selectedBrandIds();
			this.selectedStartDate();
			this.selectedEndDate();
			this.groupNameSearchCache = null;
			this.dialogVisible = nextVisible;
			if (!filter) return;
			if (!this.hasInitialized || nextVisible) {
				this.syncAdvancedCategorizationFromFilter();
				this.syncEntityInvoiceFromFilter();
				this.selectedCustomCategoryIds = [...this.appliedCustomCategoryIds];
				this.hasInitialized = true;
			}
			if (!this.isAllocatedTab) {
				this.scheduleInvoiceLoad();
			}
			if (nextVisible) {
				if (this.isAllocatedTab) {
					this.syncAllocatedProductTypesFromFilter();
					return;
				}
				this.loadEntityProducts(false);
			}
		});

		this.groupNameQuery$
			.pipe(
				debounceTime(300),
				switchMap(query =>
					!query
						? EMPTY
						: this.libraryService
								.searchGroupNames(this.selectedBankId(), this.isAllocatedTab, query)
								.pipe(
									map(options => ({ query, options })),
									takeUntil(this.groupNameCancel$)
								)
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: ({ query, options }) => {
					this.groupNameSearchCache = options.length < this.groupNameSearchLimit ? { query, results: options } : null;
					this.groupNameSuggestions = options.map(o => o.name);
				},
				error: () => {
					this.groupNameSearchCache = null;
					this.groupNameSuggestions = [];
				},
			});
	}

	// ─── Master getters ────────────────────────────────────────────────────────

	get masterCategories(): FeeCategory[] {
		return this.masters()?.categories ?? [];
	}
	get masterSubCategories(): FeeSubCategory[] {
		return this.masters()?.subCategories ?? [];
	}
	get masterTypeOfRates(): BasicItemResponse[] {
		return this.masters()?.typeOfRates ?? [];
	}
	get masterCustomCategories(): ClientCatalogItem[] {
		return this.masters()?.customCategories ?? [];
	}

	// ─── Entity getters ────────────────────────────────────────────────────────

	get entityTypeOptions(): EntityTypeOption[] {
		const brandIds = this.selectedBrandIds();
		const scopedIds = brandIds.length > 0 ? new Set(brandIds) : null;
		return (this.masters()?.entityTypes ?? [])
			.filter(et => !scopedIds || scopedIds.has(et.brandId))
			.flatMap(et =>
				et.categories
					.filter(c => c.id > 0)
					.map(c => ({ id: c.id, name: c.name, brandId: et.brandId, brandName: et.brandName, brandIconClass: this.commonService.resolveBrandIconClass(et.brandName, null) }))
			);
	}

	get entityLevelTwoOptions(): { id: number; name: string }[] {
		return this.commonService.getEntityLevelTwoOptions().map(o => ({ id: o.id, name: this.commonService.resolveTermText(o.termKey, o.name) }));
	}

	get shouldShowEntityTypeSection(): boolean {
		return !this.isAllocatedTab && this.entityTypeOptions.length > 0;
	}
	get selectedEntityTypeOption(): EntityTypeOption | null {
		return this.entityTypeOptions.find(o => o.id === this.selectedEntityTypeId) ?? null;
	}
	get entityLevelTwoLabel(): string {
		return this.selectedEntityTypeOption
			? `${this.selectedEntityTypeOption.brandName} ${this.commonGlobalService.termText(this.libraryTerm.ENTITY_TYPE)}`
			: this.commonGlobalService.termText(this.libraryTerm.ENTITY_DETAIL);
	}
	get entityProductsLabel(): string {
		return this.selectedEntityTypeName
			? `${this.commonGlobalService.termText(this.libraryTerm.FILTER_BY)} ${this.selectedEntityTypeName}`
			: this.commonGlobalService.termText(this.libraryTerm.ENTITY_VALUES);
	}
	get selectedEntityTypeName(): string {
		return this.selectedEntityTypeOption?.name ?? "";
	}
	get selectedEntityTypeBrandName(): string {
		return this.selectedEntityTypeOption?.brandName ?? "";
	}
	get requiresEntityLevelTwo(): boolean {
		return this.selectedEntityTypeId === 10;
	}
	get hasEntityProductOptions(): boolean {
		return this.shouldShowEntityProducts && this.entityProductOptions.length > 0;
	}
	get shouldShowEntityProducts(): boolean {
		return !this.requiresEntityLevelTwo || this.selectedEntityLevelTwoId !== -1;
	}

	// ─── Other getters ─────────────────────────────────────────────────────────

	get advancedFilterPills(): AdvancedFilterPill[] {
		return this.helper.buildAdvancedFilterPills(
			this.filter(),
			this.masterCategories,
			this.masterSubCategories,
			this.masterTypeOfRates,
			this.filteredCustomCategories,
			this.entityTypeOptions,
			this.isAllocatedTab,
			this.entityLevelTwoOptions,
			this.entityProductOptions,
			this.amountDecimals,
			this.scopedCreditOptions,
			this.scopedDebitPrepaidOptions
		);
	}

	get hasInvoiceFilterApplied(): boolean {
		return this.selectedInvoiceNumbers.length > 0 && this.flatInvoiceOptions.length > 0;
	}

	get invoiceSelectionLabel(): string {
		return this.commonGlobalService.termText(this.libraryTerm.INVOICES_SELECTED);
	}
	get filteredCustomCategories(): ClientCatalogItem[] {
		return this.commonService.filterClientCatalogItemsByClientIds(this.masterCustomCategories, this.selectedClientIds);
	}
	get hasFilteredCustomCategories(): boolean {
		return this.filteredCustomCategories.length > 0;
	}

	get customCategorySelectionLabel(): string {
		if (this.filteredCustomCategories.length > 0 && this.selectedCustomCategoryIds.length >= this.filteredCustomCategories.length)
			return this.commonGlobalService.termText(this.libraryTerm.ALL_CUSTOM_CATEGORIES);
		return this.commonGlobalService.termText(this.libraryTerm.CUSTOM_CATEGORY_SELECTED);
	}

	get rateTypeSelectionLabel(): string {
		if (this.masterTypeOfRates.length > 0 && this.selectedRateIds.length >= this.masterTypeOfRates.length) return this.commonGlobalService.termText(this.libraryTerm.ALL_RATE_TYPES);
		return this.commonGlobalService.termText(this.libraryTerm.RATE_TYPES_SELECTED);
	}

	get entityValuesSelectionLabel(): string {
		const total = this.entityProductOptions.length;
		if (total > 0 && this.selectedEntityProductIds.length >= total) return this.commonGlobalService.termText(this.libraryTerm.ALL_ENTITY_VALUES);
		return this.commonGlobalService.termText(this.libraryTerm.ENTITY_VALUES_SELECTED);
	}

	get selectedClientIds(): number[] {
		return this.commonService.resolveScopedClientIds(this.clientList(), this.selectedBankId() || this.filter()?.bankId || "-1");
	}
	get firstSectionLabel(): string {
		return this.activeTab() === this.allocatedTab ? this.commonGlobalService.termText(this.libraryTerm.PRODUCT_TYPE) : this.commonGlobalService.termText(this.libraryTerm.ENTITIES_AND_INVOICES);
	}
	get isAllocatedTab(): boolean {
		return this.activeTab() === this.allocatedTab;
	}

	get isCreditProductTypeSelectionDefault(): boolean {
		const allIds = this.getAllocatedAllProductIds("credit");
		return allIds.length === 0 || this.selectedCreditProductIds.length === 0 || this.selectedCreditProductIds.length >= allIds.length;
	}

	get isDebitPrepaidProductTypeSelectionDefault(): boolean {
		const allIds = this.getAllocatedAllProductIds("debitPrepaid");
		return allIds.length === 0 || this.selectedDebitPrepaidProductIds.length === 0 || this.selectedDebitPrepaidProductIds.length >= allIds.length;
	}

	get isCategorySelectionDefault(): boolean {
		return this.masterSubCategories.every(s => this.treeSelectedSubCategoryIds.includes(s.id)) || (this.treeSelectedCategoryIds.length === 0 && this.treeSelectedSubCategoryIds.length === 0);
	}

	get isCreditAllSelected(): boolean {
		const allIds = this.getAllocatedAllProductIds("credit");
		return allIds.length > 0 && this.selectedCreditProductIds.length >= allIds.length;
	}

	get isDebitPrepaidAllSelected(): boolean {
		const allIds = this.getAllocatedAllProductIds("debitPrepaid");
		return allIds.length > 0 && this.selectedDebitPrepaidProductIds.length >= allIds.length;
	}

	get isCategoryAllSelected(): boolean {
		return this.masterSubCategories.length > 0 && this.helper.isAllCatSelected(this.treeSelectedSubCategoryIds, this.masterSubCategories);
	}

	get isCategoryEmpty(): boolean {
		return this.helper.isCatEmpty(this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds);
	}

	get categorySelectionLabel(): string {
		if (this.helper.isAllCatSelected(this.treeSelectedSubCategoryIds, this.masterSubCategories) || this.helper.isCatEmpty(this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds)) {
			return this.commonGlobalService.termText(this.libraryTerm.ALL_CATEGORIES_AND_SUBCATEGORIES);
		}
		const fullySel = this.masterCategories.filter(c => this.helper.isCategorySelected(c.id, this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds, this.masterSubCategories));
		if (fullySel.length === 1 && this.treeSelectedSubCategoryIds.length === this.helper.getSubCategoryIds(fullySel[0].id, this.masterSubCategories).length) {
			return fullySel[0].description;
		}
		if (this.treeSelectedSubCategoryIds.length === 1) {
			const sub = this.masterSubCategories.find(s => s.id === this.treeSelectedSubCategoryIds[0]);
			const cat = this.masterCategories.find(c => c.id === sub?.categoryId);
			if (sub && cat) return `${cat.description} / ${sub.description}`;
		}
		return `${this.treeSelectedSubCategoryIds.length} ${this.commonGlobalService.termText(this.libraryTerm.SELECTED)}`;
	}

	get firstSectionAppliedCount(): string | undefined {
		const count = this.isAllocatedTab ? this.getAllocatedFirstSectionAppliedCount() : this.getOriginalFirstSectionAppliedCount();
		return count > 0 ? String(count) : undefined;
	}

	get categorizationAppliedCount(): string | undefined {
		const filter = this.filter();
		if (!filter) return undefined;
		let count = 0;
		if (this.commonService.resolveAppliedSubCategoryIds(filter, this.masterSubCategories).length > 0) count++;
		if ((filter.customCategoryId?.length ?? 0) > 0) count++;
		if (filter.parentFeeCodeText?.trim()) count++;
		if (filter.parentFeeName?.trim()) count++;
		return count > 0 ? String(count) : undefined;
	}

	get rateAndAmountAppliedCount(): string | undefined {
		const filter = this.filter();
		if (!filter) return undefined;
		let count = 0;
		if ((filter.rateId?.length ?? 0) > 0) count++;
		if (filter.minAmount != null || filter.maxAmount != null) count++;
		return count > 0 ? String(count) : undefined;
	}

	// ─── Tree computeds ────────────────────────────────────────────────────────

	readonly categoryTreeNodes = computed<TreeNode[]>(() =>
		this.helper.buildCategoryTreeNodes(this.masters()?.categories ?? [], this.masters()?.subCategories ?? [], this.commonGlobalService.termText(this.libraryTerm.SELECT_ALL))
	);

	readonly creditTreeNodes = computed<TreeNode[]>(() =>
		this.helper.buildProductTypeTreeNodes(this.filterAllocatedBrandsBySelection(this.masters()?.productTypes?.credit ?? []), this.commonGlobalService.termText(this.libraryTerm.SELECT_ALL))
	);

	readonly debitPrepaidTreeNodes = computed<TreeNode[]>(() =>
		this.helper.buildProductTypeTreeNodes(this.filterAllocatedBrandsBySelection(this.masters()?.productTypes?.debitPrepaid ?? []), this.commonGlobalService.termText(this.libraryTerm.SELECT_ALL))
	);

	// ─── Dialog actions ────────────────────────────────────────────────────────

	onDialogVisibleChange(visible: boolean): void {
		if (!visible) {
			this.closeAdvancedFilter();
			return;
		}
		this.dialogVisible = true;
		this.visibleChange.emit(true);
	}

	applyAdvancedFilter(): void {
		if (!this.hasValidRequiredSelections() || !this.hasValidAmountRange()) return;
		const payload = this.buildAdvancedPayload();
		this.selectedCategoryId = payload.category > 0 ? payload.category : null;
		this.selectedSubCategoryId = payload.subCategory > 0 ? payload.subCategory : null;
		this.appliedCustomCategoryIds = [...this.selectedCustomCategoryIds];
		this.applyAdvancedFilters.emit(payload);
		this.dialogVisible = false;
		this.visibleChange.emit(false);
	}

	private buildAdvancedPayload(): AdvancedFilterPayload {
		const cat = this.helper.resolveCategorizationPayload(this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds, this.masterCategories, this.masterSubCategories);
		return {
			category: cat.category,
			subCategory: cat.subCategory,
			subCategoryIds: cat.subCategoryIds,
			productId: this.resolveAppliedAllocatedProductIds(),
			productIdLabels: this.resolveAppliedAllocatedProductLabels(),
			rateId: this.selectedRateIds.length === this.masterTypeOfRates.length ? [] : [...this.selectedRateIds],
			customCategoryId: this.selectedCustomCategoryIds.length === this.filteredCustomCategories.length ? [] : [...this.selectedCustomCategoryIds],
			parentFeeCodeText: this.selectedParentFeeCodeText.trim() || null,
			parentFeeName: this.selectedParentFeeName.trim() || null,
			minAmount: this.commonService.resolveAppliedMinAmount(this.minAmount, this.maxAmount),
			maxAmount: this.maxAmount,
			invoice: this.isAllocatedTab ? null : this.hasInvoiceFilterApplied ? this.selectedInvoiceNumbers.join("|") : null,
			entity1: this.resolveAppliedEntityTypeId(),
			entity2: this.resolveAppliedEntityLevelTwoId(),
			entity3: this.resolveAppliedEntityProductIds(),
			entity3Labels: this.resolveAppliedEntityValueLabels(),
		};
	}

	// Comparacion por contenido, sin importar el orden ni el tipo (number[] o string[]).
	private sameSet<T>(a?: T[] | null, b?: T[] | null): boolean {
		return JSON.stringify([...(a ?? [])].sort()) === JSON.stringify([...(b ?? [])].sort());
	}

	private hasUnappliedChanges(): boolean {
		const f = this.filter();
		if (!f) return false;

		const cat = this.helper.resolveCategorizationPayload(this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds, this.masterCategories, this.masterSubCategories);
		const rate = this.selectedRateIds.length === this.masterTypeOfRates.length ? [] : this.selectedRateIds;
		const custom = this.selectedCustomCategoryIds.length === this.filteredCustomCategories.length ? [] : this.selectedCustomCategoryIds;

		const commonChanged =
			cat.category !== (f.category ?? -1) ||
			cat.subCategory !== (f.subCategory ?? -1) ||
			!this.sameSet(cat.subCategoryIds, f.subCategoryIds) ||
			!this.sameSet(rate, f.rateId) ||
			!this.sameSet(custom, f.customCategoryId) ||
			this.selectedParentFeeCodeText.trim() !== (f.parentFeeCodeText ?? "").trim() ||
			this.selectedParentFeeName.trim() !== (f.parentFeeName ?? "").trim() ||
			(this.minAmount ?? null) !== (f.minAmount ?? null) ||
			(this.maxAmount ?? null) !== (f.maxAmount ?? null);
		if (commonChanged) return true;

		if (this.isAllocatedTab) {
			return !this.sameSet(this.resolveAppliedAllocatedProductIds(), f.productId);
		}

		// Entity + invoice: comparados sobre la seleccion cruda (evita falsos positivos por listas async sin cargar aun)
		const appliedInvoices = f.invoice ? this.commonService.splitPipeSelection(f.invoice) : [];
		const entityLevelTwo = this.selectedEntityTypeId ? this.selectedEntityLevelTwoId : -1;
		return (
			(this.selectedEntityTypeId ?? null) !== (f.entity1 ?? null) ||
			entityLevelTwo !== (f.entity2 ?? -1) ||
			!this.sameSet(this.selectedEntityProductIds, f.entity3) ||
			!this.sameSet(this.selectedInvoiceNumbers, appliedInvoices)
		);
	}

	resetAdvancedFilter(): void {
		// Reset del panel = solo limpia la selección en memoria (no aplica, no recarga, no cierra).
		this.selectedCategoryId = null;
		this.selectedSubCategoryId = null;
		this.treeSelectedCategoryIds = [];
		this.treeSelectedSubCategoryIds = [];
		this.selectedCustomCategoryIds = [];
		this.selectedCreditProductIds = [];
		this.selectedDebitPrepaidProductIds = [];
		this.selectedRateIds = [];
		this.selectedInvoiceNumbers = [];
		this.selectedEntityTypeId = null;
		this.selectedEntityLevelTwoId = -1;
		this.selectedEntityProductIds = [];
		this.entityProductOptions = [];
		this.minAmount = null;
		this.maxAmount = null;
		this.minAmountInput = "";
		this.maxAmountInput = "";
		this.selectedParentFeeCodeText = "";
		this.selectedParentFeeName = "";
		this.groupNameSuggestions = [];
		this.groupNameSearchCache = null;
		this.syncCategoryTreeSelectedNodes();
		this.syncProductTypeTreeSelectedNodes("credit");
		this.syncProductTypeTreeSelectedNodes("debitPrepaid");
	}

	private hasAdvancedFiltersApplied(): boolean {
		const f = this.filter();
		if (!f) return false;
		return (
			f.category !== -1 ||
			f.subCategory !== -1 ||
			(f.subCategoryIds?.length ?? 0) > 0 ||
			(f.rateId?.length ?? 0) > 0 ||
			(f.customCategoryId?.length ?? 0) > 0 ||
			(f.parentFeeCodeText?.trim() ?? "") !== "" ||
			(f.parentFeeName?.trim() ?? "") !== "" ||
			(f.productId?.length ?? 0) > 0 ||
			f.entity1 != null ||
			f.entity2 != null ||
			(f.entity3?.length ?? 0) > 0 ||
			f.invoice != null ||
			f.minAmount != null ||
			f.maxAmount != null
		);
	}

	async closeAdvancedFilter(): Promise<void> {
		if (this.hasUnappliedChanges()) {
			const result = await this.alertService.confirm(
				this.commonGlobalService.termText(this.libraryTerm.CLOSE_ADVANCED_FILTER_UNSAVED),
				this.commonGlobalService.termText(this.libraryTerm.ARE_YOU_SURE),
				this.commonGlobalService.termText(this.libraryTerm.YES),
				this.commonGlobalService.termText(this.libraryTerm.NO),
				AlertType.WARNING
			);
			if (!result.isConfirmed) {
				this.dialogVisible = true;
				return;
			}
		}
		this.clearScheduledInvoiceLoad();
		this.dialogVisible = false;
		this.visibleChange.emit(false);
		this.syncAdvancedCategorizationFromFilter();
		this.syncEntityInvoiceFromFilter();
		this.selectedCustomCategoryIds = [...this.appliedCustomCategoryIds];
	}

	onRemoveAdvancedFilter(key: AppliedAdvancedFilterKey): void {
		this.removeAdvancedFilter.emit(key);
	}

	// ─── Amount handlers ───────────────────────────────────────────────────────

	updateMinAmount(step: number): void {
		this.setMinAmountValue((this.minAmount ?? 0) + step);
	}
	updateMaxAmount(step: number): void {
		this.setMaxAmountValue((this.maxAmount ?? 0) + step);
	}

	onMinAmountInput(value: string | number | null): void {
		this.minAmountInput = this.helper.sanitizeAmountInput(value, this.amountDecimals, this.amountMaxLength);
		this.minAmount = this.helper.normalizeAmountValue(this.minAmountInput, this.amountDecimals, this.amountMaxLength);
	}

	onMaxAmountInput(value: string | number | null): void {
		this.maxAmountInput = this.helper.sanitizeAmountInput(value, this.amountDecimals, this.amountMaxLength);
		this.maxAmount = this.helper.normalizeAmountValue(this.maxAmountInput, this.amountDecimals, this.amountMaxLength);
	}

	onMinAmountFocus(): void {
		this.minAmountInput = this.helper.toEditableAmountInput(this.minAmount, this.amountMaxLength);
	}
	onMaxAmountFocus(): void {
		this.maxAmountInput = this.helper.toEditableAmountInput(this.maxAmount, this.amountMaxLength);
	}
	onMinAmountBlur(): void {
		this.minAmountInput = this.helper.toEditableAmountInput(this.minAmount, this.amountMaxLength);
	}
	onMaxAmountBlur(): void {
		this.maxAmountInput = this.helper.toEditableAmountInput(this.maxAmount, this.amountMaxLength);
	}

	onAmountKeyDown(event: KeyboardEvent): void {
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		const allowed = new Set(["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);
		if (allowed.has(event.key) || /^\d$/.test(event.key)) return;
		const inp = event.target as HTMLInputElement | null;
		const val = inp?.value ?? "";
		const ss = inp?.selectionStart ?? val.length;
		const se = inp?.selectionEnd ?? val.length;
		const hasSel = ss !== se;
		if (event.key === "-") {
			if (!val.includes("-") && ss === 0) return;
			if (hasSel && ss === 0 && val.slice(ss, se).includes("-")) return;
		} else if (event.key === "." || event.key === ",") {
			const norm = val.replace(",", ".");
			if (!norm.includes(".") || (hasSel && norm.slice(ss, se).includes("."))) return;
		}
		event.preventDefault();
	}

	onAmountPaste(event: ClipboardEvent, target: "min" | "max"): void {
		event.preventDefault();
		const v = event.clipboardData?.getData("text") ?? "";
		target === "min" ? this.onMinAmountInput(v) : this.onMaxAmountInput(v);
	}

	// ─── Entity handlers ───────────────────────────────────────────────────────

	onEntityTypeChange(value: number | null): void {
		this.selectedEntityTypeId = value;
		this.selectedEntityLevelTwoId = -1;
		this.selectedEntityProductIds = [];
		this.loadEntityProducts(true);
	}

	onEntityLevelTwoChange(value: number | null): void {
		this.selectedEntityLevelTwoId = value ?? -1;
		this.selectedEntityProductIds = [];
		this.loadEntityProducts(true);
	}

	// ─── Group name handlers ───────────────────────────────────────────────────

	onGroupNameModelChange(value: string): void {
		this.selectedParentFeeName = value ?? "";
		if (this.selectedParentFeeName.trim().length < 2) {
			this.cancelPendingGroupNameSearch();
		}
	}

	onSearchGroupNames(event: AutoCompleteCompleteEvent): void {
		const query = event.query ?? "";
		this.groupNameCancel$.next();

		if (query.trim().length < 2) {
			this.cancelPendingGroupNameSearch();
			return;
		}

		const cache = this.groupNameSearchCache;
		if (cache && query.toLowerCase().includes(cache.query.toLowerCase())) {
			this.groupNameSuggestions = cache.results.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).map(o => o.name);
			this.groupNameQuery$.next(null);
			return;
		}

		this.groupNameQuery$.next(query);
	}

	private cancelPendingGroupNameSearch(): void {
		this.groupNameCancel$.next();
		this.groupNameQuery$.next(null);
		this.groupNameSuggestions = [];
	}

	onGroupNameFocus(): void {
		if (this.selectedParentFeeName.trim().length < 2) return;
		this.onSearchGroupNames({ query: this.selectedParentFeeName } as AutoCompleteCompleteEvent);
		this.groupNameAutoComplete()?.show();
	}

	// ─── Sync from filter ──────────────────────────────────────────────────────

	private syncAdvancedCategorizationFromFilter(): void {
		const filter = this.filter();
		const catId = filter?.category ?? -1;
		const subCatId = filter?.subCategory ?? -1;
		const subCatIds = this.commonService.resolveAppliedSubCategoryIds({ category: catId, subCategory: subCatId, subCategoryIds: filter?.subCategoryIds ?? [] }, this.masterSubCategories);
		this.selectedCategoryId = catId > 0 ? catId : null;
		this.selectedSubCategoryId = subCatId > 0 ? subCatId : null;
		const sync = this.helper.syncCategorizationFromFilter(catId, subCatId, subCatIds, this.masterCategories, this.masterSubCategories);
		this.treeSelectedCategoryIds = sync.treeSelectedCategoryIds;
		this.treeSelectedSubCategoryIds = sync.treeSelectedSubCategoryIds;
		const available = this.filteredCustomCategories.map(i => i.id);
		this.selectedCustomCategoryIds = filter?.customCategoryId?.length ? filter.customCategoryId.filter(id => available.includes(id)) : [];
		this.appliedCustomCategoryIds = [...this.selectedCustomCategoryIds];
		this.selectedRateIds = filter?.rateId?.length ? [...filter.rateId] : [];
		this.selectedParentFeeCodeText = filter?.parentFeeCodeText ?? "";
		this.selectedParentFeeName = filter?.parentFeeName ?? "";
		this.minAmount = filter?.minAmount ?? null;
		this.maxAmount = filter?.maxAmount ?? null;
		this.minAmountInput = this.commonService.formatAmountInput(this.minAmount, this.amountDecimals);
		this.maxAmountInput = this.commonService.formatAmountInput(this.maxAmount, this.amountDecimals);
		this.syncCategoryTreeSelectedNodes();
	}

	private syncEntityInvoiceFromFilter(): void {
		const filter = this.filter();
		if (this.isAllocatedTab) {
			this.syncAllocatedProductTypesFromFilter();
			this.selectedEntityTypeId = null;
			this.selectedEntityLevelTwoId = -1;
			this.selectedEntityProductIds = [];
			this.entityProductOptions = [];
			return;
		}
		this.selectedInvoiceNumbers = filter?.invoice ? this.commonService.splitPipeSelection(filter.invoice) : [];
		const etId = filter?.entity1 && filter.entity1 > 0 ? filter.entity1 : null;
		this.selectedEntityTypeId = etId && this.entityTypeOptions.some(o => o.id === etId) ? etId : null;
		this.selectedEntityLevelTwoId = filter?.entity2 ?? -1;
		const entity3 = filter?.entity3 ?? [];
		this.selectedEntityProductIds = entity3.length > 0 ? [...entity3] : [];
	}

	private syncAllocatedProductTypesFromFilter(resetSelection = false): void {
		if (!this.isAllocatedTab) return;
		const filter = this.filter();
		const ids = resetSelection ? [] : [...(filter?.productId ?? [])];
		const allCredit = this.scopedCreditOptions.flatMap(b => b.items.map(i => i.id));
		const allDebit = this.scopedDebitPrepaidOptions.flatMap(b => b.items.map(i => i.id));
		this.selectedCreditProductIds = ids.length > 0 ? ids.filter(id => allCredit.includes(id)) : [];
		this.selectedDebitPrepaidProductIds = ids.length > 0 ? ids.filter(id => allDebit.includes(id)) : [];
		this.syncProductTypeTreeSelectedNodes("credit");
		this.syncProductTypeTreeSelectedNodes("debitPrepaid");
	}

	// ─── Invoice loading ───────────────────────────────────────────────────────

	private scheduleInvoiceLoad(): void {
		const key = this.resolveInvoicesScopeKey();
		if (!key) {
			this.clearScheduledInvoiceLoad();
			this.setInvoiceOptions([]);
			this.lastInvoicesScopeKey = "";
			this.pendingInvoicesScopeKey = "";
			this.loadingInvoices = false;
			return;
		}
		if (this.lastInvoicesScopeKey === key || this.pendingInvoicesScopeKey === key) {
			this.loadingInvoices = false;
			return;
		}
		this.clearScheduledInvoiceLoad();
		this.pendingInvoicesScopeKey = key;
		this.loadingInvoices = true;
		this.invoiceLoadTimeout = setTimeout(() => {
			this.invoiceLoadTimeout = null;
			this.loadInvoices();
		}, 0);
	}

	private loadInvoices(): void {
		const key = this.resolveInvoicesScopeKey();
		if (!key) {
			this.setInvoiceOptions([]);
			this.lastInvoicesScopeKey = "";
			this.pendingInvoicesScopeKey = "";
			this.loadingInvoices = false;
			return;
		}
		if (this.lastInvoicesScopeKey === key) {
			this.loadingInvoices = false;
			this.pendingInvoicesScopeKey = "";
			return;
		}
		const brandIds = [...this.selectedBrandIds()].sort((a, b) => a - b);
		this.libraryService
			.getInvoices(this.selectedBankId(), this.selectedStartDate(), this.selectedEndDate(), brandIds)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: invoices => {
					this.loadingInvoices = false;
					this.pendingInvoicesScopeKey = "";
					this.lastInvoicesScopeKey = key;
					this.setInvoiceOptions(this.helper.buildInvoiceOptionGroups(invoices));
					if (this.selectedInvoiceNumbers.length > 0) {
						const availableSet = new Set(this.flatInvoiceOptions.map(o => o.invoiceNumber));
						this.selectedInvoiceNumbers = this.selectedInvoiceNumbers.filter(n => availableSet.has(n));
					}
				},
				error: () => {
					this.loadingInvoices = false;
					this.pendingInvoicesScopeKey = "";
					this.lastInvoicesScopeKey = "";
					this.setInvoiceOptions([]);
				},
			});
	}

	private clearScheduledInvoiceLoad(): void {
		if (this.invoiceLoadTimeout) {
			clearTimeout(this.invoiceLoadTimeout);
			this.invoiceLoadTimeout = null;
		}
	}

	private resolveInvoicesScopeKey(): string {
		const bankId = this.selectedBankId(),
			start = this.selectedStartDate(),
			end = this.selectedEndDate();
		if (!bankId || !start || !end) return "";
		const brandIds = [...this.selectedBrandIds()].sort((a, b) => a - b);
		return `${bankId}|${start}|${end}|${brandIds.join(",") || "-1"}`;
	}

	get flatInvoiceOptions() {
		return this._flatInvoiceOptions;
	}

	private setInvoiceOptions(groups: InvoiceOptionGroup[]): void {
		this.invoiceOptions = groups;
		this._flatInvoiceOptions = groups.flatMap(g => g.items);
	}

	// ─── Entity products loading ───────────────────────────────────────────────

	private loadEntityProducts(resetSelection: boolean): void {
		if (this.isAllocatedTab || !this.shouldShowEntityTypeSection || !this.selectedEntityTypeId) {
			this.entityProductOptions = [];
			this.selectedEntityProductIds = [];
			this.lastEntityProductsScopeKey = "";
			return;
		}
		if (this.requiresEntityLevelTwo && this.selectedEntityLevelTwoId === -1) {
			this.entityProductOptions = [];
			this.selectedEntityProductIds = [];
			this.lastEntityProductsScopeKey = "";
			this.loadingEntityProducts = false;
			return;
		}
		const entityValue = this.requiresEntityLevelTwo ? this.selectedEntityLevelTwoId : -1;
		const scopeKey = `${this.selectedBankId()}|${this.selectedEntityTypeId}|${entityValue}`;
		if (!resetSelection && this.lastEntityProductsScopeKey === scopeKey) return;
		this.loadingEntityProducts = true;
		this.lastEntityProductsScopeKey = scopeKey;
		this.libraryService
			.getProducts(this.selectedBankId(), this.selectedEntityTypeId, entityValue)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: products => {
					this.loadingEntityProducts = false;
					this.entityProductOptions = products;
					const ids = products.map(p => p.prodId);
					if (resetSelection) {
						this.selectedEntityProductIds = [];
						return;
					}
					this.selectedEntityProductIds = this.selectedEntityProductIds.filter(id => ids.includes(id));
				},
				error: () => {
					this.loadingEntityProducts = false;
					this.lastEntityProductsScopeKey = "";
					this.entityProductOptions = [];
					this.selectedEntityProductIds = [];
				},
			});
	}

	// ─── Product type tree ─────────────────────────────────────────────────────

	get scopedCreditOptions(): AllocatedProductTypeBrandGroup[] {
		return this.filterAllocatedBrandsBySelection(this.masters()?.productTypes?.credit ?? []);
	}
	get scopedDebitPrepaidOptions(): AllocatedProductTypeBrandGroup[] {
		return this.filterAllocatedBrandsBySelection(this.masters()?.productTypes?.debitPrepaid ?? []);
	}

	private filterAllocatedBrandsBySelection(options: AllocatedProductTypeBrandGroup[]): AllocatedProductTypeBrandGroup[] {
		const ids = this.selectedBrandIds();
		return ids.length === 0 ? options : options.filter(o => ids.includes(o.brandId));
	}

	buildAllocatedProductSelectionLabel(group: ProductTypeGroupKey): string {
		const options = group === "credit" ? this.scopedCreditOptions : this.scopedDebitPrepaidOptions;
		const selectedIds = this.getAllocatedSelectedProductIds(group);
		const placeholder =
			group === "credit"
				? this.commonService.resolveTermText(this.libraryTerm.SELECT_CREDIT_TYPE, "Select credit type")
				: this.commonService.resolveTermText(this.libraryTerm.SELECT_DEBIT_PREPAID_TYPE, "Select debit/prepaid type");
		return this.helper.allocatedProductLabel(options, selectedIds, placeholder, this.commonGlobalService.termText(this.libraryTerm.SELECTED));
	}

	onProductTypeTreeNodeChange(event: any, group: ProductTypeGroupKey): void {
		const treeNodes = group === "credit" ? this.creditTreeNodes() : this.debitPrepaidTreeNodes();
		const sel = group === "credit" ? this.creditTreeSelectedNodes : this.debitPrepaidTreeSelectedNodes;
		const current = sel();
		const allReal = this.helper.flattenTreeNodes(treeNodes.slice(1));

		if (event?.node?.key === this.TREESELECT_SELECT_ALL_KEY) {
			const isSel = current.some(n => n.key === this.TREESELECT_SELECT_ALL_KEY);
			if (isSel) {
				sel.set([treeNodes[0], ...allReal]);
				this.setAllocatedSelectedProductIds(group, this.getAllocatedAllProductIds(group));
			} else {
				sel.set([]);
				this.setAllocatedSelectedProductIds(group, []);
			}
			return;
		}

		const withoutAll = current.filter(n => n.key !== this.TREESELECT_SELECT_ALL_KEY);
		const itemIds = withoutAll
			.filter(n => n.key?.startsWith("pt-item-"))
			.map(n => n.data?.id)
			.filter((id): id is number => !!id);
		const brandIds = allReal
			.filter(n => n.key?.startsWith("pt-brand-"))
			.filter(b => allReal.filter(n => n.key?.startsWith("pt-item-") && n.data?.brandId === b.data?.brandId).some(i => itemIds.includes(i.data?.id)))
			.map(n => n.data?.brandId)
			.filter((id): id is number => !!id);
		const toSelect = allReal.filter(n => (n.key?.startsWith("pt-brand-") && brandIds.includes(n.data?.brandId)) || (n.key?.startsWith("pt-item-") && itemIds.includes(n.data?.id)));
		const allIds = this.getAllocatedAllProductIds(group);
		sel.set(allIds.length > 0 && allIds.every(id => itemIds.includes(id)) ? [treeNodes[0], ...toSelect] : toSelect);
		this.setAllocatedSelectedProductIds(group, itemIds);
	}

	public syncProductTypeTreeSelectedNodes(group: ProductTypeGroupKey): void {
		const treeNodes = group === "credit" ? this.creditTreeNodes() : this.debitPrepaidTreeNodes();
		const sel = group === "credit" ? this.creditTreeSelectedNodes : this.debitPrepaidTreeSelectedNodes;
		const selectedIds = this.getAllocatedSelectedProductIds(group);
		const allReal = this.helper.flattenTreeNodes(treeNodes.slice(1));
		const nodes = allReal.filter(n => {
			if (n.key?.startsWith("pt-brand-")) return allReal.filter(x => x.key?.startsWith("pt-item-") && x.data?.brandId === n.data?.brandId).some(i => selectedIds.includes(i.data?.id));
			if (n.key?.startsWith("pt-item-")) return selectedIds.includes(n.data?.id);
			return false;
		});
		const allIds = this.getAllocatedAllProductIds(group);
		sel.set(allIds.length > 0 && allIds.every(id => selectedIds.includes(id)) ? [treeNodes[0], ...nodes] : nodes);
	}

	private getAllocatedSelectedProductIds(group: ProductTypeGroupKey): number[] {
		return group === "credit" ? this.selectedCreditProductIds : this.selectedDebitPrepaidProductIds;
	}
	private setAllocatedSelectedProductIds(group: ProductTypeGroupKey, ids: number[]): void {
		if (group === "credit") this.selectedCreditProductIds = ids;
		else this.selectedDebitPrepaidProductIds = ids;
	}
	private getAllocatedAllProductIds(group: ProductTypeGroupKey): number[] {
		return (group === "credit" ? this.scopedCreditOptions : this.scopedDebitPrepaidOptions).flatMap(b => b.items.map(i => i.id));
	}

	// ─── Category tree ─────────────────────────────────────────────────────────

	onCategoryTreeNodeChange(event: any): void {
		const nodes = this.categoryTreeNodes();
		const current = this.categoryTreeSelectedNodes();
		const allReal = this.helper.flattenTreeNodes(nodes.slice(1));

		if (event?.node?.key === this.TREESELECT_SELECT_ALL_KEY) {
			const isSel = current.some(n => n.key === this.TREESELECT_SELECT_ALL_KEY);
			if (isSel) {
				this.categoryTreeSelectedNodes.set([nodes[0], ...allReal]);
				this.treeSelectedCategoryIds = this.masterCategories.map(c => c.id);
				this.treeSelectedSubCategoryIds = this.masterSubCategories.map(s => s.id);
			} else {
				this.categoryTreeSelectedNodes.set([]);
				this.treeSelectedCategoryIds = [];
				this.treeSelectedSubCategoryIds = [];
			}
			const cat = this.helper.resolveCategorizationPayload(this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds, this.masterCategories, this.masterSubCategories);
			this.selectedCategoryId = cat.category > 0 ? cat.category : null;
			this.selectedSubCategoryId = cat.subCategory > 0 ? cat.subCategory : null;
			return;
		}

		const withoutAll = current.filter(n => n.key !== this.TREESELECT_SELECT_ALL_KEY);
		this.treeSelectedSubCategoryIds = withoutAll
			.filter(n => n.key?.startsWith("sub-"))
			.map(n => n.data?.id)
			.filter((id): id is number => !!id);
		const parentIds = this.masterCategories
			.filter(c => {
				const subs = this.helper.getSubCategoryIds(c.id, this.masterSubCategories);
				return subs.length > 0 && subs.some(id => this.treeSelectedSubCategoryIds.includes(id));
			})
			.map(c => c.id);
		const leafIds = withoutAll
			.filter(n => n.key?.startsWith("cat-") && this.helper.getSubCategoryIds(n.data?.id ?? 0, this.masterSubCategories).length === 0)
			.map(n => n.data?.id)
			.filter((id): id is number => !!id);
		this.treeSelectedCategoryIds = [...new Set([...parentIds, ...leafIds])];
		const toSelect = allReal.filter(
			n => (n.key?.startsWith("cat-") && this.treeSelectedCategoryIds.includes(n.data?.id)) || (n.key?.startsWith("sub-") && this.treeSelectedSubCategoryIds.includes(n.data?.id))
		);
		const allSubIds = this.masterSubCategories.map(s => s.id);
		this.categoryTreeSelectedNodes.set(allSubIds.length > 0 && allSubIds.every(id => this.treeSelectedSubCategoryIds.includes(id)) ? [nodes[0], ...toSelect] : toSelect);
		const cat = this.helper.resolveCategorizationPayload(this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds, this.masterCategories, this.masterSubCategories);
		this.selectedCategoryId = cat.category > 0 ? cat.category : null;
		this.selectedSubCategoryId = cat.subCategory > 0 ? cat.subCategory : null;
	}

	public syncCategoryTreeSelectedNodes(): void {
		const nodes = this.categoryTreeNodes();
		const allReal = this.helper.flattenTreeNodes(nodes.slice(1));
		const selected = allReal.filter(n => {
			if (n.key?.startsWith("cat-")) return this.helper.isCategorySelected(n.data?.id, this.treeSelectedCategoryIds, this.treeSelectedSubCategoryIds, this.masterSubCategories);
			if (n.key?.startsWith("sub-")) return this.treeSelectedSubCategoryIds.includes(n.data?.id);
			return false;
		});
		this.categoryTreeSelectedNodes.set(this.helper.isAllCatSelected(this.treeSelectedSubCategoryIds, this.masterSubCategories) ? [nodes[0], ...selected] : selected);
	}

	// ─── Applied resolution ────────────────────────────────────────────────────

	private resolveAppliedAllocatedProductIds(): number[] {
		if (!this.isAllocatedTab) return [];
		const selected = [...this.selectedCreditProductIds, ...this.selectedDebitPrepaidProductIds];
		const all = [...this.getAllocatedAllProductIds("credit"), ...this.getAllocatedAllProductIds("debitPrepaid")];
		if (all.length === 0 || selected.length === 0 || selected.length >= all.length) return [];
		return Array.from(new Set(selected));
	}

	private resolveAppliedAllocatedProductLabels(): string[] {
		const ids = this.resolveAppliedAllocatedProductIds();
		if (ids.length === 0) return [];
		return [...this.scopedCreditOptions, ...this.scopedDebitPrepaidOptions]
			.flatMap(b => b.items)
			.filter(i => ids.includes(i.id))
			.map(i => i.name);
	}

	private resolveAppliedEntityTypeId(): number | null {
		return this.isAllocatedTab || !this.shouldShowEntityTypeSection || !this.selectedEntityTypeId ? null : this.selectedEntityTypeId;
	}
	private resolveAppliedEntityLevelTwoId(): number | null {
		if (this.isAllocatedTab || !this.shouldShowEntityTypeSection || !this.selectedEntityTypeId) return null;
		return this.requiresEntityLevelTwo ? this.selectedEntityLevelTwoId : -1;
	}

	private resolveAppliedEntityProductIds(): number[] {
		if (this.isAllocatedTab || !this.shouldShowEntityTypeSection || !this.selectedEntityTypeId || !this.shouldShowEntityProducts || this.entityProductOptions.length === 0) return [];
		return this.selectedEntityProductIds.length === this.entityProductOptions.length ? [] : [...this.selectedEntityProductIds];
	}

	private resolveAppliedEntityValueLabels(): string[] {
		const ids = this.resolveAppliedEntityProductIds();
		return ids.length === 0 ? [] : this.entityProductOptions.filter(e => ids.includes(e.prodId)).map(e => e.prodCod);
	}

	// ─── Counters ──────────────────────────────────────────────────────────────

	private getOriginalFirstSectionAppliedCount(): number {
		const f = this.filter();
		if (!f) return 0;
		let c = f.entity1 ? 1 : 0;
		if (f.entity1 && f.entity1 === 10 && f.entity2 != null && f.entity2 !== -1) c++;
		if ((f.entity3?.length ?? 0) > 0) c++;
		if (f.invoice) c++;
		return c;
	}

	private getAllocatedFirstSectionAppliedCount(): number {
		const f = this.filter();
		return f && (f.productId?.length ?? 0) > 0 ? 1 : 0;
	}

	// ─── Validation ────────────────────────────────────────────────────────────

	private hasValidRequiredSelections(): boolean {
		if (!this.hasSelectedBrands()) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.libraryTerm.BRAND));
			return false;
		}
		if (this.requireBusinessSelection() && !this.hasSelectedBusinesses()) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.libraryTerm.BUSINESS));
			return false;
		}
		return true;
	}

	private hasValidAmountRange(): boolean {
		if (this.minAmount == null || this.maxAmount == null || this.minAmount <= this.maxAmount) return true;
		this.messageService.add({
			severity: "warn",
			summary: this.commonGlobalService.termText(this.libraryTerm.INVALID_AMOUNT_RANGE),
			detail: this.commonGlobalService.termText(this.libraryTerm.MIN_AMOUNT_CANNOT_BE_GREATER_THAN_MAX_AMOUNT),
		});
		return false;
	}

	private showRequiredFilterToast(filterName: string): void {
		this.messageService.add({
			severity: "warn",
			summary: this.commonGlobalService.termText(this.libraryTerm.REQUIRED_FILTER),
			detail: `${this.commonGlobalService.termText(this.libraryTerm.SELECT_AT_LEAST_ONE_BEFORE_APPLYING)} ${filterName}.`,
		});
	}

	private showExportError(detail: string): void {
		this.messageService.add({ severity: "error", summary: this.commonGlobalService.termText(this.libraryTerm.EXPORT), detail });
	}

	private setMinAmountValue(value: string | number | null): void {
		this.minAmountInput = this.helper.sanitizeAmountInput(value, this.amountDecimals, this.amountMaxLength);
		this.minAmount = this.helper.normalizeAmountValue(this.minAmountInput, this.amountDecimals, this.amountMaxLength);
		this.minAmountInput = this.helper.toEditableAmountInput(this.minAmount, this.amountMaxLength);
	}

	private setMaxAmountValue(value: string | number | null): void {
		this.maxAmountInput = this.helper.sanitizeAmountInput(value, this.amountDecimals, this.amountMaxLength);
		this.maxAmount = this.helper.normalizeAmountValue(this.maxAmountInput, this.amountDecimals, this.amountMaxLength);
		this.maxAmountInput = this.helper.toEditableAmountInput(this.maxAmount, this.amountMaxLength);
	}
}
