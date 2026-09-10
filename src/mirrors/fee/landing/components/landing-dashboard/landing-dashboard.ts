import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FeeExpense } from "../fee-expense/fee-expense";
import { NetFees } from "../net-fees/net-fees";
import { PerfomanceScore } from "../perfomance-score/perfomance-score";
import { Opportunities } from "../opportunities/opportunities";
import { Announcements } from "../announcements/announcements";
import { UnitCost } from "../unit-cost/unit-cost";
import { OptimizeCta } from "../optimize-cta/optimize-cta";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { LandingService } from "../../landing.service";

@Component({
	selector: "fee-landing-dashboard",
	imports: [CommonModule, FeeExpense, NetFees, PerfomanceScore, Opportunities, Announcements, UnitCost, OptimizeCta, TermPipe],
	templateUrl: "./landing-dashboard.html",
	host: {
		class: "incontrol-panel",
	},
})
export class LandingDashboard {
	private readonly landingService = inject(LandingService);
	public readonly globalTermService = inject(GlobalTermService);
	private _isloadingFeeExpenses = signal<boolean>(false);
	private _refresh = signal<number>(0);
	private _hasError = signal<boolean>(false);
	private refresh = computed(() => this._refresh());
	public hasError = computed(() => this._hasError());
	public isloadingFeeExpenses = computed(() => this._isloadingFeeExpenses());
	public dataFeeExpenses = this.landingService.buildLandingSignal(() => this.landingService.getFeeExpenses(), this._isloadingFeeExpenses, this.refresh, this._hasError);
}
