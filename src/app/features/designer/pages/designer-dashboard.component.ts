import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, fromEvent, merge, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { AuthService } from '../../../core/services/auth.service';
import { DesignerWorkflow } from '../data/designer-dashboard.data';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { DesignerWorkflowService } from '../services/designer-workflow.service';

@Component({
  selector: 'app-designer-dashboard',
  standalone: true,
  imports: [AsyncPipe, FormsModule, PageHeaderComponent, Paginator],
  templateUrl: './designer-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerDashboardComponent {
  protected readonly user$ = inject(AuthService).currentUser$;
  private readonly refresh$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);
  protected searchTerm = '';
  protected first = 0;
  protected rows = 5;
  protected readonly createModel = {
    nombre: '',
    descripcion: ''
  };
  protected isLoading = true;
  protected isCreating = false;
  protected deletingWorkflowId: string | null = null;
  protected loadError: string | null = null;
  protected createError: string | null = null;
  protected readonly workflows$ = this.refresh$.pipe(
    startWith(void 0),
    tap(() => {
      this.isLoading = true;
      this.loadError = null;
    }),
    switchMap(() => this.workflowService.getWorkflows().pipe(
      tap(() => {
        this.isLoading = false;
      }),
      catchError(() => {
        this.isLoading = false;
        this.loadError = 'No se pudieron cargar tus workflows.';
        return of<DesignerWorkflow[]>([]);
      })
    ))
  );

  private readonly authService = inject(AuthService);
  private readonly workflowService = inject(DesignerWorkflowService);
  private readonly router = inject(Router);

  constructor() {
    merge(
      fromEvent(window, 'focus'),
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible')
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh$.next());
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected openWorkflow(workflowId: string): void {
    this.router.navigate(['/designer/workflows', workflowId]);
  }

  protected createWorkflow(): void {
    const nombre = this.createModel.nombre.trim();
    const descripcion = this.createModel.descripcion.trim();
    if (!nombre || !descripcion || this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.createError = null;
    this.workflowService.createWorkflow({ nombre, descripcion })
      .subscribe({
        next: (workflow) => {
          this.isCreating = false;
          this.createModel.nombre = '';
          this.createModel.descripcion = '';
          this.router.navigate(['/designer/workflows', workflow.id]);
        },
        error: () => {
          this.isCreating = false;
          this.createError = 'No se pudo crear el workflow.';
        }
      });
  }

  protected deleteWorkflow(workflow: DesignerWorkflow): void {
    if (this.deletingWorkflowId || !workflow.ownerUserId) {
      return;
    }

    const confirmed = window.confirm(`Eliminar workflow "${workflow.nombre}"?`);
    if (!confirmed) {
      return;
    }

    this.deletingWorkflowId = workflow.id;
    this.workflowService.deleteWorkflow(workflow.id).subscribe({
      next: () => {
        this.deletingWorkflowId = null;
        this.loadError = null;
        this.refresh$.next();
      },
      error: () => {
        this.deletingWorkflowId = null;
        this.loadError = 'No se pudo eliminar el workflow.';
      }
    });
  }

  protected retryLoad(): void {
    this.refresh$.next();
  }

  protected workflowOwnershipLabel(workflow: DesignerWorkflow, currentUserId: string | null): string {
    if (workflow.ownerUserId && workflow.ownerUserId === currentUserId) {
      return 'Propio';
    }

    return 'Invitado';
  }

  protected workflowCollaboratorCount(workflow: DesignerWorkflow): number {
    return workflow.collaborators.length;
  }

  protected filteredWorkflows(workflows: DesignerWorkflow[]): DesignerWorkflow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return workflows;
    }

    return workflows.filter((workflow) =>
      workflow.nombre.toLowerCase().includes(term) ||
      workflow.descripcion.toLowerCase().includes(term)
    );
  }

  protected paginatedWorkflows(workflows: DesignerWorkflow[]): DesignerWorkflow[] {
    const filtered = this.filteredWorkflows(workflows);
    return filtered.slice(this.first, this.first + this.rows);
  }

  protected handlePageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 5;
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm = value;
    this.first = 0;
  }

  protected workflowRoleLabel(workflow: DesignerWorkflow, currentUserId: string | null): string {
    return workflow.ownerUserId === currentUserId ? 'Owner' : 'Invitado';
  }

  protected workflowRoleClasses(workflow: DesignerWorkflow, currentUserId: string | null): string {
    return workflow.ownerUserId === currentUserId
      ? 'border-violet-200 bg-violet-50 text-violet-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  protected collaboratorInitials(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected canDeleteWorkflow(workflow: DesignerWorkflow, currentUserId: string | null): boolean {
    return workflow.ownerUserId === currentUserId;
  }
}
