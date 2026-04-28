import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DesignerUser, DesignerWorkflow, WorkflowCollaborator } from '../data/designer-dashboard.data';

type RuntimeWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

type WorkflowResponseDto = {
  id: string;
  nombre: string;
  descripcion: string;
  pasos: Array<{
    nombre: string;
    orden: number;
    departamento: string;
    formularioId: string | null;
  }>;
  diagramData: string | null;
  estado: string;
  ownerUserId: string | null;
  collaborators: WorkflowCollaboratorDto[];
};

type WorkflowCreateRequest = {
  nombre: string;
  descripcion: string;
};

type WorkflowCollaboratorDto = {
  userId: string;
  nombre: string;
  email: string;
  role: string;
};

type DesignerUserDto = {
  id: string;
  email: string;
  nombre: string;
  departamento: string;
  rol: string;
};

const apiBaseUrl =
  (window as RuntimeWindow).__env?.API_BASE_URL ?? 'http://localhost:8081';

@Injectable({
  providedIn: 'root'
})
export class DesignerWorkflowService {
  private readonly http = inject(HttpClient);
  private readonly workflowsUrl = `${apiBaseUrl}/api/workflows`;
  private readonly usersUrl = `${apiBaseUrl}/api/usuarios`;
  private readonly departamentosUrl = `${apiBaseUrl}/api/departamentos`;

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(this.departamentosUrl);
  }

  getWorkflows(): Observable<DesignerWorkflow[]> {
    return this.http.get<WorkflowResponseDto[]>(this.workflowsUrl).pipe(
      map((workflows) => workflows.map((workflow) => this.mapWorkflow(workflow)))
    );
  }

  createWorkflow(payload: WorkflowCreateRequest): Observable<DesignerWorkflow> {
    return this.http.post<WorkflowResponseDto>(this.workflowsUrl, {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      pasos: [],
      reglas: [],
      diagramData: null
    }).pipe(
      map((workflow) => this.mapWorkflow(workflow))
    );
  }

  getWorkflowById(workflowId: string): Observable<DesignerWorkflow> {
    return this.http.get<WorkflowResponseDto>(`${this.workflowsUrl}/${workflowId}`).pipe(
      map((workflow) => this.mapWorkflow(workflow))
    );
  }

  updateDiagram(workflowId: string, diagramData: string, sourceClientId?: string): Observable<DesignerWorkflow> {
    return this.http.put<WorkflowResponseDto>(`${this.workflowsUrl}/${workflowId}/diagrama`, {
      diagramData,
      sourceClientId: sourceClientId ?? null
    }).pipe(
      map((workflow) => this.mapWorkflow(workflow))
    );
  }

  updateWorkflowState(workflowId: string, estado: string): Observable<DesignerWorkflow> {
    return this.http.put<WorkflowResponseDto>(`${this.workflowsUrl}/${workflowId}/estado`, {
      estado
    }).pipe(
      map((workflow) => this.mapWorkflow(workflow))
    );
  }

  getDesigners(): Observable<DesignerUser[]> {
    return this.http.get<DesignerUserDto[]>(`${this.usersUrl}/designers`).pipe(
      map((users) => users.map((user) => ({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        departamento: user.departamento,
        rol: user.rol
      })))
    );
  }

  getCollaborators(workflowId: string): Observable<WorkflowCollaborator[]> {
    return this.http.get<WorkflowCollaboratorDto[]>(`${this.workflowsUrl}/${workflowId}/collaborators`);
  }

  addCollaborator(workflowId: string, userId: string): Observable<WorkflowCollaborator> {
    return this.http.post<WorkflowCollaboratorDto>(`${this.workflowsUrl}/${workflowId}/collaborators`, {
      userId,
      role: 'EDITOR'
    });
  }

  removeCollaborator(workflowId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.workflowsUrl}/${workflowId}/collaborators/${userId}`);
  }

  deleteWorkflow(workflowId: string): Observable<void> {
    return this.http.delete<void>(`${this.workflowsUrl}/${workflowId}`);
  }

  private mapWorkflow(workflow: WorkflowResponseDto): DesignerWorkflow {
    return {
      id: workflow.id,
      nombre: workflow.nombre,
      descripcion: workflow.descripcion,
      estado: workflow.estado ?? 'BORRADOR',
      pasos: workflow.pasos ?? [],
      diagramData: workflow.diagramData,
      ownerUserId: workflow.ownerUserId,
      collaborators: workflow.collaborators ?? []
    };
  }
}
