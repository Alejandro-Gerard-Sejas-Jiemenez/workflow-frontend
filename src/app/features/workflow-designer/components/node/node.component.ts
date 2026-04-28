import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgDiagramPortComponent, NgDiagramNodeTemplate, SimpleNode } from 'ng-diagram';

export type DynamicFormField = {
  id: string; type: string; label: string; placeholder?: string;
  required: boolean; options?: string[];
};

export type DynamicFormSchema = {
  id?: string; title: string; description?: string;
  allowAttachments: boolean; fields: DynamicFormField[];
  allowedTypes?: string; requiredDocs?: string;
};

export type WorkflowDiagramNodeData = {
  kind: string; label: string; role: string; accent: string; typeLabel: string;
  formEnabled?: boolean; conditionConfig?: any;
  formSchema?: DynamicFormSchema | null;
};

import { WorkflowDesignerConfigService } from '../../core/services/workflow-designer-config.service';

@Component({
  selector: 'app-workflow-diagram-node',
  standalone: true,
  imports: [CommonModule, NgDiagramPortComponent],
  template: `
    <div class="workflow-node-shell" [class.workflow-node-shell--selected]="node().selected">
      @if (node().type !== 'lane') {
        <ng-diagram-port id="top" side="top" type="both" class="workflow-node__port workflow-node__port--top"></ng-diagram-port>
      }
      
      <div class="workflow-node" [ngClass]="'workflow-node--' + node().type">
        @if (node().type === 'start') {
          <div class="workflow-node__initial"></div>
        } @else if (node().type === 'end') {
          <div class="workflow-node__final"><div class="workflow-node__final-core"></div></div>
        } @else if (node().type === 'flow-final') {
          <div class="workflow-node__flow-final"><div class="workflow-node__flow-final-x"></div></div>
        } @else if (node().type === 'decision' || node().type === 'merge') {
          <div class="workflow-node__diamond">
            <span class="workflow-node__diamond-label">{{ node().data.typeLabel }}</span>
          </div>
        } @else if (node().type === 'fork' || node().type === 'join') {
          <div class="workflow-node__bar"></div>
        } @else if (node().type === 'signal-send' || node().type === 'signal-receive') {
          <div class="workflow-node__signal" [class.workflow-node__signal--send]="node().type === 'signal-send'">
            <span>{{ node().data.typeLabel }}</span>
          </div>
        } @else if (node().type === 'note') {
          <div class="workflow-node__note">{{ node().data.typeLabel }}</div>
        } @else if (node().type === 'lane') {
          <div class="workflow-node__swimlane" 
         [style.width.px]="node().size?.width || 250" 
         [style.height.px]="node().size?.height || 400">
            <div class="workflow-node__swimlane-header">
              <select class="workflow-node__swimlane-select" 
                      [value]="node().data.label"
                      (change)="onLaneDepartmentChange($event)">
                <option value="">Seleccionar Departamento</option>
                @for (dept of configService.departments(); track dept.id) {
                  <option [value]="dept.nombre">{{ dept.nombre }}</option>
                }
              </select>
            </div>
            <div class="workflow-node__swimlane-body"></div>
          </div>
        } @else {
          <div class="workflow-node__body">
            <h4 class="workflow-node__title">{{ node().data.label }}</h4>
            <p class="workflow-node__role">{{ node().data.role }}</p>
          </div>
        }
      </div>

      @if (node().type !== 'lane') {
        <ng-diagram-port id="bottom" side="bottom" type="both" class="workflow-node__port workflow-node__port--bottom"></ng-diagram-port>
        <ng-diagram-port id="left" side="left" type="both" class="workflow-node__port workflow-node__port--left"></ng-diagram-port>
        <ng-diagram-port id="right" side="right" type="both" class="workflow-node__port workflow-node__port--right"></ng-diagram-port>
      }
    </div>
  `,
  styleUrl: './node.component.css'
})
export class NodeComponent implements NgDiagramNodeTemplate<WorkflowDiagramNodeData, SimpleNode<WorkflowDiagramNodeData>> {
  readonly node = input.required<SimpleNode<WorkflowDiagramNodeData>>();
  protected readonly configService = inject(WorkflowDesignerConfigService);

  onLaneDepartmentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.configService.updateNodeData(this.node(), { label: select.value });
  }
}
