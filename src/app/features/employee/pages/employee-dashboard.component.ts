import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { EMPLOYEE_TASKS } from '../data/employee-dashboard.data';
import { EmployeeTaskListComponent } from '../components/employee-task-list/employee-task-list.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [AsyncPipe, EmployeeTaskListComponent, PageHeaderComponent],
  templateUrl: './employee-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDashboardComponent {
  protected readonly tasks = EMPLOYEE_TASKS;
  protected readonly user$ = inject(AuthService).currentUser$;
  private readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}
