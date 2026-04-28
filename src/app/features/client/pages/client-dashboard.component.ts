import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService, WorkflowSummary } from '../services/client.service';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationSystemService } from '../services/notification-system.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './client-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientDashboardComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  protected readonly notificationService = inject(NotificationSystemService);
  private readonly authService = inject(AuthService);
  protected readonly user$ = this.authService.currentUser$;

  protected readonly workflows = signal<WorkflowSummary[]>([]);
  protected readonly myRequests = signal<any[]>([]);
  protected activeTab: 'available' | 'my-requests' = 'available';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.clientService.getAvailableWorkflows().subscribe(ws => {
      this.workflows.set(ws.filter(w => (w as any).estado === 'PUBLICADO' || (w as any).estado === 'BORRADOR')); // Permitir borrador para tests
    });
    this.clientService.getMisTramites().subscribe(ts => {
      this.myRequests.set(ts);
    });
  }

  iniciar(id: string): void {
    this.router.navigate(['/client/nuevo-tramite', id]);
  }

  corregir(id: string): void {
    this.router.navigate(['/client/corregir', id]);
  }

  verDetalle(id: string): void {
     this.router.navigate(['/client/seguimiento', id]);
  }

  logout(): void {
    this.authService.logout();
  }
}
