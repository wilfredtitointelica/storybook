import { Component, computed, effect, inject, input, model, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// library
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { AlertService, AlertType, AlertButtonMode, IntelicaAlertComponent } from "intelica-library-base";
// components primeng
import { InputNumber } from "primeng/inputnumber";
import { Card } from "primeng/card";
import { Message } from "primeng/message";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import { Badge } from "primeng/badge";
import { Skeleton } from "primeng/skeleton";
// interface
import { AlertMethod, AlertMethodFromConfigurationType, ConfigurationTypeMap, OptionData, ThresholdUnit } from "./modal-set-alerts.interface";
// service + DTO
import { CustomConfigurationService } from "./custom-configuration.service";
import { CustomConfigurationConstants } from "./common/constants";
import { CustomConfigurationResponse } from "./DTO/response";
import { CustomConfigurationMaintenanceRequest } from "./DTO/request";
import { ClientInformationResponse } from "../../common/DTO/client-response";

@Component({
	selector: "fee-modal-set-alert",
	standalone: true,
	imports: [FormsModule, IntelicaAlertComponent, InputNumber, Card, Message, Select, Button, Badge, Skeleton, TermPipe],
	templateUrl: "./modal-set-alert.html",
	providers: [TermPipe],
})
export class ModalSetAlertComponent {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly termPipe = inject(TermPipe);
	readonly alertService = inject(AlertService);
	private readonly service = inject(CustomConfigurationService);

	public feeId = input<string>("");
	public hasAlert = input<boolean>(false);
	public visible = model<boolean>(false);
	public clientInfo = input<ClientInformationResponse | null>(null);
	public isGroupProfile = input<boolean>(false);
	public currency = input<string | null>(null);
	public bankId = input<number>(0);

	public saved = output<void>();
	public savingChange = output<boolean>();

	////////////////////////////////////////////////////////////////////////

	AlertMethod = AlertMethod;
	MAX_THRESHOLD_VALUE = CustomConfigurationConstants.MAX_THRESHOLD_VALUE;
	// --- sections ---
	section = signal<"choose" | "manage">("choose");
	// --- input / output ---
	closeDialog = output<boolean>();
	// --- form: fields ---
	selectedMethod = signal<AlertMethod | null>(AlertMethod.ExpectedAmount);
	valueAmount = signal<number | null>(null);
	touchedAmount = signal(false);
	amountCurrencyLabel = computed(() => {
		const code = this.currency();
		const lang = this.globalTermService.languageCode;
		return code ? `${this.termPipe.transform("Amount", lang)} (${code})` : this.termPipe.transform("LBL_AMOUNT_USD", lang);
	});
	options = computed<OptionData[]>(() => [
		{ id: ThresholdUnit.Amount, name: this.amountCurrencyLabel() },
		{ id: ThresholdUnit.Percentage, name: `${this.termPipe.transform("LBL_PERCENTAGE", this.globalTermService.languageCode)} (%)` },
	]);
	selectedOption = signal<OptionData | null>(this.options()[0]);
	currentSetting = signal<"fixed" | "variation" | null>("fixed");
	// --- backend state ---
	currentConfig = signal<CustomConfigurationResponse | null>(null);
	clientId = signal<number | null>(null);
	loading = signal<boolean>(false);
	saving = signal<boolean>(false);
	errorMessage = signal<string | null>(null);

	bankName = computed<string>(() => {
		const id = this.clientId();
		const info = this.clientInfo();
		if (id == null || !info) return "";
		return info.banks?.find(b => b.bankId === id)?.bankName ?? "";
	});

	private currencyMap: Record<number, string> = { 840: "USD", 978: "EUR", 826: "GBP" };
	currentUnitLabel = computed(() => {
		const config = this.currentConfig();
		if (!config) return "USD";
		return config.thresholdUnit === ThresholdUnit.Percentage ? "%" : (this.currencyMap[config.currencyId] ?? "USD");
	});
	currentThresholdLabel = computed(() => {
		const config = this.currentConfig();
		if (!config) return "";
		return config.thresholdValue.toLocaleString("en-US", { maximumFractionDigits: 2 });
	});

	disabledButton = computed(() => {
		const value = this.valueAmount();
		if (value === null) return true;
		return value < 0 || value > CustomConfigurationConstants.MAX_THRESHOLD_VALUE || this.saving();
	});
	// --- form: errors ---
	showAmmountError = computed(() => {
		const value = this.valueAmount();
		if (!this.touchedAmount()) return false;
		if (value === null) return true;
		return value < 0 || value > CustomConfigurationConstants.MAX_THRESHOLD_VALUE;
	});
	exceedsMaxLimit = computed(() => {
		const value = this.valueAmount();
		if (!this.touchedAmount() || value === null) return false;
		return value > CustomConfigurationConstants.MAX_THRESHOLD_VALUE;
	});
	// --- method config ---
	config = computed(() => {
		const method = this.selectedMethod() ?? AlertMethod.ExpectedAmount;
		const lang = this.globalTermService.languageCode;
		if (method === AlertMethod.ExpectedAmount) {
			return {
				amountType: "default" as const,
				placeholder: this.termPipe.transform("LBL_PLACEHOLDER_EXPECTED_AMOUNT", lang),
				caption: this.termPipe.transform("LBL_CAPTION_EXPECTED_AMOUNT", lang),
			};
		}
		return {
			amountType: "select" as const,
			placeholder: this.termPipe.transform("LBL_PLACEHOLDER_VARIATION", lang),
			caption: this.termPipe.transform("LBL_CAPTION_VARIATION", lang),
		};
	});

	constructor() {
		effect(() => {
			const id = this.feeId();
			if (!id) return;
			this.loadConfig(Number(id));
		});
	}

	private loadConfig(feeId: number) {
		this.loading.set(true);
		this.errorMessage.set(null);
		this.service.getByFee(feeId, this.bankId()).subscribe({
			next: response => {
				this.clientId.set(response.clientId);
				if (response.configuration) {
					this.applyConfigToForm(response.configuration);
					this.section.set("manage");
				} else {
					this.resetForm();
					this.section.set("choose");
				}
				this.loading.set(false);
			},
			error: err => {
				this.errorMessage.set(this.extractMessage(err) ?? this.termPipe.transform("LBL_UNABLE_LOAD_ALERT", this.globalTermService.languageCode));
				this.loading.set(false);
			},
		});
	}

	private applyConfigToForm(config: CustomConfigurationResponse) {
		this.currentConfig.set(config);
		const method = AlertMethodFromConfigurationType[config.configurationType] ?? AlertMethod.ExpectedAmount;
		this.selectedMethod.set(method);
		this.currentSetting.set(method === AlertMethod.ExpectedAmount ? "fixed" : "variation");
		this.valueAmount.set(Number.isFinite(config.thresholdValue) ? config.thresholdValue : null);
		this.selectedOption.set(this.options().find(o => o.id === config.thresholdUnit) ?? this.options()[0]);
		this.touchedAmount.set(false);
	}

	private resetForm() {
		this.currentConfig.set(null);
		this.selectedMethod.set(AlertMethod.ExpectedAmount);
		this.currentSetting.set("fixed");
		this.valueAmount.set(null);
		this.selectedOption.set(this.options()[0]);
		this.touchedAmount.set(false);
	}

	save() {
		this.touchedAmount.set(true);
		if (this.disabledButton()) return;

		const method = this.selectedMethod() ?? AlertMethod.ExpectedAmount;
		const thresholdUnit = method === AlertMethod.ExpectedAmount ? ThresholdUnit.Amount : (this.selectedOption()?.id ?? ThresholdUnit.Amount);

		const currencyCode = this.currency();
		const resolvedCurrencyId = currencyCode ? (Object.entries(this.currencyMap).find(([, code]) => code === currencyCode)?.[0] ?? null) : null;

		const command: CustomConfigurationMaintenanceRequest = {
			feeId: Number(this.feeId()),
			configurationType: ConfigurationTypeMap[method],
			thresholdValue: this.valueAmount() ?? 0,
			thresholdUnit,
			currencyId: resolvedCurrencyId ? Number(resolvedCurrencyId) : CustomConfigurationConstants.DEFAULT_CURRENCY_ID,
		};

		this.saving.set(true);
		this.savingChange.emit(true);
		this.errorMessage.set(null);

		const existing = this.currentConfig();
		const request$ = existing ? this.service.update(existing.customConfigurationId, command, this.bankId()) : this.service.create(command, this.bankId());

		request$.subscribe({
			next: () => {
				this.saving.set(false);
				this.savingChange.emit(false);
				this.saved.emit();
				this.loadConfig(Number(this.feeId()));
			},
			error: err => {
				this.errorMessage.set(this.extractMessage(err) ?? this.termPipe.transform("LBL_UNABLE_SAVE_ALERT", this.globalTermService.languageCode));
				this.saving.set(false);
				this.savingChange.emit(false);
			},
		});
	}

	async confirmDelete() {
		const existing = this.currentConfig();
		if (!existing) return;

		const lang = this.globalTermService.languageCode;
		const result = await this.alertService.show({
			type: AlertType.ERROR,
			title: this.termPipe.transform("LBL_DELETE_CUSTOM_ALERT", lang),
			subtitle: this.termPipe.transform("LBL_DELETE_CONFIRM", lang),
			buttonMode: AlertButtonMode.CONFIRM_CANCEL,
			buttons: {
				confirmText: this.termPipe.transform("LBL_YES", lang),
				cancelText: this.termPipe.transform("LBL_NO", lang),
			},
		});

		if (result.isConfirmed) this.executeDelete(existing.customConfigurationId);
	}

	private executeDelete(id: number) {
		this.saving.set(true);
		this.errorMessage.set(null);
		this.service.delete(id, this.bankId()).subscribe({
			next: () => {
				this.saving.set(false);
				this.saved.emit();
				this.closeDialog.emit(true);
			},
			error: err => {
				this.errorMessage.set(this.extractMessage(err) ?? this.termPipe.transform("LBL_UNABLE_DELETE_ALERT", this.globalTermService.languageCode));
				this.saving.set(false);
			},
		});
	}

	startModify() {
		this.section.set("choose");
	}

	private extractMessage(err: unknown): string | null {
		const error = err as { error?: { Message?: string; message?: string } } | undefined;
		return error?.error?.Message ?? error?.error?.message ?? null;
	}

	////////////////////////////////////////////////////////////////////////
}
