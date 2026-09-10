import { DecimalPipe } from "@angular/common";
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { IntelicaAlertComponent } from "intelica-library-base";
import { TruncatePipe, FormatAmountPipe } from "intelica-library-project";
import { TpeFilter } from "./tpe-filter/tpe-filter.component";

@Component({
	imports: [RouterOutlet, TpeFilter, IntelicaAlertComponent],
	providers: [FormatAmountPipe, DecimalPipe, TruncatePipe],
	templateUrl: "./tpe.component.html",
	styles: ``,
})
export class TpeComponent {}
