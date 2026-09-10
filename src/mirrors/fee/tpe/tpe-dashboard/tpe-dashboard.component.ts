import { CommonModule, DecimalPipe } from "@angular/common";
import { Component, computed, DestroyRef, effect, ElementRef, inject, signal, ViewChild, viewChild, AfterViewInit, untracked } from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { EChartsOption } from "echarts";
import { YAXisOption } from "echarts/types/dist/shared";
import { AlertService, GlobalTermService, SpinnerService, TermPipe, Color, ConfigService } from "intelica-library-base";
import { AddFavoritesComponent, EchartComponent, EchartService, FormatAmountPipe, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { NgxEchartsModule } from "ngx-echarts";
import { ScrollerOptions } from "primeng/api";
import { Badge } from "primeng/badge";
import { Button } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { Select } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TextareaModule } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
import { catchError, combineLatest, distinctUntilChanged, filter, finalize, forkJoin, map, of, switchMap } from "rxjs";
import { MerchantNonComplianceResponse, MonthlyExpenseResponse, PenaltyFeesOverviewResponse, RatingResponse } from "../dto/tpe-responses.dto";
import { TpeFilterService } from "../tpe-filter/tpe-filter.service";
import { TpeService } from "../tpe.service";
import { Toast } from "primeng/toast";
import moment from "moment";
import { BUSINESS_USER_TYPE } from "../../common/constants/businessusertype";
@Component({
	selector: "fee-tpe-dashboard",
	imports: [
		FormatAmountPipe,
		TermPipe,
		CommonModule,
		RouterLink,
		FormsModule,
		Button,
		Tooltip,
		Badge,
		Select,
		MultiSelect,
		NgxEchartsModule,
		DialogModule,
		InputTextModule,
		TextareaModule,
		EchartComponent,
		AddFavoritesComponent,
		SkeletonModule,
		CardModule,
		Toast,
		StatusStateComponent,
	],

	templateUrl: "./tpe-dashboard.component.html",
	styles: ``,
})
export class TpeDashboard {
	private destroyRef = inject(DestroyRef);
	private configService = inject(ConfigService);
	private containerWidth = signal(0);

	private readonly chartTextStyle = {
		default: { color: Color.blue, fontWeight: 400 },
		bold: { color: Color.blue, fontWeight: 600 },
		fontFamily: "'Lato', sans-serif",
	};

	private wrapperSig = signal<ElementRef<HTMLDivElement> | null>(null);

	@ViewChild("wrapper")
	set wrapperSetter(el: ElementRef<HTMLDivElement> | undefined) {
		this.wrapperSig.set(el ?? null);
	}

	constructor() {
		this.filterService.restoreTempFilter();
		let ro: ResizeObserver | null = null;

		effect(() => {
			const el = this.wrapperSig()?.nativeElement;
			ro?.disconnect();
			if (!el) return;
			if (!ro) ro = new ResizeObserver(([{ contentRect }]) => this.containerWidth.set(Math.round(contentRect.width)));
			ro.observe(el);
		});

		effect(() => {
			const options = this.availableFeeOptions();
			if (!this.feeIdsInitialized && options.length > 0) {
				this.feeIdsInitialized = true;
				this.selectedFeeIds.set(options.map(fee => fee.id));
			}
		});

		effect(() => {
			const availableFeeIds = this.availableFeeOptions().map(fee => fee.id);
			this.selectedFeeIds.set(availableFeeIds);
			// const availableFeeIds = new Set(this.availableFeeOptions().map(fee => fee.id));
			// const currentSelection = untracked(() => this.selectedFeeIds());
			// const newSelection = currentSelection.filter(feeId => availableFeeIds.has(feeId));
			// if (newSelection.length !== currentSelection.length || newSelection.some((id, i) => id !== currentSelection[i])) {
			// 	this.selectedFeeIds.set(newSelection);
			// }
		});
		this.destroyRef.onDestroy(() => ro?.disconnect());
	}

	chartWidth = computed(() => {
		const extra = (this.monthlyExpense()?.length ?? 0) - 12;
		return extra > 0 ? `calc(100% + ${Math.round(((this.containerWidth() - 91) / 12) * extra)}px)` : "";
	});

	private readonly RATING_SCALE_TOTAL = 100;
	private readonly MIN_EXPENSE_MONTHS = 6;
	private readonly MAX_EXPENSE_MONTHS = 24;

