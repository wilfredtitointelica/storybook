import { Component, computed, inject, input, signal } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { GlobalTermService } from "intelica-library-base";
import { FeeDetailInfoResponse, FeeSummaryResponse } from "../dto/fee-detail.dto";
import { FEE_DETAIL_TERM } from "../common/constants";
import { FeeDetailCommonService } from "../common/fee-detail.common.service";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { PanelModule } from "primeng/panel";
import { Skeleton } from "primeng/skeleton";
import { CommonGlobalService } from "../../common/services/common.service";

const DESCRIPTION_TRUNCATE_LENGTH = 390;
const DESCRIPTION_MAX_LENGTH = 980;

@Component({
	selector: "fee-overview-summary-section",
	standalone: true,
	imports: [CardModule, ButtonModule, PanelModule, Skeleton, DecimalPipe],
	templateUrl: "./overview-summary-section.html",
})
export class OverviewSummarySectionComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	private readonly common = inject(FeeDetailCommonService);

	public overviewData = input<FeeDetailInfoResponse | null>(null);
	public feeSummary = input<FeeSummaryResponse | null>(null);
	public isLoading = input<boolean>(false);

	public currency = computed(() => this.feeSummary()?.rateUnit ?? this.feeSummary()?.currency ?? "");
	public isVolume = computed<boolean>(() => this.currency() === "%");
	public currentRate = computed<number | null>(() => {
		const raw = this.feeSummary()?.currentRate;
		if (raw === null || raw === undefined || raw === "") return null;
		const num = Number(raw);
		if (!Number.isFinite(num)) return null;
		const isVolume = this.feeSummary()?.rateUnit === "%";
		return isVolume ? num * 100 : num;
	});
	public hasCurrentRate = computed<boolean>(() => this.currentRate() !== null);
	public billingFrequency = computed<string | null>(() => this.feeSummary()?.billingFrequency ?? null);
	public rateStructure = computed<string | null>(() => this.feeSummary()?.rateStructure ?? null);
	public currentRateLabelKey = computed<string>(() => (this.common.isEffectiveRate(this.feeSummary()?.rateStructureCode ?? null) ? this.feeDetailTerm.EFFECTIVE_RATE : this.feeDetailTerm.CURRENT_RATE));

	public fullDescription = computed(() => (this.overviewData()?.description ?? "").substring(0, DESCRIPTION_MAX_LENGTH));
	public truncatedDescription = computed(() => this.fullDescription().substring(0, DESCRIPTION_TRUNCATE_LENGTH) + "...");
	public showViewMore = computed(() => this.fullDescription().length > DESCRIPTION_TRUNCATE_LENGTH);

	public isExpanded = signal(false);

	public toggleExpand(): void {
		this.isExpanded.update(v => !v);
	}
}
