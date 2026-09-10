import { Component, computed, EventEmitter, Input, OnDestroy, OnInit, Output, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { ProgressBarModule } from "primeng/progressbar";
import { NotificationBellDomain } from "../notification-bell.domain";
import { filter, Observable, Subscription } from "rxjs";
import { NotificationOrchestratorService, RecipientProgressNotification, UserNotificationAction, UserNotificationInboxItem } from "intelica-library-notification";
import { Button } from "primeng/button";
import { ActionResult } from "../dto/notification-bell.dto";

@Component({
	selector: "list-item-progress-bar",
	imports: [CommonModule, Button, Card, ProgressBarModule],
	templateUrl: "./list-item-progress-bar.html",
})
export class ListItemProgressBar implements OnInit, OnDestroy {
	@Input() notification!: UserNotificationInboxItem;
	@Output() onNotificationClick = new EventEmitter<UserNotificationInboxItem>();
	@Output() onNotificationClose = new EventEmitter<{ notification: UserNotificationInboxItem; actionCode: string }>();
	@Output() setNotificationArray = new EventEmitter<void>();

	@Input() lastActionError?: string;
	@Input() actionInFlight = new Set<string>(); // key: recipientId:actionCode

	@Input({ required: true }) actionResult$!: Observable<{ n: ActionResult; a?: UserNotificationAction }>;

	actionClose: string = "close";

	processed = 0;
	total = 0;
	isApplyClosed = true;

	get percent(): number {
		if (!this.total) return 0;
		return Math.round((this.processed * 100) / this.total);
	}

	isRead = signal<boolean>(false);
	hasIndicator = signal<boolean>(true);

	visible = signal<boolean>(true);
	status = signal<boolean>(true);
	delayMessage = signal<number>(500);
	durationMessage = computed(() => this.delayMessage() + "ms");
	// --- ng ---
	private timer?: ReturnType<typeof setTimeout>;

	private subActionResult?: Subscription;

	private sub?: Subscription;
	private jobId: string | null = null;

	constructor(private readonly orchestrator: NotificationOrchestratorService, public readonly domain: NotificationBellDomain) {}

	async ngOnInit(): Promise<void> {
		this.subActionResult = this.actionResult$.pipe(filter(r => r.n.recipientId === this.notification.recipientId)).subscribe(async r => {
			this.notification.isRead = r.n.isRead;
			this.notification.readAt = r.n.readAt;
			this.isRead.set(this.notification.isRead ?? false);
			if (this.isRead()) {
				this.hasIndicator.set(false);
			}
			if (r.n.isHidden) {
				this.status.set(false);
				this.startTimer();
				this.notification.isHidden = r.n.isHidden;
				this.notification.hiddenAt = r.n.hiddenAt;
			}
			this.setNotificationArray.emit();
		});

		this.jobId = this.notification?.jobId ?? null;
		if (!this.jobId) return;
		// Estado inicial persistido (rehidratación)
		this.processed = this.notification.jobProcessedNotificationsCount ?? 0;
		this.total = this.notification.jobTotalNotificationsCount ?? 0;
		const status = (this.notification?.jobStatusCode ?? "").toLowerCase();
		if ((status === "completed" && this.processed === this.total) || status === "failed" || status === "cancelled") {
			return;
		}
		// ✅ El orquestador se encarga de joinScope + stream por jobId
		const stream = await this.orchestrator.watchJobProgress(this.jobId);
		this.sub = stream.subscribe(update => {
			this.onJobProgress(update);
		});
	}

	ngOnDestroy(): void {
		// cortar stream local
		this.sub?.unsubscribe();
		this.sub = undefined;
		this.subActionResult?.unsubscribe();
		this.subActionResult = undefined;

		// ✅ El orquestador se encarga de leaveScope cuando no queda nadie escuchando
		if (this.jobId) {
			void this.orchestrator.unwatchJobProgress(this.jobId);
		}

		this.jobId = null;

		if (this.timer) clearTimeout(this.timer); // no memory leaks
	}

	private onJobProgress(update: RecipientProgressNotification): void {
		// El stream ya es por jobId, pero mantenemos guard por seguridad.
		if (!this.jobId || update.jobId !== this.jobId) return;

		this.notification.jobProcessedNotificationsCount = update.jobProcessedNotificationsCount;
		this.notification.jobTotalNotificationsCount = update.jobTotalNotificationsCount;
		this.notification.jobStatusCode = update.jobStatusCode;

		// Actualizar progreso
		if (typeof this.notification.jobProcessedNotificationsCount === "number") {
			this.processed = this.notification.jobProcessedNotificationsCount;
		}
		if (typeof this.notification.jobTotalNotificationsCount === "number") {
			this.total = this.notification.jobTotalNotificationsCount;
		}

		// Estado final
		const status = (this.notification.jobStatusCode ?? "").toLowerCase();
		if (status === "completed" || status === "failed" || status === "cancelled") {
			this.sub?.unsubscribe();
			this.sub = undefined;

			// dejar que ngOnDestroy haga el unwatch si el componente se destruye;
			// si quieres cortar de inmediato sin destruir el componente:
			if (this.jobId) {
				void this.orchestrator.unwatchJobProgress(this.jobId);
			}
		}
	}

	isBusy = (recipientId: string, actionCode: string): boolean => {
		return this.actionInFlight.has(`${recipientId}:${actionCode}`);
	};

	// --- functions ---

	async startTimer(): Promise<void> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}

		await new Promise<void>(resolve => {
			this.timer = setTimeout(() => {
				this.visible.set(false);
				this.timer = undefined;
				resolve();
			}, this.delayMessage());
		});

		// AQUÍ ya terminó el delay
		// Lógica que quieres ejecutar después
	}

	/* notification container */

	get statusNotification(): string {
		this.isApplyClosed = true;
		switch (this.notification.jobStatusCode) {
			case "running":
				this.isApplyClosed = false;
				return this.domain.getTerm("LBL_NOTIFICATION_IN_PROGRESS");
			case "completed":
				return this.domain.getTerm("LBL_NOTIFICATION_COMPLETED");
			case "failed":
				return this.domain.getTerm("LBL_NOTIFICATION_ERROR");
			default:
				return "";
		}
	}

	get statusTextClass(): string {
		switch (this.notification.jobStatusCode) {
			case "running":
				return "in-progress";
			case "completed":
				return "completed";
			case "failed":
				return "error";
			default:
				return "in-progress";
		}
	}

	get statusClass(): string {
		switch (this.notification.jobStatusCode) {
			case "running":
				return "in-progress";
			case "completed":
				return "completed";
			case "failed":
				return "error";
			default:
				return "in-progress";
		}
	}

	get description(): string {
		switch (this.notification.jobStatusCode) {
			case "running":
				return `${this.domain.getTerm("LBL_NOTIFICATION_SENDING")}...`;
			default:
				return `${this.notification.title}`;
		}
	}

	get progress(): any {
		switch (this.notification.jobStatusCode) {
			case "completed":
				return { text: `${this.domain.getTerm("LBL_NOTIFICATION_COMPLETED")}: ${this.processed} ${this.domain.getTerm("LBL_OF")} ${this.total}`, class: "completed" };
			case "error":
				return { text: `${this.domain.getTerm("LBL_NOTIFICATION_ERROR")}: ${this.processed} ${this.domain.getTerm("LBL_OF")} ${this.total}`, class: "error" };
			default:
				//return { text: `${this.domain.getTerm("LBL_NOTIFICATION_IN_PROGRESS")}: ${this.processed} ${this.domain.getTerm("LBL_OF")} ${this.total}`, class: "completed" };
				return { text: ``, class: "" };
		}
	}

	get progressRequest(): any {
		return this.domain.getJsonData(this.notification?.metaData)?.progressRequest;
	}

	get cursorStyle(): string {
		return this.notification.destination ? "pointer" : "default";
	}

	onCloseNotification(event: MouseEvent, notification: UserNotificationInboxItem): void {
		event.stopPropagation();
		event.preventDefault();
		this.onNotificationClose.emit({ notification, actionCode: this.actionClose });
	}
}