	public globalTermService = inject(GlobalTermService);
	private filterService = inject(TpeFilterService);
	private amountPipe = inject(FormatAmountPipe);
	private tpeService = inject(TpeService);
	private chartService = inject(EchartService);
	private numberPipe = inject(DecimalPipe);
	private termPipe = inject(TermPipe);
	private readonly alertService = inject(AlertService);

	public filter = this.filterService.filter;
	public filterOptions = this.filterService.filterOptionsApply;
	public isSendingSupport = signal(false);
	public statusStateEnum = StatusStateEnum;
	public isNoData = this.filterService.isNoData;

	public getSupportSuccess = false;

	public client = computed(() => this.filterService.selectedClientTemp());

	public currency = computed<string>(() => this.client()?.clientCurrency ?? "");

	public selectedMerchantId = signal<string | null>(null);
	public selectedFeeIds = signal<number[]>([]);
	private feeIdsInitialized = false;
	public availableFeeOptions = computed(() => {
		const filters = this.filterOptions();
		if (!filters) return [];

		const merchantId = this.selectedMerchantId();
		if (!merchantId) return filters.fees;

		const merchantToFees = filters.merchantToFees;
		if (!merchantToFees) return filters.fees;

		const feeIds = merchantToFees[merchantId] ?? [];
		if (!feeIds.length) return [];

		const allowed = new Set(feeIds);
		return filters.fees.filter(fee => allowed.has(fee.id));
	});

	public availableMerchantOptions = computed(() => {
		const filters = this.filterOptions();
		if (!filters) return [];

		return filters.merchants ?? [];
	});

	public feeToMerchants = computed(() => {
		const merchantToFees = this.filterOptions()?.merchantToFees;
		if (!merchantToFees) return {};

		const result: Record<number, string[]> = {};

		for (const [merchantId, feeIds] of Object.entries(merchantToFees)) {
			for (const feeId of feeIds) {
				(result[feeId] ??= []).push(merchantId);
			}
		}

		return result;
	});

	public isReadonlyFee = computed(() => this.availableFeeOptions().length <= 1);

	public selectedFeesLabel = computed(() => {
		const selected = this.selectedFeeIds();
		const options = this.availableFeeOptions();
		if (selected.length === 0) return "";
		if (selected.length === options.length && options.length > 1) return this.getTerm("ALL_FEES");
		if (selected.length === 1) return options.find(o => o.id === selected[0])?.name ?? "";
		return `${selected.length} ${this.getTerm("SELECTED_FEES")}`;
	});

	private penaltiesOverViewLoading = signal(true);
	private penaltiesOverViewError = signal(false);
	private penaltiesOverViewRefresh = signal(0);
	public penaltiesOverView = toSignal<PenaltyFeesOverviewResponse | null>(
		combineLatest([toObservable(this.filter), toObservable(this.penaltiesOverViewRefresh)]).pipe(
			map(([{ clientId, from, to, icas }, refresh]) => ({
				client: clientId,
				from,
				to,
				icas: icas ?? null,
				key: `${clientId}|${from}|${to}|${(icas ?? []).join(",")}|${refresh}`,
			})),
			filter(({ client, from, to }) => Boolean(client) && Boolean(from) && Boolean(to)),
			distinctUntilChanged((prev, next) => prev.key === next.key),
			switchMap(({ client, from, to, icas }) => {
				this.penaltiesOverViewLoading.set(true);
				this.penaltiesOverViewError.set(false);
				this.filterService.beginFilterRequest();
				return this.tpeService.getPenaltiesOverview({ client, from, to, icas }).pipe(
					catchError(() => {
						this.penaltiesOverViewError.set(true);
						return of(null);
					}),
					finalize(() => {
						this.penaltiesOverViewLoading.set(false);
						this.filterService.endFilterRequest();
					})
				);
			}),
			catchError(() => {
				this.penaltiesOverViewLoading.set(false);
				this.penaltiesOverViewError.set(true);
				return of(null);
			})
		),
		{ initialValue: null }
	);

	public isLoadingPenaltiesOverView = computed<boolean>(() => this.penaltiesOverViewLoading());
	public hasPenaltiesOverViewError = computed<boolean>(() => this.penaltiesOverViewError());
	public hasPenaltiesOverViewData = computed<boolean>(() => !!this.penaltiesOverView()?.amountPaid);

	public reloadPenaltiesOverView(): void {
		this.penaltiesOverViewRefresh.update(n => n + 1);
	}

