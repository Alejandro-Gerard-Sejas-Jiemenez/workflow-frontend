import { Injectable, inject, signal } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, Node, SimpleNode, NgDiagramConfig } from 'ng-diagram';
import { WorkflowDiagramNodeData, DynamicFormField, DynamicFormSchema } from '../../components/node/node.component';
import { BehaviorSubject } from 'rxjs';

import { WORKFLOW_NODE_RULES } from '../data/workflow-designer.data';

@Injectable()
export class WorkflowDesignerConfigService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly selectedNodeSubject = new BehaviorSubject<any>(null);
  public departments = signal<any[]>([]);

  public getDiagramConfig(): NgDiagramConfig {
    return {
      edgeRouting: {
        defaultRouting: 'bezier'
      },
      zIndex: {
        enabled: true,
        edgesAboveConnectedNodes: true
      },
      linking: {
        finalEdgeDataBuilder: (edge: any, source: any) => {
          let labelText = '';
          let labels: any[] = [];
          if (source && source.type === 'decision') {
            const edges = this.modelService.edges();
            const existingOutputs = edges.filter(e => e.source === source.id).length;
            labelText = existingOutputs === 0 ? 'Sí' : 'No';
            labels = [{ id: `lbl-${Date.now()}`, positionOnEdge: 0.5 }];
          }
          return {
            ...edge,
            type: 'flow',
            data: {
              label: labelText,
              labels: labels.length > 0 ? labels : undefined
            }
          };
        },
        validateConnection: (source: any, sourcePort: any, target: any, targetPort: any) => {
          if (!source || !target) return false;
          if (source.id === target.id) return false; // Prevenir auto-conexiones

          // Validar reglas estructurales
          const rules = WORKFLOW_NODE_RULES;
          const sourceType = source.type;
          const targetType = target.type;

          const sourceRules = rules[sourceType];
          const targetRules = rules[targetType];

          if (!sourceRules || !targetRules) return false;

          const edges = this.modelService.edges();
          const sourceOutputsCount = edges.filter(e => e.source === source.id).length;
          const targetInputsCount = edges.filter(e => e.target === target.id).length;

          if (sourceOutputsCount >= sourceRules.maxOutputs) {
            console.warn(`[Validación] El nodo '${sourceType}' ya alcanzó su límite máximo de salidas (${sourceRules.maxOutputs}).`);
            return false;
          }

          if (targetInputsCount >= targetRules.maxInputs) {
            console.warn(`[Validación] El nodo '${targetType}' ya alcanzó su límite máximo de entradas (${targetRules.maxInputs}).`);
            return false;
          }

          return true;
        }
      }
    };
  }

  public getNodeTemplateMap() {
    // Lazy load to avoid circular dependencies if needed, or just return here.
    return null; // Will inject from editor for now to avoid massive refactoring of imports
  }

  public getSelectedNode(): SimpleNode<WorkflowDiagramNodeData> | null {
    return this.selectionService.selection().nodes[0] as SimpleNode<WorkflowDiagramNodeData> | null;
  }

  public updateNodeData(node: Node<WorkflowDiagramNodeData>, patch: Partial<WorkflowDiagramNodeData>): void {
    this.modelService.updateNodes([{
      id: node.id,
      data: { ...node.data, ...patch }
    }]);
  }

  public updateNodeBounds(node: any, width: number, height: number, x?: number, y?: number): void {
    const patch: any = { id: node.id, size: { width, height } };
    if (x !== undefined && y !== undefined) {
      patch.position = { x, y };
    }
    this.modelService.updateNodes([patch]);
  }

  public createDefaultFormSchema(node: Node<WorkflowDiagramNodeData>): DynamicFormSchema {
    return { title: node.data.label || 'Nuevo Formulario', description: '', fields: [], allowAttachments: false };
  }

  public createDefaultFormField(type: any, index: number): DynamicFormField {
    return { id: `field-${Date.now()}-${index}`, label: `Campo ${index}`, type: type, required: false, placeholder: '' };
  }

  public updateFormField(node: Node<WorkflowDiagramNodeData>, id: string, patch: any): void {
    const schema = node.data.formSchema;
    if (!schema || !schema.fields) return;
    const fields = schema.fields.map((f: DynamicFormField) => f.id === id ? { ...f, ...patch } : f);
    this.updateNodeData(node, { formSchema: { ...schema, fields } });
  }

  public addFormField(node: Node<WorkflowDiagramNodeData>): void {
    const schema = node.data.formSchema || this.createDefaultFormSchema(node);
    const field = schema.fields || [];
    const newField = this.createDefaultFormField('text', field.length + 1);
    this.updateNodeData(node, { formSchema: { ...schema, fields: [...field, newField] } });
  }

  public removeFormField(node: Node<WorkflowDiagramNodeData>, id: string): void {
    const schema = node.data.formSchema;
    if (!schema || !schema.fields) return;
    const fields = schema.fields.filter((f: DynamicFormField) => f.id !== id);
    this.updateNodeData(node, { formSchema: { ...schema, fields } });
  }
}
