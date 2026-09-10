import { Component, computed, inject, input, output } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { GlobalTermService } from "intelica-library-base";
import { MenuItem } from "primeng/api";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { ButtonModule } from "primeng/button";
import { BadgeModule } from "primeng/badge";
import { DialogModule } from "primeng/dialog";
import { Skeleton } from "primeng/skeleton";
import { ModalReferenceComponent } from "../modal-reference/modal-reference";
import { FeeDetailInfoResponse } from "../dto/fee-detail.dto";
import { FEE_DETAIL_BREADCRUMB_DEFAULT, FEE_DETAIL_TERM } from "../common/constants";
import { CommonGlobalService } from "../../common/services/common.service";
import { FeeDetailOrigin } from "../../common/DTO/fee-detail-origin";

@Component({
	selector: "fee-title",
	standalone: true,
	imports: [BreadcrumbModule, ButtonModule, BadgeModule, DialogModule, Skeleton, ModalReferenceComponent, RouterModule],
	templateUrl: "./title.html",
})
export class TitleComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	private readonly router = inject(Router);

	public loading = input<boolean>(false);
	public overviewData = input<FeeDetailInfoResponse | null>(null);
	public hasAlert = input<boolean>(false);
	public originTrail = input<FeeDetailOrigin[]>([]);

	public showReference = output<void>();
	public setAlert = output<void>();

	public visibleItems = computed<MenuItem[]>(() => {
		const levels = this.resolvedTrail().map(level => ({
			label: this.commonGlobalService.termText(level.labelKey),
			routerLink: level.path || undefined,
		}));
		return [...levels, { label: this.commonGlobalService.termText(this.feeDetailTerm.FEE_DETAILS) }];
	});

	private resolvedTrail(): FeeDetailOrigin[] {
		const trail = this.originTrail().filter(level => !!level.labelKey);
		return trail.length ? trail : [FEE_DETAIL_BREADCRUMB_DEFAULT];
	}

	public referenceModal = false;

	public openReferenceModal(): void {
		this.referenceModal = true;
		this.showReference.emit();
	}

	public onSetAlert(): void {
		this.setAlert.emit();
	}

	public onBack(): void {
		const target = [...this.resolvedTrail()].reverse().find(level => !!level.path);
		this.router.navigateByUrl(target?.path ?? FEE_DETAIL_BREADCRUMB_DEFAULT.path);
	}
}
