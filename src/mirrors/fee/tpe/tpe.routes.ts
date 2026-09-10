import { Routes } from '@angular/router';
import { PageRootChildGuard } from 'intelica-library-base';
import { TpeDashboard } from './tpe-dashboard/tpe-dashboard.component';
import { TpeMerchantReport } from './tpe-merchant-report/tpe-merchant-report.component';
import { TpePenaltiesPaid } from './tpe-penalties-paid/tpe-penalties-paid.component';
import { TpeRecomendations } from './tpe-recomendations/tpe-recomendations.component';
import { TpeComponent } from './tpe.component';

export const TPE_ROUTES: Routes = [
	{
		path: "",
		component: TpeComponent,
		data: {
			pageRoot: "TPE",
		},
		canActivateChild: [PageRootChildGuard],
		children: [
			{ path: "dashboard", component: TpeDashboard },
			{ path: "penalties-paid", component: TpePenaltiesPaid },
			{ path: "merchant-report", component: TpeMerchantReport },
			{ path: "merchant-report/:returnFrom", component: TpeMerchantReport },
			{ path: "recomendations", component: TpeRecomendations },
			{ path: "", redirectTo: "dashboard", pathMatch: "full" },
			{ path: "**", redirectTo: "dashboard" },
		],
	},
];
