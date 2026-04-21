import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminMetric } from '../../data/admin-dashboard.data';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-metrics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMetricsComponent {
  readonly metrics = input.required<AdminMetric[]>();
}
