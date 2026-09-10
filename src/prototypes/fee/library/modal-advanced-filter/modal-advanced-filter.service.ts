import { Injectable, inject } from "@angular/core";
import { TreeNode } from "primeng/api";
import { AllocatedProductTypeBrandGroup, BasicItemResponse, ClientCatalogItem, EntityProductModel, FeeCategory, FeeSubCategory, InvoiceOption } from "../DTO/response";
import { FeeLibraryFilter } from "../DTO/request";
import { CommonService } from "../domain/common.service";
import { LIBRARY_TERM } from "../common/constants";
import { AdvancedFilterPill, EntityTypeOption, InvoiceOptionGroup, InvoiceOptionViewModel } from "../common/types";
import { LOCALE_LABELS } from "../../common/constants/locale-labels";
import { CommonGlobalService } from "../../common/services/common.service";

@Injectable({ providedIn: "root" })
export class ModalAdvancedFilterService {
	private readonly cgs = inject(CommonGlobalService);
	private readonly cs = inject(CommonService);

	// ─── Amount ────────────────────────────────────────────────────────────────

	sanitizeAmountInput(value: string | number | null, decimals: number, maxLength: number): string {
		if (value == null || value === "") return "";

		const raw = String(value).trim().replace(",", ".");
		const isNegative = raw.startsWith("-");
		const unsigned = raw.replace(/-/g, "");
		const dotIndex = unsigned.indexOf(".");

		const intPart = (dotIndex >= 0 ? unsigned.slice(0, dotIndex) : unsigned).replace(/\D/g, "");
		const decPart = (dotIndex >= 0 ? unsigned.slice(dotIndex + 1) : "").replace(/\D/g, "").slice(0, decimals);

		let result = `${isNegative ? "-" : ""}${intPart}`;
		if (dotIndex >= 0) result += ".";
		if (decPart) result += decPart;
		result = result.slice(0, maxLength);

		if (result === "-") return "-";
		if (result === ".") return "";
		return result;
	}

	normalizeAmountValue(value: string | number | null, decimals: number, maxLength: number): number | null {
		const sanitized = this.sanitizeAmountInput(value, decimals, maxLength);
		if (!sanitized || sanitized === "-" || sanitized === "." || sanitized === "-.") return null;
		const parsed = Number(sanitized);
		return Number.isNaN(parsed) ? null : parsed;
	}

	toEditableAmountInput(value: number | null, maxLength: number): string {
		return value == null || Number.isNaN(value) ? "" : String(value).slice(0, maxLength);
	}

	// ─── Invoices ──────────────────────────────────────────────────────────────

	buildInvoiceOptionGroups(invoices: InvoiceOption[]): InvoiceOptionGroup[] {
		const today = new Date();
		const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const isSpanish = this.isSpanish();
		const labels = isSpanish ? LOCALE_LABELS.es : LOCALE_LABELS.en;
		const locale = isSpanish ? "es-ES" : "en-US";
		const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
		const dtf = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" });

		const grouped = new Map<string, InvoiceOptionViewModel[]>([
			[labels.today, []],
			[labels.thisMonth, []],
			[labels.previous, []],
		]);

		for (const inv of invoices) {
			const date = new Date(inv.feeDate);
			const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			const groupLabel = dateOnly.getTime() === startOfToday.getTime() ? labels.today : dateOnly >= startOfMonth ? labels.thisMonth : labels.previous;
			grouped.get(groupLabel)!.push({
				invoiceNumber: inv.invoiceNumber,
				brandId: inv.brandId,
				brandName: inv.brandName,
				brandIconClass: this.cs.resolveBrandIconClass(inv.brandName, null),
				feeDate: date,
				relativeDateLabel: this.buildRelativeDateLabel(dateOnly, date, startOfToday, labels.today, rtf, dtf),
				groupLabel,
			});
		}

		return [labels.today, labels.thisMonth, labels.previous].map(label => ({ label, items: grouped.get(label)! })).filter(g => g.items.length > 0);
	}

	private buildRelativeDateLabel(dateOnly: Date, date: Date, startOfToday: Date, todayLabel: string, rtf: Intl.RelativeTimeFormat, dtf: Intl.DateTimeFormat): string {
		const diffDays = Math.max(0, Math.floor((startOfToday.getTime() - dateOnly.getTime()) / 86_400_000));
		const formatted = dtf.format(date);
		if (diffDays === 0) return `${todayLabel} - ${formatted}`;
		if (diffDays < 7) return `${rtf.format(-diffDays, "day")} - ${formatted}`;
		if (diffDays < 30) return `${rtf.format(-Math.floor(diffDays / 7), "week")} - ${formatted}`;
		const months = Math.max(1, (startOfToday.getFullYear() - dateOnly.getFullYear()) * 12 + startOfToday.getMonth() - dateOnly.getMonth());
		if (months < 12) return `${rtf.format(-months, "month")} - ${formatted}`;
		const years = Math.max(1, Math.floor(months / 12));
		return `${rtf.format(-years, "year")} - ${formatted}`;
	}

