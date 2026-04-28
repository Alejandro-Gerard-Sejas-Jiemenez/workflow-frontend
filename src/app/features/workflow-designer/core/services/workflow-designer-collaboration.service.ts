import { Injectable, inject } from '@angular/core';
import { WorkflowCollaborationService, WorkflowCollaborationEvent } from '../../../designer/services/workflow-collaboration.service';
import { WorkflowDesignerStateService, RemoteCursor } from './workflow-designer-state.service';
import { NgDiagramViewportService } from 'ng-diagram';

@Injectable()
export class WorkflowDesignerCollaborationService {
  private collabService = inject(WorkflowCollaborationService);
  private stateService = inject(WorkflowDesignerStateService);
  private viewportService = inject(NgDiagramViewportService);

  public handleEvent(event: WorkflowCollaborationEvent) {
    if (event.type === 'presence-snapshot') {
      this.stateService.activeUsers.set(event.users || []);
    } else if (event.type === 'cursor-moved') {
      this.updateRemoteCursor(event);
    }
  }

  private updateRemoteCursor(event: any) {
    const cursors = this.stateService.remoteCursors();
    const existing = cursors.find(c => c.clientId === event.sourceClientId);
    if (existing) {
      existing.cursor = event.cursor;
    } else {
      this.stateService.remoteCursors.set([...cursors, { 
        clientId: event.sourceClientId, 
        name: event.userName || 'Usuario',
        cursor: event.cursor,
        color: '#7c3aed'
      } as any]);
    }
  }
}
