import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../session/session.service';

export const adminGuard: CanActivateFn = () => {
	const session = inject(SessionService);
	const router = inject(Router);

	if (session.isAdmin()) {
		return true;
	}

	return router.parseUrl('security/settings/profile');
};
