import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { ProfileService } from './profile/profile.service';
import { UserResponse, ConfigMetadataResponse } from './profile/dto/profile-update.dto';
import { SecurityService } from './security/security.service';
import { SecurityStatusResponse } from './security/dto/password-update.dto';
import { TeamsService } from './teams/teams.service';
import { TeamMembersResponse } from './teams/dto/member.dto';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationSettingsResponse } from './notifications/dto/notification-settings.dto';
import { SessionService } from '../common/session/session.service';

@Injectable({ providedIn: 'root' })
export class AccountSettingsStateService {
	private readonly profileService = inject(ProfileService);
	private readonly securityService = inject(SecurityService);
	private readonly teamsService = inject(TeamsService);
	private readonly notificationsService = inject(NotificationsService);
	private readonly session = inject(SessionService);

	user = signal<UserResponse | null>(null);
	configMetadata = signal<ConfigMetadataResponse | null>(null);
	securityStatus = signal<SecurityStatusResponse | null>(null);
	teamMembers = signal<TeamMembersResponse[]>([]);
	notificationSettings = signal<NotificationSettingsResponse | null>(null);

	load(): void {
		const businessUserID = this.session.businessUserID();
		forkJoin({
			user: this.profileService.getById(businessUserID),
			metadata: this.profileService.getConfigMetadata('workroles,businessworks'),
			security: this.securityService.getSecurityStatus(businessUserID),
			members: this.session.isAdmin() ? this.teamsService.listTeamMembers() : of([] as TeamMembersResponse[]),
			notifications: this.notificationsService.getSettings(businessUserID),
		}).subscribe({
			next: ({ user, metadata, security, members, notifications }) => {
				this.user.set(user);
				this.configMetadata.set(metadata);
				this.securityStatus.set(security);
				this.teamMembers.set(members);
				this.notificationSettings.set(notifications);
			},
			error: (err) => console.error('AccountSettingsState load error:', err),
		});
	}

	reloadSecurityStatus(): void {
		this.securityService.getSecurityStatus(this.session.businessUserID()).subscribe({
			next: (data) => this.securityStatus.set(data),
			error: (err) => console.error('reloadSecurityStatus error:', err),
		});
	}

	reloadTeamMembers(): void {
		if (!this.session.isAdmin()) return;
		this.teamsService.listTeamMembers().subscribe({
			next: (members) => this.teamMembers.set(members),
			error: (err) => console.error('reloadTeamMembers error:', err),
		});
	}
}
