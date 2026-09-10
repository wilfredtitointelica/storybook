import { Component, computed, inject, input } from "@angular/core";
import { GlobalTermService } from "intelica-library-base";
import { OverviewSummarySectionComponent } from "../overview-summary-section/overview-summary-section";
import { OverviewStructureAnalysisComponent } from "../overview-structure-analysis/overview-structure-analysis";
import { OverviewAdditionalDetailComponent } from "../overview-additional-detail/overview-additional-detail";
import { FeeDetailInfoResponse, FeeRateVersionsResponse, FeeSummaryResponse } from "../dto/fee-detail.dto";
import { FeeDetailCommonService } from "../common/fee-detail.common.service";

@Component({
	selector: "fee-overview",
	standalone: true,
	imports: [OverviewSummarySectionComponent, OverviewStructureAnalysisComponent, OverviewAdditionalDetailComponent],
	templateUrl: "./overview.html",
})
export class OverviewComponent {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly common = inject(FeeDetailCommonService);

	public loading = input<boolean>(false);
	public overviewData = input<FeeDetailInfoResponse | null>(null);
	public feeSummary = input<FeeSummaryResponse | null>(null);
	public rateVersions = input<FeeRateVersionsResponse | null>(null);

	public hasRateStructure = computed<boolean>(() => {
		if (this.loading()) return true;
		const code = this.rateVersions()?.rateStructureCode;
		if (code == null) return false;
		return !this.common.isStructureHidden(code);
	});

	public hasAdditionalDetails = computed<boolean>(() => {
		if (this.loading()) return true;
		const ad = this.rateVersions()?.additionalDetails;
		if (!ad) return false;
		return ad.scope.length > 0 || ad.transactions.length > 0 || ad.products.length > 0 || ad.associatedFees.length > 0;
	});
}
