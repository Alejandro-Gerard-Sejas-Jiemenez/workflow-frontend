import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TareaService, TareaResponse } from '../services/tarea.service';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { map, switchMap, of, tap } from 'rxjs';
import { ClientService } from '../../client/services/client.service';

@Component({
  selector: 'app-tarea-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './tarea-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TareaDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tareaService = inject(TareaService);
  private readonly clientService = inject(ClientService);

  protected readonly tarea = signal<TareaResponse | null>(null);
  protected readonly workflow = signal<any>(null);
  protected readonly formulario = signal<any>(null);
  protected readonly formData = signal<Record<string, any>>({});
  protected readonly isUploading = signal<boolean>(false);
  protected detalle = '';
  protected activeTab: 'expediente' | 'actividad' | 'historial' = 'expediente';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tareaService.getTareaById(id).pipe(
        switchMap(tarea => {
          if (!tarea) return of(null);
          this.tarea.set(tarea);
          this.formData.set({ ...(tarea.datos || {}) });
          
          // Si el backend ya nos envio el formulario, lo usamos directamente
          if (tarea.formulario) {
            this.formulario.set(tarea.formulario);
            if (tarea.estado !== 'PENDIENTE_VERIFICACION') {
               this.activeTab = 'actividad';
            }
          }

          return this.tareaService.getWorkflow(tarea.workflowId);
        }),
        tap(wf => this.workflow.set(wf))
      ).subscribe({
        error: (err) => console.error('Error cargando detalles de tarea', err)
      });
    }
  }

  protected getOptions(campo: any): string[] {
    const opciones = campo.opciones || campo.options;
    if (!opciones) return [];
    if (Array.isArray(opciones)) return opciones;
    if (opciones.valores && Array.isArray(opciones.valores)) return opciones.valores;
    if (typeof opciones === 'string') return opciones.split(',').map((s: string) => s.trim());
    return [];
  }

  protected onFileSelected(fieldName: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.isUploading.set(true);
      this.clientService.uploadFiles(Array.from(input.files)).subscribe({
        next: (urls) => {
          this.updateField(fieldName, urls.join(', '));
          this.isUploading.set(false);
        },
        error: (err) => {
          console.error('Error al subir archivo', err);
          this.isUploading.set(false);
        }
      });
    }
  }

  protected updateField(key: string, value: any): void {
    const current = this.formData();
    this.formData.set({ ...current, [key]: value });
  }

  protected gestionar(accion: string): void {
    const t = this.tarea();
    if (t) {
      this.tareaService.gestionarTarea(t.id, accion, this.detalle, this.formData()).subscribe(() => {
        this.router.navigate(['/employee']);
      });
    }
  }

  protected validar(aprobado: boolean): void {
    const t = this.tarea();
    if (t) {
      this.tareaService.validarSolicitud(t.id, aprobado, this.detalle).subscribe(() => {
        this.router.navigate(['/employee']);
      });
    }
  }

  protected reSubmit(): void {
    const t = this.tarea();
    if (t) {
      this.tareaService.gestionarTarea(t.id, 'REENVIO_CORRECCION', 'Correcciones enviadas por el cliente', this.formData()).subscribe(() => {
        this.router.navigate(['/employee']);
      });
    }
  }

  protected goBack(): void {
    this.router.navigate(['/employee']);
  }
}
