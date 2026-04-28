import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService, NgDiagramService, NgDiagramViewportService, SimpleNode, Edge, Point, initializeModel } from 'ng-diagram';
import { WorkflowDiagramNodeData } from '../../components/node/node.component';
import { WorkflowDesignerStateService } from './workflow-designer-state.service';

import { WORKFLOW_NODE_RULES } from '../data/workflow-designer.data';

@Injectable()
export class WorkflowDesignerActionService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly stateService = inject(WorkflowDesignerStateService);
  private readonly injector = inject(Injector);

  constructor() {
    // Inicialización proactiva ultra-segura
    try {
      const ms = this.modelService as any;
      if (ms) {
        const currentModel = typeof ms.model === 'function' ? ms.model() : ms.model;
        if (!currentModel && typeof ms.initializeModel === 'function') {
          ms.initializeModel(initializeModel({ nodes: [], edges: [] }));
        }
      }
    } catch (e) {
      console.warn('[ActionService] Error durante la inicialización proactiva:', e);
    }
  }

  public connectSelectedNodes(): void {
    if (!this.diagramService.isInitialized()) return;
    const nodes = this.selectionService.selection().nodes as SimpleNode<any>[];
    if (nodes.length !== 2) return;

    // Sort nodes vertically so connections always go top-to-bottom
    const [first, second] = [...nodes].sort((a, b) => a.position.y - b.position.y);

    if (first.id === second.id) {
      alert('No se permiten auto-conexiones.');
      return;
    }

    // Validar reglas estructurales
    const rules = WORKFLOW_NODE_RULES;
    const sourceRules = rules[first.type || 'task'];
    const targetRules = rules[second.type || 'task'];

    if (!sourceRules || !targetRules) return;

    const edges = this.modelService.edges();
    const sourceOutputsCount = edges.filter(e => e.source === first.id).length;
    const targetInputsCount = edges.filter(e => e.target === second.id).length;

    if (sourceOutputsCount >= sourceRules.maxOutputs) {
      alert(`Regla Violada: El nodo de origen (${first.type}) permite un máximo de ${sourceRules.maxOutputs} salidas.`);
      return;
    }

    if (targetInputsCount >= targetRules.maxInputs) {
      alert(`Regla Violada: El nodo de destino (${second.type}) permite un máximo de ${targetRules.maxInputs} entradas.`);
      return;
    }

    let labelText = '';
    let labels: any[] = [];
    if (first.type === 'decision') {
      const existingOutputs = sourceOutputsCount;
      labelText = existingOutputs === 0 ? 'Sí' : 'No';
      labels = [{ id: `lbl-${Date.now()}`, positionOnEdge: 0.5 }];
    }

    this.modelService.addEdges([{
      id: `edge-${Date.now()}`,
      type: 'flow',
      source: first.id,
      target: second.id,
      data: { 
        label: labelText,
        labels: labels.length > 0 ? labels : undefined
      }
    }]);

    this.stateService.markDirty();
    this.stateService.updateStats(this.modelService.nodes().length, this.modelService.edges().length);
    console.log(`[ActionService] Nodos conectados: ${first.id} -> ${second.id}`);
    this.selectionService.deselectAll();
  }

  public resolvePorts(source: SimpleNode<any>, target: SimpleNode<any>) {
    return { sourcePort: 'bottom', targetPort: 'top' };
  }

  public updateNodeData(node: SimpleNode<any>, patch: any): void {
    this.modelService.updateNodes([{
      id: node.id,
      data: { ...node.data, ...patch }
    }]);
  }

  public updateEdgeData(edge: Edge<any>, patch: any): void {
    this.modelService.updateEdges([{
      id: edge.id,
      data: { ...edge.data, ...patch }
    }]);
  }

  public loadWorkflow(wf: any): void {
    if (!wf) return;

    let data: any;
    try {
      const rawData = wf.diagramData || wf.diagrama;
      data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (e) {
      data = { nodes: [], edges: [] };
    }

    if (!data || !data.nodes) data = { nodes: [], edges: [] };

    // TAMAÑO SOLICITADO: Ancho 200, Alto 800
    if (data.nodes.length === 0) {
      data.nodes.push({
        id: `lane-${Date.now()}`,
        type: 'lane',
        position: { x: 50, y: 50 },
        size: { width: 300, height: 800 },
        data: { label: 'Departamento 1', typeLabel: 'Carril' }
      });
    }

    try {
      const ms = this.modelService as any;
      if (typeof ms.initializeModel === 'function') {
        ms.initializeModel(initializeModel({
          nodes: data.nodes || [],
          edges: data.edges || []
        }));
      } else {
        // Fallback seguro
        this.modelService.addNodes(data.nodes || []);
        this.modelService.addEdges(data.edges || []);
      }

      console.log('[ActionService] Workflow cargado con carriles de 200x800.');

      setTimeout(() => {
        if (data.metadata?.viewport) {
          const vp = data.metadata.viewport;
          this.viewportService.setViewport(vp.x, vp.y, vp.scale);
          this.stateService.setZoom(vp.scale);
        } else {
          // Set default zoom to 100% instead of zooming to fit, which can cause extreme zoom on small diagrams
          this.viewportService.setViewport(50, 50, 1);
          this.stateService.setZoom(1);
        }
      }, 300);

    } catch (err) {
      console.error('[ActionService] Error al cargar datos:', err);
    }
  }

  public addLane(): void {
    const nodes = this.modelService.nodes();
    const lanes = nodes.filter(n => n.type === 'lane');

    let nextX = 50;
    if (lanes.length > 0) {
      // Como ahora son altos y estrechos, los pegamos horizontalmente (eje X)
      const lastLane = lanes.reduce((prev, curr) =>
        (curr.position.x + (curr.size?.width || 200)) > (prev.position.x + (prev.size?.width || 200)) ? curr : prev
      );
      nextX = lastLane.position.x + (lastLane.size?.width || 200);
    }

    // TAMAÑO SOLICITADO: Ancho 200, Alto 800
    this.modelService.addNodes([{
      id: `lane-${Date.now()}`,
      type: 'lane',
      position: { x: nextX, y: 50 },
      size: { width: 200, height: 800 },
      data: { label: `Departamento ${lanes.length + 1}`, typeLabel: 'Carril' }
    }]);
    this.stateService.markDirty();
  }

  public getModelJSON(): string {
    return JSON.stringify({
      nodes: this.modelService.nodes(),
      edges: this.modelService.edges()
    });
  }

  public zoomIn(): void {
    const nextZoom = (this.stateService.zoomLevel() / 100) + 0.1;
    this.viewportService.zoom(nextZoom);
    this.stateService.setZoom(nextZoom);
  }

  public zoomOut(): void {
    const nextZoom = (this.stateService.zoomLevel() / 100) - 0.1;
    this.viewportService.zoom(nextZoom);
    this.stateService.setZoom(nextZoom);
  }
  public fitToScreen(): void { this.viewportService.zoomToFit(); }

  public relayout(): void {
    const nodes = this.modelService.nodes();
    if (nodes.length === 0) return;
    const sorted = [...nodes].sort((a, b) => (a.type === 'start' ? -1 : (b.type === 'start' ? 1 : (a.type === 'end' ? 1 : -1))));
    const updates = sorted.map((node, i) => ({ id: node.id, position: { x: 400, y: 100 + (i * 160) } }));
    this.modelService.updateNodes(updates);
    this.viewportService.setViewport(50, 50, 1);
    this.stateService.setZoom(1);
  }

  public addNodeFromPalette(item: any, position: Point): void {
    if (!this.diagramService.isInitialized()) {
      console.warn('[ActionService] El motor no está inicializado. No se puede añadir el nodo.');
      return;
    }
    const newNode = {
      id: `node-${Date.now()}`,
      type: item.type || 'task',
      position: position,
      size: item.type === 'lane' ? { width: 800, height: 200 } : undefined,
      data: { ...item.data }
    };
    console.log('[ActionService] Agregando nodo desde paleta:', newNode);
    this.modelService.addNodes([newNode]);
  }
}
