import { CommonModule, DatePipe, DecimalPipe } from "@angular/common";
import { Component, computed, effect, inject, OnDestroy, signal, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";
import { EChartsOption } from "echarts";
import { YAXisOption } from "echarts/types/dist/shared";
import { Color, GlobalTermService, TermPipe } from "intelica-library-base";
import { AddFavoritesComponent, ColumnComponent, EchartComponent, EchartService, FormatAmountPipe, TableComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { MenuItem } from "primeng/api";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { PopoverModule } from "primeng/popover";
import { Skeleton } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { Tooltip, TooltipModule } from "primeng/tooltip";
import { finalize, Subscription } from "rxjs";
import { PenaltyFeeResponse, PenaltyMccDetailResponse, PenaltyMccResponse, PenaltyMerchantDetailResponse, TariffTierSimpleResponse } from "../dto/tpe-responses.dto";
import { TpeFilterService } from "../tpe-filter/tpe-filter.service";
import { TpeService } from "../tpe.service";
import { Toast } from "primeng/toast";

const MAX_FEES = 30;
const MAX_MCCS = 25;
const MAX_VISIBLE_MCCS = 10;
const MCC_ROW_HEIGHT = 30;
const MCC_CHART_PADDING = 24;
const TOOLTIP_RIGHT_OFFSET = 8;
type FeeBarValue = {
	name: string;
	feeId: number;
	feeName: string;
	description: string;
	value: number;
};
type MCCBarValue = { value: number; merchantCategoryId: number; description: string };

@Component({
	selector: "fee-tpe-penalties-paid",
	imports: [
		Button,
		TabsModule,
		TableModule,
		Tooltip,
		TermPipe,
		Dialog,
		EchartComponent,
		DatePipe,
		AddFavoritesComponent,
		TableComponent,
		ColumnComponent,
		Skeleton,
		BreadcrumbModule,
		RouterModule,
		TooltipModule,
		CommonModule,
		PopoverModule,
		Toast,
		StatusStateComponent,
	],
	templateUrl: "./tpe-penalties-paid.component.html",
	styles: ``,
})
export class TpePenaltiesPaid implements OnDestroy {
	private filterService = inject(TpeFilterService);
	private amountPipe = inject(FormatAmountPipe);

	private readonly chartTextStyle = {
		default: { color: Color.blue, fontWeight: 400 },
		bold: { color: Color.blue, fontWeight: 600 },
		fontFamily: "'Lato', sans-serif",
	};
	private termPipe = inject(TermPipe);
	private numberPipe = inject(DecimalPipe);
	public globalTermService = inject(GlobalTermService);
	private tpeService = inject(TpeService);
	private chartService = inject(EchartService);

	public isNoData = this.filterService.isNoData;
	public statusStateEnum = StatusStateEnum;

	public feeChart = viewChild<EchartComponent>("feePenaltiesChart");
	public mccChart = viewChild<EchartComponent>("mccPenaltiesChart");

	public currency = computed<string>(() => {
		const client = this.filterService.selectedClientTemp();
		return client ? client.clientCurrency : "";
	});

	public feeChartOptions?: EChartsOption;
	public hasFeeChartData = signal<boolean>(false);
	private feeBarIndex = -1;
	private feeBars: FeeBarValue[] = [];
	public selectedFeeBar: FeeBarValue | null = null;
	public mccChartOptions?: EChartsOption;
	public hasMccChartData = signal<boolean>(false);
	private mccBarIndex = -1;
	private mccBars: MCCBarValue[] = [];
	public selectedMccBar: MCCBarValue | null = null;
	public mccChartContainerStyle = { width: "100%", height: "1200px" };
	public mccChartViewportStyle = { height: "100%", overflowY: "hidden" };

	constructor() {
		this.filterService.restoreTempFilter();
		this.effectPenaltiesFee();
		this.effectPenaltiesMCC();
	}

	selectedTab = signal<"0" | "1">("0");
	titleLabel = computed(() => (this.selectedTab() === "0" ? "LBL_TOP_PENALTIES_PAID_BY" : "LBL_TOP_PENALTIES_PAID_BY_MCC"));
	fullItems = computed<MenuItem[]>(() => [{ label: "MastercardTPE", routerLink: "dashboard" }, { label: this.titleLabel() }]);

	public isLoadingFeeChart = computed<boolean>(() => this.loadingFeeChart());
	public loadingFeeChart = signal<boolean>(true);
	private feeChartError = signal<boolean>(false);
	public hasFeeChartError = computed<boolean>(() => this.feeChartError());
	private penaltiesFeeSub: Subscription | null = null;
	private effectPenaltiesFee(): void {
		effect(() => {
			const filter = this.filterService.filter();
			if (!filter.clientId) return;
			this.fetchPenaltiesFee();
		});
	}

	private fetchPenaltiesFee(): void {
		const filter = this.filterService.filter();
		if (!filter.clientId) return;
		this.loadingFeeChart.set(true);
		this.feeChartError.set(false);
		this.filterService.beginFilterRequest();
		this.penaltiesFeeSub?.unsubscribe();
		this.penaltiesFeeSub = this.tpeService
			.getPenaltiesByFee({
				client: filter.clientId,
				from: filter.from,
				to: filter.to,
				icas: filter.icas,
			})
			.pipe(finalize(() => this.filterService.endFilterRequest()))
			.subscribe({
				next: fees => {
					this.feeBarIndex = -1;
					this.selectedFeeBar = null;
					this.feeChartOptions = this.getFeeChartOptions(fees);
					setTimeout(() => {
						this.feeChart()?.refreshChart();
					}, 200);
					this.selectFirstFeeBar();
					this.loadingFeeChart.set(false);
				},
				error: () => {
					this.loadingFeeChart.set(false);
					this.feeChartError.set(true);
					this.feeBars = [];
					this.hasFeeChartData.set(false);
				},
			});
	}

	public reloadFeeChart(): void {
		this.fetchPenaltiesFee();
	}

	private getFeeChartOptions(fees: PenaltyFeeResponse[] = []): EChartsOption {
		const limitedFees: FeeBarValue[] = fees
			.filter(f => (f?.amount ?? 0) > 0)
			.map(f => ({
				name: f.feeCode ?? "",
				feeId: f.feeId,
				feeName: f.feeName ?? "",
				description: f.feeDescription ?? "",
				value: f.amount,
			}))
			.sort((a, b) => b.value - a.value)
			.slice(0, MAX_FEES);

		this.feeBars = limitedFees;
		this.hasFeeChartData.set(this.feeBars.length > 0);
		const categories = limitedFees.map(f => f.name);

		const seriesValues = [
			{
				name: "mastercardFees",
				value: limitedFees,
				color: Color.skyBlue,
				select: { itemStyle: { color: "#2A52C5" } },
			},
		];

		const lang = this.globalTermService.languageCode;
		const lblAmount = this.termPipe.transform("LBL_AMOUNT", lang);
		const currency = this.currency();

		const config = this.chartService.getBarChartOptions(
			categories,
			seriesValues,
			(p: any) => {
				const value = this.amountPipe.transform(p?.value, true, 2) ?? "0";
				return value;
			},
			(p: any) => {
				const data = p?.data as FeeBarValue | undefined;
				if (!data) return "";

				const amount = this.numberPipe.transform(data.value ?? 0, "1.0-2") ?? "0";

				return `
        <div style="font-family:'Lato',sans-serif; color:#0A1733; max-width:300px; word-break:break-word; white-space:normal;">
          <div style="font-weight:700; font-size:14px;">${data.feeName ?? ""}</div>
          <div style="font-weight:400; font-size:12px;">${lblAmount} (${currency}): ${amount}</div>
        </div>
      `;
			}
		);
		delete (config.tooltip as any).appendTo; // ! Nota: Se elimina `appendTo:'body'` porque Library Components no destruye correctamente el componente.
		config.grid = { ...config.grid, left: 30 };
		(config.xAxis as any).axisLabel = { ...(config.xAxis as any).axisLabel, color: this.chartTextStyle.default.color };
		(config.tooltip as any) = {
			...(config.tooltip as any),
			textStyle: this.chartTextStyle.default,
			borderColor: "#D9D9E3",
			backgroundColor: "#FCFCFC",
			padding: [8, 8],
			borderWidth: 1,
			borderRadius: 6,
			confine: true,
			extraCssText: "max-width: 300px; word-break: break-word; box-shadow: 0px 2px 4px -2px rgba(36, 38, 51, 0.05), 0px 4px 6px -2px rgba(36, 38, 51, 0.05);",
		};
		(config.series as any[]).forEach(s => {
			if (s.label) s.label.color = this.chartTextStyle.default.color;
		});
		(config.yAxis as YAXisOption).axisLabel = {
			...(config.yAxis as YAXisOption).axisLabel,
			color: this.chartTextStyle.default.color,
			formatter: (value: any) => {
				const formmated = value <= 1 ? this.amountPipe.transform(value, true, 2) : this.amountPipe.transform(value, true, 0);
				return `${this.currency()} {bold|${formmated === "-" ? 0 : formmated}}`;
			},
			rich: {
				bold: this.chartTextStyle.bold,
			},
		};

		return config;
	}

	private selectFirstFeeBar(): void {
		const firstFee = this.feeBars[0];
		if (!firstFee) {
			this.emptyFees.set(true);
			return;
		}
		if (this.feeBarIndex === 0 && this.selectedFeeBar?.feeId === firstFee.feeId) return;

		this.feeBarIndex = -1;
		this.selectedFeeBar = null;
		this.onSelectFee({ dataIndex: 0, data: firstFee });

		setTimeout(() => {
			const chartInstance = this.feeChart()?.chart;
			if (!chartInstance) return;
			chartInstance.dispatchAction({
				type: "select",
				seriesIndex: 0,
				dataIndex: 0,
			});
		}, 100);
	}

	public onSelectFee(params: any): void {
		const config = this.feeChartOptions as { series?: { data?: any[] }[] };

		const isCurrentSelect = this.feeBarIndex === params.dataIndex;
		if (isCurrentSelect) return;

		config?.series?.[0]?.data?.forEach((item: any, index: number) => {
			item.itemStyle = {
				color: isCurrentSelect ? Color.grey500 : index === params.dataIndex ? Color.grey700 : Color.grey500,
			};
		});

		this.feeBarIndex = params.dataIndex;
		this.selectedFeeBar = params.data;
		this.getTariffInfo();
		this.feeChart()?.refreshChart();
	}

	public isLoadingTariff = computed<boolean>(() => this.loadingTariff());
	public loadingTariff = signal<boolean>(true);
	private tariffError = signal<boolean>(false);
	public hasTariffError = computed<boolean>(() => this.tariffError());
	public hasTariffData = signal<boolean>(false);
	public emptyFees = signal<boolean>(false);
	public tariffTiers: TariffTierSimpleResponse[] = [];
	public tariffMethod = "";
	private tariffSub: Subscription | null = null;
	private getTariffInfo(): void {
		if (!this.selectedFeeBar) return;
		const filter = this.filterService.filter();
		const feeId = this.selectedFeeBar.feeId;
		this.loadingTariff.set(true);
		this.tariffError.set(false);
		this.tariffSub?.unsubscribe();
		this.tariffSub = this.tpeService.getCurrentTariff(filter.clientId, feeId).subscribe({
			next: tariffPopup => {
				this.tariffMethod = tariffPopup.methodId == 0 ? "Count" : "Volumen";
				this.tariffTiers = tariffPopup.tiers;
				this.hasTariffData.set(this.tariffTiers.length > 0);
				this.loadingTariff.set(false);
			},
			error: () => {
				this.loadingTariff.set(false);
				this.tariffError.set(true);
				this.tariffTiers = [];
				this.hasTariffData.set(false);
			},
		});
	}

	public reloadTariffInfo(): void {
		this.getTariffInfo();
	}

	public isLoadingMccChart = computed<boolean>(() => this.loadingMccChart());
	public loadingMccChart = signal<boolean>(false);
	private mccChartError = signal<boolean>(false);
	public hasMccChartError = computed<boolean>(() => this.mccChartError());
	private penaltiesMccSub: Subscription | null = null;
	private effectPenaltiesMCC(): void {
		effect(() => {
			const filter = this.filterService.filter();
			if (!filter.clientId) return;
			this.fetchPenaltiesMcc();
		});
	}

	private fetchPenaltiesMcc(): void {
		const filter = this.filterService.filter();
		if (!filter.clientId) return;
		this.loadingMccChart.set(true);
		this.mccChartError.set(false);
		this.filterService.beginFilterRequest();
		this.penaltiesMccSub?.unsubscribe();
		this.penaltiesMccSub = this.tpeService
			.getPenaltiesByMcc({
				client: filter.clientId,
				from: filter.from,
				to: filter.to,
				icas: filter.icas,
			})
			.pipe(finalize(() => this.filterService.endFilterRequest()))
			.subscribe({
				next: mccs => {
					this.loadingMccChart.set(false);
					this.mccBarIndex = -1;
					this.selectedMccBar = null;
					this.mccChartOptions = this.getMCCChartOptions(mccs);
					setTimeout(() => {
						this.mccChart()?.refreshChart();
						this.mccChart()?.chart?.getZr().setCursorStyle("default");
					}, 200);
					this.selectFirstMccBar();
				},
				error: () => {
					this.loadingMccChart.set(false);
					this.mccChartError.set(true);
					this.mccBars = [];
					this.hasMccChartData.set(false);
				},
			});
	}

	public reloadMccChart(): void {
		this.fetchPenaltiesMcc();
	}

	private getMCCChartOptions(mccs: PenaltyMccResponse[]): EChartsOption {
		const limitedMccs = mccs
			.filter(mcc => mcc.amount > 0)
			.map<MCCBarValue>(mcc => ({
				merchantCategoryId: mcc.mccId,
				description: mcc.mccDescription,
				value: mcc.amount,
			}))
			.sort((a, b) => a.value - b.value)
			.slice(0, MAX_MCCS);

		this.mccBars = limitedMccs;
		this.hasMccChartData.set(this.mccBars.length > 0);
		this.updateMccChartSizing();
		const values = [
			{
				name: "MastercardMcc",
				value: limitedMccs,
				color: Color.skyBlue,
			},
		];

		const categories = limitedMccs.map(mcc => mcc.description);

		const config = this.chartService.getBarChartHorizontalOptions(
			categories,
			values,
			(params: any): string => {
				return this.amountPipe.transform(params.value, true, 2);
			},
			(params: any): string => {
				const tooltip = `
				<div style="font-family:'Lato',sans-serif; color:#0A1733;">
				  <div style="font-weight:400; font-size:12px;">${this.termPipe.transform("LBL_AMOUNT", this.globalTermService.languageCode)} (${this.currency()}): ${this.numberPipe.transform(
					params.value,
					"1.0-2"
				)}</div>
				</div>
			`;
				return tooltip;
			}
		);

		const yAxis = config.yAxis as any;
		if (yAxis) {
			yAxis.triggerEvent = false;
			yAxis.tooltip = {
				show: true,
				position: (point: [number, number]) => [point[0] + TOOLTIP_RIGHT_OFFSET, point[1]],
				formatter: (params: any) => {
					const { value } = params;
					if (value.length <= 15) return "";
					const tooltip = `
				   <div>
            <div>${value.toUpperCase()}</div>
				  </div>
				`;
					return tooltip;
				},
			};
			yAxis.axisLabel = {
				...(yAxis.axisLabel ?? {}),
				color: this.chartTextStyle.default.color,
				formatter: (value: string) => this.truncateMccLabel(value),
				overflow: "truncate",
				ellipsis: "...",
			};
		}

		(config.tooltip as any) = {
			...(config.tooltip as any),
			textStyle: this.chartTextStyle.default,
			borderColor: "#D9D9E3",
			backgroundColor: "#FCFCFC",
			padding: [8, 8],
			borderWidth: 1,
			borderRadius: 6,
			confine: true,
			extraCssText: "word-break: break-word; box-shadow: 0px 2px 4px -2px rgba(36, 38, 51, 0.05), 0px 4px 6px -2px rgba(36, 38, 51, 0.05);",
		};

		(config.series as any[]).forEach(s => {
			if (s.label) s.label.color = this.chartTextStyle.default.color;
		});
		(config.series as any[])[0].barWidth = 32;
		(config.series as any[])[0].barGap = "0%";
		(config.series as any[])[0].barCategoryGap = "35%";

		// Efecto zoom en barra de gráfica, se deja comentado por el momento
		/* (config as any).dataZoom = [
			{
				type: "inside",
				start: 0,
				end: 100,
				filterMode: "empty",
			},
		]; */

		return config;
	}

	private truncateMccLabel(value: string, maxLength: number = 15): string {
		const label = String(value.toUpperCase() ?? "");
		if (label.length <= maxLength) return label;
		return `${label.slice(0, maxLength)}...`;
	}

	private updateMccChartSizing(): void {
		const total = this.mccBars.length;
		const visible = Math.min(total, MAX_VISIBLE_MCCS);
		const viewportHeight = Math.max(visible, 1) * MCC_ROW_HEIGHT + MCC_CHART_PADDING;
		this.mccChartViewportStyle = {
			height: `${viewportHeight}px`,
			overflowY: total > MAX_VISIBLE_MCCS ? "auto" : "hidden",
		};
	}

	private selectFirstMccBar(): void {
		const lastIndex = this.mccBars.length - 1;
		const firstVisualMcc = this.mccBars[lastIndex];
		if (!firstVisualMcc) return;
		if (this.mccBarIndex === lastIndex && this.selectedMccBar?.merchantCategoryId === firstVisualMcc.merchantCategoryId) return;

		this.mccBarIndex = -1;
		this.selectedMccBar = null;
		this.onSelectMcc({ dataIndex: lastIndex, data: firstVisualMcc });

		setTimeout(() => {
			const chartInstance = this.mccChart()?.chart;
			if (!chartInstance) return;
			chartInstance.dispatchAction({
				type: "select",
				seriesIndex: 0,
				dataIndex: lastIndex,
			});
		}, 100);
	}

	public onSelectMcc(params: any): void {
		const config = this.mccChartOptions as { series?: { data?: any[] }[] };

		const isCurrentSelect = this.mccBarIndex === params.dataIndex;
		if (isCurrentSelect) return;

		config?.series?.[0]?.data?.forEach((item: any, index: number) => {
			item.itemStyle = {
				color: isCurrentSelect ? Color.grey500 : index === params.dataIndex ? Color.grey700 : Color.grey500,
			};
		});

		this.mccBarIndex = params.dataIndex;
		if (!isCurrentSelect) {
			this.selectedMccBar = params.data;
			this.getMerchantDetail();
		}
		this.mccChart()?.refreshChart();
	}

	public isLoadingMerchantDetail = computed<boolean>(() => this.loadingMerchantDetail());
	public loadingMerchantDetail = signal<boolean>(false);
	private merchantDetailError = signal<boolean>(false);
	public hasMerchantDetailError = computed<boolean>(() => this.merchantDetailError());
	public hasMerchantDetailData = computed<boolean>(() => this.mccDetails().length > 0);
	public mccDetails = signal<PenaltyMccDetailResponse[]>([]);
	private mccDetailsSub: Subscription | null = null;
	private getMerchantDetail(): void {
		const mccId = this.selectedMccBar?.merchantCategoryId;
		if (mccId === undefined) return;
		const filter = this.filterService.filter();
		this.loadingMerchantDetail.set(true);
		this.merchantDetailError.set(false);
		this.mccDetailsSub?.unsubscribe();
		this.mccDetailsSub = this.tpeService
			.getPenaltiesByMccDetails(mccId, {
				client: filter.clientId,
				from: filter.from,
				to: filter.to,
				icas: filter.icas,
			})
			.subscribe({
				next: merchants => {
					this.mccDetails.set(merchants);
					this.loadingMerchantDetail.set(false);
				},
				error: () => {
					this.mccDetails.set([]);
					this.merchantDetailError.set(true);
					this.loadingMerchantDetail.set(false);
				},
			});
	}

	public reloadMerchantDetail(): void {
		this.getMerchantDetail();
	}
	public isLoadingMerchantPenaltiesTable = signal<boolean>(false);
	private merchantPenaltiesError = signal<boolean>(false);
	public hasMerchantPenaltiesError = computed<boolean>(() => this.merchantPenaltiesError());
	public hasMerchantPenaltiesData = computed<boolean>(() => this.merchantPenalties().length > 0);
	public merchantPenalties = signal<PenaltyMerchantDetailResponse[]>([]);
	public showMerchantDetail = false;
	private merchantPenaltiesSub: Subscription | null = null;
	public seletecdMerchantDetail?: PenaltyMccDetailResponse;
	public openMerchantPenaltiesModal(item: PenaltyMccDetailResponse) {
		this.showMerchantDetail = true;
		this.seletecdMerchantDetail = item;
		const { clientId: client, from, to, icas } = this.filterService.filter();
		this.isLoadingMerchantPenaltiesTable.set(true);
		this.merchantPenaltiesError.set(false);
		this.merchantPenaltiesSub?.unsubscribe();
		this.merchantPenaltiesSub = this.tpeService.getPenaltiesByMerchantDetails(item.merchantId, { client, from, to, icas }).subscribe({
			next: merchantPenalties => {
				this.merchantPenalties.set(merchantPenalties);
				this.isLoadingMerchantPenaltiesTable.set(false);
			},
			error: () => {
				this.merchantPenalties.set([]);
				this.merchantPenaltiesError.set(true);
				this.isLoadingMerchantPenaltiesTable.set(false);
			},
		});
	}

	public reloadMerchantPenalties(): void {
		if (!this.seletecdMerchantDetail) return;
		this.openMerchantPenaltiesModal(this.seletecdMerchantDetail);
	}

	ngOnDestroy(): void {
		this.penaltiesFeeSub?.unsubscribe();
		this.penaltiesMccSub?.unsubscribe();
		this.tariffSub?.unsubscribe();
		this.mccDetailsSub?.unsubscribe();
		this.merchantPenaltiesSub?.unsubscribe();
	}
}
