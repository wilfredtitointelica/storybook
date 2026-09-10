import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { InputNumberModule } from "primeng/inputnumber";
import { PaginatorModule, PaginatorState } from "primeng/paginator";
import { SelectModule } from "primeng/select";

@Component({
	selector: "fee-intelica-paginator",
	templateUrl: "./paginator.component.html",
	imports: [TermPipe, PaginatorModule, SelectModule, InputNumberModule, CommonModule, FormsModule],
})
export class PaginatorComponent {
	@Input() first: number = 0;
	@Input() rows: number = 10;
	@Input() totalRecords: number = 0;
	@Input() options: Array<{ label: number; value: number }> = [];
	@Input() valueNumber: number = 1;
	@Input() totalPages: number = 1;
	@Output() pageChange = new EventEmitter<PaginatorState>();
	@Output() rowsPerPageChange = new EventEmitter<number>();
	public readonly globalTermService = inject(GlobalTermService);
	private readonly termPipe = inject(TermPipe);
	pageInputValue: number | null = 1;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["valueNumber"]) {
			this.pageInputValue = this.valueNumber;
		}
	}

	onRowsChanged(rows: number): void {
		this.rowsPerPageChange.emit(Number(rows) || 10);
	}

	onPageInputApply(): void {
		const pageNumber = Number(this.pageInputValue);
		const targetPage = Number.isInteger(pageNumber) && pageNumber >= 1 ? pageNumber : 1;
		this.pageInputValue = targetPage;

		if (targetPage === this.valueNumber) {
			return;
		}

		this.updatePage(targetPage);
	}

	private updatePage(pageNumber: number): void {
		this.pageChange.emit({
			first: (pageNumber - 1) * this.rows,
			rows: this.rows,
			page: pageNumber - 1,
			pageCount: this.totalPages,
		});
	}
}
