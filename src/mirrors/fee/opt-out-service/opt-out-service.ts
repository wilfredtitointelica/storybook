import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { OptOutServiceFilter } from "./components/opt-out-service-filter/opt-out-service-filter";

@Component({
	selector: "fee-opt-out-service",
	imports: [RouterOutlet, OptOutServiceFilter],
	templateUrl: "./opt-out-service.html",
	host: {
		class: "opt-out-service",
	},
})
export class OptOutService {}
