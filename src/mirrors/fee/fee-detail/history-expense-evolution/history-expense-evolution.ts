import { Component, DestroyRef, ElementRef, Input, computed, effect, inject, input, output, viewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GlobalTermService } from "intelica-library-base";
import { DatePeriodEnum } from "../common/enums";
import { FeeDetailChartItem } from "../dto/fee-detail.dto";
import { FEE_DETAIL_TERM } from "../common/constants";
import { Color } from "intelica-library-base";

import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import { NgxEchartsModule } from "ngx-echarts";
import { ButtonModule } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { Tooltip } from "primeng/tooltip";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-history-expense-evolution",
	standalone: true,
	imports: [NgxEchartsModule, CommonModule, ButtonModule, Skeleton, Tooltip],
	templateUrl: "./history-expense-evolution.html",
})
export class HistoryExpenseEvolutionComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	private readonly destroyRef = inject(DestroyRef);

	@Input() totalMonths: number = 12;
	@Input() yAxisSteps: number = 5;
	@Input() animationDuration: number = 1600;

	public chartData = input<FeeDetailChartItem[]>([]);
	public activePeriod = input<DatePeriodEnum>(DatePeriodEnum.Last12Months);
	public isLoading = input<boolean>(false);
	public hasIncompleteHistory = input<boolean>(false);
	public currency = input<string>("");
	public isDownloading = input<boolean>(false);

	public downloadRequest = output<void>();

	private chartHost = viewChild<ElementRef<HTMLDivElement>>("chartHost");
	private chartInstance: echarts.ECharts | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private windowResizeHandler = (): void => this.chartInstance?.resize();

	public containerStyle: Record<string, string> = {
		width: "100%",
		height: "260px",
	};

	public barHeights: string[] = [];
	public yAxisLabels: null[] = [];
	public xAxisLabels: null[] = [];

	private readonly HEIGHT_POOL: string[] = ["62%", "62%", "85%", "95%", "92%", "90%", "68%", "83%", "96%", "75%", "78%", "95%"];

	private readonly BAR_COLOR = Color.grey500; // old "#5D86DF";
	private readonly BAR_HOVER = Color.grey700; // old "#4A6FD8";

	public isCurrentMonth = computed<boolean>(() => this.activePeriod() === DatePeriodEnum.CurrentMonth);

	public showPreviousInTooltip = computed<boolean>(() => {
		if (this.isCurrentMonth()) return false;
		return this.chartData().some(p => p.previousYearAmount !== null && p.previousYearAmount !== undefined);
	});

	public legendLabel = computed<string>(() => {
		const period = this.activePeriod();
		if (period === DatePeriodEnum.CurrentMonth) return this.commonGlobalService.termText(this.feeDetailTerm.LAST_6_MONTHS);
		if (period === DatePeriodEnum.CurrentYear) return this.commonGlobalService.termText(this.feeDetailTerm.CURRENT_YEAR);
		return this.commonGlobalService.termText(this.feeDetailTerm.LAST_12_MONTHS);
	});

	public subtitle = computed<string>(() => {
		if (this.isCurrentMonth()) return this.commonGlobalService.termText(this.feeDetailTerm.TREND_ANALYSIS_OF_LAST_6_MONTHS);
		const period = this.activePeriod();
		const periodKey = period === DatePeriodEnum.CurrentYear ? this.feeDetailTerm.CURRENT_YEAR : this.feeDetailTerm.LAST_12_MONTHS;
		return `${this.commonGlobalService.termText(this.feeDetailTerm.TREND_ANALYSIS_FOR)} ${this.commonGlobalService.termText(periodKey).toLocaleLowerCase()}`;
	});

	private chartLabels = computed<string[]>(() => this.chartData().map(p => this.commonGlobalService.formatMonthYearShort(p.year, p.month)));
	private currentSeries = computed<(number | null)[]>(() => this.chartData().map(p => p.amount ?? null));

	constructor() {
		this.buildSkeletonData();
		this.applyAnimationDuration();

		effect(() => {
			const loading = this.isLoading();
			const data = this.chartData();
			if (loading) {
				this.disposeChart();
				return;
			}
			if (data.length === 0) {
				this.disposeChart();
				return;
			}
			queueMicrotask(() => this.renderChart());
		});

		this.destroyRef.onDestroy(() => this.disposeChart());
	}

	private buildSkeletonData(): void {
		this.barHeights = Array.from({ length: this.totalMonths }, (_, i) => this.HEIGHT_POOL[i % this.HEIGHT_POOL.length]);
		this.yAxisLabels = Array(this.yAxisSteps).fill(null);
		this.xAxisLabels = Array(this.totalMonths).fill(null);
	}

	private applyAnimationDuration(): void {
		const value = this.animationDuration === 0 ? "0s" : `${this.animationDuration}ms`;
		document.documentElement.style.setProperty("--skeleton-duration", value);
	}

	private renderChart(): void {
		const host = this.chartHost()?.nativeElement;
		if (!host) return;

		const existing = echarts.getInstanceByDom(host);
		if (this.chartInstance && this.chartInstance !== existing) {
			this.disposeChart();
		}

		if (!this.chartInstance) {
			this.chartInstance = echarts.init(host, null, { renderer: "svg" });
			this.resizeObserver = new ResizeObserver(() => this.chartInstance?.resize());
			this.resizeObserver.observe(host);
			window.addEventListener("resize", this.windowResizeHandler);
		}

		this.chartInstance.setOption(this.buildChartOption(), true);
	}

	private disposeChart(): void {
		window.removeEventListener("resize", this.windowResizeHandler);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.chartInstance?.dispose();
		this.chartInstance = null;
	}

	private buildChartOption(): EChartsOption {
		const labels = this.chartLabels();
		const currentData = this.currentSeries();
		const currency = this.currency();
		const data = this.chartData();
		const showPrev = this.showPreviousInTooltip();
		const showEvents = this.isCurrentMonth();
		const legendName = this.legendLabel();
		const amountLabel = this.commonGlobalService.termText(this.feeDetailTerm.AMOUNT);
		const eventsLabel = this.commonGlobalService.termText(this.feeDetailTerm.EVENTS);

		return {
			grid: { left: "0%", right: "0%", bottom: "20%", top: "4%", containLabel: false },
			legend: {
				selectedMode: false,
				bottom: 0,
				icon: "circle",
				itemWidth: 12,
				itemHeight: 12,
				itemGap: 24,
				textStyle: { fontFamily: "lato", color: Color.blue, fontSize: 10 },
				data: [{ name: legendName, itemStyle: { color: this.BAR_COLOR } }],
			},
			tooltip: {
				trigger: "axis",
				axisPointer: { type: "none" },
				backgroundColor: "#FCFCFC",
				borderColor: "#D9D9E3",
				borderWidth: 1,
				borderRadius: 6,
				padding: [8, 8],
				textStyle: { color: Color.blue, fontSize: 12, fontFamily: "lato" },
				extraCssText: "box-shadow: 0px 2px 4px -2px rgba(36, 38, 51, 0.05), 0px 4px 6px -2px rgba(36, 38, 51, 0.05);",
				formatter: (params: unknown) => {
					const items = params as Array<{ dataIndex: number; axisValue: string; value: number | null }>;
					if (!items || items.length === 0) return "";
					const idx = items[0].dataIndex;
					const point = data[idx];
					if (!point) return "";
					const monthLabel = items[0].axisValue;
					if (showEvents) {
						const amountValue =
							point.amount !== null && point.amount !== undefined ? `${currency} ${Number(point.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-";
						const eventsValue = point.events !== null && point.events !== undefined ? Number(point.events).toLocaleString("en-US") : "-";
						return `
							<div style="font-weight:700;color:#222;margin-bottom:4px;">${monthLabel}</div>
							<div style="display:flex;justify-content:space-between;gap:32px;align-items:center;margin-bottom:2px;">
								<span style="color:#0A1733;">${amountLabel}:</span>
								<span style="font-weight:700;color:#0A1733;">${amountValue}</span>
							</div>
							<div style="display:flex;justify-content:space-between;gap:32px;align-items:center;">
								<span style="color:#0A1733;">${eventsLabel}:</span>
								<span style="font-weight:700;color:#0A1733;">${eventsValue}</span>
							</div>`;
					}
					const fmt = (v: number | null | undefined): string =>
						v !== null && v !== undefined ? `${currency} ${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-";
					const currentRow = `
						<div style="display:flex;justify-content:space-between;gap:32px;align-items:center;margin-bottom:2px;">
							<span style="color:#0A1733;">${monthLabel}:</span>
							<span style="font-weight:700;color:#0A1733;">${fmt(point.amount)}</span>
						</div>`;
					if (!showPrev) return currentRow;
					const prevLabel = this.getPreviousYearLabel(monthLabel);
					const prevRow = `
						<div style="display:flex;justify-content:space-between;gap:32px;align-items:center;">
							<span style="color:#0A1733;">${prevLabel}:</span>
							<span style="font-weight:700;color:#0A1733;">${fmt(point.previousYearAmount)}</span>
						</div>`;
					return currentRow + prevRow;
				},
			},
			xAxis: {
				type: "category",
				data: labels,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: Color.blue, fontFamily: "lato", fontSize: 12, margin: 12 },
				splitLine: { show: false },
			},
			yAxis: {
				type: "value",
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: Color.blue,
					fontSize: 12,
					fontFamily: "lato",
					align: "left",
					margin: 60,

					formatter: (value: number) => `${currency} {bold|${this.formatAxisValue(value)}}`,
					rich: {
						bold: {
							fontWeight: "bold",
							color: Color.blue,
						},
					},
				},
				splitLine: { lineStyle: { color: "#BABECF", type: "dashed" } },
			},
			series: [
				{
					name: legendName,
					type: "bar",
					barWidth: "40%",
					data: currentData,
					itemStyle: { color: this.BAR_COLOR, borderRadius: [8, 8, 8, 8] },
					emphasis: { itemStyle: { color: this.BAR_HOVER } },
					silent: true,
				},
			],
		};
	}

	private formatAxisValue(value: number): string {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return `${value}`;
	}

	private getPreviousYearLabel(label: string): string {
		const parts = label.split(" ");
		if (parts.length !== 2) return label;
		const year = parseInt(parts[1], 10);
		if (Number.isNaN(year)) return label;
		return `${parts[0]} ${year - 1}`;
	}

	public onDownloadClick(): void {
		this.downloadRequest.emit();
	}
}
