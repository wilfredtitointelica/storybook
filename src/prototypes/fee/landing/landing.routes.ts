import { Routes } from "@angular/router";
import { PageRootChildGuard } from "intelica-library-base";
import { Landing } from "./landing";
import { LandingDashboard } from "./components/landing-dashboard/landing-dashboard";

export const LANDING_ROUTES: Routes = [
	{
		path: "",
		component: LandingDashboard,
		data: {
			pageRoot: "LandingExternalNew",
		},
		canActivateChild: [PageRootChildGuard],
		children: [
			{ path: "dashboard", component: LandingDashboard },
			{ path: "", redirectTo: "dashboard", pathMatch: "full" },
			{ path: "**", redirectTo: "dashboard" },
		],
	},
];
