import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../services/client.service';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-client-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './client-request-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientRequestFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientService = inject(ClientService);

  protected readonly workflow = signal<any>(null);
  protected readonly formulario = signal<any>(null);
  protected readonly formData = signal<Record<string, any>>({});
  protected readonly selectedFiles = signal<File[]>([]);
  protected isSubmitting = false;

  ngOnInit(): void {
    const wfId = this.route.snapshot.paramMap.get('workflowId');
    if (wfId) {
      this.clientService.getAvailableWorkflows().subscribe({
        next: (workflows) => {
          const wf = workflows.find(w => w.id === wfId);
          if (wf) {
            this.workflow.set(wf);
            const pasos = wf.pasos || [];
            
            // Intentar buscar el paso 1, si no existe, tomar el primero de la lista
            let paso1 = pasos.find((p: any) => p.orden === 1);
            if (!paso1 && pasos.length > 0) {
              paso1 = pasos[0];
            }
            
            if (paso1 && paso1.formularioId) {
              this.clientService.getFormulario(paso1.formularioId).subscribe({
                next: (form) => this.formulario.set(form),
                error: (err) => console.error('Error cargando formulario:', err)
              });
            } else {
              console.warn('El Workflow no tiene un Paso inicial o FormularioId válido:', wf);
            }
          } else {
            console.warn('No se encontró el Workflow con ID:', wfId);
          }
        },
        error: (err) => console.error('Error cargando workflows:', err)
      });
    }
  }

  protected updateField(key: string, value: any): void {
    this.formData.set({ ...this.formData(), [key]: value });
  }

  protected onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles.set([...this.selectedFiles(), ...Array.from(files as File[])]);
    }
  }

  protected removeFile(index: number): void {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);
  }

  protected getOptions(opciones: any): string[] {
    if (!opciones) return [];
    if (Array.isArray(opciones)) return opciones;
    if (opciones.valores) return opciones.valores;
    return [];
  }

  protected submit(): void {
    const wf = this.workflow();
    if (!wf) return;

    this.isSubmitting = true;
    
    // Subir archivos primero si hay
    if (this.selectedFiles().length > 0) {
      this.clientService.uploadFiles(this.selectedFiles()).subscribe(urls => {
        this.iniciarConDatos(wf.id, urls);
      });
    } else {
      this.iniciarConDatos(wf.id, []);
    }
  }

  private iniciarConDatos(wfId: string, docUrls: string[]): void {
    const body = {
      workflowId: wfId,
      datos: this.formData(),
      documentosUrl: docUrls
    };

    this.clientService.iniciarTramite(body).subscribe({
      next: () => {
        this.router.navigate(['/client']);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  protected goBack(): void {
    this.router.navigate(['/client']);
  }
}
