import { Component, computed, inject, input, signal } from "@angular/core";
import { GaTrackDirective } from "../../shared/analitycs";
import { Panel } from "primeng/panel";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { GraphLine } from "./graph-line/graph-line";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { RouterLink } from "@angular/router";
import { StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { NetFeesBySchemeResponse } from "../../dto/landing-responses.dto";
@Component({
	selector: "fee-net-fees",
	imports: [GaTrackDirective, Panel, Button, GraphLine, Skeleton, RouterLink, TermPipe, StatusStateComponent],
	templateUrl: "./net-fees.html",
})
export class NetFees {
	public readonly globalTermService = inject(GlobalTermService);
	readonly dataNetFeesByScheme = input<NetFeesBySchemeResponse>();
	readonly isloadingNetFeesByScheme = input<boolean>();

	private _refresh = signal<number>(0);
	private _hasError = signal<boolean>(false);

	public hasError = computed(() => this._hasError());

	public currencyCode = computed<string>(() => this.dataNetFeesByScheme()?.currencyCode ?? "-");
	public startDate = computed<string>(() => this.dataNetFeesByScheme()?.startDateLabel ?? "-");
	public endDate = computed<string>(() => this.dataNetFeesByScheme()?.endDateLabel ?? "-");
	public graphTable = computed(() => this.dataNetFeesByScheme()?.table ?? []);

	public hasGraphTableData = computed<boolean>(() => this.graphTable().length > 0);

	public statusStateEnum = StatusStateEnum;

	ngOnInit() {}

	reload() {
		this._refresh.update(n => n + 1);
	}
}