	private merchantNonComplianceLoading = signal(true);
	private merchantNonComplianceError = signal(false);
	private merchantNonComplianceRefresh = signal(0);
	public merchantNonCompliance = toSignal<MerchantNonComplianceResponse | null>(
		combineLatest([toObservable(this.filter), toObservable(this.merchantNonComplianceRefresh)]).pipe(
			map(([{ clientId, from, to, icas }, refresh]) => ({
				client: clientId,
				from,
				to,
				icas: icas ?? null,
				key: `${clientId}|${from}|${to}|${(icas ?? []).join(",")}|${refresh}`,
			})),
			filter(({ client, from, to }) => Boolean(client) && Boolean(from) && Boolean(to)),
			distinctUntilChanged((prev, next) => prev.key === next.key),
			switchMap(({ client, from, to, icas }) => {
				this.merchantNonComplianceLoading.set(true);
				this.merchantNonComplianceError.set(false);
				this.filterService.beginFilterRequest();
				return forkJoin({
					topMerchant: this.tpeService.getMerchantNonComplianceTopMerchant({ client, from, to, icas }),
					summary: this.tpeService.getMerchantNonComplianceSummary({ client, from, to, icas }),
				}).pipe(
					map(
						({ topMerchant, summary }) =>
							({
								merchantWithMostPenalties: topMerchant.merchantWithMostPenalties ?? "",
								totalMerchants: summary.totalMerchants ?? 0,
							} as MerchantNonComplianceResponse)
					),
					catchError(() => {
						this.merchantNonComplianceError.set(true);
						return of(null);
					}),
					finalize(() => {
						this.merchantNonComplianceLoading.set(false);
						this.filterService.endFilterRequest();
					})
				);
			}),
			catchError(() => {
				this.merchantNonComplianceLoading.set(false);
				this.merchantNonComplianceError.set(true);
				return of(null);
			})
		),
		{ initialValue: null }
	);

	public isLoadingMerchantNonCompliance = computed<boolean>(() => this.merchantNonComplianceLoading());
	public hasMerchantNonComplianceError = computed<boolean>(() => this.merchantNonComplianceError());
	public hasMerchantNonComplianceData = computed<boolean>(() => !!this.merchantNonCompliance()?.totalMerchants);

	public reloadMerchantNonCompliance(): void {
		this.merchantNonComplianceRefresh.update(n => n + 1);
	}

	private ratingLoading = signal(true);
	public ratingSeverity = computed<"success" | "info" | "danger" | null>(() => {
		const rating = this.rating();
		if (!rating) return null;
		const letterSeverityMap: Record<string, "success" | "info" | "danger" | null> = {
			A: "success",
			B: "info",
			C: null,
			D: "danger",
		};
		return letterSeverityMap[rating.letter] ?? null;
	});

	public ratingClass = computed<string>(() => {
		const rating = this.rating();
		if (!rating) return "";
		if (rating.letter === "C") return "prBadge--yellow";
		return "";
	});

	public get languageCode() {
		return this.globalTermService.languageCode.toLowerCase();
	}

	private ratingError = signal(false);
	private ratingRefresh = signal(0);
	public rating = toSignal<RatingResponse | null>(
		combineLatest([toObservable(this.filter), toObservable(this.ratingRefresh)]).pipe(
			map(([{ clientId, to }, refresh]) => ({
				client: clientId,
				to,
				key: `${clientId}|${to}|${refresh}`,
			})),
			filter(({ client, to }) => Boolean(client) && Boolean(to)),
			distinctUntilChanged((prev, next) => prev.key === next.key),
			switchMap(({ client, to }) => {
				this.ratingLoading.set(true);
				this.ratingError.set(false);
				this.filterService.beginFilterRequest();
				return this.tpeService.getRating(client, to).pipe(
					catchError(() => {
						this.ratingError.set(true);
						return of(null);
					}),
					finalize(() => {
						this.ratingLoading.set(false);
						this.filterService.endFilterRequest();
					})
				);
			}),
			catchError(() => {
				this.ratingLoading.set(false);
				this.ratingError.set(true);
				return of(null);
			})
		),
		{ initialValue: null }
	);

	public isLoadingRating = computed<boolean>(() => this.ratingLoading());
	public hasRatingError = computed<boolean>(() => this.ratingError());
	public hasRatingData = computed<boolean>(() => !!this.rating()?.value);

	public reloadRating(): void {
		this.ratingRefresh.update(n => n + 1);
	}

	public defaultSubject = computed(() => this.getTerm("TpeSupportDefaultSubject"));
	public defaultBody = computed(() => this.getTerm("TpeSupportDefaultBody"));

