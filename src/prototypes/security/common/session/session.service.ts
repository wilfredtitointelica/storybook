import { computed, Injectable, signal } from '@angular/core';
import { getCookie } from 'typescript-cookie';
import { UserSession } from './session.model';

/**
 * Raw shape of the `data` cookie as set by the authentication layer.
 * Internal to this file — consumers always receive the typed `UserSession`.
 */
interface DataCookieRaw {
	name: string;
	fullName: string;
	email: string;
	businessUserID: string;
	isAdmin: boolean;
	businessuserTypeName: string;
	callBack: string;
	isGroup: boolean;
	isInternal: boolean;
	clientGroupID: string;
	callBackSecurityQuestions: string;
	callBackLink: string;
	organizationName: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
	private readonly _session = signal<UserSession | null>(this.parse());

	/** Full session snapshot. Prefer named computed signals below for template bindings. */
	readonly session = this._session.asReadonly();

	// --- Convenience signals for the most-used fields ---
	readonly businessUserID  = computed(() => this._session()?.businessUserID  ?? '');
	readonly clientGroupID   = computed(() => this._session()?.clientGroupID   ?? '');
	readonly isAdmin         = computed(() => this._session()?.isAdmin         ?? false);
	readonly fullName         = computed(() => this._session()?.fullName         ?? '');
	readonly email            = computed(() => this._session()?.email            ?? '');
	readonly organizationName = computed(() => this._session()?.organizationName ?? '');

	private parse(): UserSession | null {
		try {
			const raw = getCookie('data');
			if (!raw) return null;

			const cookie = JSON.parse(decodeURIComponent(raw)) as DataCookieRaw;

			return {
				businessUserID:           cookie.businessUserID            ?? '',
				clientGroupID:            cookie.clientGroupID             ?? '',
				name:                     cookie.name                      ?? '',
				fullName:                 cookie.fullName                  ?? '',
				email:                    cookie.email                     ?? '',
				isAdmin:                  cookie.isAdmin                   ?? false,
				isGroup:                  cookie.isGroup                   ?? false,
				isInternal:               cookie.isInternal                ?? false,
				businessUserTypeName:     cookie.businessuserTypeName      ?? '',
				callBack:                 cookie.callBack                  ?? '',
				callBackSecurityQuestions: cookie.callBackSecurityQuestions ?? '',
				callBackLink:             cookie.callBackLink               ?? '',
				organizationName:         cookie.organizationName           ?? '',
			};
		} catch {
			return null;
		}
	}
}
