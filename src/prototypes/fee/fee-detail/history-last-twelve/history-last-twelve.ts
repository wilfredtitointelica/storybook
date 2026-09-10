import { Component, computed, inject, input } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { GlobalTermService } from "intelica-library-base";
import { FeeDetailKpiResponse } from "../dto/fee-detail.dto";
import { DatePeriodEnum } from "../common/enums";
import { FEE_DETAIL_TERM } from "../common/constants";
import { Skeleton } from "primeng/skeleton";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-history-last-twelve",
	standalone: true,
	imports: [Skeleton, DecimalPipe],
	templateUrl: "./history-last-twelve.html",
})
export class HistoryLastTwelveComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;

	public kpiData = input<FeeDetailKpiResponse | null>(null);
	public activePeriod = input<DatePeriodEnum>(DatePeriodEnum.Last12Months);
	public isLoading = input<boolean>(false);

	public isCurrentMonth = computed<boolean>(() => this.activePeriod() === DatePeriodEnum.CurrentMonth);

	public titleMain = computed<string>(() => {
		const period = this.activePeriod();
		if (period === DatePeriodEnum.CurrentMonth) return this.commonGlobalService.termText(this.feeDetailTerm.MONTHLY_CLOSE);
		if (period === DatePeriodEnum.CurrentYear) return this.commonGlobalService.termText(this.feeDetailTerm.CURRENT_YEAR);
		if (period === DatePeriodEnum.Custom) return this.commonGlobalService.termText(this.feeDetailTerm.CUSTOM_PERIOD);
		return this.commonGlobalService.termText(this.feeDetailTerm.LAST_12_MONTHS);
	});

	public titleSubtitle = computed<string>(() => {
		if (this.activePeriod() !== DatePeriodEnum.CurrentMonth) return "";
		return this.commonGlobalService.formatMonthYear(new Date());
	});

	public comparisonLabel = computed<string>(() => {
		const key = this.activePeriod() === DatePeriodEnum.CurrentMonth ? this.feeDetailTerm.VS_PREVIOUS_MONTH : this.feeDetailTerm.VS_PREVIOUS_PERIOD;
		return this.commonGlobalService.termText(key);
	});

	public currency = computed<string>(() => this.kpiData()?.currency ?? "");
	public totalFeeAmount = computed<number>(() => this.kpiData()?.totalFeeAmount ?? 0);
	public totalEvents = computed<number>(() => this.kpiData()?.totalEvents ?? 0);
	public isLargeAmount = computed<boolean>(() => Math.abs(this.totalFeeAmount()) >= 100000);

	public showComparison = computed<boolean>(() => {
		const data = this.kpiData();
		if (!data) return false;
		if (data.isSinglePeriod) return false;
		if (!data.hasEnoughHistory) return false;
		if (data.totalFeeAmountPrevious === null || data.totalFeeAmountPrevious === undefined) return false;
		return true;
	});

	public showNotEnoughHistoryMessage = computed<boolean>(() => {
		const data = this.kpiData();
		if (!data) return false;
		return !this.showComparison();
	});

	public showTotalEvents = computed<boolean>(() => {
		const data = this.kpiData();
		if (!data) return false;
		if (this.isCurrentMonth()) return true;
		return data.hasEnoughHistory && data.totalFeeAmountPrevious !== null && data.totalFeeAmountPrevious !== undefined;
	});

	public trendDelta = computed<number>(() => {
		const data = this.kpiData();
		if (!data || data.totalFeeAmountPrevious === null || data.totalFeeAmountPrevious === undefined) return 0;
		return data.totalFeeAmount - data.totalFeeAmountPrevious;
	});

	public trendPercent = computed<string>(() => {
		const data = this.kpiData();
		if (!data || !data.totalFeeAmountPrevious) return "0%";
		const pct = (this.trendDelta() / data.totalFeeAmountPrevious) * 100;
		return `${Math.abs(pct).toFixed(1)}%`;
	});

	public trendDeltaAbs = computed<number>(() => Math.abs(this.trendDelta()));

	public trendIsPositive = computed<boolean>(() => this.trendDelta() >= 0);

	public trendValueClass = computed<string>(() => (this.trendIsPositive() ? "periodSummary__trendValue--positive" : "periodSummary__trendValue--negative"));

	public trendIcon = computed<string>(() => (this.trendIsPositive() ? "icon-economic-growth" : "icon-economic-decrease"));
}
