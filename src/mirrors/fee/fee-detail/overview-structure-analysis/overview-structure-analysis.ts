import { Component, computed, inject, input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { GlobalTermService } from "intelica-library-base";
import { CardModule } from "primeng/card";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { MessageModule } from "primeng/message";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { BadgeModule } from "primeng/badge";
import { Skeleton } from "primeng/skeleton";
import { OverviewSimulateComponent } from "../overview-simulate/overview-simulate";
import { FeeDetailInfoResponse, FeeRateVersionsResponse, FeeSummaryResponse, RateTierItem, RateVersionItem } from "../dto/fee-detail.dto";
import { FeeDetailCommonService } from "../common/fee-detail.common.service";
import { FEE_DETAIL_TERM, RATE_EVENTS_DESCRIPTION_TERM, RATE_FINAL_AMOUNT_DESCRIPTION_TERM } from "../common/constants";
import { CommonGlobalService } from "../../common/services/common.service";

interface DisplayTier {
	tierDisplay: string;
	min: number | null;
	max: number | null;
	rate: number;
	isActive: boolean;
	minLabel: string | null;
	description: string | null;
}

interface DisplayVersion extends RateVersionItem {
	effectiveDate: string;
}

@Component({
	selector: "fee-overview-structure-analysis",
	standalone: true,
	imports: [FormsModule, CommonModule, CardModule, SelectModule, TableModule, MessageModule, ButtonModule, InputTextModule, BadgeModule, Skeleton, OverviewSimulateComponent],
	templateUrl: "./overview-structure-analysis.html",
})
export class OverviewStructureAnalysisComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	private readonly common = inject(FeeDetailCommonService);

	public rateVersions = input<FeeRateVersionsResponse | null>(null);
	public feeSummary = input<FeeSummaryResponse | null>(null);
	public overviewData = input<FeeDetailInfoResponse | null>(null);
	public isLoading = input<boolean>(false);

	public events = signal<string>("");

	public selectedVersionId = signal<string | null>(null);

	public versions = computed<DisplayVersion[]>(() =>
		(this.rateVersions()?.versions ?? []).map(v => ({
			...v,
			effectiveDate: this.common.formatEffectivePeriod(v.begin, v.end, v.version),
		}))
	);
	public hasMultipleVersions = computed(() => this.versions().length > 1);

	public selectedVersion = computed<DisplayVersion | null>(() => {
		const list = this.versions();
		if (list.length === 0) return null;
		const id = this.selectedVersionId();
		const found = id ? list.find(v => v.version === id) : null;
		return found ?? list[0];
	});

	public rateStructureLabel = computed(() => this.selectedVersion()?.rateStructure ?? this.rateVersions()?.rateStructure ?? this.feeSummary()?.rateStructure ?? "");
	public rateStructureCode = computed<number | null>(() => this.selectedVersion()?.rateStructureCode ?? this.rateVersions()?.rateStructureCode ?? this.feeSummary()?.rateStructureCode ?? null);
	public currency = computed(() => this.selectedVersion()?.currency ?? this.rateVersions()?.currency ?? this.feeSummary()?.currency ?? "");
	public rateUnit = computed(() => this.selectedVersion()?.rateUnit ?? this.rateVersions()?.rateUnit ?? this.feeSummary()?.rateUnit ?? this.currency());

	public showTable = computed<boolean>(() => !this.common.isStructureHidden(this.rateStructureCode()));

	public isDependent = computed<boolean>(() => this.selectedVersion()?.isDependent ?? false);
	public isMultipleRate = computed<boolean>(() => this.selectedVersion()?.isMultipleRate ?? false);
	public isAssociated = computed<boolean>(() => (this.rateVersions()?.additionalDetails?.associatedFees?.length ?? 0) > 0);

	public effectivePeriodText = computed(() => this.selectedVersion()?.effectiveDate ?? "");

	public eventsDescriptionKey = computed<string>(() => {
		const code = this.rateStructureCode();
		return (code !== null && RATE_EVENTS_DESCRIPTION_TERM[code]) || this.feeDetailTerm.EVENTS_DESCRIPTION;
	});

	public finalAmountDescriptionKey = computed<string>(() => {
		const code = this.rateStructureCode();
		return (code !== null && RATE_FINAL_AMOUNT_DESCRIPTION_TERM[code]) || this.feeDetailTerm.ACCUMULATED_AMOUNT_DESCRIPTION;
	});

	private eventsAsNumber = computed<number>(() => {
		const num = this.common.parseFormattedNumber(this.events());
		return num !== null && Number.isFinite(num) ? num : 0;
	});

	private matchedTierIndices = computed<Set<number>>(() => this.common.findMatchedTierIndices(this.eventsAsNumber(), this.selectedVersion()?.tiers ?? [], this.rateStructureCode()));

	public isVolume = computed<boolean>(() => this.rateUnit() === "%");

	private canHighlightActiveTier = computed<boolean>(() => (this.selectedVersion()?.tiers?.length ?? 0) > 1 && !this.isMultipleRate());

	public displayTiers = computed<DisplayTier[]>(() => {
		const tiers = this.selectedVersion()?.tiers ?? [];
		const activeSet = this.matchedTierIndices();
		const volumeMultiplier = this.isVolume() ? 100 : 1;
		const allowActive = this.canHighlightActiveTier();
		return tiers.map((t, idx) => this.toDisplayTier(t, allowActive && activeSet.has(idx), volumeMultiplier));
	});

	public showDescriptionColumn = computed<boolean>(() => {
		const tiers = this.displayTiers();
		return tiers.length > 0 && tiers.every(t => this.isEmptyRange(t));
	});

	public onVersionChange(version: DisplayVersion | null): void {
		this.selectedVersionId.set(version?.version ?? null);
	}

	public getStatusTerm(status: string): string {
		const map: Record<string, string> = {
			Active: this.feeDetailTerm.ACTIVE,
			Historical: this.feeDetailTerm.STATUS_HISTORICAL,
			"Coming Soon": this.feeDetailTerm.STATUS_COMING_SOON,
		};
		const termKey = map[status];
		return termKey ? this.commonGlobalService.termText(termKey) : status;
	}

	public getVersionLabel(version: string): string {
		const map: Record<string, string> = {
			Current: this.feeDetailTerm.CURRENT_RATE_VERSION,
			Previous: this.feeDetailTerm.PREVIOUS_RATE_VERSION,
			Future: this.feeDetailTerm.FUTURE_RATE_VERSION,
		};
		const termKey = map[version];
		return termKey ? this.commonGlobalService.termText(termKey) : version;
	}

	private toDisplayTier(t: RateTierItem, isActive: boolean, volumeMultiplier: number): DisplayTier {
		const rate = Number(t.rate);
		const activeSuffix = ` · ${this.commonGlobalService.termText(this.feeDetailTerm.ACTIVE)}`;
		return {
			tierDisplay: isActive ? `${t.tier}${activeSuffix}` : String(t.tier),
			min: t.minimum,
			max: t.maximum,
			rate: Number.isFinite(rate) ? rate * volumeMultiplier : 0,
			isActive,
			minLabel: t.minimum === null ? "No minimum" : null,
			description: t.description,
		};
	}

	private isEmptyRange(t: DisplayTier): boolean {
		return (t.min === null || t.min === 0) && (t.max === null || t.max === 0);
	}
}
