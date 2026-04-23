import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, of, Subject, switchMap, tap } from 'rxjs';
import { NgDiagramWorkflowEditorComponent } from '../../workflow-designer/components/ng-diagram-workflow-editor.component';
import { AuthService } from '../../../core/services/auth.service';
import { DesignerUser, DesignerWorkflow, WorkflowCollaborator } from '../data/designer-dashboard.data';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { DesignerWorkflowService } from '../services/designer-workflow.service';
import { WorkflowCollaborationService } from '../services/workflow-collaboration.service';

@Component({
  selector: 'app-designer-workflow-editor-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, NgDiagramWorkflowEditorComponent, PageHeaderComponent],
  templateUrl: './designer-workflow-editor-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerWorkflowEditorPageComponent {
  protected readonly user$ = inject(AuthService).currentUser$;
  private readonly editor = viewChild(NgDiagramWorkflowEditorComponent);
  protected isLoading = true;
  protected loadError: string | null = null;
  protected collaborationStatus = 'Sincronizado';
  protected selectedWorkflow: DesignerWorkflow | null = null;
  protected collaborators: WorkflowCollaborator[] = [];
  protected availableDesigners: DesignerUser[] = [];
  protected selectedInviteUserId = '';
  protected invitationStatus: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly workflowService = inject(DesignerWorkflowService);
  private readonly collaborationService = inject(WorkflowCollaborationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly diagramDraft$ = new Subject<string>();
  private workflowId: string | null = null;
  private hasPendingLocalChanges = false;

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((params) => {
          this.workflowId = params.get('workflowId');
          this.isLoading = true;
          this.loadError = null;
        }),
        switchMap((params) => {
          const workflowId = params.get('workflowId');
          if (!workflowId) {
            return of(null);
          }

          return this.workflowService.getWorkflowById(workflowId).pipe(
            catchError(() => {
              this.loadError = 'No se pudo abrir el workflow solicitado.';
              return of(null);
            })
          );
        })
      )
      .subscribe((workflow) => {
        this.selectedWorkflow = workflow;
        this.isLoading = false;
        if (workflow) {
          this.loadCollaborators(workflow.id);
          this.subscribeToWorkflowRealtime(workflow.id);
        } else {
          this.collaborators = [];
          this.collaborationService.disconnect();
        }
        this.cdr.markForCheck();
      });

    this.diagramDraft$
      .pipe(
        debounceTime(1200),
        distinctUntilChanged(),
        switchMap((diagramData) => {
          if (!this.workflowId) {
            return EMPTY;
          }

          return this.workflowService.updateDiagram(
            this.workflowId,
            diagramData,
            this.collaborationService.clientId
          ).pipe(
            tap((workflow) => {
              this.acknowledgeLocalDiagramSave(workflow);
            }),
            catchError(() => {
              this.collaborationStatus = 'Error de sincronizacion';
              this.cdr.markForCheck();
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.collaborationService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.type !== 'diagram-updated' ||
          event.workflowId !== this.workflowId ||
          event.sourceClientId === this.collaborationService.clientId ||
          !event.diagramData) {
          return;
        }

        this.collaborationStatus = 'Actualizado en tiempo real';
        this.cdr.markForCheck();
      });

    this.workflowService.getDesigners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((designers) => {
        this.availableDesigners = designers;
        this.cdr.markForCheck();
      });
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected goToWorkflowList(): void {
    if (!this.workflowId || !this.selectedWorkflow) {
      this.router.navigate(['/designer']);
      return;
    }

    const diagramData = this.editor()?.exportDiagram();
    if (!diagramData) {
      this.router.navigate(['/designer']);
      return;
    }

    this.workflowService.updateDiagram(
      this.workflowId,
      diagramData,
      this.collaborationService.clientId
    ).subscribe({
      next: () => {
        this.router.navigate(['/designer']);
      },
      error: () => {
        this.router.navigate(['/designer']);
      }
    });
  }

  protected saveDiagram(diagramData: string): void {
    if (!this.workflowId) {
      return;
    }

    this.workflowService.updateDiagram(
      this.workflowId,
      diagramData,
      this.collaborationService.clientId
    ).subscribe({
      next: (workflow) => {
        this.acknowledgeLocalDiagramSave(workflow);
        this.cdr.markForCheck();
      }
    });
  }

  protected handleDiagramDraftChanged(diagramData: string): void {
    this.hasPendingLocalChanges = true;
    this.collaborationStatus = 'Editando...';
    this.diagramDraft$.next(diagramData);
  }

  protected retryLoad(): void {
    if (this.workflowId) {
      this.workflowId = null;
    }
    this.router.navigateByUrl(this.router.url);
  }

  protected inviteSelectedDesigner(): void {
    if (!this.workflowId || !this.selectedInviteUserId) {
      return;
    }

    this.workflowService.addCollaborator(this.workflowId, this.selectedInviteUserId)
      .subscribe({
        next: () => {
          this.invitationStatus = 'Usuario invitado al workflow';
          this.selectedInviteUserId = '';
          this.loadCollaborators(this.workflowId!);
          this.cdr.markForCheck();
        },
        error: () => {
          this.invitationStatus = 'No se pudo invitar al usuario';
          this.cdr.markForCheck();
        }
      });
  }

  protected removeCollaborator(userId: string): void {
    if (!this.workflowId) {
      return;
    }

    this.workflowService.removeCollaborator(this.workflowId, userId)
      .subscribe(() => this.loadCollaborators(this.workflowId!));
  }

  protected userInitials(name: string | null | undefined): string {
    if (!name) {
      return 'U';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  private subscribeToWorkflowRealtime(workflowId: string): void {
    this.collaborationService.connect(workflowId, this.authService.getToken());
  }

  private loadCollaborators(workflowId: string): void {
    this.workflowService.getCollaborators(workflowId)
      .subscribe({
        next: (collaborators) => {
          this.collaborators = collaborators;
          this.cdr.markForCheck();
        },
        error: () => {
          this.collaborators = [];
          this.cdr.markForCheck();
        }
      });
  }

  private acknowledgeLocalDiagramSave(workflow: DesignerWorkflow): void {
    if (this.selectedWorkflow?.id === workflow.id) {
      this.selectedWorkflow.diagramData = workflow.diagramData;
      this.selectedWorkflow.collaborators = workflow.collaborators;
      this.selectedWorkflow.ownerUserId = workflow.ownerUserId;
    }

    this.hasPendingLocalChanges = false;
    this.collaborationStatus = 'Sincronizado';
    this.cdr.markForCheck();
  }
}
