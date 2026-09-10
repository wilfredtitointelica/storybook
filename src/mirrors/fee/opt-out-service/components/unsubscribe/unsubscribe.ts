import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { Message } from "primeng/message";
import { StepperModule } from "primeng/stepper";
import { Timeline } from "primeng/timeline";
import { OptOutSteps, OptOutUnsubscribedDto } from "../../dto/opt-out-service-commands.dto";
import { OptOutServicesService } from "../../opt-out-service.service";
import { ContactTypeEnum } from "../../common/enums/opt-out-service.enum";
import { finalize } from "rxjs";
import { InputTextModule } from "primeng/inputtext";
import { Skeleton } from "primeng/skeleton";
import { UnsubcribeService } from "./service/unsubscribe.service";

@Component({
	selector: "fee-unsubscribe",
	imports: [TermPipe, Button, DialogModule, TextareaModule, CheckboxModule, FormsModule, Message, Timeline, StepperModule, InputTextModule, Skeleton],
	templateUrl: "./unsubscribe.html",
})
export class Unsubscribe {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly optOutService = inject(OptOutServicesService);
	private readonly unsubcribeService = inject(UnsubcribeService);

	private _stepsCommand = signal<OptOutSteps | null>(null);
	private _isLoadingSteps = signal(false);
	private _isLoadingUnsubscribed = signal(false);

	public stepsData = this.optOutService.buildEntitySignal(this._stepsCommand, cmd => this.optOutService.getUnsubscribe(cmd), this._isLoadingSteps);

	public isLoadingSteps = computed(() => this._isLoadingSteps());

	public contactTypeEnum = ContactTypeEnum;

	public _to = signal<string | null>(null);
	public _subject = signal<string | null>(null);
	public _body = signal<string | null>(null);
	public _url = signal<string | null>(null);
	public _isUnsubscribed = signal<boolean>(false);
	private _lastSentKey = signal<string | null>(null);
	public _isSaveUnsubscribed = signal<boolean>(false);

	public to = computed(() => this.cleanEmail(this._to() ?? this.stepsData()?.to));
	public subject = computed(() => this._subject() ?? this.stepsData()?.subject ?? "");
	public body = computed(() => this._body() ?? this.stepsData()?.body ?? "");
	public url = computed(() => this._url() ?? this.stepsData()?.url ?? "");
	public isUnsubscribed = computed(() => this._isUnsubscribed());
	public isSaveUnsubscribed = computed(() => this._isSaveUnsubscribed());

	public timeLine = computed(() => {
		const data = this.stepsData();
		if (!data) return [];

		const map = [
			{ term: "PUBLICATION_DATE", date: data.publicationDateParse },
			{ term: "TRIAL_PERIOD_STARTS", date: data.trialPeriodStartParse },
			{ term: "LAST_DAY_OPT_OUT", date: data.lastDayOptOutParse },
			{ term: "BILLING_STARTS", date: data.billingStartParse },
			{ term: "NEXT_OPT_OUT_WINDOW", date: data.nextOptOutWindowParse },
		];

		return map
			.filter(x => !!x.date)
			.map(x => ({
				date: x.date,
				term: x.term,
			}));
	});

	public showDialog = false;
	public activeStep: number = 1;

	constructor() {}

	openDialog(bankId: number, opcId: number, isBill: boolean): void {
		this.activeStep = 1;
		this._stepsCommand.set({
			bankId,
			opcId,
			isBill,
		});
		this.showDialog = true;
	}
	onCancel() {
		this.activeStep = 1;
		this.showDialog = false;
		this._isUnsubscribed.set(false);
		this._isSaveUnsubscribed.set(false);
	}
	openEmailClient() {
		const to = encodeURIComponent(this.to() ?? "");
		const subject = encodeURIComponent(this.subject() ?? "");
		const body = encodeURIComponent(this.body() ?? "");

		const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

		window.location.href = mailto;
	}
	openExternalUrl() {
		const to = this.to() ?? "";
		if (!to) return;

		window.open(to, "_blank", "noopener,noreferrer");
	}
	onContinueAndSave(): void {
		const base = this._stepsCommand();
		if (!base) return;

		const command: OptOutUnsubscribedDto = {
			opcId: base.opcId,
			clientId: base.bankId
		};

		const key = this.buildKey(command);

		if (this._lastSentKey() !== key) {
			this._lastSentKey.set(key);
			this._isLoadingUnsubscribed.set(true);

			this.optOutService
				.upsertUnsubscribe(command)
				.pipe(
					finalize(() => {
						this._isLoadingUnsubscribed.set(false);
						this.activeStep = 4;
						this._isSaveUnsubscribed.set(true);
					})
				)
				.subscribe(() => {});
		} else {
			this.activeStep = 4;
		}
	}
	onClose() {
		this.activeStep = 1;
		this.showDialog = false;
		if (this.isUnsubscribed() && this.isSaveUnsubscribed()) {
			this.unsubcribeService.trigger();
		}
		this._isUnsubscribed.set(false);
		this._isSaveUnsubscribed.set(false);
	}
	private cleanEmail(value?: string | null): string {
		if (!value) return "";

		return value
			.replace(/^mailto:/i, "")
			.split("?")[0]
			.split(";") // soporta múltiples
			.map(x => x.trim())
			.filter(Boolean)
			.join(";");
	}
	private buildKey(cmd: OptOutUnsubscribedDto): string {
		return [cmd.opcId, cmd.clientId].join("|");
	}
}
