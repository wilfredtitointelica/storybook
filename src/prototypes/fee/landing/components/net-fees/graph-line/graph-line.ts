import { Component, ElementRef, inject, viewChild, effect, signal, computed, DestroyRef, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as echarts from "echarts";
import { EChartsOption } from "echarts";
import type { ECharts, SeriesOption, TooltipComponentOption } from "echarts";
import { NgxEchartsModule } from "ngx-echarts";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LayoutResizeService } from "./layout-resize.service";
import { NetFeesBySchemeTableResponse } from "../../../dto/landing-responses.dto";
import { CallbackDataParams } from "echarts/types/dist/shared";
import { BrandEnum } from "../../../../common/enums/common.enum";
import { BrandHelper } from "../../../../common/helpers/common.helper";
import { Color, GlobalTermService, TermPipe } from "intelica-library-base";
import { FormatAmountPipe } from "intelica-library-project";

@Component({
	selector: "fee-graph-line",
	imports: [CommonModule, NgxEchartsModule],
	templateUrl: "./graph-line.html",
})
export class GraphLine {
	private readonly layoutResizeService = inject(LayoutResizeService);
	private readonly destroyRef = inject(DestroyRef);
	private readonly globalTermService = inject(GlobalTermService);
	private readonly formatAmountPipe = inject(FormatAmountPipe);
	private readonly termPipe = inject(TermPipe);

	readonly data = input<NetFeesBySchemeTableResponse[]>([]);
	readonly currencyCode = input<string>("-");

	readonly labels = computed(() => {
		const data = this.data();
		if (!data.length) return [];
		var result = [...new Map(data.sort((a, b) => a.monthId - b.monthId).map(item => [item.monthId, item.monthShort])).values()];
		return result;
	});

	private readonly months = computed(() => {
		const data = this.data();
		if (!data.length) return [];
		return [...new Set(data.map(x => x.monthId))].sort((a, b) => a - b);
	});

	readonly series = computed(() => {
		const data = this.data();
		if (!data.length) return [];
		const months = this.months();
		const brands = [...new Set(data.map(x => x.brandId))];
		return brands.map(brandId => {
			const brandData = data.filter(x => x.brandId === brandId);
			return {
				name: this.getBrandName(brandId),
				color: BrandHelper.getColor(brandId),
				data: months.map(monthId => {
					const item = brandData.find(x => x.monthId === monthId);
					return {
						value: item?.amount ?? null,
						meta: item ?? null,
					};
				}),
			};
		});
	});

	private resizeObserver?: ResizeObserver;
	private layoutSubscription?: any;

	private readonly chartInstance = signal<echarts.ECharts | null>(null);

	private readonly chartOptions = computed<EChartsOption>(() => this.BuildChartOptions());

	private readonly chartContainer = viewChild<ElementRef<HTMLElement>>("chartLine");

	constructor() {
		effect(() => {
			const container = this.chartContainer()?.nativeElement;
			if (!container) return;

			this.InitChart(container);
			this.SubscribeToLayoutChanges();
		});

		effect(() => {
			const chart = this.chartInstance();
			if (!chart) return;

			chart.setOption(this.chartOptions(), true);
		});
	}

	ngOnDestroy() {
		this.resizeObserver?.disconnect();
		this.layoutSubscription?.unsubscribe();
		this.chartInstance()?.dispose();
	}

	private InitChart(container: HTMLElement) {
		if (this.chartInstance()) return;

		const chart = echarts.init(container, undefined, {
			renderer: "svg",
			useDirtyRect: false,
		});

		this.chartInstance.set(chart);
		chart.setOption(this.chartOptions());

		this.ObserveContainerResize(container);
		this.AttachLegendValidation(chart);
	}

	private ObserveContainerResize(container: HTMLElement) {
		this.resizeObserver = new ResizeObserver(() => {
			this.HandleResize("observer");
		});

		this.resizeObserver.observe(container);
	}

