import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNotification, AdminUser } from '../../data/admin-dashboard.data';

@Component({
  selector: 'app-admin-access-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-access-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAccessPanelComponent {
  readonly inactiveUsers = input(0);
  readonly recentUsers = input<AdminUser[]>([]);
  readonly recentNotifications = input<AdminNotification[]>([]);
}
