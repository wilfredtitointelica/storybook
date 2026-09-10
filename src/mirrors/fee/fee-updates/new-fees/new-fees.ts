import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, computed, inject, input, output } from "@angular/core";
import { SkeletonModule } from "primeng/skeleton";
import { GlobalTermService } from "intelica-library-base";
import { ColumnComponent, FormatAmountPipe, OrderConstants, RowResumenComponent, TableFetchComponent, TruncatePipe, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { FEE_UPDATES_CONSTANTS, FEE_UPDATES_TERM } from "../common/constants";
import { FeeUpdatesPageChangeEvent, QueryParametersModel } from "../dto/fee-updates.dto";
import { CurrencyTotal, NewFeeItem, NewFeesResponse } from "../dto/fee-updates-responses.dto";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-updates-new-fees",
	standalone: true,
	imports: [CommonModule, FormsModule, SkeletonModule, ColumnComponent, TableFetchComponent, RowResumenComponent, FormatAmountPipe, StatusStateComponent, ButtonModule, TruncatePipe, TooltipModule],
	templateUrl: "./new-fees.html",
})
export class NewFeesComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeUpdatesTerm = FEE_UPDATES_TERM;
	public readonly StatusStateEnum = StatusStateEnum;

	public loading = input<boolean>(false);
	public showClientColumn = input<boolean>(false);
	public data = input<NewFeesResponse | null>(null);
	public hasActiveSearch = input<boolean>(false);
	public hasError = input<boolean>(false);
	public searchText = input<string>("");

	public queryChange = output<FeeUpdatesPageChangeEvent>();
	public feeCodeClick = output<{ feeId: string; clientId: number | null; newTab: boolean }>();
	public reload = output<void>();

	public currentPage = input<number>(1);
	public rowsPerPage = input<number>(FEE_UPDATES_CONSTANTS.DEFAULT_PAGE_SIZE);
	public sortField = input<string>("firstBillingDate");
	public sortOrder = input<number>(-1);

	public items = computed<NewFeeItem[]>(() => this.data()?.items ?? []);
	public totalItems = computed<number>(() => this.data()?.totalCount ?? 0);
	public availableCurrencies = computed<string[]>(() => this.data()?.availableCurrencies ?? []);
	public currencyTotals = computed<CurrencyTotal[]>(() => this.data()?.currencyTotals ?? []);
	public hasItems = computed<boolean>(() => this.items().length > 0);

	public totalByCurrency(code: string): number {
		return this.currencyTotals().find(t => t.code === code)?.totalAmount ?? 0;
	}

	public amountFor(row: NewFeeItem, code: string): number | null {
		const value = row.amountByCurrency?.[code];
		return typeof value === "number" ? value : null;
	}

	public sortFieldFor(code: string): string {
		return `amount_${code}`;
	}

	public onTableQueryChange(event: QueryParametersModel): void {
		let sortField = this.sortField();
		let sortOrder = this.sortOrder();
		if (event.OrderBy !== undefined) {
			sortField = event.OrderBy ?? "firstBillingDate";
			sortOrder = event.SortDirection === OrderConstants.ORDER_BY_ASC ? 1 : -1;
		}
		this.queryChange.emit({
			pageNumber: event.PageNumber ?? this.currentPage(),
			rowsPerPage: event.PageSize ?? this.rowsPerPage(),
			sortField,
			sortOrder,
			search: "",
		});
	}

	public onFeeCodeClick(row: NewFeeItem, event?: MouseEvent): void {
		this.feeCodeClick.emit({ feeId: row.feeId, clientId: row.clientId, newTab: !!(event && (event.ctrlKey || event.metaKey)) });
	}
}
