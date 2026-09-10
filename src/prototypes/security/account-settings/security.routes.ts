import { Routes } from "@angular/router";

import { AccountSettingsComponent } from "../account-settings/account-settings.component";
import { ProfileComponent } from "../account-settings/profile/profile.component";
import { TeamsComponent } from "../account-settings/teams/teams.component";
import { SecurityComponent } from "../account-settings/security/security.component";
import { NotificationsComponent } from "../account-settings/notifications/notifications.component";
import { adminGuard } from "../common/guards/admin.guard";
import { PageRootChildGuard } from "intelica-library-base";

export const SECURITY_ROUTES: Routes = [
	{
		path: "",
		component: AccountSettingsComponent,
		data: { title: "Account Settings", pageRoot: "Security-Settings" },
		canActivateChild: [PageRootChildGuard],
		children: [
			{ path: "", redirectTo: "profile", pathMatch: "full" },
			{ path: "profile", component: ProfileComponent },
			{ path: "teams", component: TeamsComponent, canActivate: [adminGuard] },
			{ path: "security", component: SecurityComponent },
			{ path: "notifications", component: NotificationsComponent },
		],
	},
];