	trackByMerchantId = (_: number, item: { id: number }) => item.id;
	public virtualScrollOptions: ScrollerOptions = {
		numToleratedItems: 10,
		autoSize: true,
		trackBy: this.trackByMerchantId,
	};

	private monthlyExpenseLoading = signal(true);
	private monthlyExpenseError = signal(false);
	private monthlyExpenseRefresh = signal(0);
	public monthlyExpense = toSignal<MonthlyExpenseResponse[] | null>(
		combineLatest([toObservable(this.filter), toObservable(this.selectedMerchantId), toObservable(this.selectedFeeIds), toObservable(this.monthlyExpenseRefresh)]).pipe(
			map(([{ clientId, from, to, icas }, merchantId, feeIds, refresh]) => ({
				client: clientId,
				from,
				to,
				icas: icas ?? null,
				merchant: merchantId,
				fees: feeIds,
				key: `${clientId}|${from}|${to}|${(icas ?? []).join(",")}|${merchantId ?? ""}|${feeIds.join(",")}|${refresh}`,
			})),
			filter(({ client, from, to }) => Boolean(client) && Boolean(from) && Boolean(to)),
			distinctUntilChanged((prev, next) => prev.key === next.key),
			switchMap(({ client, from, to, icas, merchant, fees }) => {
				this.monthlyExpenseLoading.set(true);
				this.monthlyExpenseError.set(false);
				this.filterService.beginFilterRequest();
				return this.tpeService
					.getMonthlyExpense({
						client,
						from: this.getFirstDateCode(from),
						to: this.getFirstDateCode(to),
						icas,
						merchant: merchant ?? undefined,
						fees: fees?.length ? fees : null,
					})
					.pipe(
						catchError(() => {
							this.monthlyExpenseError.set(true);
							return of(null);
						}),
						finalize(() => {
							this.monthlyExpenseLoading.set(false);
							this.filterService.endFilterRequest();
						})
					);
			}),
			catchError(() => {
				this.monthlyExpenseLoading.set(false);
				this.monthlyExpenseError.set(true);
				return of(null);
			})
		),
		{ initialValue: null }
	);

	public isLoadingMonthlyExpense = computed<boolean>(() => this.monthlyExpenseLoading());
	public hasMonthlyExpenseError = computed<boolean>(() => this.monthlyExpenseError());
	public hasMonthlyExpenseData = computed<boolean>(() => {
		const monthlyExpenseData = this.monthlyExpense();
		if (!monthlyExpenseData || monthlyExpenseData.length === 0) return false;
		return monthlyExpenseData.some(item => (item.amount ?? 0) > 0 || (item.quantity ?? 0) > 0 || (item.convertedAmount ?? 0) > 0);
	});

	public reloadMonthlyExpense(): void {
		this.monthlyExpenseRefresh.update(n => n + 1);
	}

	public monthlyExpenseChart = viewChild<EchartComponent>("monthlyExpenseChart");

