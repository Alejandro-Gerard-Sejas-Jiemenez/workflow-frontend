import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleNode, NgDiagramModelService } from 'ng-diagram';
import { WorkflowDiagramNodeData } from '../../node/node.component';
import { WorkflowDesignerConfigService } from '../../../core/services/workflow-designer-config.service';
import { WorkflowDesignerStateService } from '../../../core/services/workflow-designer-state.service';

@Component({
  selector: 'app-workflow-designer-condition-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <fieldset [disabled]="stateService.isPublished()" class="condition-builder-section space-y-4 border-none p-0 m-0">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
          <i class="pi pi-sliders-h text-[11px] text-slate-400"></i> Reglas de Decisión
        </span>
        <button (click)="addRule()" 
                class="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 hover:text-indigo-700 rounded-xl text-[10px] font-bold transition-all">
          <i class="pi pi-plus text-[8px]"></i> Añadir regla
        </button>
      </div>

      @if (rules.length > 1) {
        <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Unir con:</span>
          <select [ngModel]="logicalOperator" 
                  (ngModelChange)="updateOperator($event)"
                  class="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-0.5 cursor-pointer outline-none">
            <option value="AND">Y (AND)</option>
            <option value="OR">O (OR)</option>
          </select>
        </div>
      }

      <div class="rules-list space-y-2.5">
        @for (rule of rules; track $index) {
          <div class="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 relative group hover:border-slate-300/70 transition-all">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Regla #{{ $index + 1 }}</span>
              <button (click)="removeRule($index)" 
                      class="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Quitar regla">
                <i class="pi pi-trash text-[10px]"></i>
              </button>
            </div>

            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1"><i class="pi pi-tag text-[9px]"></i> Campo</span>
              
              @if (getPrecedingFields().length > 0) {
                <div class="relative flex items-center animate-fadein">
                  <select [ngModel]="rule.field" 
                          (ngModelChange)="updateRule($index, 'field', $event)"
                          class="w-full pl-3 pr-8 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 bg-slate-50/50 hover:bg-slate-50 outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-all">
                    <option value="">Seleccione un campo...</option>
                    @for (fieldOpt of getPrecedingFields(); track fieldOpt) {
                      <option [value]="fieldOpt">{{ fieldOpt }}</option>
                    }
                  </select>
                  <i class="pi pi-chevron-down absolute right-3 text-[8px] text-slate-400 pointer-events-none"></i>
                </div>
              } @else {
                <input type="text" 
                       [ngModel]="rule.field" 
                       (ngModelChange)="updateRule($index, 'field', $event)" 
                       placeholder="Escribe el nombre del campo..." 
                       class="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 transition-all outline-none" />
              }
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1"><i class="pi pi-cog text-[9px]"></i> Operador</span>
                <select [ngModel]="rule.operator" 
                        (ngModelChange)="updateRule($index, 'operator', $event)"
                        class="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:border-indigo-500 outline-none cursor-pointer">
                  @if (getFieldType(rule.field) === 'checklist') {
                    <option value="==">Contiene la opción (==)</option>
                    <option value="!=">No contiene la opción (!=)</option>
                  } @else {
                    <option value="==">Igual a (==)</option>
                    <option value="!=">Distinto de (!=)</option>
                    @if (getFieldType(rule.field) === 'number') {
                      <option value=">">Mayor que (>)</option>
                      <option value="<">Menor que (<)</option>
                      <option value=">=">Mayor o igual (>=)</option>
                      <option value="<=">Menor o igual (<=)</option>
                    }
                  }
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1"><i class="pi pi-pencil text-[9px]"></i> Valor</span>
                
                @if (getFieldOptions(rule.field).length > 0) {
                  <div class="relative flex items-center animate-fadein">
                    <select [ngModel]="rule.value" 
                            (ngModelChange)="updateRule($index, 'value', $event)"
                            class="w-full pl-3 pr-8 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 bg-slate-50/50 hover:bg-slate-50 outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-all">
                      <option value="">Seleccione...</option>
                      @for (valOpt of getFieldOptions(rule.field); track valOpt) {
                        <option [value]="valOpt">{{ valOpt }}</option>
                      }
                    </select>
                    <i class="pi pi-chevron-down absolute right-3 text-[8px] text-slate-400 pointer-events-none"></i>
                  </div>
                } @else {
                  <input type="text" 
                         [ngModel]="rule.value" 
                         (ngModelChange)="updateRule($index, 'value', $event)" 
                         placeholder="Ej: 1000, VIP..." 
                         class="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 transition-all outline-none" />
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 gap-1">
            <i class="pi pi-info-circle text-base"></i>
            <span class="text-[10px] font-medium">Agrega una regla para iniciar</span>
          </div>
        }
      </div>
    </fieldset>
  `,
  styleUrl: '../../editor/editor.component.css'
})
export class ConditionBuilderComponent {
  node = input.required<SimpleNode<WorkflowDiagramNodeData>>();
  private configService = inject(WorkflowDesignerConfigService);
  public stateService = inject(WorkflowDesignerStateService);
  private readonly modelService = inject(NgDiagramModelService);

  getPrecedingFields(): string[] {
    const currentNode = this.node();
    const edges = this.modelService.edges();
    const nodes = this.modelService.nodes();

    // Encontrar todos los IDs de nodos que tienen un flujo que entra al nodo actual
    const incomingNodeIds = edges
      .filter(e => e.target === currentNode.id)
      .map(e => e.source);

    if (incomingNodeIds.length === 0) return [];

    const fields: string[] = [];

    // Para cada nodo de origen, si tiene un formSchema con fields, extraemos las etiquetas (labels)
    incomingNodeIds.forEach(sourceId => {
      const sourceNode = nodes.find(n => n.id === sourceId);
      const data = sourceNode?.data as any;
      if (sourceNode && data && data.formSchema) {
        const schema = data.formSchema;
        if (schema.fields && Array.isArray(schema.fields)) {
          schema.fields.forEach((f: any) => {
            if (f.label && !fields.includes(f.label)) {
              fields.push(f.label);
            }
          });
        }
      }
    });

    return fields;
  }

  getFieldSchema(fieldName: string): any | null {
    if (!fieldName) return null;
    const currentNode = this.node();
    const edges = this.modelService.edges();
    const nodes = this.modelService.nodes();

    const incomingNodeIds = edges
      .filter(e => e.target === currentNode.id)
      .map(e => e.source);

    for (const sourceId of incomingNodeIds) {
      const sourceNode = nodes.find(n => n.id === sourceId);
      const data = sourceNode?.data as any;
      if (sourceNode && data && data.formSchema) {
        const schema = data.formSchema;
        if (schema.fields && Array.isArray(schema.fields)) {
          const field = schema.fields.find((f: any) => f.label === fieldName);
          if (field) return field;
        }
      }
    }
    return null;
  }

  getFieldType(fieldName: string): string {
    const schema = this.getFieldSchema(fieldName);
    return schema ? schema.type : 'text';
  }

  getFieldOptions(fieldName: string): string[] {
    const schema = this.getFieldSchema(fieldName);
    if (!schema) return [];
    
    // Si es tipo booleano o checkbox, las opciones son true / false
    if (schema.type === 'checkbox' || schema.type === 'booleano') {
      return ['true', 'false'];
    }
    
    // Si es select o checklist, extraemos sus opciones
    if (schema.options && Array.isArray(schema.options)) {
      return schema.options;
    }
    return [];
  }

  get config() { 
    const c = this.node().data.conditionConfig as any;
    return c || { rules: [], logicalOperator: 'AND' }; 
  }

  get rules(): any[] { return this.config.rules || []; }
  get logicalOperator(): string { return this.config.logicalOperator || 'AND'; }

  updateOperator(op: string) {
    this.configService.updateNodeData(this.node(), {
      conditionConfig: { ...this.config, logicalOperator: op }
    });
  }

  addRule() {
    const currentRules = [...this.rules];
    currentRules.push({ field: '', operator: '==', value: '' });
    this.configService.updateNodeData(this.node(), {
      conditionConfig: { ...this.config, rules: currentRules }
    });
  }

  removeRule(index: number) {
    const currentRules = this.rules.filter((_, i) => i !== index);
    this.configService.updateNodeData(this.node(), {
      conditionConfig: { ...this.config, rules: currentRules }
    });
  }

  updateRule(index: number, field: string, value: any) {
    const currentRules = this.rules.map((r, i) => i === index ? { ...r, [field]: value } : r);
    this.configService.updateNodeData(this.node(), {
      conditionConfig: { ...this.config, rules: currentRules }
    });
  }
}
