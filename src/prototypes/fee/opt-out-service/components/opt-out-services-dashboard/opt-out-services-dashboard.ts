import { Component, inject, ElementRef, OnDestroy, signal, computed, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { CardModule } from "primeng/card";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { Badge } from "primeng/badge";
import { CommonModule } from "@angular/common";
import * as echarts from "echarts";
import { EChartsOption, SeriesOption, TooltipComponentOption } from "echarts";
import { NgxEchartsModule } from "ngx-echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { catchError, distinctUntilChanged, EMPTY, filter, finalize, forkJoin, map, merge, Observable, of, Subject, Subscription, switchMap, takeUntil, tap } from "rxjs";
import { LayoutResizeService } from "../../service/layout-resize.service";
import { OptOutServicesService } from "../../opt-out-service.service";
import { OptOutServiceFilterCommand } from "../../dto/opt-out-service-commands.dto";
import { OptOutServiceFilterService } from "../opt-out-service-filter/service/opt-out-service-filter.service";
import moment from "moment";
import { PeriodFilterTypeEnum, UpcomingOptOutStatusEnum, UsageLevelEnum, VariationTrendEnum } from "../../common/enums/opt-out-service.enum";
import { FormatDateConstants } from "../../../common/constants/format.date";
import { Toast } from "primeng/toast";
import { UnsubcribeService } from "../unsubscribe/service/unsubscribe.service";
import { FormatValuePipe } from "../../../common/pipe/format-value.pipe";
import { Color } from "intelica-library-base";
import { StatusStateComponent, StatusStateEnum, AddFavoritesComponent } from "intelica-library-project";

@Component({
	selector: "fee-opt-out-services-dashboard",
	imports: [
		TermPipe,
		RouterLink,
		Button,
		SkeletonModule,
		ProgressBarModule,
		TooltipModule,
		CardModule,
		NgxEchartsModule,
		CommonModule,
		FormatValuePipe,
		Toast,
		StatusStateComponent,
		AddFavoritesComponent,
		Badge,
	],
	templateUrl: "./opt-out-services-dashboard.html",
})
export class OptOutServicesDashboard implements OnInit, OnDestroy {
	private readonly chartTextStyle = {
		default: { color: Color.blue, fontWeight: 400 },
		bold: { color: Color.blue, fontWeight: 600 },
	};

	private readonly termPipe = inject(TermPipe);
	public readonly globalTermService = inject(GlobalTermService);
	private readonly optOutService = inject(OptOutServicesService);
	private readonly optOutServiceFilter = inject(OptOutServiceFilterService);
	private readonly unsubcribeService = inject(UnsubcribeService);

	public readonly filter = this.optOutServiceFilter.filter;
	public readonly periodFilterTypeEnum = PeriodFilterTypeEnum;
	private refresh = this.unsubcribeService.refresh;

	private _isloadingAddToFavorites = signal<boolean>(false);
	private _isloadingSubscriptionsCard = signal<boolean>(true);
	private _isloadingSavingsCard = signal<boolean>(true);
	private _isloadingUpcomingCard = signal<boolean>(true);
	private _isloadingBillingGraph = signal<boolean>(true);

	public isloadingAddToFavorites = computed(() => this._isloadingAddToFavorites());
	public isloadingSubscriptionsCard = computed(() => this._isloadingSubscriptionsCard());
	public isloadingSavingsCard = computed(() => this._isloadingSavingsCard());
	public isloadingUpcomingCard = computed(() => this._isloadingUpcomingCard());
	public isloadingBillingGraph = computed(() => {
		const isLoading = this._isloadingBillingGraph();
		if (!isLoading) {
			setTimeout(() => {
				const chartElement = this.el.nativeElement.querySelector("#evolution_graph_plot");
				if (chartElement) {
					this.initChart(chartElement);
					this.subscribeToLayoutChanges();
				}
			}, 1);
		}
		return isLoading;
	});
	public currencyCode = computed<string>(() => this.optOutServiceFilter.currencyCode() ?? "-");

	private formatDate(date: Date): string {
		return moment(date).format(FormatDateConstants.YYYYMMDD);
	}

	private getToday(): Date {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}

	private getStartOfYear(date: Date): Date {
		return new Date(date.getFullYear(), 0, 1);
	}

	private getEndOfYear(date: Date): Date {
		return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
	}

	private overrideSavings = (cmd: OptOutServiceFilterCommand): OptOutServiceFilterCommand => {
		const today = this.getToday();

		const start = this.getStartOfYear(today);
		const end = today;

		return new OptOutServiceFilterCommand({
			...cmd,
			startDate: this.formatDate(start),
			endDate: this.formatDate(end),
		});
	};

	private overrideUpcoming = (cmd: OptOutServiceFilterCommand): OptOutServiceFilterCommand => {
		const today = this.getToday();

		const start = new Date(today);
		start.setDate(start.getDate() + 1);

		const end = this.getEndOfYear(today);

		return new OptOutServiceFilterCommand({
			...cmd,
			startDate: this.formatDate(start),
			endDate: this.formatDate(end),
		});
	};

	public dataSubscriptionsCard = this.optOutService.buildCardSignal(cmd => this.optOutService.getSubscriptionsCard(cmd), this._isloadingSubscriptionsCard, this.filter, undefined, this.refresh);
	public dataSavingsCard = this.optOutService.buildCardSignal(cmd => this.optOutService.getSavingsCard(cmd), this._isloadingSavingsCard, this.filter, this.overrideSavings, this.refresh);
	public dataUpcomingCard = this.optOutService.buildCardSignal(cmd => this.optOutService.getUpcomingCard(cmd), this._isloadingUpcomingCard, this.filter, this.overrideUpcoming, this.refresh);
	public dataBillingGraph = this.optOutService.buildCardSignal(cmd => this.optOutService.getBillingGraph(cmd), this._isloadingBillingGraph, this.filter);

	public usageLevelEnum = UsageLevelEnum;
	public variationTrendEnum = VariationTrendEnum;
	public upcomingOptOutStatusEnum = UpcomingOptOutStatusEnum;
	public statusStateEnum = StatusStateEnum;

	public getInitialData = computed(() => {
		const data = this.dataBillingGraph();
		const months = data?.months ?? [];
		return {
			labels: months.map(m => m.monthShort ?? m.month.toString()),
			expenses: months.map(m => m.actualAmount ?? null),
			forecast: months.map(m => m.forecastAmount ?? null),
		};
	});

	public showForecastArea = computed(() => {
		const data = this.dataBillingGraph();
		return data?.showForecastArea ?? false;
	});

	// Skeleton Graph
	readonly yAxisLabels = signal(Array(9).fill(null));
	readonly gridLines = signal(Array(9).fill(null));
	readonly xAxisLabels = signal(Array(12).fill(null));

	readonly dataPoints = signal([
		{ x: 0, y: 30 },
		{ x: 8.33, y: 42 },
		{ x: 16.66, y: 30 },
		{ x: 25, y: 50 },
		{ x: 33.33, y: 40 },
		{ x: 41.66, y: 52 },
		{ x: 50, y: 42 },
		{ x: 58.33, y: 55 },
		{ x: 66.66, y: 62 },
		{ x: 75, y: 56 },
		{ x: 83.33, y: 38 },
		{ x: 91.66, y: 18 },
	]);

	readonly paths = computed(() => {
		const points = this.dataPoints();
		if (!points.length) return { line: "", area: "" };

		let line = `M ${points[0].x} ${100 - points[0].y}`;
		let area = `M ${points[0].x} 100 L ${points[0].x} ${100 - points[0].y}`;

		for (let i = 1; i < points.length; i++) {
			const { x, y } = points[i];
			const invY = 100 - y;

			line += ` L ${x} ${invY}`;
			area += ` L ${x} ${invY}`;
		}

		area += ` L ${points[points.length - 1].x} 100 Z`;

		return { line, area };
	});

	// Graph
	readonly containerStyle = signal<{ width: string; height: string }>({
		width: "100%",
		height: "400px",
	});

	private chart!: echarts.ECharts;
	private resizeObserver!: ResizeObserver;
	private sidebarSub!: Subscription;

	constructor(private el: ElementRef, private layoutResizeService: LayoutResizeService) {}

	ngOnInit() {}

	ngOnDestroy(): void {
		this.resizeObserver?.disconnect();
		this.sidebarSub?.unsubscribe();
		this.chart?.dispose();
	}

	private initChart(el: HTMLElement): void {
		this.chart = echarts.init(el, undefined, { renderer: "svg" });

		this.updateChart(this.getInitialData());

		this.resizeObserver = new ResizeObserver(() => this.chart.resize());
		this.resizeObserver.observe(el);
	}

	public updateChart(data: { labels: string[]; expenses: (number | null)[]; forecast: (number | null)[] }): void {
		if (!this.chart) return;

		const options = this.buildChartOptions(data);

		this.chart.setOption(options, {
			notMerge: true,
			lazyUpdate: true,
		});
	}

	private buildChartOptions(data: { labels: string[]; expenses: (number | null)[]; forecast: (number | null)[] }): EChartsOption {
		const series: SeriesOption[] = [];

		const expensesSeries = this.buildExpensesSeries(data.expenses);
		const forecastSeries = this.buildForecastSeries(data.forecast, this.dataBillingGraph()?.todayShort, this.dataBillingGraph()?.showTodayDivider);

		series.push(expensesSeries);
		if (forecastSeries) series.push(forecastSeries);

		return {
			grid: { left: 0, right: 0, top: 15, bottom: 70, containLabel: true },

			textStyle: { fontFamily: "Lato, sans-serif" },

			xAxis: {
				type: "category",
				data: data.labels,
				axisLine: { show: false },
				axisLabel: { color: this.chartTextStyle.default.color },
			},

			yAxis: {
				type: "value",
				splitLine: {
					show: true,
					lineStyle: { width: 1, color: "#D9D9E3", type: [4, 6], cap: "round" },
				},
				axisLabel: {
					color: this.chartTextStyle.default.color,
					formatter: (v: number) => `{cur|${this.currencyCode()}} {val|${this.formatAmount(v, 0)}}`,
					rich: {
						usd: this.chartTextStyle.default,
						val: this.chartTextStyle.bold,
					},
				},
			},

			tooltip: this.buildTooltip(),

			legend: {
				selectedMode: false,
				bottom: 10,
				icon: "circle",
				itemWidth: 12,
				itemHeight: 10,
				itemGap: 25,
				textStyle: { ...this.chartTextStyle.default, fontSize: 12 },
			},

			series: series,
		};
	}

	private buildExpensesSeries(data: (number | null)[]): SeriesOption {
		return {
			name: "Expenses",
			type: "line",
			data,
			symbol: "circle",
			symbolSize: 10,
			z: 10,
			cursor: "default",
			lineStyle: { width: 2, color: "#64738B" },
			itemStyle: { color: "#64738B" },
			areaStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: "#64738B" },
					{ offset: 1, color: "rgba(115,143,227,0)" },
				]),
			},
		};
	}

	private buildForecastSeries(data: (number | null)[], today?: string | null, showDivider?: boolean | null): SeriesOption | null {
		const hasData = data?.some(v => v !== null && v !== undefined);
		const shouldShow = hasData && showDivider;
		if (!shouldShow) return null;

		const series: SeriesOption = {
			name: "Forecast",
			type: "line",
			data,
			symbol: "circle",
			symbolSize: 10,
			cursor: "default",
			lineStyle: { width: 1, color: "#5CB39D" },
			itemStyle: { color: "#5CB39D" },
			areaStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: "#5CB39D" },
					{ offset: 1, color: "rgba(104,161,192,0)" },
				]),
			},
		};
		if (today && showDivider) {
			series.markLine = {
				silent: true,
				symbol: "none",
				data: [
					{
						xAxis: today,
						label: {
							show: true,
							formatter: this.termPipe.transform("LAST_MONTH", this.globalTermService.languageCode),
							position: "start",
							offset: [0, 27],
							padding: [6, 12],
							borderRadius: 16,
							backgroundColor: "#DDE6F8",
							borderColor: this.chartTextStyle.default.color,
							color: this.chartTextStyle.default.color,
							borderWidth: 1,
							fontSize: 12,
							fontWeight: 500,
						},
					},
				],
				lineStyle: { color: "#9CA3BA", width: 2, type: [6, 6], cap: "round" },
			};
		}
		return series;
	}

	private buildTooltip(): TooltipComponentOption {
		return {
			trigger: "item",
			backgroundColor: "#FCFCFC",
			borderColor: "#D9D9E3",
			borderWidth: 1,
			borderRadius: 6,
			padding: 8,
			textStyle: { color: Color.blue, fontSize: 12, fontFamily: "lato" },
			extraCssText: "box-shadow: 0px 2px 4px -2px rgba(36, 38, 51, 0.05), 0px 4px 6px -2px rgba(36, 38, 51, 0.05);",

			position(pos, _, __, ___, size) {
				return [pos[0] - size.contentSize[0] / 2, pos[1] - size.contentSize[1] - 20];
			},

			formatter: (p: CallbackDataParams | CallbackDataParams[]) => {
				if (Array.isArray(p)) return "";

				const value = typeof p.value === "number" ? p.value.toLocaleString() : "-";

				return `
        <div style="font-family:'Lato',sans-serif; color:${Color.blue};">
          <div style="font-weight:700; font-size:14px;">${p.name}</div>
          <div style="font-weight:400; font-size:12px;">${this.currencyCode()} ${value}</div>
        </div>
      `;
			},
		};
	}

	private subscribeToLayoutChanges(): void {
		this.sidebarSub = this.layoutResizeService.onSidebarChange().subscribe(() => {
			this.resize("sidebar");
		});
	}

	private resize(source: "observer" | "sidebar" | "manual" = "manual"): void {
		if (!this.chart) return;

		setTimeout(() => {
			this.chart.resize();
		}, 1);
	}

	private formatAmount(value: number, decimals: number): string {
		const absValue = Math.abs(value);

		const suffixes = [
			{ limit: 1e12, suffix: "T" },
			{ limit: 1e9, suffix: "B" },
			{ limit: 1e6, suffix: "M" },
			{ limit: 1e3, suffix: "K" },
		];

		for (const { limit, suffix } of suffixes) {
			if (absValue >= limit) {
				return this.trimZeros((value / limit).toFixed(decimals)) + suffix;
			}
		}

		return this.trimZeros(value.toFixed(decimals));
	}

	private trimZeros(value: string): string {
		return value.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/, "");
	}
}
