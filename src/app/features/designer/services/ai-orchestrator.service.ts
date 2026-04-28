import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

type RuntimeWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

const apiBaseUrl =
  (window as RuntimeWindow).__env?.API_BASE_URL ?? 'http://localhost:8081';

@Injectable({
  providedIn: 'root'
})
export class AiOrchestratorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/api/ai-orchestrator`;

  generateFromPrompt(prompt: string): Observable<{ xml: string }> {
    return this.http.post<{ xml: string }>(`${this.apiUrl}/generate-from-prompt`, { prompt });
  }

  generateFromVoice(audioBlob: Blob): Observable<{ xml: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-recording.wav');
    return this.http.post<{ xml: string }>(`${this.apiUrl}/generate-from-voice`, formData);
  }

  generateFromPdf(pdfFile: File): Observable<{ xml: string }> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    return this.http.post<{ xml: string }>(`${this.apiUrl}/generate-from-pdf`, formData);
  }

  proposeWorkflowJson(prompt: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/propose-workflow`, { prompt });
  }

  prioritizeTask(tareaId: string): Observable<any> {
    return this.http.post<any>(`${apiBaseUrl}/api/tareas/${tareaId}/priorizar`, {});
  }
}
