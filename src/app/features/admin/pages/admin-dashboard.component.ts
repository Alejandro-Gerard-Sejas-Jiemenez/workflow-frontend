import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { ADMIN_METRICS } from '../data/admin-dashboard.data';
import { AdminMetricsComponent } from '../components/admin-metrics/admin-metrics.component';
import { AdminAccessPanelComponent } from '../components/admin-access-panel/admin-access-panel.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [Button, AdminMetricsComponent, AdminAccessPanelComponent],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  protected readonly metrics = ADMIN_METRICS;
  private readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}
