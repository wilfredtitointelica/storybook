import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { TabsModule } from "primeng/tabs";
import { SkeletonModule } from "primeng/skeleton";
import { ButtonModule } from "primeng/button";
import { FileSharingFilterRequest } from "../DTO/request";
import { FileCategoryResponse } from "../DTO/response";
import { CommonService } from "../domain/common.service";
import { FormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";
import { TagModule } from "primeng/tag";
import { AlertService, AlertType, GlobalTermService, TermPipe } from "intelica-library-base";
@Component({
	selector: "fee-modal-advanced-filter",
	imports: [DialogModule, TabsModule, SkeletonModule, ButtonModule, CheckboxModule, FormsModule, TagModule, TermPipe],
	templateUrl: "./modal-advanced-filter.html",
	styleUrl: "./modal-advanced-filter.css",
})
export class ModalAdvancedFilter {
	@Input() visibleLg = false;
	@Input() categorySelectedVisual: number[] = [];
	@Input() fileSharingFilteRequestTemp: FileSharingFilterRequest = {} as FileSharingFilterRequest;
	@Input() ListCategory: FileCategoryResponse[] = [];
	@Input() loading = true;
	@Input() busy = false;
	@Output() onClickApplyFilter: EventEmitter<FileSharingFilterRequest> = new EventEmitter();
	@Output() closeDialogAdvanceFilter: EventEmitter<boolean> = new EventEmitter();
	readonly GlobalTermService = inject(GlobalTermService);
	private readonly termPipe = inject(TermPipe);
	private readonly alertService = inject(AlertService);
	private readonly commonFileSharingService = inject(CommonService);

	// El chip refleja lo APLICADO (igual que library: aparece al aplicar, no al seleccionar).
	get categoryChipLabel(): string {
		return this.commonFileSharingService.buildAdvancedFilterChipLabel(this.fileSharingFilteRequestTemp.categorySelected, this.ListCategory);
	}
	removeAppliedCategory() {
		if (this.busy) return;
		this.fileSharingFilteRequestTemp.categorySelected = [];
		this.categorySelectedVisual = [];
		this.onClickApplyFilter.emit(this.fileSharingFilteRequestTemp);
	}

	ngOnInit() {
		this.validateCategory();
	}
	ngOnChanges(changes: any): void {
		if (changes.visibleLg?.currentValue === true) {
			this.validateCategory();
		}
	}
	validateCategory() {
		const applied = this.fileSharingFilteRequestTemp.categorySelected ?? [];
		const valid = new Set(this.ListCategory.map(c => c.categoryId));
		this.categorySelectedVisual = applied.filter(id => valid.has(id));
	}
	applyFilter() {
		this.fileSharingFilteRequestTemp.categorySelected = [...this.categorySelectedVisual];
		this.onClickApplyFilter.emit(this.fileSharingFilteRequestTemp);
		this.closeAllDialogs();
	}

	resetFilter() {
		this.categorySelectedVisual = [];
	}
	isAllSelected(): boolean {
		return this.ListCategory.length > 0 && this.categorySelectedVisual.length === this.ListCategory.length;
	}
	toggleAll(checked: boolean) {
		this.categorySelectedVisual = checked ? this.ListCategory.map(c => c.categoryId) : [];
	}
	async closeAllDialogs() {
		if (this.hasUnappliedChanges()) {
			const result = await this.alertService.confirm(
				this.termPipe.transform("SM_CLOSE_ADVANCED_FILTER_UNSAVED"),
				this.termPipe.transform("SM_ARE_YOU_SURE"),
				this.termPipe.transform("SM_YES"),
				this.termPipe.transform("SM_NO"),
				AlertType.WARNING
			);
			if (!result.isConfirmed) {
				this.visibleLg = true;
				return;
			}
			this.validateCategory();
		}
		this.closeDialogAdvanceFilter.emit(false);
	}

	// Cambios pendientes = selección en el modal distinta a la aplicada (lo que muestran las pastillas)
	private hasUnappliedChanges(): boolean {
		const applied = [...(this.fileSharingFilteRequestTemp.categorySelected ?? [])].filter(id => id !== -1).sort((a, b) => a - b);
		const visual = [...(this.categorySelectedVisual ?? [])].sort((a, b) => a - b);
		if (applied.length !== visual.length) return true;
		return applied.some((v, i) => v !== visual[i]);
	}

	get appliedAdvancedCount(): number {
		return (this.fileSharingFilteRequestTemp.categorySelected ?? []).filter(id => id !== -1).length;
	}
}
