import { Component, inject, Input, OnChanges, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// patterns
import { ListItemOptOutRequest } from "../list-item-opt-out-request/list-item-opt-out-request";
import { ListItemTeamRequest } from "../list-item-team-request/list-item-team-request";
import { ListItemGenericNotification } from "../list-item-generic-notification/list-item-generic-notification";
import { ListItemProgressBar } from "../list-item-progress-bar/list-item-progress-bar";
// components
import { Button } from "primeng/button";
import { Badge } from "primeng/badge";
import { TabsModule, TabList, TabPanels, Tab, TabPanel } from "primeng/tabs";
import { CommonModule } from "@angular/common";
import { Observable, Subject, Subscription } from "rxjs";
import { ActionResult, NotificationTab } from "../dto/notification-bell.dto";
import { NotificationBellDomain } from "../notification-bell.domain";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { NotificationOrchestratorService, UserNotificationAction, UserNotificationInboxItem } from "intelica-library-notification";
import { navigateToUrl } from "single-spa";
// enums

@Component({
	selector: "notification-bell-admin",
	imports: [
		FormsModule,
		CommonModule,
		Button,
		TabsModule,
		TabList,
		TabPanels,
		TabPanel,
		Tab,
		Badge,
		ListItemOptOutRequest,
		ListItemTeamRequest,
		ListItemGenericNotification,
		ListItemProgressBar,
		TermPipe,
	],
	templateUrl: "./notification-bell-admin.html",
})
export class NotificationBellAdmin implements OnInit, OnChanges, OnDestroy {
	readonly GlobalTermService = inject(GlobalTermService);

	@Input({ required: true }) notifications: UserNotificationInboxItem[] = [];
	@Input({ required: true }) unreadCountBrand = signal<number>(0);
	@Input({ required: true }) unreadCountRequest = signal<number>(0);
	@Input({ required: true }) unreadCountGeneric = signal<number>(0);
	@Input({ required: true }) unreadCountIncontrol = signal<number>(0);
	@Input({ required: true }) unreadCountProgress = signal<number>(0);
	@Input({ required: true }) markResult$!: Observable<ActionResult>;

	private actionResultSubject = new Subject<{ n: ActionResult; a?: UserNotificationAction }>();
	actionResult$ = this.actionResultSubject.asObservable();

	notificationsBrand: UserNotificationInboxItem[] = [];
	notificationsRequest: UserNotificationInboxItem[] = [];
	notificationsGeneric: UserNotificationInboxItem[] = [];
	notificationsProgress: UserNotificationInboxItem[] = [];

	notificationsBrandLimited: UserNotificationInboxItem[] = [];
	notificationsRequestLimited: UserNotificationInboxItem[] = [];
	notificationsGenericLimited: UserNotificationInboxItem[] = [];
	notificationsProgressLimited: UserNotificationInboxItem[] = [];

	lastActionError?: string;
	actionInFlight = new Set<string>(); // key: recipientId:actionCode

	maxItems = 7;
	NotificationTab = NotificationTab;

	tabValue = signal<NotificationTab>(NotificationTab.Incontrol);

	private sub?: Subscription;

	constructor(
		public readonly domain: NotificationBellDomain,
		private readonly orchestrator: NotificationOrchestratorService
	) {}

	ngOnInit() {
		this.sub = this.markResult$.pipe().subscribe(async r => {
			this.actionResultSubject.next({ n: r });
		});
	}

	ngOnChanges(): void {
		this.setNotificationArray();
	}

	ngOnDestroy() {
		this.sub?.unsubscribe();
	}

	get hasUnreadIncontrol(): boolean {
		return this.unreadCountIncontrol() > 0;
	}

	viewAll(length: number): boolean {
		return length > this.maxItems;
	}

	getUnreadCount(unreadCount: number): string {
		var term = unreadCount.toString() + " " + this.domain.getTerm("LBL_PENDING_NOTIFICATIONS");
		return term;
	}

	public setNotificationArray() {
		this.notificationsBrand = this.notifications.filter(n => n.notificationTypeCode == "BRD" && !n.isHidden);
		this.notificationsRequest = this.notifications.filter(n => (n.notificationTypeCode == "TEM" || n.notificationTypeCode == "OPT") && !n.isHidden);
		this.notificationsGeneric = this.notifications.filter(n => n.notificationTypeCode == "NTF" && !n.isHidden);
		this.notificationsProgress = this.notifications.filter(n => n.notificationTypeCode == "PRG" && !n.isHidden);

		this.notificationsBrandLimited = [...this.notificationsBrand].slice(0, this.maxItems);
		this.notificationsRequestLimited = [...this.notificationsRequest].slice(0, this.maxItems);
		this.notificationsGenericLimited = [...this.notificationsGeneric].slice(0, this.maxItems);
		this.notificationsProgressLimited = [...this.notificationsProgress].slice(0, this.maxItems);
		this.recalcUnread();
	}

	private recalcUnread(): void {
		this.unreadCountBrand.set(this.notificationsBrand.reduce((acc, x) => acc + (x.isRead ? 0 : 1), 0));
		this.unreadCountRequest.set(this.notificationsRequest.reduce((acc, x) => acc + (x.isRead ? 0 : 1), 0));
		this.unreadCountGeneric.set(this.notificationsGeneric.reduce((acc, x) => acc + (x.isRead ? 0 : 1), 0));
		this.unreadCountProgress.set(this.notificationsProgress.reduce((acc, x) => acc + (x.isRead ? 0 : 1), 0));
		this.unreadCountIncontrol.set(this.unreadCountRequest() + this.unreadCountGeneric() + this.unreadCountProgress());
	}

	trackByRecipientId(_: number, item: UserNotificationInboxItem): string {
		return [item.notificationTypeCode, item.notificationId, item.jobId, item.recipientId, item.createdAt].join("|");
	}

	public async safeMarkAsRead(n: UserNotificationInboxItem, a?: UserNotificationAction): Promise<void> {
		if (n.isRead) {
			return;
		}
		try {
			const result = await this.orchestrator.markAsRead(n.recipientId);
			this.actionResultSubject.next({ n: { recipientId: result.recipientId, isRead: result.isRead, readAt: result.readAt, isHidden: result.isHidden, hiddenAt: result.hiddenAt }, a });
		} catch {}
	}

	public async safeMarkAsHidden(n: UserNotificationInboxItem, a?: UserNotificationAction): Promise<void> {
		if (n.isHidden) {
			return;
		}
		try {
			const result = await this.orchestrator.markAsHidden(n.recipientId);
			this.actionResultSubject.next({ n: { recipientId: result.recipientId, isRead: result.isRead, readAt: result.readAt, isHidden: result.isHidden, hiddenAt: result.hiddenAt }, a });
		} catch {}
	}

	async onNotificationClick(n: UserNotificationInboxItem): Promise<void> {
		if (n.destination) {
			this.safeMarkAsRead(n);
			this.domain.safeNavigate(n.destination);
		}
	}

	async onNotificationClose(n: UserNotificationInboxItem, actionCode: string): Promise<void> {
		const key = `${n.recipientId}:${actionCode}`;
		if (this.actionInFlight.has(key)) return;
		this.actionInFlight.add(key);
		await this.safeMarkAsHidden(n);
	}

	async onNotificationActionClick(event: MouseEvent, notification: UserNotificationInboxItem, action: UserNotificationAction): Promise<void> {
		// Evita que el click del botón dispare el click del item
		event.stopPropagation();
		event.preventDefault();
		const key = `${notification.recipientId}:${action.code}`;
		if (this.actionInFlight.has(key)) return;

		this.lastActionError = undefined;
		this.actionInFlight.add(key);

		try {
			const type = this.domain.normalizeActionType(action.destinationType);
			const dest = action.destination;
			const body = JSON.parse(action.destinationData ?? "{}");

			if (!dest) return;

			if (type === "URL" || type === "NAV") {
				this.domain.safeNavigate(dest);
				return;
			}

			if (type === "POST" || type === "PUT" || type === "PATCH" || type === "DELETE" || type === "GET") {
				await this.domain.executeHttpAction(type, dest, body);
				if (action.markAsHidden) {
					await this.safeMarkAsHidden(notification, action);
				} else if (action.markAsRead) {
					await this.safeMarkAsRead(notification, action);
				}
				return;
			}
		} catch (e: any) {
			this.lastActionError = e?.message ?? "No se pudo ejecutar la acción";
		} finally {
			this.actionInFlight.delete(key);
		}
	}

	onSettingRequests(): void {
		navigateToUrl("/security/settings/teams");
	}
}
