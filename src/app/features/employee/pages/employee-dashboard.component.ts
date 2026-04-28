import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { TareaService } from '../services/tarea.service';
import { EmployeeTaskListComponent } from '../components/employee-task-list/employee-task-list.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { AiOrchestratorService } from '../../designer/services/ai-orchestrator.service';
import { forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [AsyncPipe, CommonModule, EmployeeTaskListComponent, PageHeaderComponent],
  templateUrl: './employee-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDashboardComponent {
  private readonly tareaService = inject(TareaService);
  private readonly aiService = inject(AiOrchestratorService);
  protected isOptimizing = false;

  protected readonly tasks$ = this.tareaService.misTareas().pipe(
    switchMap(tareas => {
      if (tareas.length === 0) return of([]);
      
      const workflowIds = [...new Set(tareas.map(t => t.workflowId))];
      return forkJoin(
        workflowIds.map(id => this.tareaService.getWorkflow(id))
      ).pipe(
        map(workflows => {
          const workflowMap = new Map(workflows.map((w: any) => [w.id, w.nombre]));
          return tareas.map(t => ({
            id: t.id,
            workflowName: workflowMap.get(t.workflowId) ?? 'Workflow Desconocido',
            estado: t.estado,
            prioridad: t.prioridad ?? 'MEDIA',
            fecha: t.historial && t.historial.length > 0 ? t.historial[0].fecha : new Date().toISOString(),
            colorClass: this.getColorClass(t.prioridad, t.estado),
            headerClass: this.getHeaderClass(t.prioridad)
          }));
        })
      );
    }),
    shareReplay(1)
  );

  private getColorClass(prioridad: string, estado: string): string {
    if (estado === 'PENDIENTE_VERIFICACION') return 'border-amber-500';
    if (prioridad === 'ALTA') return 'border-red-500';
    if (prioridad === 'BAJA') return 'border-blue-500';
    return 'border-violet-500';
  }

  private getHeaderClass(prioridad: string): string {
    if (prioridad === 'ALTA') return 'text-red-900 bg-red-50';
    if (prioridad === 'BAJA') return 'text-blue-900 bg-blue-50';
    return 'text-violet-900 bg-violet-50';
  }

  protected readonly user$ = inject(AuthService).currentUser$;
  private readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }

  protected optimizePriorities(): void {
    this.isOptimizing = true;
    this.tareaService.misTareas().pipe(
      switchMap(tareas => {
        const pendingTasks = tareas.filter(t => t.prioridad !== 'ALTA'); // Simular que solo optimizamos las no-alta
        if (pendingTasks.length === 0) return of([]);
        return forkJoin(
          pendingTasks.map(t => this.aiService.prioritizeTask(t.id))
        );
      })
    ).subscribe({
      next: () => {
        this.isOptimizing = false;
        window.location.reload(); // Recarga simple para ver cambios
      },
      error: () => {
        this.isOptimizing = false;
      }
    });
  }
}
