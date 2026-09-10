import { NotificationPreferences } from './notification.interface';
import { NotificationSettingsResponse, UpdateNotificationCommand } from './dto/notification-settings.dto';

interface NotificationSettings {
    emailMaster: boolean;
    newFees: boolean;
    penalties: boolean;
    optOut: boolean;
    announcements: boolean;
    customFees: boolean;
    accessRequests: boolean;
    newUserRegistrations: boolean;
}

const ITEM_ID_TO_FIELD: Record<string, keyof NotificationSettings> = {
    'email_master':           'emailMaster',
    'new_fees':               'newFees',
    'penalties':              'penalties',
    'opt_out':                'optOut',
    'announcements':          'announcements',
    'custom_fees':            'customFees',
    'access_requests':        'accessRequests',
    'new_user_registrations': 'newUserRegistrations',
};

export function fromApiResponse(r: NotificationSettingsResponse): NotificationSettings {
    return {
        emailMaster:         r.emailNotificationMaster,
        newFees:             r.newFee,
        penalties:           r.penalty,
        optOut:              r.optOut,
        announcements:       r.announcements,
        customFees:          r.customFees,
        accessRequests:      r.accessRequests,
        newUserRegistrations: r.newUserRegistrations,
    };
}

export function applyToPreferences(
    prefs: NotificationPreferences,
    settings: NotificationSettings
): NotificationPreferences {
    const applyChecked = (items: any[] | undefined) =>
        items?.map(item => {
            const field = ITEM_ID_TO_FIELD[item.id];
            return field !== undefined ? { ...item, checked: settings[field] } : { ...item };
        });

    return {
        email: {
            ...prefs.email,
            masters: applyChecked(prefs.email.masters) as any,
            items:   applyChecked(prefs.email.items) as any,
        },
        administrative: {
            ...prefs.administrative,
            items: applyChecked(prefs.administrative.items) as any,
        },
    };
}

export function toUpdateCommand(
    businessUserID: string,
    prefs: NotificationPreferences
): UpdateNotificationCommand {
    const all = [
        ...(prefs.email.masters ?? []),
        ...(prefs.email.items ?? []),
        ...(prefs.administrative.items ?? []),
    ];
    const get = (id: string): boolean => all.find(i => i.id === id)?.checked ?? false;

    return {
        businessUserID,
        emailNotificationMaster: get('email_master'),
        newFee:                  get('new_fees'),
        penalty:                 get('penalties'),
        optOut:                  get('opt_out'),
        announcements:           get('announcements'),
        customFees:              get('custom_fees'),
        accessRequests:          get('access_requests'),
        newUserRegistrations:    get('new_user_registrations'),
    };
}
