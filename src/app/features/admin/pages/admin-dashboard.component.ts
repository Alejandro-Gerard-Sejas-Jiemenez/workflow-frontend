import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Subject, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AdminApiService } from '../services/admin-api.service';
import { AdminUserCreate, AdminUserUpdate, AdminDepartment, EMPTY_ADMIN_DASHBOARD } from '../data/admin-dashboard.data';
import { AdminUserManagementComponent } from '../components/admin-user-management/admin-user-management.component';
import { AdminUserCreatorComponent } from '../components/admin-user-creator/admin-user-creator.component';
import { AdminDepartmentManagementComponent } from '../components/admin-department-management/admin-department-management.component';
import { AdminAuditLogComponent } from '../components/admin-audit-log/admin-audit-log.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe, 
    AdminUserManagementComponent, 
    AdminUserCreatorComponent, 
    AdminDepartmentManagementComponent,
    AdminAuditLogComponent,
    PageHeaderComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  protected readonly emptyState = EMPTY_ADMIN_DASHBOARD;
  protected activeTab: 'usuarios' | 'departamentos' | 'bitacora' = 'usuarios';
  private readonly refresh$ = new Subject<void>();
  private readonly adminApiService = inject(AdminApiService);
  protected readonly dashboard$ = this.refresh$.pipe(
    startWith(void 0),
    switchMap(() => this.adminApiService.getDashboardData())
  );
  private readonly authService = inject(AuthService);
  protected readonly user$ = this.authService.currentUser$;

  protected logout(): void {
    this.authService.logout();
  }

  protected deactivateUser(userId: string): void {
    this.adminApiService.deactivateUser(userId).subscribe({
      next: () => this.refresh$.next()
    });
  }

  protected restoreUser(userId: string): void {
    this.adminApiService.restoreUser(userId).subscribe({
      next: () => this.refresh$.next()
    });
  }

  protected createUser(user: AdminUserCreate): void {
    this.adminApiService.createUser(user).subscribe({
      next: () => this.refresh$.next()
    });
  }

  protected updateUser(user: AdminUserUpdate): void {
    this.adminApiService.updateUser(user).subscribe({
      next: () => this.refresh$.next()
    });
  }

  protected createDepartment(dept: AdminDepartment): void {
    this.adminApiService.createDepartment(dept).subscribe({
      next: () => this.refresh$.next()
    });
  }

  protected updateDepartment(dept: AdminDepartment): void {
    this.adminApiService.updateDepartment(dept).subscribe({
      next: () => this.refresh$.next()
    });
  }

  protected deleteDepartment(id: string): void {
    this.adminApiService.deleteDepartment(id).subscribe({
      next: () => this.refresh$.next()
    });
  }
}
