import { inject, Injectable, OnDestroy } from "@angular/core";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { getCookie } from "typescript-cookie";
import { AlertButtonMode, AlertService, CloseSessionService, ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { SecurityHttpService } from "../http-service/security.http.service";
@Injectable({ providedIn: "root" })
export class SessionInactivityService implements OnDestroy {
	private readonly configService = inject(ConfigService);
	private readonly closeSessionService = inject(CloseSessionService);
	private readonly alertService = inject(AlertService);
	private readonly globalTermService = inject(GlobalTermService);
	private readonly termPipe = inject(TermPipe);
	private readonly securityHttpService = inject(SecurityHttpService);
	private hubConnection: HubConnection | null = null;
	initialize(): void {
		const refreshTokenID = getCookie("refreshToken");
		if (!refreshTokenID) return;
		const hubUrl = `${this.configService.environment?.signalPath}/session-inactivity`;
		this.hubConnection = new HubConnectionBuilder().withUrl(hubUrl, { withCredentials: true }).withAutomaticReconnect().build();
		this.hubConnection.on("Disconnect", () => {
			this.handleDisconnect(refreshTokenID);
		});
		this.hubConnection.onreconnected(connectionId => {
			const token = getCookie("refreshToken");
			if (token) this.connect(token);
			else console.warn("[SessionInactivity] No refreshToken after reconnect — not rejoining group");
		});
		this.hubConnection.onclose(err => {
			console.warn("[SessionInactivity] Connection closed", err);
		});
		this.hubConnection
			.start()
			.then(() => {
				this.connect(refreshTokenID);
			})
			.catch(err => console.error("[SessionInactivity] Connection error:", err));
	}
	private async handleDisconnect(accessInformationID: string): Promise<void> {
		if (!accessInformationID) {
			this.closeSessionService.closeSession();
			return;
		}
		const title = this.termPipe.transform("SessionInactivity", this.globalTermService.languageCode);
		const result = await this.alertService.warning(title, undefined, AlertButtonMode.CONFIRM_CANCEL);
		if (result.isConfirmed) {
			this.securityHttpService.UpdateLastActivity(accessInformationID).subscribe();
		} else {
			this.securityHttpService.UpdateExpirationDate(accessInformationID).subscribe({
				complete: () => this.closeSessionService.closeSession(),
			});
		}
	}
	private connect(refreshTokenID: string): void {
		this.hubConnection
			?.invoke("Connect", refreshTokenID)
			.then(() => console.log("[SessionInactivity] Connect invoked successfully"))
			.catch(err => console.error("[SessionInactivity] Connect error:", err));
	}
	ngOnDestroy(): void {
		this.hubConnection?.stop();
	}
}
