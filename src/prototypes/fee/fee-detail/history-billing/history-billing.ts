import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { GlobalTermService } from "intelica-library-base";
import { ColumnComponent, SortFieldModel, TableComponent, TruncatePipe, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { BillingHistoryItem, BillingHistoryResponse } from "../dto/fee-detail.dto";
import { FEE_DETAIL_TERM } from "../common/constants";
import { CommonGlobalService } from "../../common/services/common.service";

const SORT_FIELD_MAP: Record<string, string> = {
	date: "RunDt",
	billingNumber: "InvoiceNumDesc",
	billingActivity: "BillingActivity",
	entityActivity: "EntityActivity",
	description: "FeeDesc",
	originalCurrency: "OriginalCurrency",
	price: "FeeRate",
	events: "FeeCnt",
	originalAmount: "OriginalAmount",
	exchangeRate: "ExchangeRate",
	targetCurrency: "TargetCurrency",
	targetAmount: "TargetAmount",
};

@Component({
	selector: "fee-history-billing",
	standalone: true,
	imports: [CommonModule, ButtonModule, DecimalPipe, Skeleton, TooltipModule, TableComponent, ColumnComponent, TruncatePipe, StatusStateComponent],
	templateUrl: "./history-billing.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryBillingComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	public readonly StatusStateEnum = StatusStateEnum;

	public historyData = input<BillingHistoryResponse | null>(null);
	public isLoading = input<boolean>(false);
	public isDownloading = input<boolean>(false);

	public downloadRequest = output<SortFieldModel>();

	private table = viewChild(TableComponent);

	public items = computed<BillingHistoryItem[]>(() => this.historyData()?.items ?? []);
	public showPagination = computed<boolean>(() => this.items().length > 10);
	public hasMultipleCurrencies = computed<boolean>(() => this.historyData()?.hasMultipleCurrencies ?? false);
	public totalAmountHeader = computed<string>(() => {
		const cur = this.historyData()?.unifiedCurrency ?? "";
		const baseLabel = this.commonGlobalService.termText(this.feeDetailTerm.TOTAL_AMOUNT);
		return cur ? `${baseLabel} (${cur})` : baseLabel;
	});

	public get exportTooltip(): string {
		return !this.isLoading() && this.items().length === 0 ? this.commonGlobalService.termText(this.feeDetailTerm.NO_DATA_TO_EXPORT) : "";
	}

	public onDownloadClick(): void {
		const table = this.table();
		const uiField = (table?.SortField as string) ?? "date";
		const sortOrder = table?.SortOrder ?? -1;
		const sortField = SORT_FIELD_MAP[uiField] ?? "RunDt";
		this.downloadRequest.emit({ sortField, sortOrder });
	}
}
