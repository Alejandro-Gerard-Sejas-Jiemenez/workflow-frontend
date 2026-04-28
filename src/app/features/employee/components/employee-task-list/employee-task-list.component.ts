import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { EmployeeTask } from '../../data/employee-dashboard.data';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-task-list',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './employee-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeTaskListComponent {
  readonly tasks = input.required<EmployeeTask[]>();
  private readonly router = inject(Router);

  protected atender(id: string): void {
    this.router.navigate(['/employee/tareas', id]);
  }
}
