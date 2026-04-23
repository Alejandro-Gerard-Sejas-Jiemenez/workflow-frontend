import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/home/pages/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/pages/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'designer',
    loadComponent: () => import('./features/designer/pages/designer-dashboard.component').then(m => m.DesignerDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_DESIGNER'] }
  },
  {
    path: 'designer/workflows/:workflowId',
    loadComponent: () => import('./features/designer/pages/designer-workflow-editor-page.component').then(m => m.DesignerWorkflowEditorPageComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_DESIGNER'] }
  },
  {
    path: 'employee',
    loadComponent: () => import('./features/employee/pages/employee-dashboard.component').then(m => m.EmployeeDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_EMPLEADO'] }
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
