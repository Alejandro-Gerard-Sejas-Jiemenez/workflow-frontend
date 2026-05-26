import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleNode } from 'ng-diagram';
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
              <input type="text" 
                     [ngModel]="rule.field" 
                     (ngModelChange)="updateRule($index, 'field', $event)" 
                     placeholder="Ej: monto, area..." 
                     class="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 transition-all outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1"><i class="pi pi-cog text-[9px]"></i> Operador</span>
                <select [ngModel]="rule.operator" 
                        (ngModelChange)="updateRule($index, 'operator', $event)"
                        class="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:border-indigo-500 outline-none cursor-pointer">
                  <option value="==">Igual a (==)</option>
                  <option value="!=">Distinto de (!=)</option>
                  <option value=">">Mayor que (>)</option>
                  <option value="<">Menor que (<)</option>
                  <option value=">=">Mayor o igual (>=)</option>
                  <option value="<=">Menor o igual (<=)</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-slate-500 flex items-center gap-1"><i class="pi pi-pencil text-[9px]"></i> Valor</span>
                <input type="text" 
                       [ngModel]="rule.value" 
                       (ngModelChange)="updateRule($index, 'value', $event)" 
                       placeholder="Ej: 1000, VIP" 
                       class="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 transition-all outline-none" />
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
