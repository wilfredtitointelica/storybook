import { Routes } from "@angular/router";
import { PageRootChildGuard } from "intelica-library-base";
import { OptOutService } from "./opt-out-service";
import { OptOutServicesDashboard } from "./components/opt-out-services-dashboard/opt-out-services-dashboard";
import { TopOptOutSubscriptions } from "./components/top-opt-out-subscriptions/top-opt-out-subscriptions";
import { OptOutSavings } from "./components/opt-out-savings/opt-out-savings";
import { UpcomingOptOuts } from "./components/upcoming-opt-outs/upcoming-opt-outs";

export const OPT_OUT_SERVICE_ROUTES: Routes = [
	{
		path: "",
		component: OptOutService,
		data: {
			pageRoot: "OptOutServicesExternalNew",
		},
		canActivateChild: [PageRootChildGuard],
		children: [
			{ path: "dashboard", component: OptOutServicesDashboard },
			{ path: "top-subscriptions", component: TopOptOutSubscriptions },
			{ path: "top-subscriptions/:returnFrom", component: TopOptOutSubscriptions },
			{ path: "savings", component: OptOutSavings },
			{ path: "savings/:returnFrom", component: OptOutSavings },
			{ path: "upcoming", component: UpcomingOptOuts },
			{ path: "", redirectTo: "dashboard", pathMatch: "full" },
			{ path: "**", redirectTo: "dashboard" },
		],
	},
];