	private isSpanish(): boolean {
		return this.cgs.languageCode?.toUpperCase() === "ES";
	}

	// ─── Trees ─────────────────────────────────────────────────────────────────

	buildCategoryTreeNodes(cats: FeeCategory[], subs: FeeSubCategory[], selectAllLabel: string): TreeNode[] {
		const nodes: TreeNode[] = [{ key: "__select_all__", label: selectAllLabel, leaf: true }];

		for (const cat of cats) {
			const children = subs.filter(s => s.categoryId === cat.id).map(s => ({ key: `sub-${s.id}`, label: s.description, leaf: true, data: { id: s.id, categoryId: s.categoryId } }));

			nodes.push({
				key: `cat-${cat.id}`,
				label: cat.description,
				children: children.length > 0 ? children : undefined,
				leaf: children.length === 0,
				data: { id: cat.id },
			});
		}

		return nodes;
	}

	buildProductTypeTreeNodes(options: AllocatedProductTypeBrandGroup[], selectAllLabel: string): TreeNode[] {
		const nodes: TreeNode[] = [{ key: "__select_all__", label: selectAllLabel, leaf: true }];

		for (const brand of options) {
			const children = brand.items.map(i => ({
				key: `pt-item-${i.id}`,
				label: i.name,
				leaf: true,
				data: { id: i.id, brandId: brand.brandId },
			}));

			nodes.push({
				key: `pt-brand-${brand.brandId}`,
				label: brand.brandName,
				children: children.length > 0 ? children : undefined,
				leaf: children.length === 0,
				data: { brandId: brand.brandId },
			});
		}

		return nodes;
	}

	flattenTreeNodes(nodes: TreeNode[]): TreeNode[] {
		return nodes.flatMap(n => [n, ...(n.children ? this.flattenTreeNodes(n.children) : [])]);
	}

	// ─── Categorization ────────────────────────────────────────────────────────

	getSubCategoryIds(catId: number, subs: FeeSubCategory[]): number[] {
		return subs.filter(s => s.categoryId === catId).map(s => s.id);
	}

	isCategorySelected(catId: number, selCatIds: number[], selSubIds: number[], subs: FeeSubCategory[]): boolean {
		const subIds = this.getSubCategoryIds(catId, subs);
		return subIds.length === 0 ? selCatIds.includes(catId) : subIds.some(id => selSubIds.includes(id));
	}

	isAllCatSelected(selSubIds: number[], subs: FeeSubCategory[]): boolean {
		return subs.every(s => selSubIds.includes(s.id));
	}

	isCatEmpty(catIds: number[], subIds: number[]): boolean {
		return catIds.length === 0 && subIds.length === 0;
	}

	resolveCategorizationPayload(selCatIds: number[], selSubIds: number[], cats: FeeCategory[], subs: FeeSubCategory[]): { category: number; subCategory: number; subCategoryIds: number[] } {
		const isDefaultSelection = this.isAllCatSelected(selSubIds, subs) || this.isCatEmpty(selCatIds, selSubIds);
		if (isDefaultSelection) return { category: -1, subCategory: -1, subCategoryIds: [] };

		const sorted = [...new Set(selSubIds)].sort((a, b) => a - b);
		const fullySelectedCats = cats.filter(c => this.isCategorySelected(c.id, selCatIds, selSubIds, subs));

		if (fullySelectedCats.length === 1) {
			const catSubIds = this.getSubCategoryIds(fullySelectedCats[0].id, subs);
			const allSubsOfCatSelected = selSubIds.filter(id => catSubIds.includes(id)).length === catSubIds.length;
			if (allSubsOfCatSelected) return { category: fullySelectedCats[0].id, subCategory: -1, subCategoryIds: sorted };
		}

		if (selSubIds.length === 1) {
			const sub = subs.find(s => s.id === selSubIds[0]);
			if (sub) return { category: sub.categoryId, subCategory: sub.id, subCategoryIds: sorted };
		}

		return { category: -1, subCategory: -1, subCategoryIds: sorted };
	}

