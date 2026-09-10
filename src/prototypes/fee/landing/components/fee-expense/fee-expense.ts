import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { GaTrackDirective } from "../../shared/analitycs";
import { Panel } from "primeng/panel";
import { Tabs, Tab, TabList, TabPanels, TabPanel } from "primeng/tabs";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Skeleton } from "primeng/skeleton";
import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";
import { FeeExpenseTab, NetworkItem, BusinessItem } from "./fee-expense.interface";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { LandingService } from "../../landing.service";
import { BusinessEnum, BusinessTrasactionEnum, TransactionEnum } from "../../common/enums/landing.enum";
import { BrandHelper } from "../../../common/helpers/common.helper";
import { BrandEnum } from "../../../library/common/enums";
import { FormatValuePipe } from "../../../common/pipe/format-value.pipe";
import { StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { TotalFeeExpensesResponse } from "../../dto/landing-responses.dto";
@Component({
	selector: "fee-fee-expense",
	imports: [FormsModule, CommonModule, GaTrackDirective, Panel, Tabs, Tab, TabList, TabPanels, TabPanel, ToggleSwitch, Skeleton, BadgeModule, TooltipModule, FormatValuePipe, TermPipe, StatusStateComponent],
	templateUrl: "./fee-expense.html",
})
export class FeeExpense {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly landingService = inject(LandingService);
	readonly dataTotalFeeExpense = input<TotalFeeExpensesResponse>();
	readonly isloadingTotalFeeExpense = input<boolean>();

	private _hasError = signal<boolean>(false);

	public hasError = computed(() => this._hasError());

	public currencyCode = computed<string>(() => this.dataTotalFeeExpense()?.currencyCode ?? "-");
	public monthShort = computed<string>(() => this.dataTotalFeeExpense()?.monthShort ?? "");
	public monthShortComparison = computed<string>(() => this.dataTotalFeeExpense()?.monthShortComparison ?? "");
	public lastMonthShort = computed<string>(() => this.dataTotalFeeExpense()?.lastMonthShort ?? "");
	public lastMonthShortComparison = computed<string>(() => this.dataTotalFeeExpense()?.lastMonthShortComparison ?? "");
	public last12MonthShortComparison = computed<string>(() => this.dataTotalFeeExpense()?.last12MonthShortComparison ?? "");

	public hasData = computed<boolean>(() => (this.dataTotalFeeExpense()?.lastValueAmount?.length ?? 0) > 0);
	public hasDataLastMonth = computed<boolean>(() => (this.dataTotalFeeExpense()?.lastMonthAmount?.length ?? 0) > 0);
	public hasDataL12months = computed<boolean>(() => (this.dataTotalFeeExpense()?.last12MonthAmount?.length ?? 0) > 0);

	private networkToggleState = signal<Record<number, boolean>>({
		[BrandEnum.Visa]: true,
		[BrandEnum.Mastercard]: true,
		[BrandEnum.Amex]: true,
	});

	protected readonly canToggleCurrent = computed(() => {
		const state = this.networkToggleState();
		const active = Object.values(state).filter(Boolean).length;
		return Object.fromEntries(Object.entries(state).map(([id, checked]) => [id, checked ? active > 1 : true]));
	});

	private currentValidBrands = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastValueAmount ?? [];
		if (!table) return new Set<number>();
		return new Set(table.map(x => x.brandId));
	});

	public currentMonthByBrand = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastValueAmount ?? [];
		if (!table) {
			return [];
		}
		const grouped = new Map<number, number>();
		for (const row of table) {
			const current = grouped.get(row.brandId) ?? 0;
			grouped.set(row.brandId, current + row.amount);
		}
		return Array.from(grouped.entries()).map(
			([brandId, total]): NetworkItem => ({
				brandId,
				brandIcon: BrandHelper.getIcon(brandId),
				amount: total,
				checked: true,
			})
		);
	});

	public currentMonthByBusiness = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastValueAmount ?? [];
		if (!table) return [];
		const toggleState = this.networkToggleState();
		const activeBrands = this.getActiveBrands(toggleState, table);
		const grouped = new Map<string, BusinessItem>();
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			let term: string | null = null;
			let businessTransactionId: number | null = null;
			if (row.businessId === BusinessEnum.Isssuer) {
				term = "ISSUER";
				businessTransactionId = BusinessTrasactionEnum.Issuer;
			}
			if (row.businessId === BusinessEnum.Acquirer) {
				if (row.transactionId === TransactionEnum.Purchase) {
					term = "ACQUIRER_MERCHANT";
					businessTransactionId = BusinessTrasactionEnum.AcquirerMerchant;
				} else if (row.transactionId === TransactionEnum.Cash) {
					term = "ACQUIRER_CASH";
					businessTransactionId = BusinessTrasactionEnum.AcquirerCash;
				} else {
					continue;
				}
			}
			if (row.businessId === BusinessEnum.NotSpecified) {
				term = "NOT_ALLOCATED";
				businessTransactionId = BusinessTrasactionEnum.NotSpecified;
			}
			if (!term) continue;
			const key = row.businessId === BusinessEnum.Acquirer ? `${row.businessId}-${row.transactionId}-${term}` : `${row.businessId}-${term}`;
			const current = grouped.get(key);
			if (current) {
				current.amount += row.amount;
			} else {
				grouped.set(key, {
					businessTransactionId: businessTransactionId ?? 0,
					businessId: row.businessId,
					transactionId: row.transactionId,
					term,
					amount: row.amount,
				});
			}
		}
		return Array.from(grouped.values());
	});

	public currentMonthTotal = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastValueAmount ?? [];
		if (!table) return 0;
		const toggleState = this.networkToggleState();
		const activeBrands = this.getActiveBrands(toggleState, table);
		let total = 0;
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			total += row.amount;
		}
		return total;
	});

	public previousMonthTotal = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastValueAmountComparison ?? [];
		if (!table) return 0;
		const toggleState = this.networkToggleState();
		const activeBrands = this.getActiveBrands(toggleState, table);
		let total = 0;
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			total += row.amount;
		}
		return total;
	});

	public totalVariationPercent = computed(() => {
		const current = this.currentMonthTotal();
		const previous = this.previousMonthTotal();
		if (previous === 0) return 0;
		return ((current - previous) / previous) * 100;
	});

	public currentResolveState = computed(() => {
		const percent = this.totalVariationPercent();
		return this.landingService.ResolveState(percent);
	});

	private networkToggleStateLastMonth = signal<Record<number, boolean>>({
		[BrandEnum.Visa]: true,
		[BrandEnum.Mastercard]: true,
		[BrandEnum.Amex]: true,
	});

	protected readonly canToggleLastMonth = computed(() => {
		const state = this.networkToggleStateLastMonth();
		const active = Object.values(state).filter(Boolean).length;
		return Object.fromEntries(Object.entries(state).map(([id, checked]) => [id, checked ? active > 1 : true]));
	});

	private lastMonthValidBrands = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastMonthAmount ?? [];
		if (!table) return new Set<number>();
		return new Set(table.map(x => x.brandId));
	});

	public lastMonthByBrand = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastMonthAmount ?? [];
		if (!table) return [];
		const grouped = new Map<number, number>();
		for (const row of table) {
			grouped.set(row.brandId, (grouped.get(row.brandId) ?? 0) + row.amount);
		}
		return Array.from(grouped.entries()).map(
			([brandId, total]): NetworkItem => ({
				brandId,
				brandIcon: BrandHelper.getIcon(brandId),
				amount: total,
				checked: true,
			})
		);
	});

	public lastMonthByBusiness = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastMonthAmount ?? [];
		if (!table) return [];
		const toggleState = this.networkToggleStateLastMonth();
		const activeBrands = this.getActiveBrands(toggleState, table);
		const grouped = new Map<string, BusinessItem>();
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			let term: string | null = null;
			let businessTransactionId: number | null = null;
			if (row.businessId === BusinessEnum.Isssuer) {
				term = "ISSUER";
				businessTransactionId = BusinessTrasactionEnum.Issuer;
			}
			if (row.businessId === BusinessEnum.Acquirer) {
				if (row.transactionId === TransactionEnum.Purchase) {
					term = "ACQUIRER_MERCHANT";
					businessTransactionId = BusinessTrasactionEnum.AcquirerMerchant;
				} else if (row.transactionId === TransactionEnum.Cash) {
					term = "ACQUIRER_CASH";
					businessTransactionId = BusinessTrasactionEnum.AcquirerCash;
				} else {
					continue;
				}
			}
			if (row.businessId === BusinessEnum.NotSpecified) {
				term = "NOT_ALLOCATED";
				businessTransactionId = BusinessTrasactionEnum.NotSpecified;
			}
			if (!term) continue;
			const key = row.businessId === BusinessEnum.Acquirer ? `${row.businessId}-${row.transactionId}-${term}` : `${row.businessId}-${term}`;
			const current = grouped.get(key);
			if (current) {
				current.amount += row.amount;
			} else {
				grouped.set(key, {
					businessTransactionId: businessTransactionId ?? 0,
					businessId: row.businessId,
					transactionId: row.transactionId,
					term,
					amount: row.amount,
				});
			}
		}

		return Array.from(grouped.values());
	});

	public lastMonthTotal = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastMonthAmount ?? [];
		if (!table) return 0;
		const toggleState = this.networkToggleStateLastMonth();
		const activeBrands = this.getActiveBrands(toggleState, table);
		let total = 0;
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			total += row.amount;
		}
		return total;
	});

	public previousLastMonthTotal = computed(() => {
		const table = this.dataTotalFeeExpense()?.lastMonthAmountComparison ?? [];
		if (!table) return 0;
		const toggleState = this.networkToggleStateLastMonth();
		const activeBrands = this.getActiveBrands(toggleState, table);
		let total = 0;
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			total += row.amount;
		}
		return total;
	});

	public lastMonthVariationPercent = computed(() => {
		const current = this.lastMonthTotal();
		const previous = this.previousLastMonthTotal();
		if (previous === 0) return 0;
		return ((current - previous) / previous) * 100;
	});

	public lastMonthResolveState = computed(() => {
		const percent = this.lastMonthVariationPercent();
		return this.landingService.ResolveState(percent);
	});

	private networkToggleState12M = signal<Record<number, boolean>>({
		[BrandEnum.Visa]: true,
		[BrandEnum.Mastercard]: true,
		[BrandEnum.Amex]: true,
	});

	protected readonly canToggle12M = computed(() => {
		const state = this.networkToggleState12M();
		const active = Object.values(state).filter(Boolean).length;
		return Object.fromEntries(Object.entries(state).map(([id, checked]) => [id, checked ? active > 1 : true]));
	});

	private last12MonthsValidBrands = computed(() => {
		const table = this.dataTotalFeeExpense()?.last12MonthAmount ?? [];
		if (!table) return new Set<number>();
		return new Set(table.map(x => x.brandId));
	});

	public last12MonthsByBrand = computed(() => {
		const table = this.dataTotalFeeExpense()?.last12MonthAmount ?? [];
		if (!table) return [];
		const grouped = new Map<number, number>();
		for (const row of table) {
			grouped.set(row.brandId, (grouped.get(row.brandId) ?? 0) + row.amount);
		}
		return Array.from(grouped.entries()).map(
			([brandId, total]): NetworkItem => ({
				brandId,
				brandIcon: BrandHelper.getIcon(brandId),
				amount: total,
				checked: true,
			})
		);
	});

	public last12MonthsByBusiness = computed(() => {
		const table = this.dataTotalFeeExpense()?.last12MonthAmount ?? [];
		if (!table) return [];
		const toggleState = this.networkToggleState12M();
		const activeBrands = this.getActiveBrands(toggleState, table);
		const grouped = new Map<string, BusinessItem>();
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;
			let term: string | null = null;
			let businessTransactionId: number | null = null;
			if (row.businessId === BusinessEnum.Isssuer) {
				term = "ISSUER";
				businessTransactionId = BusinessTrasactionEnum.Issuer;
			}
			if (row.businessId === BusinessEnum.Acquirer) {
				if (row.transactionId === TransactionEnum.Purchase) {
					term = "ACQUIRER_MERCHANT";
					businessTransactionId = BusinessTrasactionEnum.AcquirerMerchant;
				} else if (row.transactionId === TransactionEnum.Cash) {
					term = "ACQUIRER_CASH";
					businessTransactionId = BusinessTrasactionEnum.AcquirerCash;
				} else {
					continue;
				}
			}
			if (row.businessId === BusinessEnum.NotSpecified) {
				term = "NOT_ALLOCATED";
				businessTransactionId = BusinessTrasactionEnum.NotSpecified;
			}
			if (!term) continue;
			const key = row.businessId === BusinessEnum.Acquirer ? `${row.businessId}-${row.transactionId}-${term}` : `${row.businessId}-${term}`;
			const current = grouped.get(key);
			if (current) {
				current.amount += row.amount;
			} else {
				grouped.set(key, {
					businessTransactionId: businessTransactionId ?? 0,
					businessId: row.businessId,
					transactionId: row.transactionId,
					term,
					amount: row.amount,
				});
			}
		}

		return Array.from(grouped.values());
	});

	public last12MonthsTotal = computed(() => {
		const table = this.dataTotalFeeExpense()?.last12MonthAmount ?? [];
		if (!table) return 0;
		const toggleState = this.networkToggleState12M();
		const hasToggleState = Object.keys(toggleState).length > 0;
		const activeBrands = new Set(
			hasToggleState
				? Object.entries(toggleState)
						.filter(([, v]) => v)
						.map(([k]) => Number(k))
				: table.map(x => x.brandId)
		);
		let total = 0;
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;

			total += row.amount;
		}
		return total;
	});

	public previous12MonthsTotal = computed(() => {
		const table = this.dataTotalFeeExpense()?.last12MonthAmountComparison ?? [];
		if (!table) return 0;
		const toggleState = this.networkToggleState12M();
		const hasToggleState = Object.keys(toggleState).length > 0;
		const activeBrands = new Set(
			hasToggleState
				? Object.entries(toggleState)
						.filter(([, v]) => v)
						.map(([k]) => Number(k))
				: table.map(x => x.brandId)
		);
		let total = 0;
		for (const row of table) {
			if (!activeBrands.has(row.brandId)) continue;

			total += row.amount;
		}
		return total;
	});

	public last12MonthsVariationPercent = computed(() => {
		const current = this.last12MonthsTotal();
		const previous = this.previous12MonthsTotal();
		if (previous === 0) return 0;
		return ((current - previous) / previous) * 100;
	});

	public last12MonthsResolveState = computed(() => {
		const percent = this.last12MonthsVariationPercent();
		return this.landingService.ResolveState(percent);
	});

	feeExpenseTab = FeeExpenseTab;
	tabValue = signal<FeeExpenseTab>(FeeExpenseTab.LastMonth);

	public partialDataTooltip = "Current month values are based on partial data availability. Comparisons are not shown to avoid confusion.";

	public statusStateEnum = StatusStateEnum;

	constructor() {}

	ngOnInit() {}

	reload() {}

	private getActiveBrands(toggleState: Record<number, boolean>, table: any[]) {
		const hasToggleState = Object.keys(toggleState).length > 0;

		return new Set<number>(
			hasToggleState
				? Object.entries(toggleState)
						.filter(([, v]) => v)
						.map(([k]) => Number(k))
				: table.map(x => x.brandId)
		);
	}

	public onNetworkToggleChange(network: NetworkItem, checked: boolean, tab: FeeExpenseTab) {
		network.checked = checked;
		let validBrands: Set<number>;
		let toggleState: typeof this.networkToggleState;
		switch (tab) {
			case FeeExpenseTab.CurrentMonth:
				validBrands = this.currentValidBrands();
				toggleState = this.networkToggleState;
				break;
			case FeeExpenseTab.LastMonth:
				validBrands = this.lastMonthValidBrands();
				toggleState = this.networkToggleStateLastMonth;
				break;
			default:
				validBrands = this.last12MonthsValidBrands();
				toggleState = this.networkToggleState12M;
				break;
		}
		toggleState.update(state => {
			const next: Record<number, boolean> = {};
			for (const brandId of validBrands) {
				next[brandId] = brandId === network.brandId ? checked : (state[brandId] ?? true);
			}
			return next;
		});
	}
}
