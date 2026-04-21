import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { EmployeeTask } from '../../data/employee-dashboard.data';

@Component({
  selector: 'app-employee-task-list',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './employee-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeTaskListComponent {
  readonly tasks = input.required<EmployeeTask[]>();
}
