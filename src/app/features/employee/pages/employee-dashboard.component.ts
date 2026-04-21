import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { EMPLOYEE_TASKS } from '../data/employee-dashboard.data';
import { EmployeeTaskListComponent } from '../components/employee-task-list/employee-task-list.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [AsyncPipe, Button, EmployeeTaskListComponent],
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