	private SubscribeToLayoutChanges() {
		this.layoutSubscription = this.layoutResizeService
			.onSidebarChange()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => {
				this.HandleResize("sidebar");
			});
	}

	private HandleResize(source: "observer" | "sidebar" | "manual") {
		const chart = this.chartInstance();
		if (!chart) return;

		setTimeout(() => {
			chart.resize();
		}, 1);
	}

	private BuildChartOptions(): EChartsOption {
		return {
			textStyle: {
				fontFamily: "Lato, sans-serif",
			},

			grid: {
				top: 10,
				right: 10,
				bottom: "20%",
				left: 50,
			},

			xAxis: this.BuildXAxis(),
			yAxis: this.BuildYAxis(),
			tooltip: this.BuildTooltip(),
			legend: this.BuildLegend(),
			series: this.BuildSeries(),
		};
	}

	private BuildXAxis(): EChartsOption["xAxis"] {
		return {
			type: "category",
			boundaryGap: true,
			data: this.labels(),
			axisLine: { show: false },
			axisLabel: {
				color: Color.blue,
				interval: 0,
				hideOverlap: false,
			},
		};
	}

	private BuildYAxis(): EChartsOption["yAxis"] {
		return {
			type: "value",
			axisLabel: {
				color: Color.blue,
				fontFamily: "Lato, sans-serif",
				formatter: (value: number) => `{cur|${this.currencyCode()}} {val|${this.formatAmount(value, 0)}}`,
				rich: {
					cur: { fontWeight: "normal" },
					val: { fontWeight: 900 },
				},
			},

			splitLine: {
				lineStyle: {
					color: "#E6E8F0",
				},
			},
		};
	}

	private BuildLegend(): EChartsOption["legend"] {
		return {
			bottom: -2,
			icon: "circle",
			itemWidth: 10,
			itemHeight: 10,
			itemGap: 30,
			selectedMode: true,
			textStyle: {
				color: Color.blue,
				fontFamily: "Lato, sans-serif",
				fontSize: 12,
			},
		};
	}

	private BuildSeries(): EChartsOption["series"] {
		return this.series().map(serie => {
			return this.CreateLineSeries(serie.name, serie.color, serie.data);
		});
	}

	private CreateLineSeries(name: string, color: string, data: any[]): SeriesOption {
		return {
			name,
			data,
			type: "line",
			symbol: "circle",
			symbolSize: 10,
			smooth: false,
			cursor: "default",
			itemStyle: {
				color,
			},
			lineStyle: {
				color,
				width: 1,
			},
		};
	}

	private BuildTooltip(): TooltipComponentOption {
		return {
			trigger: "item",
			backgroundColor: "transparent",
			borderColor: "transparent",
			borderWidth: 0,
			padding: [0, 0],
			textStyle: {
				color: Color.blue,
				fontFamily: "Lato, sans-serif",
				fontSize: 12,
			},
			extraCssText: "box-shadow: 0px 2px 4px -2px rgba(36, 38, 51, 0.05), 0px 4px 6px -2px rgba(36, 38, 51, 0.05);",

			confine: true,

			position(pos, _, __, ___, size) {
				return [pos[0] - size.contentSize[0] / 2, pos[1] - size.contentSize[1] - 20];
			},

			formatter: (p: CallbackDataParams | CallbackDataParams[]) => {
				if (Array.isArray(p)) return "";

				const item = (p.data as any)?.meta as NetFeesBySchemeTableResponse | null;

				if (!item) return "";

				const rows = [
					{ label: this.termPipe.transform("LBL_GROSS", this.globalTermService.languageCode), amount: item.grossFees },
					{ label: this.termPipe.transform("LBL_RETURNS", this.globalTermService.languageCode), amount: item.returns },
					{ label: this.termPipe.transform("LBL_EXCLUSIONS", this.globalTermService.languageCode), amount: item.exclusions },
					{ label: this.termPipe.transform("LBL_NET_EXPENSES", this.globalTermService.languageCode), amount: item.amount },
				]
					.map(
						x => `
							<div class="ptTableLite__row">
      					  <div class="ptTableLite__cell">${x.label}</div>
      					  <div class="ptTableLite__cell">${this.formatAmountPipe.transform(x.amount, true, 2, true)}</div>
      					</div>
						`
					)
					.join("");

				return `
					<div class="ghTooltip" style="min-width: 200px">
      			  <div class="ghTooltip__container">
      			    <div class="ptTableLite ptTableLite--fullFirstColumn">
      			      <div class="ptTableLite__head">
      			        <div class="ptTableLite__row">
      			          <div class="ptTableLite__cell">${item.monthLabel}</div>
      			        </div>
      			      </div>
      			      <div class="ptTableLite__body">
      			        ${rows}
      			      </div>
      			    </div>
      			  </div>
      			</div>
				`;
			},
		};
	}

	private AttachLegendValidation(chart: ECharts): void {
		chart.on("legendselectchanged", (params: any) => {
			const activeLegends = Object.values(params.selected).filter(Boolean).length;

			if (activeLegends === 0) {
				chart.dispatchAction({
					type: "legendSelect",
					name: params.name,
				});
			}
		});
	}

	private getBrandName(brandId: number): string {
		switch (brandId) {
			case BrandEnum.Visa:
				return "Visa";
			case BrandEnum.Mastercard:
				return "Mastercard";
			case BrandEnum.Amex:
				return "Amex";
			default:
				return "Unknown";
		}
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
