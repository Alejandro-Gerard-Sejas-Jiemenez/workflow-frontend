import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleNode, Edge } from 'ng-diagram';
import { WorkflowDiagramNodeData } from '../node/node.component';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { ConditionBuilderComponent } from './condition-builder/condition-builder.component';
import { WorkflowDesignerActionService } from '../../core/services/workflow-designer-action.service';
import { WorkflowDesignerStateService } from '../../core/services/workflow-designer-state.service';

@Component({
  selector: 'app-workflow-designer-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, FormBuilderComponent, ConditionBuilderComponent],
  template: `
    <aside class="form-builder-panel">
      <fieldset [disabled]="stateService.isPublished()" class="contents">
        <div class="form-builder-panel__header">
          <div>
            <h4 class="text-slate-800 font-bold">{{ getTitle() }}</h4>
            <p class="text-xs text-slate-400">{{ getSubtitle() }}</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="node-active" [ngModel]="node()?.data?.formEnabled !== false" (ngModelChange)="updateActive($event)" class="accent-violet-600">
            <label for="node-active" class="text-[10px] font-black uppercase text-slate-400">Activo</label>
          </div>
        </div>

        <div class="form-builder-panel__body">
          @if (edge()) {
            <div class="property-group">
              <label>Etiqueta de la conexión</label>
              <input type="text" [ngModel]="edge()?.data?.label" (ngModelChange)="updateEdgeLabel($event)" placeholder="Ej: Sí / No / Condición">
            </div>
          } @else if (node()) {
            @if (isCondition()) {
              <app-workflow-designer-condition-builder [node]="node()!" />
            } @else {
              <app-workflow-designer-form-builder [node]="node()!" />
            }
          } @else {
            <div class="empty-state">Selecciona un elemento para configurar</div>
          }
        </div>
      </fieldset>
    </aside>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `],
  styleUrl: '../editor/editor.component.css'
})
export class PropertiesPanelComponent {
  node = input<SimpleNode<WorkflowDiagramNodeData> | null>(null);
  edge = input<Edge<any> | null>(null);

  private actionService = inject(WorkflowDesignerActionService);
  public stateService = inject(WorkflowDesignerStateService);

  getTitle(): string {
    if (this.edge()) return 'Propiedades de línea';
    if (this.isCondition()) return 'Condición del nodo';
    return 'Formulario del nodo';
  }

  getSubtitle(): string {
    return this.edge()?.id || this.node()?.data?.label || '';
  }

  isCondition(): boolean { return this.node()?.type === 'decision'; }

  updateActive(active: boolean) {
    if (this.node()) this.actionService.updateNodeData(this.node()!, { formEnabled: active });
  }

  updateNodeLabel(label: string) {
    if (this.node()) {
      this.actionService.updateNodeData(this.node()!, { label });
      this.stateService.markDirty();
    }
  }

  updateEdgeLabel(label: string) {
    if (this.edge()) this.actionService.updateEdgeData(this.edge()!, { label });
  }
}
