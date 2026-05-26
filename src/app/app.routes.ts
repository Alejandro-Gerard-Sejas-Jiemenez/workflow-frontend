import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/pages/login.component').then(m => m.LoginComponent)
  },
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
    loadComponent: () => import('./features/designer/pages/dashboard/designer-dashboard.component').then(m => m.DesignerDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_DESIGNER'] }
  },
  {
    path: 'designer/workflows/:workflowId',
    loadComponent: () => import('./features/designer/pages/workflow-editor/designer-workflow-editor-page.component').then(m => m.DesignerWorkflowEditorPageComponent),
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
    path: 'employee/tareas/:id',
    loadComponent: () => import('./features/employee/pages/tarea-detail.component').then(m => m.TareaDetailComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_EMPLEADO'] }
  },
  {
    path: 'client',
    loadComponent: () => import('./features/client/pages/client-dashboard.component').then(m => m.ClientDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_CLIENTE'] }
  },
  {
    path: 'client/nuevo-tramite/:workflowId',
    loadComponent: () => import('./features/client/pages/client-request-form.component').then(m => m.ClientRequestFormComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_CLIENTE'] }
  },
  {
    path: 'client/corregir/:id',
    loadComponent: () => import('./features/client/pages/client-correction.component').then(m => m.ClientCorrectionComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_CLIENTE'] }
  },
  {
    path: 'client/seguimiento/:id',
    loadComponent: () => import('./features/client/pages/client-tracking.component').then(m => m.ClientTrackingComponent),
    canActivate: [authGuard],
    data: { roles: ['ROLE_CLIENTE'] }
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
