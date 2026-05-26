import { Injectable, signal } from '@angular/core';
import { WorkflowPresenceUser, WorkflowCursor } from '../../../designer/services/workflow-collaboration.service';

export type RemoteCursor = WorkflowPresenceUser & {
  cursor: WorkflowCursor;
};

@Injectable()
export class WorkflowDesignerStateService {
  // Estado básico del editor
  public readonly isDirty = signal(false);
  public readonly isPublished = signal(false);
  public readonly isSaving = signal(false);
  public readonly lastSavedAt = signal<Date | null>(null);
  public readonly zoomLevel = signal(100);
  
  // Estadísticas del diagrama
  public readonly totalNodes = signal(0);
  public readonly totalLinks = signal(0);
  
  // Estado de colaboración
  public readonly activeUsers = signal<WorkflowPresenceUser[]>([]);
  public readonly remoteCursors = signal<RemoteCursor[]>([]);

  public markDirty(): void {
    this.isDirty.set(true);
  }

  public resetDirty(date: Date = new Date()): void {
    this.isDirty.set(false);
    this.lastSavedAt.set(date);
  }

  public updateStats(nodes: number, links: number): void {
    this.totalNodes.set(nodes);
    this.totalLinks.set(links);
  }

  public setZoom(level: number): void {
    this.zoomLevel.set(Math.round(level * 100));
  }
}
