import { Component, computed, inject, input } from "@angular/core";
import { GlobalTermService } from "intelica-library-base";
import { FeeAdditionalDetailsResponse } from "../dto/fee-detail.dto";
import { FEE_DETAIL_TERM } from "../common/constants";
import { CardModule } from "primeng/card";
import { BadgeModule } from "primeng/badge";
import { Skeleton } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { CommonGlobalService } from "../../common/services/common.service";

const CHIPS_SCROLL_THRESHOLD = 27;

@Component({
	selector: "fee-overview-additional-detail",
	standalone: true,
	imports: [CardModule, BadgeModule, Skeleton, TooltipModule],
	templateUrl: "./overview-additional-detail.html",
})
export class OverviewAdditionalDetailComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;

	public getGroupTerm(code: string): string {
		const map: Record<string, string> = {
			PURCHASE: this.feeDetailTerm.PURCHASE,
			CASH: this.feeDetailTerm.CASH,
			CR: this.feeDetailTerm.CREDIT,
			DB: this.feeDetailTerm.DEBIT,
			PP: this.feeDetailTerm.PREPAID,
			ALL: this.feeDetailTerm.ALL_PRODUCTS,
		};
		const termKey = map[code];
		return termKey ? this.commonGlobalService.termText(termKey) : code;
	}

	public additionalDetails = input<FeeAdditionalDetailsResponse | null>(null);
	public isLoading = input<boolean>(false);

	public scope = computed<string[]>(() => this.additionalDetails()?.scope ?? []);
	public transactionGroups = computed(() => this.additionalDetails()?.transactions ?? []);
	public productGroups = computed(() => this.additionalDetails()?.products ?? []);
	public gridProductGroups = computed(() => this.productGroups().filter(g => g.code !== "PP"));
	public prepaidGroup = computed(() => this.productGroups().find(g => g.code === "PP") ?? null);
	public associatedFees = computed(() => this.additionalDetails()?.associatedFees ?? []);

	public hasContent = computed<boolean>(() => this.scope().length > 0 || this.transactionGroups().length > 0 || this.productGroups().length > 0 || this.associatedFees().length > 0);

	public totalChips = computed<number>(() => {
		const sumGroupItems = (groups: { items: string[] }[]) => groups.reduce((acc, g) => acc + g.items.length, 0);
		return this.scope().length + sumGroupItems(this.transactionGroups()) + sumGroupItems(this.productGroups()) + this.associatedFees().length;
	});

	public hasOverflow = computed<boolean>(() => this.totalChips() > CHIPS_SCROLL_THRESHOLD);
}
