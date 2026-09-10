import { Component, computed, inject, input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Panel } from "primeng/panel";
import { Message } from "primeng/message";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { AlertType } from "../../alerts-filter/dto/alerts-filter.dto";
import { AlertGroupDetailResponse } from "../../dto/alerts-responses.dto";
import { ALERTS_BREADCRUMB } from "../../common/constants";
import { CommonGlobalService } from "../../../common/services/common.service";

@Component({
	selector: "alerts-detail-penalties",
	templateUrl: "./penalties.component.html",
	imports: [CommonModule, TermPipe, Panel, Message, Button, Skeleton],
})
export class AlertsDetailPenaltiesComponent {
	public globalTermService = inject(GlobalTermService);
	private readonly commonGlobalService = inject(CommonGlobalService);

	context = input<AlertType>();
	data = input<AlertGroupDetailResponse | null>(null);
	loading = input<boolean>(false);

	showAllPenalties = signal(false);
	private readonly initialCount = 3;

	visibleFees = computed(() => {
		const fees = this.data()?.fees ?? [];
		return this.showAllPenalties() ? fees : fees.slice(0, this.initialCount);
	});

	remainingCount = computed(() => {
		const total = this.data()?.fees?.length ?? 0;
		return Math.max(0, total - this.initialCount);
	});

	isMastercard(brandName: string): boolean {
		return brandName.toLowerCase() === "mastercard";
	}

	toggleShowAll() {
		this.showAllPenalties.update((v) => !v);
	}

	onViewDetails(feeId: number, bankId: number, billingDate: string) {
		if (feeId == null || bankId == null) return;
		const date = billingDate?.split("T")[0];
		this.commonGlobalService.navigateToFeeDetail({
			feeId,
			bankId,
			origin: ALERTS_BREADCRUMB,
			dateRange: date ? { startDate: date, endDate: date } : undefined,
		});
	}

	formatLongDate(isoDate: string | undefined, languageCode: string): string {
		if (!isoDate) return "";
		const date = this.toLocalDateTime(isoDate);
		const isSpanish = languageCode?.toLowerCase() === "es";
		const month = new Intl.DateTimeFormat(isSpanish ? "es-ES" : "en-US", { month: "short" }).format(date).replace(/\.$/, "");
		const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
		const day = String(date.getDate()).padStart(2, "0");
		return `${day} ${monthCap}, ${date.getFullYear()}`;
	}
	toLocalDateTime(value: string): Date {
		const cleanValue = value.replace('Z', '');
	  
		const [datePart, timePart = '00:00:00'] = cleanValue.split('T');
	  
		const [year, month, day] = datePart.split('-').map(Number);
		const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);
	  
		return new Date(year, month - 1, day, hour, minute, second);
	  }

	// formatBillingPeriod(minIso: string | undefined, maxIso: string | undefined, languageCode: string): string {
	// 	if (!minIso) return "";
	// 	if (!maxIso || minIso === maxIso) return this.formatLongDate(minIso, languageCode);
	// 	return `${this.formatLongDate(minIso, languageCode)} - ${this.formatLongDate(maxIso, languageCode)}`;
	// }
}
