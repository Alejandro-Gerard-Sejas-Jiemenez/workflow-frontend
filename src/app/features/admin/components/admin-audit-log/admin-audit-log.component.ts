import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAuditLog } from '../../data/admin-dashboard.data';

@Component({
  selector: 'app-admin-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-audit-log.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAuditLogComponent {
  @Input() logs: AdminAuditLog[] = [];

  protected getActionClass(accion: string): string {
    if (accion.includes('CREAR')) return 'text-green-600 bg-green-50';
    if (accion.includes('ELIMINAR') || accion.includes('DESACTIVAR')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  }
}
