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
	selector: "list-item-brand-notification",
	imports: [CommonModule, Card, Button, Tooltip, Badge],
	templateUrl: "./list-item-brand-notification.html",
})
export class ListItemBrandNotification implements OnInit, OnDestroy {
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
	private timer?: ReturnType<typeof setTimeout>;
	private sub?: Subscription;
	constructor(public readonly domain: NotificationBellDomain) {
		effect(() => {
			this.isRead.set(this.notification?.isRead ?? false);
			if (this.isRead()) {
				this.hasIndicator.set(false);
			}
			this.visible.set(!this.notification?.isHidden);
		});
	}
	ngOnInit() {
		this.sub = this.actionResult$.pipe(filter(r => r.n.recipientId === this.notification.recipientId)).subscribe(async r => {
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
	}
	ngOnDestroy() {
		if (this.timer) clearTimeout(this.timer);
		this.sub?.unsubscribe();
	}
	isBusy = (recipientId: string, actionCode: string): boolean => {
		return this.actionInFlight.has(`${recipientId}:${actionCode}`);
	};
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
	get brandFile(): any {
		return this.domain.getJsonData(this.notification?.metaData)?.brandFile;
	}
	get cursorStyle(): string {
		return this.notification.destination ? "pointer" : "default";
	}
	get impactTypeDescription(): string {
		return this.domain.GlobalTermService.languageCode === "es" ? this.brandFile?.impactType.descriptionEs : this.brandFile?.impactType.descriptionEn;
	}
	onCloseNotification(event: MouseEvent, notification: UserNotificationInboxItem): void {
		event.stopPropagation();
		event.preventDefault();
		this.onNotificationClose.emit({ notification, actionCode: this.actionClose });
	}
}
