import { Component, computed, effect, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Button } from "primeng/button";
import { Card } from "primeng/card";
import { Badge } from "primeng/badge";
import { NotificationBellDomain } from "../notification-bell.domain";
import { UserNotificationAction, UserNotificationInboxItem } from "intelica-library-notification";
import { filter, Observable, Subscription } from "rxjs";
import { ActionResult } from "../dto/notification-bell.dto";
import { Tooltip } from "primeng/tooltip";

@Component({
	selector: "list-item-generic-notification",
	imports: [CommonModule, Card, Button, Tooltip, Badge],
	templateUrl: "./list-item-generic-notification.html",
})
export class ListItemGenericNotification implements OnInit, OnDestroy {
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

	visible = signal<boolean>(true);
	status = signal<boolean>(true);
	delayMessage = signal<number>(500);
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
				this.status.set(false);
				this.startTimer();
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

	onActionClick(event: MouseEvent, notification: UserNotificationInboxItem, action: UserNotificationAction): void {
		// clave: evitar que dispare el click del item
		event.stopPropagation();
		event.preventDefault();

		this.onNotificationActionClick.emit({
			event: event,
			notification: notification,
			action: action,
		});
	}

	get body(): any {
		return this.domain.getJsonData(this.notification?.metaData)?.body;
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
