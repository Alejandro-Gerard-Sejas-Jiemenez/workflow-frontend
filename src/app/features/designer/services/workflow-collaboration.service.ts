import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

type RuntimeWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

export type WorkflowPresenceUser = {
  sessionId: string;
  clientId: string;
  userId: string;
  name: string;
  role: string;
  color: string;
};

export type WorkflowCursor = {
  x: number;
  y: number;
};

export type WorkflowCollaborationEvent = {
  type: 'diagram-updated' | 'node-upserted' | 'node-deleted' | 'edge-upserted' | 'edge-deleted' | 'presence-snapshot' | 'user-joined' | 'user-left' | 'cursor-moved';
  workflowId: string;
  diagramData?: string;
  node?: unknown;
  nodeId?: string;
  edge?: unknown;
  edgeId?: string;
  users?: WorkflowPresenceUser[];
  user?: WorkflowPresenceUser;
  cursor?: WorkflowCursor;
  sourceClientId: string | null;
  updatedAt: number;
};

const apiBaseUrl =
  ((window as RuntimeWindow).__env as any)?.COLLABORATION_API_URL;

@Injectable({
  providedIn: 'root'
})
export class WorkflowCollaborationService {
  private readonly messageSubject = new Subject<WorkflowCollaborationEvent>();
  private socket: WebSocket | null = null;
  private subscribedWorkflowId: string | null = null;
  private readonly socketUrl =
    ((window as RuntimeWindow).__env as any)?.COLLABORATION_WS_URL ?? 'ws://localhost:8082/ws/workflows';
  private readonly instanceClientId = `designer-${crypto.randomUUID()}`;

  get clientId(): string {
    return this.instanceClientId;
  }

  get messages$(): Observable<WorkflowCollaborationEvent> {
    return this.messageSubject.asObservable();
  }

  connect(workflowId: string, token: string | null): Observable<WorkflowCollaborationEvent> {
    if (this.subscribedWorkflowId === workflowId && this.socket?.readyState === WebSocket.OPEN) {
      return this.messages$;
    }

    this.disconnect();
    this.subscribedWorkflowId = workflowId;
    this.socket = new WebSocket(this.socketUrl);

    this.socket.addEventListener('open', () => {
      this.socket?.send(JSON.stringify({
        type: 'subscribe',
        workflowId,
        clientId: this.clientId,
        token
      }));
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as WorkflowCollaborationEvent;
        if (payload?.workflowId) {
          this.messageSubject.next(payload);
        }
      } catch {
        // Ignore malformed realtime payloads.
      }
    });

    this.socket.addEventListener('close', () => {
      this.socket = null;
    });

    this.socket.addEventListener('error', () => {
      this.socket?.close();
    });

    return this.messages$;
  }

  send(event: Omit<WorkflowCollaborationEvent, 'sourceClientId' | 'updatedAt'>): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify({
      ...event,
      sourceClientId: this.clientId,
      updatedAt: Date.now()
    }));
  }

  disconnect(): void {
    this.subscribedWorkflowId = null;
    if (!this.socket) {
      return;
    }

    this.socket.close();
    this.socket = null;
  }
}
