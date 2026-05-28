import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleNode, NgDiagramModelService } from 'ng-diagram';
import { WorkflowDiagramNodeData } from '../../node/node.component';
import { WorkflowDesignerConfigService } from '../../../core/services/workflow-designer-config.service';
import { WorkflowDesignerStateService } from '../../../core/services/workflow-designer-state.service';

@Component({
  selector: 'app-workflow-designer-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-builder.component.html',
  styleUrl: '../../editor/editor.component.css'
})
export class FormBuilderComponent {
  node = input.required<SimpleNode<WorkflowDiagramNodeData>>();
  public configService = inject(WorkflowDesignerConfigService);
  public stateService = inject(WorkflowDesignerStateService);
  private readonly modelService = inject(NgDiagramModelService);

  getDepartmentName(): string {
    const taskNode = this.node();
    if (taskNode.type === 'lane') return '';
    if (taskNode.type === 'start') return 'RECEPCION';

    const role = (taskNode.data as any)?.role || (taskNode.data as any)?.departamento || '';

    // Buscar si está dentro de algún carril (lane)
    const allNodes = this.modelService.nodes();
    const lanes = allNodes.filter(n => n.type === 'lane');

    const taskX = taskNode.position.x;
    const taskY = taskNode.position.y;

    for (const lane of lanes) {
      const laneX = lane.position.x;
      const laneY = lane.position.y;
      const laneW = lane.size?.width || 200;
      const laneH = lane.size?.height || 800;

      if (taskX >= laneX && taskX <= (laneX + laneW) && taskY >= laneY && taskY <= (laneY + laneH)) {
        return (lane.data as any)?.label || '';
      }
    }

    return role;
  }

  get schema() { return this.node().data.formSchema; }
  
  get allowedTypesString() { return (this.schema as any)?.allowedTypes || ''; }
  get requiredDocsString() { return (this.schema as any)?.requiredDocs || ''; }

  updateSchema(patch: any) {
    this.configService.updateNodeData(this.node(), { 
      formSchema: { ...this.schema!, ...patch } 
    });
  }

  updateAllowedTypes(val: string) { this.updateSchema({ allowedTypes: val }); }
  updateRequiredDocs(val: string) { this.updateSchema({ requiredDocs: val }); }

  updateField(id: string, patch: any) { this.configService.updateFormField(this.node(), id, patch); }
  addField() { this.configService.addFormField(this.node()); }
  removeField(id: string) { this.configService.removeFormField(this.node(), id); }

  updateNodeRole(role: string) {
    this.configService.updateNodeData(this.node(), { role });
    this.stateService.markDirty();
  }
}
