import { Component, computed, inject, input, viewChild } from "@angular/core";
// --- echart ---
import { EChartsOption } from "echarts";
import { NgxEchartsModule } from "ngx-echarts";
// --- intelica library ---
import { Color } from "intelica-library-base";
import { EchartComponent, EchartService } from "intelica-library-project";
// --- interface ---
import { RATING_COLORS, RatingConfig, ValueFormat } from "./graph-gauge.interface";

@Component({
	selector: "fee-graph-gauge",
	imports: [NgxEchartsModule, EchartComponent],
	templateUrl: "./graph-gauge.html",
})
export class GraphGauge {
	private readonly chartService = inject(EchartService);

	private readonly chartRef = viewChild<EchartComponent>("chartGauge");

	public readonly value = input<number | null>();
	public readonly format = input<ValueFormat>();
	public readonly label = input<string | null>();

	public readonly ratingConfiguration = computed(() => this.BuildRatingConfiguration(this.resolvedValue()));
	public readonly chartOptions = computed<EChartsOption>(() => this.BuildChartOptions(this.resolvedValue(), this.ratingConfiguration()));

	private readonly resolvedValue = computed(() => this.value() ?? 0);
	private readonly resolvedFormat = computed(() => this.format() ?? "");
	private readonly resolvedLabel = computed(() => this.label() ?? "score");

	public HandleChartEvent(event: unknown) {}

	private FormatScoreLabel(value: number): string {
		const normalized = Math.max(0, Math.min(100, value));
		const formatted = this.formatNumber(normalized, 2);

		switch (this.resolvedFormat()) {
			case "percent":
				return `${formatted}%`;
			case "custom":
				return `${formatted} ${this.resolvedLabel()}`;
			default:
				return `${formatted} score`;
		}
	}

	private formatNumber(value: number, decimals: number): string {
		return value.toFixed(decimals).replace(/\.?0+$/, "");
	}

	private BuildRatingConfiguration(value: number): RatingConfig {
		if (value <= 35) return { rating: "D", color: RATING_COLORS.D };
		if (value < 55) return { rating: "C", color: RATING_COLORS.C };
		if (value < 85) return { rating: "B", color: RATING_COLORS.B };

		return { rating: "A", color: RATING_COLORS.A };
	}
	private BuildChartOptions(value: number, ratingConfig: RatingConfig): EChartsOption {
		const baseOptions = this.GetBaseGaugeOptions(value, ratingConfig);

		this.ConfigureDetailPosition(baseOptions);
		this.ConfigurePointer(baseOptions);
		this.ConfigureLabelCenter(baseOptions, value);
		this.ConfigureMinMaxLabels(baseOptions);

		return baseOptions;
	}

	// --- config split (más legible) ---
	private GetBaseGaugeOptions(value: number, RatingConfig: RatingConfig) {
		return this.chartService.getRateSemiDoughnutOptions(RatingConfig.rating, value, 48, RatingConfig.color, 100);
	}
	private ConfigureDetailPosition(options: any) {
		const series = options.series as any[];

		if (series?.[0]?.detail) {
			series[0].detail.offsetCenter = [0, "-10%"];
			series[0].detail.rich.letter.color = Color.blue;
		}
	}
	private ConfigurePointer(options: any) {
		const series = options.series as any[];
		const lineWidth = series?.[0]?.axisLine?.lineStyle?.width;

		if (series?.[1]?.pointer && typeof lineWidth === "number") {
			series[1].pointer.width = lineWidth + 7;
			series[1].pointer.length = "188%";
			series[1].z = 20;
			series[1].zlevel = 2;

			series[1].pointer.itemStyle = {
				...(series[1].pointer.itemStyle ?? {}),
				borderColor: "#D9D9E3",
				borderWidth: 2,
			};
		}
	}
	private ConfigureLabelCenter(options: any, value: number) {
		options.graphic = [
			{
				type: "text",
				left: "center",
				top: "60%",
				silent: true,
				style: {
					text: this.FormatScoreLabel(value),
					fontFamily: "Lato, sans-serif",
					fontSize: 12,
					fontWeight: 500,
					fill: Color.blue,
					textAlign: "center",
				},
			},
		];
	}
	private ConfigureMinMaxLabels(options: any) {
		const series = options.series as any[];

		const gauge = series?.[0];
		if (!gauge?.data) return;

		gauge.data.forEach((item: any) => {
			if (!item.title) return;

			const isMin = item.name === "0";
			const isMax = item.name === "100";

			if (isMin || isMax) {
				item.title.fontFamily = "Lato, sans-serif";
				item.title.fontSize = 10; // 👈 tamaño distinto
				item.title.fontWeight = 400;
				item.title.color = Color.blue;
			}
		});
	}
}
