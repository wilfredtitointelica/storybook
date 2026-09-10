import { Component, inject, input, output } from "@angular/core";
import { GlobalTermService } from "intelica-library-base";
import { SortFieldModel, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { Skeleton } from "primeng/skeleton";
import { HistoryLastTwelveComponent } from "../history-last-twelve/history-last-twelve";
import { HistoryExpenseEvolutionComponent } from "../history-expense-evolution/history-expense-evolution";
import { HistoryBillingComponent } from "../history-billing/history-billing";
import { FEE_DETAIL_TERM } from "../common/constants";
import { DatePeriodEnum } from "../common/enums";
import { BillingHistoryResponse, FeeDetailChartItem, FeeDetailKpiResponse } from "../dto/fee-detail.dto";
import { Tooltip } from "primeng/tooltip";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-history",
	standalone: true,
	imports: [Skeleton, HistoryLastTwelveComponent, HistoryExpenseEvolutionComponent, HistoryBillingComponent, Tooltip, StatusStateComponent],
	templateUrl: "./history.html",
})
export class HistoryComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	public readonly StatusStateEnum = StatusStateEnum;

	public loading = input<boolean>(false);
	public hasError = input<boolean>(false);
	public kpiData = input<FeeDetailKpiResponse | null>(null);
	public chartData = input<FeeDetailChartItem[]>([]);
	public historyData = input<BillingHistoryResponse | null>(null);
	public activePeriod = input<DatePeriodEnum>(DatePeriodEnum.Last12Months);
	public hasIncompleteHistory = input<boolean>(false);
	public isDownloading = input<boolean>(false);
	public isDownloadingExpenseEvolution = input<boolean>(false);

	public downloadRequest = output<SortFieldModel>();
	public expenseEvolutionDownloadRequest = output<void>();
	public reload = output<void>();
}
