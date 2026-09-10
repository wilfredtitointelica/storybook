import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ConfigService,
  GlobalTermService,
  TermPipe,
  CookieAttributesGeneral,
  GetCookieAttributes,
  CloseSessionService,
  GoogleTaskManagerService,
} from 'intelica-library-base';
import { Button } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';
import { navigateToUrl } from 'single-spa';
import { Cookies, getCookie, setCookie } from 'typescript-cookie';
import { ActivatedRoute } from '@angular/router';
import { UserProfileHttpService } from './user-profile.http.service';
import { AuthenticationProfileCommand } from './dto/profile.dto';
class Profile {
  id: string;
  name: string;
  businessUserClientGroupID: string;
  clientGroupID: string;
  clientID: string;
  languageID: string;
  constructor() {
    this.id = '';
    this.name = '';
    this.businessUserClientGroupID = '';
    this.clientGroupID = '';
    this.clientID = '';
    this.languageID = '';
  }
}
@Component({
  selector: 'user-profile',
  imports: [FormsModule, Select, Button, Popover, TermPipe],
  templateUrl: './user-profile.html',
})
export class UserProfile implements OnInit {
  private readonly configService = inject(ConfigService);
  public readonly globalTermService = inject(GlobalTermService);
  private readonly userProfileHttpService = inject(UserProfileHttpService);
  private readonly closeSessionService = inject(CloseSessionService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly googleTaskManagerService = inject(GoogleTaskManagerService);
  businessUserID: string = '';
  userProfile = signal<Profile[]>([]);
  originalProfile = signal<Profile | null>(new Profile());
  selectedUserProfile = signal<Profile | null>(new Profile());
  activeButton = signal<boolean>(false);
  displayName = computed(() => {
    const fullName = this.configService.SessionInformation?.fullName ?? '';
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : '';
    return lastInitial ? `${firstName} ${lastInitial}` : firstName;
  });
  isInternal = signal<boolean | null>(null);
  ngOnInit() {
    this.businessUserID = this.configService.SessionInformation?.businessUserID ?? '';
    this.getClientGroupsByUser();
    this.initialIsInternal();
  }
  private initialIsInternal(): void {
    if (this.isInternal() !== null) return;
    const stored = sessionStorage.getItem('isInternal');
    if (stored !== null) {
      this.isInternal.set(stored === 'true');
      return;
    }
    if (this.configService.SessionInformation) {
      const value = this.configService.SessionInformation.isInternal;
      sessionStorage.setItem('isInternal', String(value));
      this.isInternal.set(value);
    }
  }
  getClientGroupsByUser() {
    this.userProfileHttpService.getClientGroupsByUser().subscribe((response) => {
      const profiles = response.flatMap((d) => {
        const groups = [];
        if (d.isGroup) {
          groups.push({
            id: `P|${d.clientGroupID}`,
            name: d.intelicaName,
            businessUserClientGroupID: d.businessUserClientGroupID,
            clientGroupID: d.clientGroupID,
            clientID: null,
            languageID: d.languageID,
          });
        }
        groups.push(
          ...d.clientDetails.map((element: any) => ({
            id: `C|${element.clientID}`,
            name: element.intelicaName,
            businessUserClientGroupID: d.businessUserClientGroupID,
            clientGroupID: d.clientGroupID,
            clientID: element.clientID,
            languageID: element.languageID,
          })),
        );
        return groups;
      });
      this.userProfile.set(profiles);
      const clientID = getCookie('defaultClientID');
      const clientGroupID = getCookie('defaultClientGroupID');
      const profileID = clientID ? `C|${clientID}` : `P|${clientGroupID}`;
      const profile = this.userProfile().find((p) => p.id === profileID);
      this.selectedUserProfile.set(profile ?? new Profile());
      this.googleTaskManagerService.pushEvent('ProfileLoaded', {
        id: profile?.id,
        profileClientID: profile?.clientID,
        profileClientGroupID: profile?.clientGroupID,
        businessUserID: this.businessUserID,
        businessuserTypeName: this.configService.SessionInformation?.businessuserTypeName,
      });
    });
  }
  onSettings(): void {
    navigateToUrl('/security/settings/profile');
  }
  onSingOut() {
    sessionStorage.clear();
    this.activatedRoute.queryParamMap.subscribe((params: any) => {
      this.closeSessionService.closeSession();
    });
  }
  onProfileChange(value: Profile, popover: any) {
    requestAnimationFrame(() => {
      this.selectedUserProfile.set(value);
      popover.align();
    });
    const request: AuthenticationProfileCommand = {
      businessUserClientGroupID: value.businessUserClientGroupID,
      businessUserID: this.businessUserID,
      clientGroupID: value.clientGroupID,
      clientID: value.clientID,
      authenticationClientID: this.configService.environment?.clientID!,
      callBack: `${window.location.origin}/`,
      languageID: value.languageID,
    };
    this.userProfileHttpService.validateAuthentication(request).subscribe((response) => {
      //Este metodo existe por que si se usa el login o authentication publicado, el dominio es `dev.intelica.com` y no `localhost` y no se sobreescriben las cookies
      // Por eso es necesario en este caso como en setsessioninformation escribir las cookies manualmente
      if (window.location.hostname == 'localhost') {
        const cookieAttributesGeneral = GetCookieAttributes(
          this.configService.environment?.environment ?? '',
        );
        Object.keys(Cookies.get() ?? {}).forEach((cookieName) => {
          Cookies.remove(cookieName, cookieAttributesGeneral);
        });
        let data = JSON.stringify(response.authenticationData);
        setCookie('token', response.jwtToken, CookieAttributesGeneral);
        setCookie('refreshToken', response.refreshToken, CookieAttributesGeneral);
        setCookie('data', data, CookieAttributesGeneral);
        setCookie(
          'businessUserClientGroupID',
          response.businessUserClientGroupID,
          CookieAttributesGeneral,
        );
        setCookie('language', response.languageCode, CookieAttributesGeneral);
        if (response.clientID != null)
          setCookie('defaultClientID', response.clientID, CookieAttributesGeneral);
        response.businessUserAuthClient.forEach((element) => {
          setCookie(element.authClientID, element.compressedPages, cookieAttributesGeneral);
        });
        setCookie('defaultClientGroupID', response.clientGroupID, CookieAttributesGeneral);
        setCookie('profile', response.profile, cookieAttributesGeneral);
        setCookie('ITLNW', response.refreshToken, cookieAttributesGeneral);
      }
      window.location.reload();
    });
  }
}
