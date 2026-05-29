import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../services/client.service';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { TareaService } from '../../employee/services/tarea.service';

@Component({
  selector: 'app-client-correction',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './client-correction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientCorrectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientService = inject(ClientService);
  private readonly tareaService = inject(TareaService); // Reusamos para obtener la tarea

  protected readonly tarea = signal<any>(null);
  protected readonly workflow = signal<any>(null);
  protected readonly pasoInicial = signal<any>(null);
  protected readonly formulario = signal<any>(null);
  protected readonly formData = signal<Record<string, any>>({});
  protected readonly isUploading = signal<boolean>(false);
  protected isSubmitting = false;

  protected onFormFieldSelected(fieldName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.isUploading.set(true);
      this.clientService.uploadFiles(Array.from(input.files)).subscribe({
        next: (urls) => {
          this.updateField(fieldName, urls.join(', '));
          this.isUploading.set(false);
        },
        error: (err) => {
          console.error('Error al subir archivo del campo:', err);
          this.isUploading.set(false);
        }
      });
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tareaService.misTareas().subscribe(tareas => {
        const t = tareas.find(x => x.id === id);
        if (t) {
          this.tarea.set(t);
          this.formData.set({ ...(t.datos || {}) });

          this.tareaService.getWorkflow(t.workflowId).subscribe(wf => {
            this.workflow.set(wf);
            const paso1 = wf.pasos?.find((p: any) => p.orden === 1);
            if (paso1) {
              this.pasoInicial.set(paso1);
              if (paso1.formularioId) {
                this.clientService.getFormulario(paso1.formularioId).subscribe(form => {
                  this.formulario.set(form);
                });
              }
            }
          });
        }
      });
    }
  }

  protected updateField(key: string, value: any): void {
    this.formData.set({ ...this.formData(), [key]: value });
  }

  protected isOptionChecked(fieldName: string, option: string): boolean {
    const value = this.formData()[fieldName];
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.includes(option);
    }
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).includes(option);
    }
    return false;
  }

  protected toggleChecklistOption(fieldName: string, option: string, checked: boolean): void {
    const current = this.formData()[fieldName];
    let list: string[] = [];
    if (Array.isArray(current)) {
      list = [...current];
    } else if (typeof current === 'string' && current.trim()) {
      list = current.split(',').map(s => s.trim());
    }
    
    if (checked) {
      if (!list.includes(option)) {
        list.push(option);
      }
    } else {
      list = list.filter(item => item !== option);
    }
    this.updateField(fieldName, list);
  }

  protected getOptions(opciones: any): string[] {
    if (!opciones) return [];
    if (Array.isArray(opciones)) return opciones;
    if (opciones.valores) return opciones.valores;
    return [];
  }

  protected submit(): void {
    const t = this.tarea();
    if (!t) return;

    this.isSubmitting = true;

    // Usamos el endpoint de gestión con la acción especial REENVIO_CORRECCION
    this.tareaService.gestionarTarea(t.id, 'REENVIO_CORRECCION', 'Correcciones enviadas por el cliente', this.formData()).subscribe({
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
