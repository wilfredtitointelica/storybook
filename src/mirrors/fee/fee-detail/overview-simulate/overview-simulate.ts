import { Component, computed, effect, inject, input, model } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { GlobalTermService } from "intelica-library-base";
import { FormatAmountPipe } from "intelica-library-project";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
import { RateVersionItem } from "../dto/fee-detail.dto";
import { SimulatorError } from "../common/enums";
import { FeeDetailCommonService } from "../common/fee-detail.common.service";
import { FEE_DETAIL_TERM } from "../common/constants";
import { CommonGlobalService } from "../../common/services/common.service";

const EVENTS_MAX_LENGTH = 22;

@Component({
	selector: "fee-overview-simulate",
	standalone: true,
	imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule, Skeleton, DecimalPipe, FormatAmountPipe],
	templateUrl: "./overview-simulate.html",
})
export class OverviewSimulateComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	private readonly common = inject(FeeDetailCommonService);

	public events = model<string>("");

	public selectedVersion = input<RateVersionItem | null>(null);
	public rateStructureCode = input<number | null>(null);
	public currency = input<string>("");
	public rateUnit = input<string>("");
	public isDependent = input<boolean>(false);
	public isMultipleRate = input<boolean>(false);
	public isAssociated = input<boolean>(false);
	public isLoading = input<boolean>(false);

	public readonly maxLength = EVENTS_MAX_LENGTH;

	private errorCode = computed<SimulatorError | null>(() => this.common.validateNumericInput(this.events()));

	public isSimulatorEnabled = computed<boolean>(() => {
		if (this.isDependent() || this.isMultipleRate()) return false;
		return !this.common.isStructureHidden(this.rateStructureCode());
	});

	private eventsAsNumber = computed<number>(() => {
		const num = this.common.parseFormattedNumber(this.events());
		return num !== null && Number.isFinite(num) ? num : 0;
	});

	public hasResult = computed<boolean>(() => {
		if (!this.isSimulatorEnabled()) return false;
		if (this.errorCode() !== null) return false;
		const value = this.events().trim();
		if (value === "") return false;
		return this.eventsAsNumber() > 0;
	});

	public isRateApply = computed<boolean>(() => !this.common.isEffectiveRate(this.rateStructureCode()));

	public isVolume = computed<boolean>(() => this.rateUnit() === "%");

	public minAmount = computed<number | null>(() => {
		const v = this.selectedVersion()?.minAmount ?? null;
		return v !== null && v > 0 ? v : null;
	});
	public maxAmount = computed<number | null>(() => {
		const v = this.selectedVersion()?.maxAmount ?? null;
		return v !== null && v > 0 ? v : null;
	});

	public finalAmount = computed<number | null>(() => {
		if (!this.hasResult()) return null;
		const v = this.selectedVersion();
		return this.common.calculateFeeAmount(this.eventsAsNumber(), v?.tiers ?? [], this.rateStructureCode(), v?.minAmount ?? null, v?.maxAmount ?? null);
	});

	public outputRate = computed<number | null>(() => {
		if (!this.hasResult()) return null;
		const volumeMultiplier = this.isVolume() ? 100 : 1;
		if (this.isRateApply()) {
			const r = this.common.getTierRateForEvents(this.eventsAsNumber(), this.selectedVersion()?.tiers ?? [], this.rateStructureCode());
			return r === null ? null : r * volumeMultiplier;
		}
		const total = this.finalAmount();
		const events = this.eventsAsNumber();
		if (total === null || events <= 0) return null;
		return (total / events) * volumeMultiplier;
	});

	public tierUsedLabel = computed<string>(() => {
		if (!this.hasResult()) return "";
		return this.common.getTierUsedLabel(this.eventsAsNumber(), this.selectedVersion()?.tiers ?? [], this.rateStructureCode());
	});

	public errorMessage = computed<{ title: string; body: string } | null>(() => {
		const code = this.errorCode();
		if (code === null) return null;
		if (code === SimulatorError.InvalidFormat) {
			return {
				title: this.commonGlobalService.termText(this.feeDetailTerm.INVALID_INPUT_FORMAT_TITLE),
				body: this.commonGlobalService.termText(this.feeDetailTerm.INVALID_INPUT_FORMAT_BODY),
			};
		}
		if (code === SimulatorError.InvalidBasis) {
			return {
				title: this.commonGlobalService.termText(this.feeDetailTerm.INVALID_BASIS_TITLE),
				body: this.commonGlobalService.termText(this.feeDetailTerm.INVALID_BASIS_BODY),
			};
		}
		return null;
	});

	constructor() {
		effect(() => {
			if (!this.isSimulatorEnabled() && this.events() !== "") {
				this.events.set("");
			}
		});
	}

	public clearEvents(): void {
		this.events.set("");
	}

	public onKeyPress(event: KeyboardEvent): void {
		if (!/^[0-9.]$/.test(event.key)) {
			event.preventDefault();
			return;
		}
		const target = event.target as HTMLInputElement;
		const start = target.selectionStart ?? 0;
		const end = target.selectionEnd ?? 0;
		const projected = target.value.substring(0, start) + event.key + target.value.substring(end);
		if (!this.common.isInProgressNumeric(projected)) {
			event.preventDefault();
		}
	}

	public onPaste(event: ClipboardEvent): void {
		const clipboardData = event.clipboardData?.getData("text") ?? "";
		const target = event.target as HTMLInputElement;
		const start = target.selectionStart ?? 0;
		const end = target.selectionEnd ?? 0;
		const projected = target.value.substring(0, start) + clipboardData + target.value.substring(end);
		const stripped = projected.replace(/,/g, "");
		if (!this.common.isInProgressNumeric(stripped)) {
			event.preventDefault();
		}
	}

	public onBlur(): void {
		const current = this.events();
		if (!current) return;
		const formatted = this.common.formatAmountInputDynamic(current, 15);
		if (formatted !== current) this.events.set(formatted);
	}

	public onFocus(): void {
		const current = this.events();
		if (!current.includes(",")) return;
		this.events.set(current.replace(/,/g, ""));
	}
}
