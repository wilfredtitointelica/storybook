import { Component, computed, inject, signal } from "@angular/core";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { ColumnComponent, TableComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { DialogModule } from "primeng/dialog";
import { Skeleton } from "primeng/skeleton";
import { OptOutServicesService } from "../../opt-out-service.service";

@Component({
	selector: "fee-fees-by-document-configuration",
	imports: [DialogModule, TermPipe, TableComponent, ColumnComponent, Skeleton, StatusStateComponent],
	templateUrl: "./fees-by-document-configuration.html",
})
export class FeesByDocumentConfiguration {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly optOutService = inject(OptOutServicesService);

	private _isloadingTable = signal<boolean>(false);
	private _params = signal<{ clientId: number; opcId: number } | null>(null);
	private _opcName = signal<string>("");

	public isloadingTable = computed(() => this._isloadingTable());
	public opcName = computed(() => this._opcName());
	public readonly statusStateEnum = StatusStateEnum;

	public feesData = this.optOutService.buildEntitySignal(this._params, ({ clientId, opcId }) => this.optOutService.getFeesByDocumentConfiguration(clientId, opcId), this._isloadingTable);

	public rows = computed(() => this.feesData() ?? []);

	public showDialog = false;

	openDialog(opcId: number, opcName: string = "", clientId: number = 0): void {
		this._params.set({ clientId, opcId });
		this._opcName.set(opcName);
		this.showDialog = true;
	}

	onClose() {
		this.showDialog = false;
	}
}
