import { ChangeDetectionStrategy, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, fromEvent, merge, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../../core/services/auth.service';
import { DesignerWorkflow } from '../../data/designer-dashboard.data';
import { DesignerWorkflowService } from '../../services/designer-workflow.service';
import { PageHeaderComponent } from '../../../../shared/layout/page-header/page-header.component';
import { DesignerDashboardSidebarComponent } from './components/sidebar/sidebar.component';
import { DesignerWorkflowListComponent } from './components/list/workflow-list.component';
import { DesignerAiModalComponent } from './components/ai-modal/ai-modal.component';

@Component({
  selector: 'app-designer-dashboard',
  standalone: true,
  imports: [AsyncPipe, CommonModule, PageHeaderComponent, ToastModule, DesignerDashboardSidebarComponent, DesignerWorkflowListComponent, DesignerAiModalComponent],
  providers: [MessageService],
  templateUrl: './designer-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerDashboardComponent {
  private readonly aiModal = viewChild(DesignerAiModalComponent);
  protected readonly user$ = inject(AuthService).currentUser$;
  protected readonly refresh$ = new Subject<void>();
  protected isLoading = true;
  protected isCreating = false;
  protected deletingWorkflowId: string | null = null;
  protected loadError: string | null = null;
  protected createError: string | null = null;

  protected readonly workflows$ = this.refresh$.pipe(
    startWith(void 0), tap(() => { this.isLoading = true; this.loadError = null; }),
    switchMap(() => this.workflowService.getWorkflows().pipe(
      tap(() => this.isLoading = false),
      catchError(() => { this.isLoading = false; this.loadError = 'Error al cargar workflows.'; return of<DesignerWorkflow[]>([]); })
    ))
  );

  private readonly authService = inject(AuthService);
  private readonly workflowService = inject(DesignerWorkflowService);
  private readonly router = inject(Router);

  constructor() {
    merge(fromEvent(window, 'focus'), fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible')))
      .pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.refresh$.next());
  }

  protected createWorkflow(m: { nombre: string, descripcion: string }) {
    this.isCreating = true; this.createError = null;
    this.workflowService.createWorkflow(m).subscribe({
      next: (w) => this.router.navigate(['/designer/workflows', w.id]),
      error: () => { this.isCreating = false; this.createError = 'Error al crear workflow.'; }
    });
  }

  protected handleAiGenerated(diagramData: string) {
    this.workflowService.createWorkflow({ nombre: 'Flujo generado por IA', descripcion: 'Generado automáticamente.' }).subscribe({
      next: (w) => this.workflowService.updateDiagram(w.id, diagramData).subscribe(() => this.router.navigate(['/designer/workflows', w.id]))
    });
  }

  protected deleteWorkflow(w: DesignerWorkflow) {
    if (!window.confirm(`Eliminar "${w.nombre}"?`)) return;
    this.deletingWorkflowId = w.id;
    this.workflowService.deleteWorkflow(w.id).subscribe({
      next: () => { this.deletingWorkflowId = null; this.refresh$.next(); },
      error: () => { this.deletingWorkflowId = null; }
    });
  }

  protected openAiModal() { this.aiModal()?.open(); }
  protected logout() { this.authService.logout(); }
  protected openWorkflow(id: string) { this.router.navigate(['/designer/workflows', id]); }
}
