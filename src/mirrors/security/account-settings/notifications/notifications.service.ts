import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'intelica-library-base';
import { Observable } from 'rxjs';
import { NotificationSettingsResponse, UpdateNotificationCommand } from './dto/notification-settings.dto';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    private readonly http = inject(HttpClient);
    private readonly _configService = inject(ConfigService);

    getSettings(businessUserID: string): Observable<NotificationSettingsResponse> {
        return this.http.get<NotificationSettingsResponse>(`${this._configService.environment?.securityPath}/UserAlert/${businessUserID}`);
    }

    updateSettings(command: UpdateNotificationCommand): Observable<NotificationSettingsResponse> {
        return this.http.put<NotificationSettingsResponse>(`${this._configService.environment?.securityPath}/UserAlert`, command);
    }
}
