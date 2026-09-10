import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GaTrackDirective } from "../../shared/analitycs";
import { Panel } from "primeng/panel";
import { Badge } from "primeng/badge";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Skeleton } from "primeng/skeleton";
import { AnnouncementItem } from "./announcements.interface";
import { AlertService, GlobalTermService, TermPipe } from "intelica-library-base";
import { LandingService } from "../../landing.service";
import { BusinessEnum } from "../../common/enums/landing.enum";
import { BrandHelper } from "../../../common/helpers/common.helper";
import { StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { OptOutServicesService } from "../../../opt-out-service/opt-out-service.service";
import { TooltipModule } from "primeng/tooltip";
import moment from "moment";
@Component({
	selector: "fee-announcements",
	imports: [CommonModule, GaTrackDirective, Panel, Badge, Button, Dialog, Skeleton, TermPipe, StatusStateComponent, TooltipModule],
	templateUrl: "./announcements.html",
})
export class Announcements {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly landingService = inject(LandingService);
	private readonly optOutService = inject(OptOutServicesService);
	private readonly termPipe = inject(TermPipe);
	private readonly alertService = inject(AlertService);

	private _isloadingUpcomingAnnouncements = signal<boolean>(false);
	private _refresh = signal<number>(0);
	private _hasError = signal<boolean>(false);

	public isloadingUpcomingAnnouncements = computed(() => this._isloadingUpcomingAnnouncements());
	private refresh = computed(() => this._refresh());
	public hasError = computed(() => this._hasError());

	public dataUpcomingAnnouncements = this.landingService.buildLandingSignal(() => this.landingService.getUpcomingAnnouncements(), this._isloadingUpcomingAnnouncements, this.refresh, this._hasError);

	public businessEnum = BusinessEnum;
	public statusStateEnum = StatusStateEnum;

	public announcementsData = computed<AnnouncementItem[]>(() =>
		(this.dataUpcomingAnnouncements()?.table ?? []).map(item => ({
			documentId: item.documentId,
			brandId: item.brandId,
			brandIcon: BrandHelper.getIcon(item.brandId),
			finantialTitle: item.finantialTitle,
			financialImpactType: item.financialImpactType,
			business: item.business,
			effectiveDateShort: item.effectiveDateShort,
			finantialDescription: item.finantialDescription,
		}))
	);

	public announcementsCount = computed(() => this.dataUpcomingAnnouncements()?.bannerCount);

	public hasAnnouncements = computed<boolean>(() => (this.dataUpcomingAnnouncements()?.table?.length ?? 0) > 0);

	// --- announcement ( solo demo maqueta ) ---
	public selectedAnnouncement = signal<AnnouncementItem | null>(null);
	public isAnnouncementDialogVisible = signal<boolean>(false);

	ngOnInit() {}

	reload() {
		this._refresh.update(n => n + 1);
	}

	goToDetails(): void {
		const baseUrl = window.location.origin.replace("incontrolappnew", "incontrolapp");
		window.location.href = `${baseUrl}/fee/brandfile/list`;
	}

	showAnnouncementDialog(announcement: AnnouncementItem): void {
		this.selectedAnnouncement.set(announcement);
		this.isAnnouncementDialogVisible.set(true);
	}

	onClickAnnouncement() {
		const documentId = this.selectedAnnouncement()?.documentId ?? 0;
		if (documentId == null || documentId == 0) return;
		this.optOutService.downloadDocument(documentId).subscribe({
			next: response => {
				if (!response.body) return;
				const contentType = response.body?.type || "";

				const fileName = this.optOutService.getFileNameFromHeader(response) ?? `document_${moment().format("YYYYMMDD")}`;

				if (contentType.toLowerCase().includes("pdf")) {
					this.optOutService.viewFile(fileName, { body: response.body });
				} else {
					this.optOutService.downloadFile(fileName, response);
				}
			},
			error: () => {
				this.alertService.message(this.termPipe.transform("FileNotFound", this.globalTermService.languageCode));
			},
			complete: () => {},
		});
	}
}
