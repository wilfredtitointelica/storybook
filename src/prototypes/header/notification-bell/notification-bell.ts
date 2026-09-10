import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// components
import { Button } from "primeng/button";
import { Popover } from "primeng/popover";
import { TabsModule } from "primeng/tabs";
import { CommonModule } from "@angular/common";
import { Subject, Subscription } from "rxjs";
import { NotificationBellDomain } from "./notification-bell.domain";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { NotificationOrchestratorService, RecipientNotification, UserNotificationAction, UserNotificationInboxItem } from "intelica-library-notification";
import { NotificationBellAdmin } from "./notification-bell-admin/notification-bell-admin";
import { NotificationBellUser } from "./notification-bell-user/notification-bell-user";
import { ActionResult } from "./dto/notification-bell.dto";
// enums

@Component({
	selector: "notification-bell",
	imports: [FormsModule, CommonModule, Button, Popover, TabsModule, NotificationBellAdmin, NotificationBellUser, TermPipe],
	templateUrl: "./notification-bell.html",
})
export class NotificationBell implements OnInit, OnDestroy {
	readonly GlobalTermService = inject(GlobalTermService);
	private readonly configService = inject(ConfigService);

	filterChannels: string[] = ["inapp", "push"];

	activeButton = signal<boolean>(false);

	isAdmin = signal<boolean>(false);
	isInternal = signal<boolean>(false);

	lastActionError?: string;
	actionInFlight = new Set<string>(); // key: recipientId:actionCode

	private sub?: Subscription;

	unreadCountBrand = signal<number>(0);
	unreadCountRequest = signal<number>(0);
	unreadCountGeneric = signal<number>(0);
	unreadCountProgress = signal<number>(0);
	unreadCountIncontrol = signal<number>(0);

	notifications: UserNotificationInboxItem[] = [];

	userId: string | undefined = undefined;

	constructor(
		public readonly domain: NotificationBellDomain,
		private readonly orchestrator: NotificationOrchestratorService
	) {}

	async ngOnInit(): Promise<void> {
		this.userId = this.configService?.SessionInformation?.businessUserID;
		this.isAdmin.set(this.configService?.SessionInformation?.isAdmin ?? false);
		this.isInternal.set(this.configService?.SessionInformation?.isInternal ?? false);

		if (!this.userId) return;

		await this.loadInbox();

		// ✅ El orquestador hace joinScope("user", userId) y te entrega stream por userId
		const stream = await this.orchestrator.watchUserInbox(this.userId);

		this.sub = stream.subscribe(update => {
			if (update.userId !== this.userId) return;
			//console.log("inbox update", update);
			this.applyRealtimeUpdate(update);
		});
	}

	ngOnDestroy(): void {
		this.sub?.unsubscribe();
		this.sub = undefined;

		if (this.userId) {
			void this.orchestrator.unwatchUserInbox(this.userId);
		}
	}

	get hasUnread(): boolean {
		return this.unreadCountBrand() > 0 || this.unreadCountIncontrol() > 0;
	}

	get hasMarkAllAsRead(): boolean {
		return this.unreadCountBrand() > 0 || this.unreadCountIncontrol() > 0 || this.isMarking();
	}

	private async loadInbox(): Promise<void> {
		const items = await this.orchestrator.getUserNotificacions();
		this.notifications = (items ?? [])
			.filter(n => this.filterChannels.includes(n.channelCode))
			.slice()
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0);
	}

	private applyRealtimeUpdate(update: RecipientNotification): void {
		const idx = this.notifications.findIndex(x => x.recipientId === update.recipientId);
		if (idx >= 0) {
			const current = this.notifications[idx];
			this.notifications[idx] = {
				...current,
				statusCode: update.statusCode ?? current.statusCode,
			};
			return;
		}
		const nowIso = (update.lastAttemptAt as any) ?? new Date().toISOString();
		const newItem: UserNotificationInboxItem = {
			recipientId: update.recipientId,
			notificationId: update.notificationId,
			jobId: update.jobId ?? null,
			notificationTypeCode: update.notificationTypeCode ?? null,
			channelCode: update.channelCode ?? "push",
			destination: update.destination ?? null,
			destinationLabel: update.destinationLabel ?? null,
			title: update.title ?? "(Sin título)",
			body: update.body ?? null,
			metaData: update.metaData ?? null,
			address: update.address ?? null,
			statusCode: update.statusCode ?? "sent",
			isRequiredAsUnread: update.isRequiredAsUnread ?? false,
			isRead: update.isRead ?? false,
			readAt: update.readAt ?? null,
			isHidden: update.isHidden ?? false,
			hiddenAt: update.hiddenAt ?? null,
			createdAt: update.createdAt ?? nowIso,
			attempts: update.attempts ?? 0,
			lastAttemptAt: update.lastAttemptAt ?? nowIso,
			lastErrorMessage: update.lastErrorMessage ?? null,
			userId: update.userId ?? null,
			clientId: update.clientId ?? null,
			groupId: update.groupId ?? null,
			jobStatusCode: update.jobStatusCode ?? null,
			jobProcessedCount: update.jobProcessedCount ?? 0,
			jobTotalCount: update.jobTotalCount ?? 0,
			jobProcessedNotificationsCount: update.jobProcessedNotificationsCount ?? 0,
			jobTotalNotificationsCount: update.jobTotalNotificationsCount ?? 0,
			actions: ((update as any).actions as UserNotificationAction[]) ?? null,
		};

		this.notifications = [newItem, ...this.notifications].filter(n => this.filterChannels.includes(n.channelCode)).slice(0);
	}

	private markResultSubject = new Subject<ActionResult>();
	markResult$ = this.markResultSubject.asObservable();

	isMarking = signal<boolean>(false);
	async markAllAsRead() {
		this.isMarking.set(true);
		const response = await this.orchestrator.markAllAsRead();
		response.forEach(r => {
			this.markResultSubject.next({
				recipientId: r.recipientId,
				isRead: r.isRead,
				readAt: r.readAt,
				isHidden: r.isHidden,
				hiddenAt: r.hiddenAt,
			});
		});
		this.isMarking.set(false);
	}
}
