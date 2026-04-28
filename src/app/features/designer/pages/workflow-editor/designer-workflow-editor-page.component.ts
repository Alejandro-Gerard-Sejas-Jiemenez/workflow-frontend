import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, of, Subject, switchMap, tap } from 'rxjs';
import { WorkflowEditorComponent } from '../../../workflow-designer/components/editor/editor.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DesignerUser, DesignerWorkflow, WorkflowCollaborator } from '../../data/designer-dashboard.data';
import { PageHeaderComponent } from '../../../../shared/layout/page-header/page-header.component';
import { DesignerWorkflowService } from '../../services/designer-workflow.service';
import { WorkflowCollaborationService } from '../../services/workflow-collaboration.service';
import { DesignerWorkflowEditorHeaderComponent } from './components/header/header.component';
import { provideNgDiagram, NgDiagramModelService, initializeModel } from 'ng-diagram';
import { WorkflowDesignerStateService } from '../../../workflow-designer/core/services/workflow-designer-state.service';
import { WorkflowDesignerActionService } from '../../../workflow-designer/core/services/workflow-designer-action.service';
import { WorkflowDesignerConfigService } from '../../../workflow-designer/core/services/workflow-designer-config.service';
import { WorkflowDesignerCollaborationService } from '../../../workflow-designer/core/services/workflow-designer-collaboration.service';

@Component({
  selector: 'app-designer-workflow-editor-page',
  standalone: true,
  imports: [CommonModule, AsyncPipe, WorkflowEditorComponent, PageHeaderComponent, DesignerWorkflowEditorHeaderComponent],
  templateUrl: './designer-workflow-editor-page.component.html',
  providers: [
    provideNgDiagram(),
    WorkflowDesignerStateService,
    WorkflowDesignerActionService,
    WorkflowDesignerConfigService,
    WorkflowDesignerCollaborationService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerWorkflowEditorPageComponent {
  private readonly editor = viewChild(WorkflowEditorComponent);
  protected readonly user$ = inject(AuthService).currentUser$;
  protected isLoading = true;
  protected loadError: string | null = null;
  protected selectedWorkflow: DesignerWorkflow | null = null;
  protected collaborators: WorkflowCollaborator[] = [];
  protected availableDesigners: DesignerUser[] = [];
  protected departments: any[] = [];
  protected invitationStatus: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly workflowService = inject(DesignerWorkflowService);
  private readonly collaborationService = inject(WorkflowCollaborationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly diagramDraft$ = new Subject<string>();
  private workflowId: string | null = null;

  constructor() {
    this.initWorkflowLoading();
    this.initAutosave();
    this.initRealtime();
    this.initExtraData();
  }

  private initWorkflowLoading() {
    this.route.paramMap.pipe(takeUntilDestroyed(), tap(p => { this.workflowId = p.get('workflowId'); this.isLoading = true; }),
      switchMap(p => p.get('workflowId') ? this.workflowService.getWorkflowById(p.get('workflowId')!).pipe(catchError(() => { this.loadError = 'Error al abrir workflow.'; return of(null); })) : of(null))
    ).subscribe(w => { 
      this.selectedWorkflow = w; 
      this.isLoading = false; 
      if (w) { 
        this.loadCollaborators(w.id); 
        this.collaborationService.connect(w.id, this.authService.getToken()); 
      } 
      this.cdr.markForCheck(); 
    });
  }

  private initAutosave() {
    this.diagramDraft$.pipe(debounceTime(1200), distinctUntilChanged(), switchMap(d => this.workflowId ? this.workflowService.updateDiagram(this.workflowId, d, this.collaborationService.clientId).pipe(tap(w => this.ackSave(w)), catchError(() => { this.cdr.markForCheck(); return EMPTY; })) : EMPTY), takeUntilDestroyed()).subscribe();
  }

  private initRealtime() {
    this.collaborationService.messages$.pipe(takeUntilDestroyed()).subscribe(e => { if (e.type === 'diagram-updated' && e.workflowId === this.workflowId && e.sourceClientId !== this.collaborationService.clientId) { this.cdr.markForCheck(); } });
  }

  private initExtraData() {
    const configService = inject(WorkflowDesignerConfigService);
    this.workflowService.getDesigners().pipe(takeUntilDestroyed()).subscribe(d => { 
      this.availableDesigners = d; 
      this.cdr.markForCheck(); 
    });
    this.workflowService.getDepartments().pipe(takeUntilDestroyed()).subscribe(d => { 
      this.departments = d; 
      configService.departments.set(d);
      this.cdr.markForCheck(); 
    });
  }

  protected save() { const d = this.editor()?.exportDiagram(); if (d && this.workflowId) this.workflowService.updateDiagram(this.workflowId, d, this.collaborationService.clientId).subscribe(w => this.ackSave(w)); }
  protected toggleState() { if (this.workflowId && this.selectedWorkflow) this.workflowService.updateWorkflowState(this.workflowId, this.selectedWorkflow.estado === 'PUBLICADO' ? 'BORRADOR' : 'PUBLICADO').subscribe(w => { this.selectedWorkflow = w; this.cdr.markForCheck(); }); }
  protected invite(userId: string) { if (this.workflowId) this.workflowService.addCollaborator(this.workflowId, userId).subscribe({ next: () => { this.invitationStatus = 'Invitado'; this.loadCollaborators(this.workflowId!); }, error: () => this.invitationStatus = 'Error' }); }
  protected logout() { inject(AuthService).logout(); }
  protected goBack() { if (this.editor()?.isDirty) this.save(); this.router.navigate(['/designer']); }
  private loadCollaborators(id: string) { this.workflowService.getCollaborators(id).subscribe(c => { this.collaborators = c; this.cdr.markForCheck(); }); }
  private ackSave(w: DesignerWorkflow) { if (this.selectedWorkflow) { this.selectedWorkflow.diagramData = w.diagramData; this.selectedWorkflow.collaborators = w.collaborators; } this.cdr.markForCheck(); }
}
