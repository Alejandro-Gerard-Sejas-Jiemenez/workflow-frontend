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
import { WorkflowDesignerStateService } from '../../core/services/workflow-designer-state.service';

@Component({
  selector: 'app-workflow-diagram-node',
  standalone: true,
  imports: [CommonModule, NgDiagramPortComponent],
  template: `
    <div class="workflow-node-shell" 
         [class.workflow-node-shell--selected]="node().selected"
         [attr.data-no-drag]="stateService.isPublished() ? true : null">
      @if (node().type !== 'lane' && !stateService.isPublished()) {
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
          <div class="workflow-node__swimlane relative" 
               [style.width.px]="node().size?.width || 250" 
               [style.height.px]="node().size?.height || 400">
            <div class="workflow-node__swimlane-header">
              <select class="workflow-node__swimlane-select" 
                      [value]="node().data.label"
                      (change)="onLaneDepartmentChange($event)"
                      [disabled]="stateService.isPublished()">
                <option value="">Seleccionar Departamento</option>
                @for (dept of configService.departments(); track dept.id) {
                  <option [value]="dept.nombre">{{ dept.nombre }}</option>
                }
              </select>
            </div>
            <div class="workflow-node__swimlane-body"></div>
            
            @if (!stateService.isPublished()) {
              <!-- Top handle -->
              <div class="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'top')"></div>
              <!-- Bottom handle -->
              <div class="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'bottom')"></div>
              <!-- Left handle -->
              <div class="absolute top-0 bottom-0 left-0 w-2 cursor-w-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'left')"></div>
              <!-- Right handle -->
              <div class="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'right')"></div>
              
              <!-- Corners -->
              <div class="absolute right-0 bottom-0 w-3 h-3 cursor-se-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'bottom-right')"></div>
              <div class="absolute left-0 bottom-0 w-3 h-3 cursor-sw-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'bottom-left')"></div>
              <div class="absolute right-0 top-0 w-3 h-3 cursor-ne-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'top-right')"></div>
              <div class="absolute left-0 top-0 w-3 h-3 cursor-nw-resize hover:bg-violet-500/50 z-50" (mousedown)="startResize($event, 'top-left')"></div>
            }
          </div>
        } @else {
          <div class="workflow-node__body">
            <h4 class="workflow-node__title">{{ node().data.label }}</h4>
            <p class="workflow-node__role">{{ node().data.role }}</p>
          </div>
        }
      </div>

      @if (node().type !== 'lane' && !stateService.isPublished()) {
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
  public readonly stateService = inject(WorkflowDesignerStateService);

  onLaneDepartmentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.configService.updateNodeData(this.node(), { label: select.value });
  }

  startResize(event: MouseEvent, dir: string) {
    event.preventDefault();
    event.stopPropagation();

    const initialWidth = this.node().size?.width || 250;
    const initialHeight = this.node().size?.height || 400;
    const initialX = this.node().position.x;
    const initialY = this.node().position.y;
    const startX = event.clientX;
    const startY = event.clientY;

    const doResize = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = initialWidth;
      let newHeight = initialHeight;
      let newX = initialX;
      let newY = initialY;

      if (dir.includes('right')) {
        newWidth = Math.max(150, initialWidth + deltaX);
      }
      if (dir.includes('bottom')) {
        newHeight = Math.max(150, initialHeight + deltaY);
      }
      if (dir.includes('left')) {
        newWidth = Math.max(150, initialWidth - deltaX);
        newX = initialX + (initialWidth - newWidth);
      }
      if (dir.includes('top')) {
        newHeight = Math.max(150, initialHeight - deltaY);
        newY = initialY + (initialHeight - newHeight);
      }

      this.configService.updateNodeBounds(this.node(), newWidth, newHeight, newX, newY);
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    };

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
  }
}
