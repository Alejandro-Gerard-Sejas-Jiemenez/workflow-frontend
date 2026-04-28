import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { FileUpload } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { AiOrchestratorService } from '../../../../services/ai-orchestrator.service';
import { serializeDiagramDataForEditor } from '../../../../../workflow-designer/core/utils/diagram-data-adapter';

@Component({
  selector: 'app-designer-ai-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, Button, FileUpload],
  templateUrl: './ai-modal.component.html',
  styleUrls: ['./ai-modal.component.css']
})
export class DesignerAiModalComponent {
  isVisible = signal(false);
  generated = output<string>();
  
  protected aiPrompt = '';
  protected isAiGenerating = false;
  protected isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private readonly aiService = inject(AiOrchestratorService);
  private readonly messageService = inject(MessageService);

  open() { this.isVisible.set(true); this.aiPrompt = ''; }

  protected generateFromPrompt() {
    if (!this.aiPrompt.trim() || this.isAiGenerating) return;
    this.isAiGenerating = true;
    this.aiService.generateFromPrompt(this.aiPrompt).subscribe({
      next: (res) => this.finalizeAiCreation(res.xml),
      error: (err) => this.handleAiError(err)
    });
  }

  protected async toggleRecording() {
    if (this.isRecording) this.stopRecording();
    else await this.startRecording();
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = () => this.generateFromVoice(new Blob(this.audioChunks, { type: 'audio/wav' }));
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo acceder al micrófono.' });
    }
  }

  private stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
  }

  private generateFromVoice(blob: Blob) {
    this.isAiGenerating = true;
    this.aiService.generateFromVoice(blob).subscribe({
      next: (res) => this.finalizeAiCreation(res.xml),
      error: (err) => this.handleAiError(err)
    });
  }

  protected onPdfUpload(event: any) {
    const file = event.files[0];
    if (!file) return;
    this.isAiGenerating = true;
    this.aiService.generateFromPdf(file).subscribe({
      next: (res) => this.finalizeAiCreation(res.xml),
      error: (err) => this.handleAiError(err)
    });
  }

  private finalizeAiCreation(xml: string) {
    const data = xml ? serializeDiagramDataForEditor(xml) : null;
    if (data) {
      this.generated.emit(data);
      this.isVisible.set(false);
      this.isAiGenerating = false;
    } else {
      this.handleAiError('El XML BPMN no pudo convertirse al formato del editor.');
    }
  }

  private handleAiError(error?: any) {
    this.isAiGenerating = false;
    const detail = error instanceof HttpErrorResponse ? (error.error?.message || error.message) : (typeof error === 'string' ? error : 'Error al procesar con IA.');
    this.messageService.add({ severity: 'error', summary: 'Error de IA', detail });
  }
}
