import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/home']);
    return false;
  }

  const expectedRoles = route.data['roles'] as Array<string>;
  const userRole = authService.getUserRole();

  if (expectedRoles && !expectedRoles.includes(userRole || '')) {
    authService.redirectBasedOnRole();
    return false;
  }

  return true;
};
