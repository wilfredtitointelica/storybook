import { Component, computed, inject, input } from "@angular/core";
import { GlobalTermService } from "intelica-library-base";
import { CardModule } from "primeng/card";
import { Skeleton } from "primeng/skeleton";
import { FEE_UPDATES_CONSTANTS, FEE_UPDATES_TERM } from "../common/constants";
import { FeeUpdatesSummaryResponse } from "../dto/fee-updates-responses.dto";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-updates-summary-cards",
	standalone: true,
	imports: [CardModule, Skeleton],
	templateUrl: "./summary-cards.html",
})
export class SummaryCardsComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeUpdatesTerm = FEE_UPDATES_TERM;
	public readonly emptyPlaceholder = FEE_UPDATES_CONSTANTS.EMPTY_VALUE_PLACEHOLDER;

	public loading = input<boolean>(false);
	public summary = input<FeeUpdatesSummaryResponse | null>(null);

	public newFeesDisplay = computed<string>(() => this.formatCount(this.summary()?.newFeesCount));
	public tariffChangesDisplay = computed<string>(() => this.formatCount(this.summary()?.tariffChangesCount));
	public ceasedFeesDisplay = computed<string>(() => this.formatCount(this.summary()?.ceasedFeesCount));

	private formatCount(value: number | undefined | null): string {
		if (value === null || value === undefined || value === 0) return this.emptyPlaceholder;
		return value.toLocaleString();
	}
}
