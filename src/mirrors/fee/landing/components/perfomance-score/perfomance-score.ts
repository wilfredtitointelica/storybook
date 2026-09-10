import { Component, computed, inject, input, signal } from "@angular/core";
import { Panel } from "primeng/panel";
import { Tooltip } from "primeng/tooltip";
import { Skeleton } from "primeng/skeleton";
import { GraphGauge } from "./graph-gauge/graph-gauge";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { LandingService } from "../../landing.service";
import { FormatValuePipe } from "../../../common/pipe/format-value.pipe";
import { StatusStateComponent, StatusStateEnum } from "intelica-library-project";
@Component({
	selector: "fee-perfomance-score",
	imports: [Panel, Tooltip, Skeleton, GraphGauge, FormatValuePipe, TermPipe, StatusStateComponent],
	templateUrl: "./perfomance-score.html",
})
export class PerfomanceScore {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly landingService = inject(LandingService);

	private _isloadingPerformanceScore = signal<boolean>(false);
	private _refresh = signal<number>(0);
	private _hasError = signal<boolean>(false);

	public isloadingPerformanceScore = computed(() => this._isloadingPerformanceScore());
	private refresh = computed(() => this._refresh());
	public hasError = computed(() => this._hasError());

	public dataPerformanceScore = this.landingService.buildLandingSignal(() => this.landingService.getPerformanceScore(), this._isloadingPerformanceScore, this.refresh, this._hasError);

	public currencyCode = computed<string>(() => this.dataPerformanceScore()?.currencyCode ?? "-");

	public total = computed<number>(() => this.dataPerformanceScore()?.amount ?? 0);
	public score = computed<number>(() => this.dataPerformanceScore()?.score ?? 0);
	public hasData = computed(() => (this.dataPerformanceScore()?.score ?? 0) > 0);

	public statusStateEnum = StatusStateEnum;

	ngOnInit() {}

	reload() {
		this._refresh.update(n => n + 1);
	}
}