	syncCategorizationFromFilter(
		catId: number,
		subCatId: number,
		subCatIds: number[],
		cats: FeeCategory[],
		subs: FeeSubCategory[]
	): { treeSelectedCategoryIds: number[]; treeSelectedSubCategoryIds: number[] } {
		if (subCatIds.length > 0) {
			const parentCatIds = Array.from(new Set(subs.filter(s => subCatIds.includes(s.id)).map(s => s.categoryId)));
			return { treeSelectedCategoryIds: parentCatIds, treeSelectedSubCategoryIds: [...subCatIds] };
		}
		if (catId <= 0) return { treeSelectedCategoryIds: [], treeSelectedSubCategoryIds: [] };
		if (subCatId > 0) return { treeSelectedCategoryIds: [catId], treeSelectedSubCategoryIds: [subCatId] };
		return { treeSelectedCategoryIds: [catId], treeSelectedSubCategoryIds: this.getSubCategoryIds(catId, subs) };
	}

	// ─── Labels ────────────────────────────────────────────────────────────────

	entityOption<T extends { id: number }>(id: number | null | undefined, opts: T[]): T | null {
		return id ? (opts.find(o => o.id === id) ?? null) : null;
	}

	entityValuesSummary(ids: number[], products: EntityProductModel[], selectedLabel: string): string {
		if (ids.length === 1) {
			const product = products.find(e => e.prodId === ids[0]);
			return product?.prodCod ?? `1 ${selectedLabel}`;
		}
		return `${ids.length} ${selectedLabel}`;
	}

	allocatedProductTypeSummary(filter: FeeLibraryFilter, selectedLabel: string, allLabel: string): string {
		const count = filter.productId?.length ?? 0;
		if (count === 0) return allLabel;
		if (count === 1 && filter.productIdLabels?.length === 1) return filter.productIdLabels[0];
		return `${count} ${selectedLabel}`;
	}

	allocatedProductLabel(options: AllocatedProductTypeBrandGroup[], selectedIds: number[], placeholder: string, selectedLabel: string): string {
		const allItems = options.flatMap(b => b.items);
		if (allItems.length === 0 || selectedIds.length === 0 || selectedIds.length >= allItems.length) return placeholder;

		const selected = allItems.filter(i => selectedIds.includes(i.id));
		const fullBrand = options.find(b => b.items.length > 0 && b.items.length === selected.length && b.items.every(i => selectedIds.includes(i.id)));
		if (fullBrand) return fullBrand.brandName;

		if (selected.length === 1) {
			const parentBrand = options.find(b => b.items.some(i => i.id === selected[0].id));
			return parentBrand ? `${parentBrand.brandName} / ${selected[0].name}` : selected[0].name;
		}

		return `${selected.length} ${selectedLabel}`;
	}

	// ─── Pills ─────────────────────────────────────────────────────────────────

	buildAdvancedFilterPills(
		filter: FeeLibraryFilter | null,
		masterCategories: FeeCategory[],
		masterSubCategories: FeeSubCategory[],
		masterTypeOfRates: BasicItemResponse[],
		filteredCustomCategories: ClientCatalogItem[],
		entityTypeOptions: EntityTypeOption[],
		isAllocatedTab: boolean,
		entityLevelTwoOptions: { id: number; name: string }[],
		entityProductOptions: EntityProductModel[],
		amountDecimals: number,
		creditOptions: AllocatedProductTypeBrandGroup[] = [],
		debitPrepaidOptions: AllocatedProductTypeBrandGroup[] = []
	): AdvancedFilterPill[] {
		if (!filter) return [];

		const t = (k: string) => this.cgs.termText(k);
		const tabPills = isAllocatedTab
			? this.buildAllocatedPills(filter, creditOptions, debitPrepaidOptions, t)
			: this.buildNonAllocatedPills(filter, entityTypeOptions, entityLevelTwoOptions, entityProductOptions, t);

		return [...this.buildCommonPills(filter, masterCategories, masterSubCategories, masterTypeOfRates, filteredCustomCategories, amountDecimals, t), ...tabPills];
	}

