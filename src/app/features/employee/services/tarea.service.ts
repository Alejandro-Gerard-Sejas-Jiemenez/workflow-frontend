import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TareaResponse {
  id: string;
  workflowId: string;
  estado: string;
  pasoActual: number;
  asignadoA: string;
  prioridad: string;
  datos: Record<string, any>;
  documentosUrl?: string[];
  historial: any[];
  comentarios?: any[];
  formulario?: any;
}

type RuntimeWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

const apiBaseUrl = (window as RuntimeWindow).__env?.API_BASE_URL ?? 'http://localhost:8081';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/api/tareas`;

  misTareas(): Observable<TareaResponse[]> {
    return this.http.get<TareaResponse[]>(`${this.apiUrl}/mis-tareas`);
  }

  getTareaById(id: string): Observable<TareaResponse> {
    return this.http.get<TareaResponse>(`${this.apiUrl}/${id}`);
  }

  getWorkflow(id: string): Observable<any> {
    return this.http.get<any>(`${apiBaseUrl}/api/workflows/${id}`);
  }

  getFormulario(id: string): Observable<any> {
    return this.http.get<any>(`${apiBaseUrl}/api/formularios/${id}`);
  }

  gestionarTarea(id: string, accionUsuario: string, detalle: string, nuevosDatos: any): Observable<TareaResponse> {
    return this.http.post<TareaResponse>(`${this.apiUrl}/${id}/gestionar`, {
      nuevosDatos,
      accionUsuario,
      detalle
    });
  }

  validarSolicitud(id: string, aprobado: boolean, observaciones: string): Observable<TareaResponse> {
    return this.http.post<TareaResponse>(`${this.apiUrl}/${id}/validar`, {
      aprobado,
      observaciones
    });
  }
}
