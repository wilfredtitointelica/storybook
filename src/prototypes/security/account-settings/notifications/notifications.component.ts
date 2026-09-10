import { Component, computed, effect, inject, OnDestroy, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Subject, debounceTime, takeUntil } from "rxjs";
// --- directives ---
import { GaTrackDirective } from "../../common/analitycs";
// interfaces
import { NotificationPreferences } from "./notification.interface";
// domain
import { applyToPreferences, fromApiResponse, toUpdateCommand } from "./notifications.domain";
// service
import { NotificationsService } from "./notifications.service";
// state
import { AccountSettingsStateService } from "../account-settings-state.service";
// session
import { SessionService } from "../../common/session/session.service";
// components
import { Panel } from "primeng/panel";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Message } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
// term
import { GlobalTermService, TermPipe } from "intelica-library-base";

const INITIAL_PREFERENCES: NotificationPreferences = {
	email: {
		heading: "EmailNotificationsSectionTitle",
		masters: [
			{
				id: "email_master",
				title: "EmailNotificationTitle",
				description: "EmailNotificationBody",
				checked: true,
				blocked: false,
				alert: {
					checkedTitleKey: "MasterNotificationEnableMessageTitle",
					checkedBodyKey: "MasterNotificationEnableMessageSubTitle",
					uncheckedTitleKey: "MasterNotificationWarningMessageTitle",
					uncheckedBodyKey: "MasterNotificationWarningMessageSubTitle",
					visible: false,
				},
			},
		],
		items: [
			{ id: "new_fees", title: "NewFeesNotificationTitle", description: "NewFeesNotificationBody", checked: true, blocked: false },
			{ id: "penalties", title: "PenaltiesNotificationTitle", description: "PenaltiesNotificationBody", checked: true, blocked: false },
			{ id: "opt_out", title: "OptOutNotificationTitle", description: "OptOutNotificationBody", checked: false, blocked: false },
			{ id: "announcements", title: "AnnouncementsNotificationTitle", description: "AnnouncementsNotificationBody", checked: false, blocked: false },
			{ id: "custom_fees", title: "CustomFeesNotificationTitle", description: "CustomFeesNotificationBody", checked: false, blocked: false },
		],
	},
	administrative: {
		heading: "AdminNotificationsSectionTitle",
		items: [
			{ id: "access_requests", title: "AccessRequestAdminNotifTitle", description: "AccessRequestAdminNotifBody", checked: true, blocked: false },
			{ id: "new_user_registrations", title: "NewRegisAdminNotifTitle", description: "NewRegisAdminNotifBody", checked: false, blocked: false },
		],
	},
};

@Component({
	selector: "app-notifications",
	standalone: true,
	imports: [FormsModule, CommonModule, GaTrackDirective, Panel, ToggleSwitch, Message, SkeletonModule, TermPipe],
	templateUrl: "./notifications.component.html",
	host: { class: "profile" },
})
export class NotificationsComponent implements OnDestroy {
	readonly termService = inject(GlobalTermService);
	isReady = computed(() => this.termService.TermsReady() && !!this.state.notificationSettings());
	private readonly notificationsService = inject(NotificationsService);
	private readonly state = inject(AccountSettingsStateService);
	private readonly session = inject(SessionService);
	private readonly destroy$ = new Subject<void>();
	private readonly saveSubject = new Subject<void>();

	notificationPreferences = signal<NotificationPreferences>(INITIAL_PREFERENCES);
	isSaving = signal<boolean>(false);

	emailNotificationsMasters = computed(() => this.notificationPreferences().email.masters);
	emailNotificationsItems = computed(() => this.notificationPreferences().email.items);
	administrativeNotificationsItems = computed(() => this.notificationPreferences().administrative.items);
	isEmailMasterOff = signal<boolean>(false);

	constructor() {
		this.saveSubject.pipe(debounceTime(600), takeUntil(this.destroy$)).subscribe(() => this.save());
		effect(() => {
			const settings = this.state.notificationSettings();
			if (!settings) return;
			const mapped = fromApiResponse(settings);
			this.notificationPreferences.set(applyToPreferences(INITIAL_PREFERENCES, mapped));
			this.isEmailMasterOff.set(!mapped.emailMaster);
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	OnToggleChange(item: { id: string; checked: boolean; alert?: { visible: boolean } }, value: boolean): void {
		item.checked = value;
		if (item.alert) item.alert.visible = true;
		if (item.id === "email_master") this.isEmailMasterOff.set(!value);
		this.saveSubject.next();
	}

	private save(): void {
		const command = toUpdateCommand(this.session.businessUserID(), this.notificationPreferences());
		this.isSaving.set(true);
		if(!command.emailNotificationMaster) {
			command.customFees = false;
			command.newFee = false;
			command.optOut = false;
			command.penalty = false;
			command.announcements = false;
		}
		this.notificationsService.updateSettings(command).subscribe({
			next: () => this.isSaving.set(false),
			error: err => {
				this.isSaving.set(false);
				console.error("updateSettings error:", err);
			},
		});
	}
}
