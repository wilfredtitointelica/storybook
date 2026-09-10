import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Panel } from "primeng/panel";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { AlertGroupDetailResponse } from "../../dto/alerts-responses.dto";
import { ALERTS_BREADCRUMB } from "../../common/constants";
import { CommonGlobalService } from "../../../common/services/common.service";

@Component({
	selector: "alerts-detail-custom",
	templateUrl: "./custom.component.html",
	imports: [CommonModule, TermPipe, Panel, Button, Skeleton],
})
export class AlertsDetailCustomComponent {
	public globalTermService = inject(GlobalTermService);
	private readonly commonGlobalService = inject(CommonGlobalService);

	data = input<AlertGroupDetailResponse | null>(null);
	loading = input<boolean>(false);

	// Rule variants per DRF-031/032/033
	isExpectedAmount = computed(() => this.data()?.configurationType === 1);
	isVariation = computed(() => this.data()?.configurationType === 2);
	isVariationPercentage = computed(() => this.isVariation() && this.data()?.thresholdUnit === 2);

	headerTermKey = computed(() => (this.isExpectedAmount() ? "LBL_EXPECTED_AMOUNT_ALERT" : "LBL_VARIATION_THRESHOLD_ALERT"));

	currencyCode = computed<string>(() => this.data()?.fees?.[0]?.currencyCode ?? this.data()?.totalAmountsByBrand?.[0]?.currencyCode ?? "");
	billingDate = computed<string>(() => this.formatLongDate(this.data()?.fees?.[0]?.billingDate, this.globalTermService.languageCode));

	formattedThreshold = computed(() => {
		const d = this.data();
		if (d?.thresholdValue == null) return "";
		const value = Number(d.thresholdValue).toLocaleString("en-US", { minimumFractionDigits: 2 });
		return this.isVariationPercentage() ? `${value}%` : value;
	});

	formattedActualValue = computed(() => {
		const d = this.data();
		if (d?.actualValue == null) return "";
		return Number(d.actualValue).toLocaleString("en-US", { minimumFractionDigits: 2 });
	});

	formattedDeviation = computed(() => {
		const d = this.data();
		if (d?.deviationValue == null) return "";
		const value = Number(d.deviationValue).toLocaleString("en-US", { minimumFractionDigits: 2 });
		return this.isVariationPercentage() ? `${value}%` : value;
	});

	feeBrand = computed(() => (this.data()?.fees?.[0]?.brandName ?? "").toLowerCase());

	formatLongDate(isoDate: string | undefined | null, languageCode: string): string {
		if (!isoDate) return "";
		const date = this.toLocalDateTime(isoDate);
		const isSpanish = languageCode?.toLowerCase() === "es";
		const month = new Intl.DateTimeFormat(isSpanish ? "es-ES" : "en-US", { month: "short" }).format(date).replace(/\.$/, "");
		const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
		const day = String(date.getDate()).padStart(2, "0");
		return `${day} ${monthCap}, ${date.getFullYear()}`;
	}

	onViewDetails() {
		const feeId = this.data()?.feeId;
		const bankId = this.data()?.bankId;
		if (feeId == null || bankId == null) return;
		const date = this.data()?.fees?.[0]?.billingDate?.split("T")[0];
		this.commonGlobalService.navigateToFeeDetail({
			feeId,
			bankId,
			origin: ALERTS_BREADCRUMB,
			dateRange: date ? { startDate: date, endDate: date } : undefined,
		});
	}
	toLocalDateTime(value: string): Date {
		const cleanValue = value.replace('Z', '');
	  
		const [datePart, timePart = '00:00:00'] = cleanValue.split('T');
	  
		const [year, month, day] = datePart.split('-').map(Number);
		const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);
	  
		return new Date(year, month - 1, day, hour, minute, second);
	  }
}
