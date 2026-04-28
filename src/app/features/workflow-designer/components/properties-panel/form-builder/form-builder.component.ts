import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleNode } from 'ng-diagram';
import { WorkflowDiagramNodeData } from '../../node/node.component';
import { WorkflowDesignerConfigService } from '../../../core/services/workflow-designer-config.service';

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
}
