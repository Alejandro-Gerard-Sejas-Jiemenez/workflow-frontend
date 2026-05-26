import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

type RuntimeWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

const apiBaseUrl = (window as RuntimeWindow).__env?.API_BASE_URL ?? '';

export interface WorkflowSummary {
  id: string;
  nombre: string;
  descripcion: string;
  pasos: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/api`;

  getAvailableWorkflows(): Observable<WorkflowSummary[]> {
    return this.http.get<WorkflowSummary[]>(`${this.apiUrl}/workflows`);
  }

  getFormulario(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/formularios/${id}`);
  }

  uploadFiles(files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<string[]>(`${this.apiUrl}/upload/imagenes`, formData);
  }

  iniciarTramite(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tareas`, body);
  }
  
  getMisTramites(): Observable<any[]> {
    // Reutilizamos el endpoint que filtra por asignación o creador (ajustado en TareaService)
    return this.http.get<any[]>(`${this.apiUrl}/tareas/mis-tareas`);
  }
}