	private buildCommonPills(
		filter: FeeLibraryFilter,
		masterCategories: FeeCategory[],
		masterSubCategories: FeeSubCategory[],
		masterTypeOfRates: BasicItemResponse[],
		filteredCustomCategories: ClientCatalogItem[],
		amountDecimals: number,
		t: (k: string) => string
	): AdvancedFilterPill[] {
		const lt = LIBRARY_TERM;
		const pills: AdvancedFilterPill[] = [];
		const selOpts = { emptyLabel: t(lt.ALL), singleFallbackLabel: t(lt.SELECTED), multiSuffixLabel: t(lt.SELECTED) };
		const allCatLabel = t(lt.ALL_CATEGORIES_AND_SUBCATEGORIES);

		const catLabel = this.cs.buildCategorizationSummary(filter, masterCategories, masterSubCategories, { allLabel: allCatLabel, multiSuffixLabel: t(lt.SELECTED) });
		if (catLabel && catLabel !== allCatLabel) pills.push({ key: "categorization", label: `${t(lt.CATEGORIZATION)}: ${catLabel}` });
		if (filter.rateId?.length) pills.push({ key: "rate", label: `${t(lt.RATE_TYPE)}: ${this.cs.formatSelectionSummary(filter.rateId, masterTypeOfRates, selOpts)}` });
		if (filter.customCategoryId?.length)
			pills.push({ key: "customCategory", label: `${t(lt.CUSTOM_CATEGORY)}: ${this.cs.formatSelectionSummary(filter.customCategoryId, filteredCustomCategories, selOpts)}` });
		if (filter.parentFeeCodeText?.trim()) pills.push({ key: "parentFeeCode", label: `${t(lt.PARENT_FEE_CODE)}: ${filter.parentFeeCodeText.trim()}` });
		if (filter.parentFeeName?.trim()) pills.push({ key: "groupName", label: `${t(lt.GROUP_NAME)}: ${filter.parentFeeName.trim()}` });
		if (filter.minAmount != null || filter.maxAmount != null)
			pills.push({ key: "amount", label: `${t(lt.AMOUNT_LABEL)}: ${this.cs.buildAmountRangeSummary(filter.minAmount ?? null, filter.maxAmount ?? null, amountDecimals)}` });

		return pills;
	}

	private buildAllocatedPills(
		filter: FeeLibraryFilter,
		creditOptions: AllocatedProductTypeBrandGroup[],
		debitPrepaidOptions: AllocatedProductTypeBrandGroup[],
		t: (k: string) => string
	): AdvancedFilterPill[] {
		const lt = LIBRARY_TERM;
		const pills: AdvancedFilterPill[] = [];
		const selectedIds = filter.productId ?? [];
		if (selectedIds.length === 0) return [];

		const creditSummary = this.buildProductGroupSummary(selectedIds, creditOptions, t(lt.SELECTED));
		if (creditSummary) {
			pills.push({ key: "productTypeCredit", label: `${t(lt.CREDIT)}: ${creditSummary}` });
		}

		const debitSummary = this.buildProductGroupSummary(selectedIds, debitPrepaidOptions, t(lt.SELECTED));
		if (debitSummary) {
			pills.push({ key: "productTypeDebitPrepaid", label: `${t(lt.DEBIT_PREPAID)}: ${debitSummary}` });
		}

		return pills;
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

	private buildNonAllocatedPills(
		filter: FeeLibraryFilter,
		entityTypeOptions: EntityTypeOption[],
		entityLevelTwoOptions: { id: number; name: string }[],
		entityProductOptions: EntityProductModel[],
		t: (k: string) => string
	): AdvancedFilterPill[] {
		const lt = LIBRARY_TERM;
		const pills: AdvancedFilterPill[] = [];
		const entityType = this.entityOption(filter.entity1 ?? null, entityTypeOptions);

		if (entityType) pills.push({ key: "entityType", label: `${t(lt.ENTITY_TYPE)}: ${entityType.name}` });

		if (filter.entity1) {
			const lvl2 = entityLevelTwoOptions.find(i => i.id === (filter.entity2 ?? -1));
			const lvl2Label = entityType ? `${entityType.brandName} ${t(lt.ENTITY_TYPE)}` : t(lt.ENTITY_DETAIL);
			if (lvl2 && lvl2.id !== -1) pills.push({ key: "entityDetail", label: `${lvl2Label}: ${lvl2.name}` });
		}

		if (filter.entity3?.length) {
			const entityLabel = entityType ? `${t(lt.FILTER_BY)} ${entityType.name}` : t(lt.ENTITY_VALUES);
			pills.push({ key: "entityValues", label: `${entityLabel}: ${this.entityValuesSummary(filter.entity3, entityProductOptions, t(lt.SELECTED))}` });
		}

		if (filter.invoice) pills.push({ key: "invoice", label: `${t(lt.INVOICE)}: ${this.cs.buildInvoiceSelectionSummary(filter.invoice, t(lt.SELECTED))}` });

		return pills;
	}
}
