import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TareaService } from '../../employee/services/tarea.service';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-client-tracking',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './client-tracking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientTrackingComponent implements OnInit {
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly tareaService = inject(TareaService);

  protected readonly tarea = signal<any>(null);
  protected readonly workflow = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tareaService.getTareaById(id).subscribe(t => {
        this.tarea.set(t);
        this.tareaService.getWorkflow(t.workflowId).subscribe(wf => {
          this.workflow.set(wf);
        });
      });
    }
  }

  protected getProgressWidth(): string {
    const t = this.tarea();
    const wf = this.workflow();
    if (!t || !wf || !wf.pasos) return '0%';
    
    if (t.estado === 'COMPLETADO') return '100%';
    if (t.estado === 'PENDIENTE_VERIFICACION') return '10%';
    
    const currentStep = t.pasoActual || 0;
    const totalSteps = wf.pasos.length;
    return `${Math.min(20 + (currentStep / totalSteps) * 80, 95)}%`;
  }

  protected goBack(): void {
    this.router.navigate(['/client']);
  }
}