	public monthlyExpenseChartConfig = computed<EChartsOption>(() => {
		const monthlyExpenseData = this.monthlyExpense();
		if (!monthlyExpenseData) return {} as EChartsOption;
		const { categories, values } = this.buildExpenseSeries(monthlyExpenseData);
		const chartData = [
			{
				name: "mastercardMonthlyExpense",
				value: values,
				color: Color.grey500, // old Color.skyBlue
			},
		];

		const config = this.chartService.getBarChartOptions(
			categories,
			chartData,
			(params: any) => "",
			(params: any): string => {
				return `
        <div style="font-family:'Lato',sans-serif; color:#0A1733;">
          <div style="font-weight:700; font-size:14px;">${this.currency()}</div>
          <div style="font-weight:400; font-size:12px;">${this.getTerm("AMOUNT")}: ${this.numberPipe.transform(params.data.value, "1.0-2")}</div>
          <div style="font-weight:400; font-size:12px;">${this.getTerm("VOLUME")}: ${this.numberPipe.transform(params.data.convertedAmount, "1.0-2")}</div>
          <div style="font-weight:400; font-size:12px;">${this.getTerm("QUANTITY")}: ${this.numberPipe.transform(params.data.quantity, "1.0-2")}</div>
        </div>
        `;
			}
		);

		const series = config.series as any[];
		series?.forEach(s => {
			s.emphasis = {
				...(s.emphasis ?? {}),
				itemStyle: {
					...(s.emphasis?.itemStyle ?? {}),
					color: Color.grey700,
				},
			};
		});

		delete (config.tooltip as any).appendTo; // ! Nota: Se elimina `appendTo:'body'` porque Library Components no destruye correctamente el componente.

		(config.series as any[])?.forEach(s => (s.cursor = "default"));
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
			extraCssText: "box-shadow: 0px 2px 4px -2px rgba(36, 38, 51, 0.05), 0px 4px 6px -2px rgba(36, 38, 51, 0.05);",
		};
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

		setTimeout(() => this.monthlyExpenseChart()?.refreshChart(), 200);

		return config as EChartsOption;
	});

	public expenseChartContainerStyle = { width: "100%", height: "306px" };
	public expenseChartViewportStyle = { width: "100%", heigth: "306px", overflowX: "hidden" };

	private buildExpenseSeries(monthlyExpenseData: MonthlyExpenseResponse[]): {
		categories: string[];
		values: { value: number; quantity: number; convertedAmount: number }[];
	} {
		const { from, to } = this.filterService.filter();
		const range = this.resolveExpenseRange(from, to, monthlyExpenseData);
		if (!range) {
			return {
				categories: monthlyExpenseData.map(x => this.formatMonthName(x.yearMonth)),
				values: monthlyExpenseData.map(m => ({
					value: m.amount,
					quantity: m.quantity,
					convertedAmount: m.convertedAmount,
				})),
			};
		}

		const map = new Map<number, MonthlyExpenseResponse>();
		for (const item of monthlyExpenseData) {
			map.set(item.yearMonth, item);
		}

		const months = this.expandMonths(range.start, range.end);
		const categories = months.map(m => this.formatMonthName(Number(m.format("YYYYMM"))));
		const values = months.map(m => {
			const key = Number(m.format("YYYYMM"));
			const item = map.get(key);
			return {
				value: item?.amount ?? 0,
				quantity: item?.quantity ?? 0,
				convertedAmount: item?.convertedAmount ?? 0,
			};
		});

		return { categories, values };
	}

	private resolveExpenseRange(from: string, to: string, data: MonthlyExpenseResponse[]): { start: moment.Moment; end: moment.Moment } | null {
		let start = from ? moment(from, "YYYY-MM-DD", true).startOf("month") : null;
		let end = to ? moment(to, "YYYY-MM-DD", true).startOf("month") : null;

		if (!start?.isValid() || !end?.isValid()) {
			const months = data.map(item => item.yearMonth).sort((a, b) => a - b);
			if (months.length === 0) return null;
			start = moment(months[0].toString().padStart(6, "0"), "YYYYMM").startOf("month");
			end = moment(months[months.length - 1].toString().padStart(6, "0"), "YYYYMM").startOf("month");
		}

		if (start.isAfter(end)) {
			const swap = start;
			start = end;
			end = swap;
		}

		const totalMonths = end.diff(start, "months") + 1;
		if (totalMonths > this.MAX_EXPENSE_MONTHS) {
			start = end.clone().subtract(this.MAX_EXPENSE_MONTHS - 1, "months");
		} else if (totalMonths < this.MIN_EXPENSE_MONTHS) {
			start = end.clone().subtract(this.MIN_EXPENSE_MONTHS - 1, "months");
		}

		return { start, end };
	}

	private expandMonths(start: moment.Moment, end: moment.Moment): moment.Moment[] {
		const months: moment.Moment[] = [];
		const cursor = start.clone();
		while (cursor.isSameOrBefore(end, "month")) {
			months.push(cursor.clone());
			cursor.add(1, "month");
		}
		return months;
	}
	private getFirstDateCode(value: string) {
		return [...value.split("-", 2), "01"].join("-");
	}

	public formatMonthName(monthId: number): string {
		const lang = this.globalTermService.languageCode;
		const dateStr = monthId.toString().padStart(6, "0");
		const year = dateStr.substring(0, 4);
		const month = dateStr.substring(4, 6);

		const isoDate = `${year}-${month}-01`;

		const capitalize = (str: string): string => {
			return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
		};

		return capitalize(moment(isoDate).locale(lang).format("MMM YY")).replace(".", "");
	}

	public ratingChartComponent = viewChild<EchartComponent>("ratingChart");
	private getRatingCompliancePercent(score: number): number {
		const normalizedScore = Math.max(0, Math.min(1, score));
		return (1 - normalizedScore) * this.RATING_SCALE_TOTAL;
	}

	private formatRatingPercentLabel(percentValue: number): string {
		const normalized = Math.max(0, Math.min(this.RATING_SCALE_TOTAL, percentValue));
		return `${this.numberPipe.transform(normalized, "1.0-2") ?? 0}%`;
	}

	public ratingChartConfig = computed<EChartsOption>(() => {
		const ratingResponse = this.rating();
		if (!ratingResponse) return {} as EChartsOption;
		const compliancePercent = this.getRatingCompliancePercent(ratingResponse.value);
		const percentLabel = this.formatRatingPercentLabel(compliancePercent);
		let config = this.chartService.getRateSemiDoughnutOptions(ratingResponse.letter, compliancePercent, 50, ratingResponse.color, this.RATING_SCALE_TOTAL);
		const series = (config as any).series as any[] | undefined;
		const lineWidth = series?.[0]?.axisLine?.lineStyle?.width;
		if (series?.[0]?.detail) {
			series[0].detail.offsetCenter = [0, "-20%"];
			if (series[0].detail.rich?.letter) series[0].detail.rich.letter.color = this.chartTextStyle.default.color;
			if (series[0].detail.rich?.bottom) series[0].detail.rich.bottom.color = this.chartTextStyle.default.color;
		}
		if (series?.[0]?.data?.[0]?.title) series[0].data[0].title.color = this.chartTextStyle.default.color;
		if (series?.[0]?.data?.[1]?.title) series[0].data[1].title.color = this.chartTextStyle.default.color;
		if (series?.[1]?.pointer && typeof lineWidth === "number") {
			series[1].pointer.width = lineWidth + 4;
			series[1].pointer.length = "188%";
			series[1].z = 20;
			series[1].zlevel = 2;
			series[1].pointer.itemStyle = {
				...(series[1].pointer.itemStyle ?? {}),
				borderColor: "#D9D9E3",
				borderWidth: 2,
			};
		}
		(config as any).graphic = [
			{
				type: "text",
				left: "center",
				top: "56%",
				silent: true,
				style: {
					text: percentLabel,
					fontFamily: "Lato, sans-serif",
					fontSize: 16,
					fontWeight: 500,
					fill: this.chartTextStyle.default.color,
					textAlign: "center",
				},
			},
		];
		setTimeout(() => {
			this.ratingChartComponent()?.refreshChart();
		}, 200);
		return config;
	});

	public isVisibleGetSupport = false;
	public subjectText: string = "";
	public bodyText: string = "";
	showDialogGetSupport() {
		if (this.configService.SessionInformation!.businessuserTypeName === BUSINESS_USER_TYPE.INTELICA) {
			this.alertService.warning("", this.getTerm("SEND_SUPPORT_MAIL_NOT_ALLOWED")).then(_ => {});
			return;
		}
		this.isVisibleGetSupport = true;
		this.clearGetSupportInputs();
	}
	closeDialogGetSupport() {
		this.isVisibleGetSupport = false;
		this.clearGetSupportInputs();
	}
	private clearGetSupportInputs(): void {
		this.subjectText = this.defaultSubject();
		this.bodyText = this.defaultBody();
	}
	sendMailGetSupport() {
		this.isSendingSupport.set(true);
		this.isVisibleGetSupport = false;
		this.tpeService
			.sendMail({ subject: this.subjectText, body: this.bodyText, blindCopy: [] })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: success => {
					this.clearGetSupportInputs();
					this.showResultGetSupportModal(success);
					this.isSendingSupport.set(false);
				},
				error: () => {
					this.showResultGetSupportModal(false);
					this.isSendingSupport.set(false);
				},
			});
	}
	private showResultGetSupportModal(success: boolean) {
		if (success) {
			this.alertService
				.show({
					title: this.getTerm("TpeSupportSendSuccessSummary"),
					subtitle: this.getTerm("TpeSupportSendSuccessDetail"),
					customIcon: "icon icon-sent",
				} as Parameters<AlertService["show"]>[0])
				.then(_ => {});
		} else {
			this.alertService.error(this.getTerm("TpeSupportSendErrorSummary"), this.getTerm("TpeSupportSendErrorDetail")).then(_ => {});
		}
	}

	private getTerm(key: string): string {
		return this.termPipe.transform(key, this.globalTermService.languageCode);
	}

	// --- text ellipsis ---

	isTextOverflow = false;
	checkTextOverflow(element: HTMLElement | null): void {
		if (!element) return;
		this.isTextOverflow = element.scrollHeight > element.clientHeight;
	}
}
