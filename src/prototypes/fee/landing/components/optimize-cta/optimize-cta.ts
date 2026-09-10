import { Component, inject } from "@angular/core";
// --- directives ---
import { GaTrackDirective } from "../../shared/analitycs";
// --- components ---
import { Panel } from "primeng/panel";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
// --- demo ---
import { GlobalTermService, TermPipe, ConfigService } from "intelica-library-base";
import { LandingService } from "../../landing.service";
import { AlertService, AlertType, IntelicaAlertComponent } from "intelica-library-base";
import { BUSINESS_USER_TYPE } from "../../../common/constants/businessusertype";
@Component({
	selector: "fee-optimize-cta",
	imports: [GaTrackDirective, Panel, Button, IntelicaAlertComponent, TermPipe],
	templateUrl: "./optimize-cta.html",
})
export class OptimizeCta {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly landingService = inject(LandingService);
	private readonly alertService = inject(AlertService);
	private readonly termPipe = inject(TermPipe);
	private readonly configService = inject(ConfigService);

	public isSendingAnalysis = false;
	private hasSentAnalysis = false;

	ngOnInit() {}

	ShowAlertCallout(type: "success" | "error") {
		var alertMessage = {
			success: {
				title: this.termPipe.transform("REQUEST_RECEIVED", this.globalTermService.languageCode),
				subtitle: this.termPipe.transform("REQUEST_RECEIVED_MESSAGE", this.globalTermService.languageCode),
				customIcon: "icon icon-sent",
				buttons: {
					confirmText: "Ok",
				},
			},
			error: {
				type: AlertType.ERROR,
				title: this.termPipe.transform("SOMETHING_WENT_WRONG", this.globalTermService.languageCode),
				subtitle: this.termPipe.transform("SOMETHING_WENT_WRONG_MESSAGE", this.globalTermService.languageCode),
				customIcon: "icon icon-overlay-error",
				buttons: {
					confirmText: "Back",
				},
			},
		};
		this.alertService.show(alertMessage[type] as Parameters<AlertService["show"]>[0]);
	}

	SendAnalysis(): void {
		if (this.isSendingAnalysis || this.hasSentAnalysis) {
			return;
		}
		if (this.configService.SessionInformation!.businessuserTypeName === BUSINESS_USER_TYPE.INTELICA) {
			this.alertService.warning("", this.termPipe.transform("SEND_SUPPORT_MAIL_NOT_ALLOWED", this.globalTermService.languageCode)).then((_) => {});
			return;
		}
		this.isSendingAnalysis = true;
		this.landingService.sendAnalytics().subscribe({
			next: (boolean) => {
				if (boolean) {
					this.hasSentAnalysis = true;
					this.ShowAlertCallout("success");
				} else {
					this.ShowAlertCallout("error");
				}
				this.isSendingAnalysis = false;
			},
			error: () => {
				this.ShowAlertCallout("error");
				this.isSendingAnalysis = false;
			},
		});
	}
}
