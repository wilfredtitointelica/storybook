import { Component, signal, computed, OnDestroy, effect, EventEmitter, Input, Output, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Button } from "primeng/button";
import { Card } from "primeng/card";
import { Badge } from "primeng/badge";
import { NotificationBellDomain } from "../notification-bell.domain";
import { UserNotificationAction, UserNotificationInboxItem } from "intelica-library-notification";
import { filter, Observable, Subscription } from "rxjs";
import { ActionResult, NotificationStatus } from "../dto/notification-bell.dto";

@Component({
	selector: "list-item-team-request",
	imports: [CommonModule, Button, Card, Badge],
	templateUrl: "./list-item-team-request.html",
})
export class ListItemTeamRequest implements OnInit, OnDestroy {
	@Input() notification!: UserNotificationInboxItem;
	@Output() onNotificationClick = new EventEmitter<UserNotificationInboxItem>();
	@Output() onNotificationClose = new EventEmitter<{ notification: UserNotificationInboxItem; actionCode: string }>();
	@Output() onNotificationActionClick = new EventEmitter<{ event: MouseEvent; notification: UserNotificationInboxItem; action: UserNotificationAction }>();
	@Output() setNotificationArray = new EventEmitter<void>();

	@Input() lastActionError?: string;
	@Input() actionInFlight = new Set<string>(); // key: recipientId:actionCode

	@Input({ required: true }) actionResult$!: Observable<{ n: ActionResult; a?: UserNotificationAction }>;

	actionClose: string = "close";

	isRead = signal<boolean>(false);
	hasIndicator = signal<boolean>(true);
	// --- values ---
	visible = signal<boolean>(true);
	status = signal<NotificationStatus>("pending");
	delayMessage = signal<number>(1500);
	durationMessage = computed(() => this.delayMessage() + "ms");

	// --- ng ---

	private timer?: ReturnType<typeof setTimeout>;

	private sub?: Subscription;

	constructor(public readonly domain: NotificationBellDomain) {
		effect(() => {
			this.isRead.set(this.notification?.isRead ?? false);
			if (this.isRead()) {
				this.hasIndicator.set(false);
			}
			this.visible.set(!this.notification?.isHidden); // reset visible on notification change
		});
	}

	ngOnInit() {
		this.sub = this.actionResult$.pipe(filter(r => r.n.recipientId === this.notification.recipientId)).subscribe(async r => {
			//console.log("Before action result", { ...this.notification });
			this.notification.isRead = r.n.isRead;
			this.notification.readAt = r.n.readAt;
			this.isRead.set(this.notification.isRead ?? false);
			if (this.isRead()) {
				this.hasIndicator.set(false);
			}
			//console.log("Recived action result", { ...this.notification });
			if (r.n.isHidden) {
				this.status.set(r?.a?.code === "approve" ? "approved" : r?.a?.code === "reject" ? "rejected" : "pending");
				await this.startTimer();
				this.notification.isHidden = r.n.isHidden;
				this.notification.hiddenAt = r.n.hiddenAt;
				//console.log("After action result", { ...this.notification });
			}
			this.setNotificationArray.emit();
		});
	}

	ngOnDestroy() {
		if (this.timer) clearTimeout(this.timer); // no memory leaks
		this.sub?.unsubscribe();
	}

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

	isBusy = (recipientId: string, actionCode: string): boolean => {
		return this.actionInFlight.has(`${recipientId}:${actionCode}`);
	};

	onActionClick(event: MouseEvent, notification: UserNotificationInboxItem, action: UserNotificationAction): void {
		// clave: evitar que dispare el click del item
		event.stopPropagation();
		event.preventDefault();
		//console.log("Action click", { notification: { ...notification }, action: action });
		this.onNotificationActionClick.emit({
			event: event,
			notification: notification,
			action: action,
		});
	}

	get teamRequest(): any {
		return this.domain.getJsonData(this.notification?.metaData)?.teamRequest;
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
