import { Injectable, inject } from '@angular/core';
import { WorkflowCollaborationService, WorkflowCollaborationEvent } from '../../../designer/services/workflow-collaboration.service';
import { WorkflowDesignerStateService, RemoteCursor } from './workflow-designer-state.service';
import { WorkflowDesignerActionService } from './workflow-designer-action.service';
import { NgDiagramViewportService } from 'ng-diagram';

@Injectable()
export class WorkflowDesignerCollaborationService {
  private collabService = inject(WorkflowCollaborationService);
  private stateService = inject(WorkflowDesignerStateService);
  private viewportService = inject(NgDiagramViewportService);
  private actionService = inject(WorkflowDesignerActionService);

  public handleEvent(event: WorkflowCollaborationEvent) {
    if (event.type === 'presence-snapshot') {
      this.stateService.activeUsers.set(event.users || []);
    } else if (event.type === 'cursor-moved') {
      this.updateRemoteCursor(event);
    } else if (event.type === 'diagram-updated') {
      if (event.sourceClientId !== this.collabService.clientId) {
        console.log('[Collaboration] Recibida actualizacion de diagrama remota.');
        this.actionService.loadWorkflow({ diagramData: event.diagramData });
      }
    }
  }

  private updateRemoteCursor(event: any) {
    const cursors = this.stateService.remoteCursors();
    const existing = cursors.find(c => c.clientId === event.sourceClientId);
    const u = event.user || {};
    if (existing) {
      existing.cursor = event.cursor;
      if (u.name) existing.name = u.name;
      if (u.color) existing.color = u.color;
    } else {
      this.stateService.remoteCursors.set([...cursors, { 
        clientId: event.sourceClientId, 
        name: u.name || event.userName || 'Usuario',
        cursor: event.cursor,
        color: u.color || '#7c3aed'
      } as any]);
    }
  }
}
