import { Routes } from "@angular/router";
import { AlertsComponent } from "./alerts.component";

export const ALERTS_ROUTES: Routes = [
	{
		path: "",
		component: AlertsComponent,
		data: {
			pageRoot: "FeeAlerts",
		},
	},
];
