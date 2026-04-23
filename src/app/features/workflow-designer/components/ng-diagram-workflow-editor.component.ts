import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, ElementRef, inject, Injector, input, output, runInInjectionContext, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Card } from 'primeng/card';
import {
  configureShortcuts,
  Edge,
  EdgeDrawnEvent,
  initializeModel,
  ModelAdapter,
  NgDiagramComponent,
  NgDiagramConfig,
  NgDiagramModelService,
  NgDiagramEdgeTemplateMap,
  NgDiagramNodeTemplateMap,
  NgDiagramPaletteItem,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  NgDiagramService,
  Node,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  NodeDragEndedEvent,
  NodeResizedEvent,
  PaletteItemDroppedEvent,
  Point,
  SelectionChangedEvent,
  SelectionRemovedEvent,
  SelectionMovedEvent,
  provideNgDiagram,
  SimpleNode
} from 'ng-diagram';
import { DesignerWorkflow } from '../../designer/data/designer-dashboard.data';
import { WorkflowCollaborationEvent, WorkflowCollaborationService, WorkflowCursor, WorkflowPresenceUser } from '../../designer/services/workflow-collaboration.service';
import { ADMIN_DEPARTMENTS } from '../../admin/data/admin-dashboard.data';
import { WorkflowDiagramEdgeComponent } from './workflow-diagram-edge.component';
import { WorkflowDiagramNodeComponent, WorkflowDiagramNodeData } from './workflow-diagram-node.component';

type WorkflowNodeKind = 'start' | 'task' | 'decision' | 'fork' | 'join' | 'end' | 'lane';
type WorkflowPatternKind = 'linear' | 'alternative' | 'iterative' | 'parallel';
type SidebarCategory = 'shapes' | 'patterns';
type WorkflowPortId = 'top' | 'right' | 'bottom' | 'left';

type WorkflowDiagramModel = {
  nodes?: SimpleNode<WorkflowDiagramNodeData>[];
  edges?: Edge[];
  metadata?: object;
};

type OverlayEdge = {
  id: string;
  points: string;
};

type OverlayJunction = {
  id: string;
  x: number;
  y: number;
  r: number;
};

type RemoteCursor = WorkflowPresenceUser & {
  cursor: WorkflowCursor;
};

@Component({
  selector: 'app-ng-diagram-workflow-editor',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    NgDiagramComponent,
    NgDiagramPaletteItemComponent,
    NgDiagramPaletteItemPreviewComponent
  ],
  providers: [provideNgDiagram()],
  templateUrl: './ng-diagram-workflow-editor.component.html',
  styleUrl: './ng-diagram-workflow-editor.component.css'
})
export class NgDiagramWorkflowEditorComponent {
  private static readonly MAX_AUTO_FIT_SCALE = 1.25;
  private static readonly DEFAULT_SPARSE_SCALE = 1;
  readonly workflow = input<DesignerWorkflow | null>(null);
  readonly saveDiagram = output<string>();
  readonly diagramDraftChanged = output<string>();
  private readonly diagramCanvas = viewChild<object>('diagramCanvas');

  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly collaborationService = inject(WorkflowCollaborationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  protected model: ModelAdapter = this.createModel();
  protected readonly diagramConfig: NgDiagramConfig = {
    shortcuts: configureShortcuts([
      {
        actionName: 'multiSelection',
        bindings: [
          { modifiers: { primary: true } }
        ]
      },
      {
        actionName: 'boxSelection',
        bindings: [{ modifiers: { shift: true } }]
      }
    ]),
    boxSelection: {
      partialInclusion: true,
      realtime: false
    },
    linking: {
      finalEdgeDataBuilder: (edge: Edge) => ({
        ...edge,
        type: 'flow',
        routing: 'orthogonal'
      })
    },
    edgeRouting: {
      defaultRouting: 'orthogonal'
    },
    resize: {
      defaultResizable: true,
      allowResizeBelowChildrenBounds: true,
      getMinNodeSize: (node: Node<WorkflowDiagramNodeData>) => node.type === 'lane'
        ? { width: 220, height: 220 }
        : { width: 42, height: 42 }
    }
  };
  protected readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['start', WorkflowDiagramNodeComponent],
    ['task', WorkflowDiagramNodeComponent],
    ['decision', WorkflowDiagramNodeComponent],
    ['fork', WorkflowDiagramNodeComponent],
    ['join', WorkflowDiagramNodeComponent],
    ['end', WorkflowDiagramNodeComponent],
    ['lane', WorkflowDiagramNodeComponent]
  ]);
  protected readonly edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['flow', WorkflowDiagramEdgeComponent]
  ]);
  protected selectedLaneDepartment = ADMIN_DEPARTMENTS[0] as string;
  protected readonly paletteItems: NgDiagramPaletteItem<WorkflowDiagramNodeData>[] = [
    this.createPaletteItem('lane'),
    this.createPaletteItem('start'),
    this.createPaletteItem('task'),
    this.createPaletteItem('decision'),
    this.createPaletteItem('fork'),
    this.createPaletteItem('join'),
    this.createPaletteItem('end')
  ];
  protected laneLabels: string[] = [...ADMIN_DEPARTMENTS];
  protected readonly supportedPatterns: Array<{ kind: WorkflowPatternKind; title: string; description: string }> = [
    {
      kind: 'linear',
      title: 'Flujo lineal secuencial',
      description: 'Encadena actividades una despues de otra en una ruta unica.'
    },
    {
      kind: 'alternative',
      title: 'Flujo alternativo',
      description: 'Usa una decision para abrir caminos posibles y volver a un punto comun.'
    },
    {
      kind: 'iterative',
      title: 'Flujo iterativo',
      description: 'Permite repetir una actividad mientras una condicion siga activa.'
    },
    {
      kind: 'parallel',
      title: 'Procesos en paralelo',
      description: 'Divide y sincroniza dos tareas que corren al mismo tiempo.'
    }
  ];
  protected readonly sidebarCategories: Array<{ key: SidebarCategory; label: string; icon: string; hint: string }> = [
    { key: 'shapes', label: 'Figuras', icon: 'pi pi-stop', hint: 'UML' },
    { key: 'patterns', label: 'Plantillas', icon: 'pi pi-sitemap', hint: 'Patrones' }
  ];
  protected activeSidebarCategory: SidebarCategory = 'shapes';
  protected isSidebarPanelOpen = true;
  protected isDirty = false;
  protected zoomLevel = 100;
  protected selectedNodeName: string | null = null;
  protected selectedNodeRole: string | null = null;
  protected totalNodes = 0;
  protected totalLinks = 0;
  protected lastSavedAt: Date | null = null;
  protected loadError: string | null = null;
  protected activeUsers: WorkflowPresenceUser[] = [];
  protected remoteCursors: RemoteCursor[] = [];
  private lastWorkflowSignature: string | null = null;
  private currentWorkflowId: string | null = null;
  private isApplyingRemoteEvent = false;
  private readonly deletedNodeIds = new Set<string>();
  private readonly deletedEdgeIds = new Set<string>();
  private canvasResizeObserver: ResizeObserver | null = null;
  private resizeRefreshFrame: number | null = null;
  private zoomSyncFrame: number | null = null;
  private lastCursorSentAt = 0;
  constructor() {
    effect(() => {
      const workflow = this.workflow();
      if (workflow) {
        const signature = this.buildWorkflowSignature(workflow);
        if (signature !== this.lastWorkflowSignature) {
          this.lastWorkflowSignature = signature;
          if (this.isCurrentDiagramAck(workflow)) {
            this.isDirty = false;
            this.lastSavedAt = new Date();
            return;
          }
          this.loadWorkflow(workflow);
        }
      }
    });

    this.collaborationService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.applyRemoteCollaborationEvent(event));

    this.destroyRef.onDestroy(() => {
      this.canvasResizeObserver?.disconnect();
      if (this.resizeRefreshFrame !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(this.resizeRefreshFrame);
      }
    });
  }

  protected zoomIn(): void {
    const viewport = this.viewportService.viewport();
    this.viewportService.setViewport(viewport.x, viewport.y, Math.min(this.viewportService.maxZoom, viewport.scale + 0.1));
    this.scheduleZoomSync();
  }

  protected zoomOut(): void {
    const viewport = this.viewportService.viewport();
    this.viewportService.setViewport(viewport.x, viewport.y, Math.max(this.viewportService.minZoom, viewport.scale - 0.1));
    this.scheduleZoomSync();
  }

  protected fitToScreen(): void {
    this.viewportService.zoomToFit({ padding: 72 });
    const viewport = this.viewportService.viewport();
    if (viewport.scale > NgDiagramWorkflowEditorComponent.MAX_AUTO_FIT_SCALE) {
      this.viewportService.setViewport(
        viewport.x,
        viewport.y,
        NgDiagramWorkflowEditorComponent.MAX_AUTO_FIT_SCALE
      );
    }
    this.scheduleZoomSync();
  }

  protected relayout(): void {
    const nodes = [...this.modelService.nodes()] as SimpleNode<WorkflowDiagramNodeData>[];
    const sortedNodes = nodes.sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x);

    const updates = sortedNodes.map((node, index) => ({
        id: node.id,
        position: {
          x: node.type === 'decision' ? 360 : 320,
          y: 80 + index * 180
        }
      }));

    this.modelService.updateNodes(updates);
    this.syncStepLabels();
    this.markDirty();
    this.broadcastNodes(this.modelService.nodes() as SimpleNode<WorkflowDiagramNodeData>[]);
    queueMicrotask(() => this.fitToScreen());
  }

  protected canConnectSelection(): boolean {
    const selectedNodes = this.selectionService.selection().nodes as SimpleNode<WorkflowDiagramNodeData>[];
    return selectedNodes.length === 2 && selectedNodes.every((node) => node.type !== 'lane');
  }

  protected connectSelectedNodes(): void {
    const selectedNodes = this.selectionService.selection().nodes as SimpleNode<WorkflowDiagramNodeData>[];
    if (selectedNodes.length !== 2) {
      return;
    }

    const [firstNode, secondNode] = [...selectedNodes].sort(
      (left, right) => left.position.y - right.position.y || left.position.x - right.position.x
    );

    const edgeId = this.generateId('edge');
    const ports = this.resolveConnectionPorts(firstNode, secondNode);
    const alreadyExists = this.modelService.edges().some((edge) =>
      edge.source === firstNode.id &&
      edge.target === secondNode.id &&
      edge.sourcePort === ports.sourcePort &&
      edge.targetPort === ports.targetPort
    );

    if (alreadyExists) {
      return;
    }

    const edge: Edge = {
      id: edgeId,
      type: 'flow',
      source: firstNode.id,
      sourcePort: ports.sourcePort,
      target: secondNode.id,
      targetPort: ports.targetPort,
      data: {},
      routing: 'orthogonal'
    };

    this.modelService.addEdges([edge]);
    this.updateStats();
    this.markDirty();
    this.broadcastEdge(edge);
  }

  protected removeSelectedNode(): void {
    const selection = this.selectionService.selection();
    const nodeIds = selection.nodes.map((node) => node.id);
    const edgeIds = selection.edges.map((edge) => edge.id);

    this.selectionService.deleteSelection();
    this.syncStepLabels();
    this.markDirty();
    nodeIds.forEach((nodeId) => this.broadcastNodeDeleted(nodeId));
    edgeIds.forEach((edgeId) => this.broadcastEdgeDeleted(edgeId));
  }

  protected onSelectionRemoved(event: SelectionRemovedEvent): void {
    this.syncStepLabels();
    this.updateStats();
    if (this.isApplyingRemoteEvent) {
      return;
    }

    this.markDirty();
    event.deletedNodes.forEach((node) => this.broadcastNodeDeleted(node.id));
    event.deletedEdges.forEach((edge) => this.broadcastEdgeDeleted(edge.id));
  }

  protected addPaletteNode(kind: WorkflowNodeKind): void {
    const selectedNode = this.selectionService.selection().nodes[0] as SimpleNode<WorkflowDiagramNodeData> | undefined;
    const size = this.getNodeSize(kind);
    const viewportCenter = this.getVisibleCenterFlowPosition();
    const position = selectedNode
      ? this.centerNodePosition(
          {
            x: selectedNode.position.x + selectedNode.size!.width / 2 + (kind === 'decision' ? 28 : 0),
            y: selectedNode.position.y + selectedNode.size!.height + 120
          },
          size
        )
      : this.createLanePosition(this.resolveLaneIndexFromX(viewportCenter.x), size, Math.max(96, viewportCenter.y - size.height / 2));

    const newNode: SimpleNode<WorkflowDiagramNodeData> = {
      id: `node-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      type: kind,
      position,
      size,
      autoSize: kind !== 'lane',
      resizable: kind === 'lane',
      zOrder: kind === 'lane' ? 0 : 10,
      data: this.buildNodeData(
        kind,
        this.getDefaultLabel(kind),
        this.getDefaultRole(kind),
        this.getDefaultHint(kind),
        0
      )
    };

    this.diagramService.transaction(() => {
      this.modelService.addNodes([newNode]);

      if (selectedNode && selectedNode.type !== 'lane' && kind !== 'lane') {
        const ports = this.resolveConnectionPorts(selectedNode, newNode);
        const edge: Edge = {
          id: `edge-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          type: 'flow',
          source: selectedNode.id,
          sourcePort: ports.sourcePort,
          target: newNode.id,
          targetPort: ports.targetPort,
          data: {},
          routing: 'orthogonal'
        };
        this.modelService.addEdges([edge]);
      }
    });

    this.selectionService.select([newNode.id], []);
    this.syncStepLabels();
    this.updateStats();
    this.markDirty();
    this.broadcastNodes(this.modelService.nodes() as SimpleNode<WorkflowDiagramNodeData>[]);
    this.broadcastEdges(this.modelService.edges());
  }

  protected addPaletteNodeFromLibrary(kind: string): void {
    this.addPaletteNode(kind as WorkflowNodeKind);
  }

  protected insertFlowPattern(kind: WorkflowPatternKind): void {
    const anchorNode = this.selectionService.selection().nodes[0] as SimpleNode<WorkflowDiagramNodeData> | undefined;
    const viewportCenter = this.getVisibleCenterFlowPosition();
    const startX = anchorNode?.position.x ?? viewportCenter.x - 110;
    const startY = anchorNode ? anchorNode.position.y + 170 : viewportCenter.y - 80;
    const graph = this.buildPatternGraph(kind, startX, startY);

    this.diagramService.transaction(() => {
      this.modelService.addNodes(graph.nodes);
      this.modelService.addEdges(graph.edges);

      if (anchorNode && graph.entryNodeId) {
        const entryNode = graph.nodes.find((node) => node.id === graph.entryNodeId);
        if (!entryNode) {
          return;
        }
        const ports = this.resolveConnectionPorts(anchorNode, entryNode);
        this.modelService.addEdges([{
          id: this.generateId('edge'),
          type: 'flow',
          source: anchorNode.id,
          sourcePort: ports.sourcePort,
          target: graph.entryNodeId,
          targetPort: ports.targetPort,
          data: {},
          routing: 'orthogonal'
        }]);
      }
    });

    this.selectionService.select(graph.nodes.map((node) => node.id), []);
    this.syncStepLabels();
    this.updateStats();
    this.markDirty();
    this.broadcastNodes(graph.nodes);
    this.broadcastEdges(this.modelService.edges());
  }

  protected persistDiagram(): void {
    this.syncStepLabels();
    this.saveDiagram.emit(this.modelService.toJSON());
    this.isDirty = false;
    this.lastSavedAt = new Date();
  }

  public triggerSave(): void {
    this.persistDiagram();
  }

  public exportDiagram(): string {
    this.syncStepLabels();
    return this.modelService.toJSON();
  }

  protected onDiagramInit(): void {
    this.observeCanvasResize();
    this.scheduleViewportRefresh();
    this.isDirty = false;
    this.updateStats();
  }

  protected onPaletteDrop(event: PaletteItemDroppedEvent): void {
    const droppedNode = event.node as SimpleNode<WorkflowDiagramNodeData>;
    const kind = (droppedNode.type as WorkflowNodeKind | undefined) ?? 'task';
    const size = droppedNode.size ?? this.getNodeSize(kind);
    const normalizedData = droppedNode.data ?? this.buildNodeData(
      kind,
      this.getDefaultLabel(kind),
      this.getDefaultRole(kind),
      this.getDefaultHint(kind),
      0
    );
    const normalizedNode: SimpleNode<WorkflowDiagramNodeData> = {
      ...droppedNode,
      type: kind,
      size,
      position: event.dropPosition,
      autoSize: kind !== 'lane',
      resizable: kind === 'lane',
      zOrder: kind === 'lane' ? 0 : 10,
      data: {
        ...normalizedData
      },
      selected: true
    };

    const nodeUpdates = this.modelService.nodes().map((node) =>
      node.id === droppedNode.id
        ? normalizedNode
        : {
            id: node.id,
            selected: false
          }
    );

    this.modelService.updateNodes(nodeUpdates);

    this.selectionService.select([droppedNode.id], []);
    this.syncStepLabels();
    this.updateStats();
    this.markDirty();
    this.scheduleNodeCreatedBroadcast(droppedNode.id, normalizedNode);
    this.scheduleZoomSync();
  }

  protected onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedNode = event.selectedNodes[0] as Node<WorkflowDiagramNodeData> | undefined;
    this.selectedNodeName = selectedNode?.data.label ?? null;
    this.selectedNodeRole = selectedNode?.data.role ?? null;
    if (selectedNode?.type === 'lane' && selectedNode.data.label) {
      this.selectedLaneDepartment = selectedNode.data.label;
    }
  }

  protected updateSelectedLaneDepartment(department: string): void {
    this.selectedLaneDepartment = department;
    const selectedNode = this.selectionService.selection().nodes[0] as SimpleNode<WorkflowDiagramNodeData> | undefined;
    if (!selectedNode || selectedNode.type !== 'lane') {
      return;
    }

    this.modelService.updateNodes([{
      id: selectedNode.id,
      data: {
        ...selectedNode.data,
        label: department
      }
    }]);

    this.selectedNodeName = department;
    this.markDirty();
    this.broadcastNode({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label: department
      }
    });
  }

  protected selectedLaneSelectorStyle(): Record<string, string> | null {
    const selectedNode = this.selectionService.selection().nodes[0] as SimpleNode<WorkflowDiagramNodeData> | undefined;
    if (!selectedNode || selectedNode.type !== 'lane') {
      return null;
    }

    const viewport = this.viewportService.viewport();
    const nodeWidth = selectedNode.size?.width ?? 280;

    return {
      left: `${viewport.x + (selectedNode.position.x + 14) * viewport.scale}px`,
      top: `${viewport.y + (selectedNode.position.y + 12) * viewport.scale}px`,
      width: `${Math.max(180, (nodeWidth - 28) * viewport.scale)}px`
    };
  }

  protected onEdgeDrawn(event: EdgeDrawnEvent): void {
    this.updateStats();
    this.markDirty();
    this.broadcastEdge(event.edge);
  }

  protected onNodeResized(event: NodeResizedEvent): void {
    this.markDirty();
    this.broadcastNode(event.node as SimpleNode<WorkflowDiagramNodeData>);
  }

  protected onNodeDragEnded(event: NodeDragEndedEvent): void {
    const movedLane = event.nodes.find((node) => node.type === 'lane') as SimpleNode<WorkflowDiagramNodeData> | undefined;
    if (!movedLane) {
      this.markDirty();
      this.broadcastNodes(event.nodes as SimpleNode<WorkflowDiagramNodeData>[]);
      return;
    }

    this.applyCompactedLanePosition(movedLane);
  }

  protected onSelectionMoved(event: SelectionMovedEvent): void {
    this.markDirty();
    this.broadcastNodes(event.nodes as SimpleNode<WorkflowDiagramNodeData>[]);
  }

  private applyCompactedLanePosition(lane: SimpleNode<WorkflowDiagramNodeData>): void {
    const snappedPosition = this.getCompactedLanePosition(lane);
    if (!snappedPosition) {
      this.markDirty();
      this.broadcastNode(lane);
      return;
    }

    this.modelService.updateNodes([{
      id: lane.id,
      position: snappedPosition
    }]);
    this.markDirty();
    this.broadcastNode({
      ...lane,
      position: snappedPosition
    });
  }

  protected setSidebarCategory(category: SidebarCategory): void {
    if (this.activeSidebarCategory === category) {
      this.isSidebarPanelOpen = !this.isSidebarPanelOpen;
      return;
    }

    this.activeSidebarCategory = category;
    this.isSidebarPanelOpen = true;
  }

  protected closeSidebarPanel(): void {
    this.isSidebarPanelOpen = false;
  }

  protected onCanvasPointerMove(event: PointerEvent): void {
    if (!this.currentWorkflowId || Date.now() - this.lastCursorSentAt < 70) {
      return;
    }

    this.lastCursorSentAt = Date.now();
    this.collaborationService.send({
      type: 'cursor-moved',
      workflowId: this.currentWorkflowId,
      cursor: this.viewportService.clientToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })
    });
  }

  protected remoteCursorStyle(remoteCursor: RemoteCursor): Record<string, string> {
    const viewport = this.viewportService.viewport();
    return {
      left: `${viewport.x + remoteCursor.cursor.x * viewport.scale}px`,
      top: `${viewport.y + remoteCursor.cursor.y * viewport.scale}px`,
      '--remote-cursor-color': remoteCursor.color
    };
  }

  protected edgeOverlayTransform(): string {
    const viewport = this.viewportService.viewport();
    return `translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`;
  }

  protected overlayEdges(): OverlayEdge[] {
    const nodes = this.modelService.nodes() as SimpleNode<WorkflowDiagramNodeData>[];

    return this.modelService.edges()
      .map((edge) => {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);

        if (!source || !target) {
          return null;
        }

        const sourcePoint = this.resolveOverlayPortPosition(source, edge.sourcePort, true);
        const targetPoint = this.resolveOverlayPortPosition(target, edge.targetPort, false);

        return {
          id: edge.id,
          points: this.buildOverlayPolylinePoints(sourcePoint, targetPoint, edge.sourcePort, edge.targetPort)
        } satisfies OverlayEdge;
      })
      .filter((edge): edge is OverlayEdge => edge !== null);
  }

  protected temporaryOverlayEdge(): OverlayEdge | null {
    const linkingState = this.diagramService.actionState().linking;
    const temporaryEdge = linkingState?.temporaryEdge;

    if (!temporaryEdge) {
      return null;
    }

    const nodes = this.modelService.nodes() as SimpleNode<WorkflowDiagramNodeData>[];
    const source = nodes.find((node) => node.id === temporaryEdge.source);
    if (!source) {
      return null;
    }

    const sourcePoint = temporaryEdge.sourcePosition
      ?? this.resolveOverlayPortPosition(source, temporaryEdge.sourcePort, true);
    const targetPoint = temporaryEdge.targetPosition
      ?? linkingState?.dropPosition
      ?? null;

    if (!sourcePoint || !targetPoint) {
      return null;
    }

    return {
      id: temporaryEdge.id ?? 'temporary-edge',
      points: this.buildOverlayPolylinePoints(sourcePoint, targetPoint, temporaryEdge.sourcePort, temporaryEdge.targetPort)
    };
  }

  protected overlayJunctions(): OverlayJunction[] {
    const nodes = this.modelService.nodes() as SimpleNode<WorkflowDiagramNodeData>[];
    const outgoingGroups = new Map<string, OverlayJunction>();
    const incomingGroups = new Map<string, OverlayJunction>();

    for (const edge of this.modelService.edges()) {
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);

      if (source) {
        const sourcePoint = this.resolveOverlayPortPosition(source, edge.sourcePort, true);
        const sourceVector = this.resolvePortDirectionVector(edge.sourcePort, true);
        const sourceExit = {
          x: sourcePoint.x + sourceVector.x * 22,
          y: sourcePoint.y + sourceVector.y * 22
        };
        const key = `${edge.source}:${edge.sourcePort ?? 'auto'}:${sourceExit.x}:${sourceExit.y}`;
        const existing = outgoingGroups.get(key);
        if (existing) {
          existing.r = 4.5;
        } else {
          outgoingGroups.set(key, {
            id: `out-${key}`,
            x: sourceExit.x,
            y: sourceExit.y,
            r: 0
          });
        }
      }

      if (target) {
        const targetPoint = this.resolveOverlayPortPosition(target, edge.targetPort, false);
        const targetVector = this.resolvePortDirectionVector(edge.targetPort, false);
        const targetEntry = {
          x: targetPoint.x + targetVector.x * 22,
          y: targetPoint.y + targetVector.y * 22
        };
        const key = `${edge.target}:${edge.targetPort ?? 'auto'}:${targetEntry.x}:${targetEntry.y}`;
        const existing = incomingGroups.get(key);
        if (existing) {
          existing.r = 4.5;
        } else {
          incomingGroups.set(key, {
            id: `in-${key}`,
            x: targetEntry.x,
            y: targetEntry.y,
            r: 0
          });
        }
      }
    }

    return [...outgoingGroups.values(), ...incomingGroups.values()]
      .filter((junction) => junction.r > 0);
  }

  private loadWorkflow(workflow: DesignerWorkflow): void {
    this.loadError = null;
    this.currentWorkflowId = workflow.id;
    this.laneLabels = this.resolveLaneLabels(workflow);

    if (workflow.diagramData) {
      try {
        const parsed = JSON.parse(workflow.diagramData) as WorkflowDiagramModel;
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          const nodes = this.normalizeLoadedNodes(parsed.nodes);
          this.model = this.createModel({
            nodes,
            edges: parsed.edges,
            metadata: parsed.metadata ?? {}
          });
          this.isDirty = false;
          this.updateStats(nodes, parsed.edges);
          this.scheduleViewportRefresh(() => {
            this.syncStepLabels();
          });
          return;
        }
      } catch {
        this.loadError = 'No se pudo leer el diagrama guardado. Se reconstruyo una version base.';
      }
    }

    this.model = this.createModel(this.buildDefaultModel(workflow));
    this.isDirty = false;
    this.updateStats();
    this.scheduleViewportRefresh();
  }

  private buildWorkflowSignature(workflow: DesignerWorkflow): string {
    const stepsSignature = workflow.pasos
      .map((step) => `${step.orden}:${step.nombre}:${step.departamento}:${step.formularioId ?? ''}`)
      .join('|');

    return `${workflow.id}::${workflow.diagramData ?? 'no-diagram'}::${stepsSignature}`;
  }

  private isCurrentDiagramAck(workflow: DesignerWorkflow): boolean {
    return this.currentWorkflowId === workflow.id &&
      !!workflow.diagramData &&
      workflow.diagramData === this.modelService.toJSON();
  }

  private buildDefaultModel(workflow: DesignerWorkflow): WorkflowDiagramModel {
    const steps = [...workflow.pasos].sort((left, right) => left.orden - right.orden);
    const nodes = steps.map((step, index) => {
      const kind = this.resolveKind(index, steps.length);
      const size = this.getNodeSize(kind);
      const laneIndex = this.resolveLaneIndex(step.departamento);

      return {
        id: `node-${index + 1}`,
        type: kind,
        position: this.createLanePosition(laneIndex, size, 92 + index * 180),
        size,
        data: this.buildNodeData(
          kind,
          step.nombre,
          step.departamento,
          step.formularioId ? `Formulario vinculado: ${step.formularioId}` : 'Sin formulario vinculado',
          step.orden
        )
      } satisfies SimpleNode<WorkflowDiagramNodeData>;
    });

    const edges = steps.slice(1).map((_, index) => {
      const sourceNode = nodes[index];
      const targetNode = nodes[index + 1];
      const ports = this.resolveConnectionPorts(sourceNode, targetNode);

      return {
        id: `edge-${index + 1}`,
        type: 'flow',
        source: sourceNode.id,
        sourcePort: ports.sourcePort,
        target: targetNode.id,
        targetPort: ports.targetPort,
        data: {}
      } satisfies Edge;
    });

    return { nodes, edges, metadata: {} };
  }

  private buildPatternGraph(kind: WorkflowPatternKind, startX: number, startY: number): {
    nodes: SimpleNode<WorkflowDiagramNodeData>[];
    edges: Edge[];
    entryNodeId: string;
  } {
    switch (kind) {
      case 'alternative':
        return this.buildAlternativePattern(startX, startY);
      case 'iterative':
        return this.buildIterativePattern(startX, startY);
      case 'parallel':
        return this.buildParallelPattern(startX, startY);
      case 'linear':
      default:
        return this.buildLinearPattern(startX, startY);
    }
  }

  private buildLinearPattern(startX: number, startY: number): { nodes: SimpleNode<WorkflowDiagramNodeData>[]; edges: Edge[]; entryNodeId: string } {
    const laneIndex = this.resolveLaneIndexFromX(startX);
    const first = this.createNode('task', this.getLaneStartX(laneIndex, this.getNodeSize('task')), startY, 'Actividad 1', 'Sistema', 'Primer paso de la secuencia.');
    const second = this.createNode('task', this.getLaneStartX(laneIndex, this.getNodeSize('task')), startY + 170, 'Actividad 2', 'Sistema', 'Continua el flujo sin bifurcar.');
    const third = this.createNode('task', this.getLaneStartX(laneIndex, this.getNodeSize('task')), startY + 340, 'Actividad 3', 'Sistema', 'Cierra la cadena secuencial.');

    return {
      nodes: [first, second, third],
      edges: [
        this.createEdge(first, second),
        this.createEdge(second, third)
      ],
      entryNodeId: first.id
    };
  }

  private buildAlternativePattern(startX: number, startY: number): { nodes: SimpleNode<WorkflowDiagramNodeData>[]; edges: Edge[]; entryNodeId: string } {
    const middleLane = this.resolveLaneIndexFromX(startX);
    const leftLane = Math.max(0, middleLane - 1);
    const rightLane = Math.min(this.laneLabels.length - 1, middleLane + 1);
    const decision = this.createNode('decision', this.getLaneStartX(middleLane, this.getNodeSize('decision')), startY, 'Evaluar condicion', 'Sistema', 'Define que camino continua.');
    const optionA = this.createNode('task', this.getLaneStartX(leftLane, this.getNodeSize('task')), startY + 190, 'Ruta A', this.getLaneLabel(leftLane), 'Camino alternativo A.');
    const optionB = this.createNode('task', this.getLaneStartX(rightLane, this.getNodeSize('task')), startY + 190, 'Ruta B', this.getLaneLabel(rightLane), 'Camino alternativo B.');
    const merge = this.createNode('decision', this.getLaneStartX(middleLane, this.getNodeSize('decision')), startY + 380, 'Fusion', this.getLaneLabel(middleLane), 'Combina caminos alternativos en una sola salida.');

    return {
      nodes: [decision, optionA, optionB, merge],
      edges: [
        this.createEdge(decision, optionA),
        this.createEdge(decision, optionB),
        this.createEdge(optionA, merge),
        this.createEdge(optionB, merge)
      ],
      entryNodeId: decision.id
    };
  }

  private buildIterativePattern(startX: number, startY: number): { nodes: SimpleNode<WorkflowDiagramNodeData>[]; edges: Edge[]; entryNodeId: string } {
    const laneIndex = this.resolveLaneIndexFromX(startX);
    const task = this.createNode('task', this.getLaneStartX(laneIndex, this.getNodeSize('task')), startY, 'Actividad repetible', this.getLaneLabel(laneIndex), 'Se ejecuta una o varias veces.');
    const review = this.createNode('decision', this.getLaneStartX(laneIndex, this.getNodeSize('decision')), startY + 190, 'Continuar iteracion', this.getLaneLabel(laneIndex), 'Decide si se repite o avanza.');
    const exit = this.createNode('task', this.getLaneStartX(laneIndex, this.getNodeSize('task')), startY + 380, 'Salir del ciclo', this.getLaneLabel(laneIndex), 'Continua el proceso fuera del bucle.');

    return {
      nodes: [task, review, exit],
      edges: [
        this.createEdge(task, review),
        this.createEdge(review, task),
        this.createEdge(review, exit)
      ],
      entryNodeId: task.id
    };
  }

  private buildParallelPattern(startX: number, startY: number): { nodes: SimpleNode<WorkflowDiagramNodeData>[]; edges: Edge[]; entryNodeId: string } {
    const middleLane = this.resolveLaneIndexFromX(startX);
    const leftLane = Math.max(0, middleLane - 1);
    const rightLane = Math.min(this.laneLabels.length - 1, middleLane + 1);
    const fork = this.createNode('fork', this.getLaneStartX(middleLane, this.getNodeSize('fork')), startY, 'Fork', this.getLaneLabel(middleLane), 'Divide el flujo en ramas simultaneas.');
    const branchA = this.createNode('task', this.getLaneStartX(leftLane, this.getNodeSize('task')), startY + 150, 'Proceso paralelo A', this.getLaneLabel(leftLane), 'Primera rama simultanea.');
    const branchB = this.createNode('task', this.getLaneStartX(rightLane, this.getNodeSize('task')), startY + 150, 'Proceso paralelo B', this.getLaneLabel(rightLane), 'Segunda rama simultanea.');
    const join = this.createNode('join', this.getLaneStartX(middleLane, this.getNodeSize('join')), startY + 330, 'Join', this.getLaneLabel(middleLane), 'Sincroniza las ramas paralelas en un solo flujo.');
    const next = this.createNode('task', this.getLaneStartX(middleLane, this.getNodeSize('task')), startY + 470, 'Continuacion', this.getLaneLabel(middleLane), 'Prosigue luego de sincronizar.');

    return {
      nodes: [fork, branchA, branchB, join, next],
      edges: [
        this.createEdge(fork, branchA),
        this.createEdge(fork, branchB),
        this.createEdge(branchA, join),
        this.createEdge(branchB, join),
        this.createEdge(join, next)
      ],
      entryNodeId: fork.id
    };
  }

  private createPaletteItem(kind: WorkflowNodeKind): NgDiagramPaletteItem<WorkflowDiagramNodeData> {
    return {
      type: kind,
      size: this.getNodeSize(kind),
      data: this.buildNodeData(
        kind,
        this.getDefaultLabel(kind),
        this.getDefaultRole(kind),
        this.getDefaultHint(kind),
        0
      )
    };
  }

  private createNode(
    kind: WorkflowNodeKind,
    x: number,
    y: number,
    label: string,
    role: string,
    hint: string
  ): SimpleNode<WorkflowDiagramNodeData> {
    return {
      id: this.generateId('node'),
      type: kind,
      position: { x, y },
      size: this.getNodeSize(kind),
      autoSize: kind !== 'lane',
      resizable: kind === 'lane',
      zOrder: kind === 'lane' ? 0 : 10,
      data: this.buildNodeData(kind, label, role, hint, 0)
    };
  }

  private createEdge(sourceNode: SimpleNode<WorkflowDiagramNodeData>, targetNode: SimpleNode<WorkflowDiagramNodeData>): Edge {
    const ports = this.resolveConnectionPorts(sourceNode, targetNode);
    return {
      id: this.generateId('edge'),
      type: 'flow',
      source: sourceNode.id,
      sourcePort: ports.sourcePort,
      target: targetNode.id,
      targetPort: ports.targetPort,
      data: {},
      routing: 'orthogonal'
    };
  }

  private buildNodeData(
    kind: WorkflowNodeKind,
    label: string,
    role: string,
    hint: string,
    stepNumber: number
  ): WorkflowDiagramNodeData {
    const palette = this.getPalette(kind, role);

    return {
      kind,
      label,
      role,
      hint,
      accent: palette.accent,
      accentSoft: palette.accentSoft,
      typeLabel: stepNumber > 0 ? `Paso ${stepNumber}` : this.getTypeLabel(kind)
    };
  }

  private resolveKind(index: number, total: number): WorkflowNodeKind {
    if (index === 0) {
      return 'start';
    }

    if (index === total - 1) {
      return 'end';
    }

    return 'task';
  }

  private getNodeSize(kind: WorkflowNodeKind): { width: number; height: number } {
    if (kind === 'lane') {
      return { width: 280, height: 420 };
    }

    if (kind === 'decision') {
      return { width: 142, height: 142 };
    }

    if (kind === 'fork' || kind === 'join') {
      return { width: 220, height: 14 };
    }

    if (kind === 'start' || kind === 'end') {
      return { width: 42, height: 42 };
    }

    return { width: 220, height: 78 };
  }

  private syncStepLabels(): void {
    const orderedNodes = [...this.modelService.nodes()]
      .sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x) as SimpleNode<WorkflowDiagramNodeData>[];

    this.modelService.updateNodes(
      orderedNodes.map((node, index) => ({
        id: node.id,
        data: {
          ...node.data,
          typeLabel: `Paso ${index + 1}`
        }
      }))
    );
    this.updateStats();
  }

  private updateStats(nodes = this.modelService.nodes(), edges = this.modelService.edges()): void {
    this.totalNodes = nodes.length;
    this.totalLinks = edges.length;
  }

  private updateZoom(): void {
    this.zoomLevel = Math.round(this.viewportService.scale() * 100);
  }

  private scheduleViewportRefresh(afterFit?: () => void): void {
    if (typeof window === 'undefined') {
      this.refreshViewportForCurrentDiagram();
      afterFit?.();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        this.refreshViewportForCurrentDiagram();
        afterFit?.();
      });
    });
  }

  private scheduleZoomSync(): void {
    if (typeof window === 'undefined') {
      this.updateZoom();
      return;
    }

    if (this.zoomSyncFrame !== null) {
      window.cancelAnimationFrame(this.zoomSyncFrame);
    }

    this.zoomSyncFrame = window.requestAnimationFrame(() => {
      this.zoomSyncFrame = null;
      this.updateZoom();
    });
  }

  private observeCanvasResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const canvasRef = this.diagramCanvas() as { nativeElement?: HTMLElement; elementRef?: ElementRef<HTMLElement> } | undefined;
    const canvas = canvasRef?.nativeElement ?? canvasRef?.elementRef?.nativeElement;
    const container = canvas?.parentElement;
    if (!container) {
      return;
    }

    this.canvasResizeObserver?.disconnect();
    this.canvasResizeObserver = new ResizeObserver(() => this.scheduleResizeViewportRefresh());
    this.canvasResizeObserver.observe(container);
  }

  private scheduleResizeViewportRefresh(): void {
    if (typeof window === 'undefined') {
      this.refreshViewportForCurrentDiagram();
      return;
    }

    if (this.resizeRefreshFrame !== null) {
      window.cancelAnimationFrame(this.resizeRefreshFrame);
    }

    this.resizeRefreshFrame = window.requestAnimationFrame(() => {
      this.resizeRefreshFrame = null;
      this.refreshViewportForCurrentDiagram();
    });
  }

  private refreshViewportForCurrentDiagram(): void {
    if (this.shouldUseSparseViewport()) {
      this.resetSparseViewport();
      return;
    }

    this.fitToScreen();
  }

  private shouldUseSparseViewport(): boolean {
    return this.modelService.nodes().length <= 1 && this.modelService.edges().length === 0;
  }

  private resetSparseViewport(): void {
    this.viewportService.setViewport(0, 0, NgDiagramWorkflowEditorComponent.DEFAULT_SPARSE_SCALE);
    this.scheduleZoomSync();
  }

  private generateId(prefix: 'node' | 'edge'): string {
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
  }

  private markDirty(): void {
    this.isDirty = true;
    this.diagramDraftChanged.emit(this.modelService.toJSON());
  }

  private applyRemoteCollaborationEvent(event: WorkflowCollaborationEvent): void {
    if (event.sourceClientId === this.collaborationService.clientId ||
      event.workflowId !== this.currentWorkflowId ||
      event.type === 'diagram-updated') {
      return;
    }

    this.isApplyingRemoteEvent = true;
    try {
      switch (event.type) {
        case 'presence-snapshot':
          this.activeUsers = (event.users ?? [])
            .filter((user) => user.clientId !== this.collaborationService.clientId);
          break;
        case 'user-joined':
          if (event.user && event.user.clientId !== this.collaborationService.clientId) {
            this.activeUsers = [
              ...this.activeUsers.filter((user) => user.clientId !== event.user!.clientId),
              event.user
            ];
          }
          break;
        case 'user-left':
          if (event.user) {
            this.activeUsers = this.activeUsers.filter((user) => user.clientId !== event.user!.clientId);
            this.remoteCursors = this.remoteCursors.filter((cursor) => cursor.clientId !== event.user!.clientId);
          }
          break;
        case 'cursor-moved':
          if (event.user && event.cursor && event.user.clientId !== this.collaborationService.clientId) {
            this.remoteCursors = [
              ...this.remoteCursors.filter((cursor) => cursor.clientId !== event.user!.clientId),
              { ...event.user, cursor: event.cursor }
            ];
          }
          break;
        case 'node-upserted':
          if (event.node) {
            this.upsertRemoteNode(event.node as SimpleNode<WorkflowDiagramNodeData>);
          }
          break;
        case 'node-deleted':
          if (event.nodeId) {
            this.deletedNodeIds.add(event.nodeId);
            this.modelService.deleteNodes([event.nodeId]);
          }
          break;
        case 'edge-upserted':
          if (event.edge) {
            this.upsertRemoteEdge(event.edge as Edge);
          }
          break;
        case 'edge-deleted':
          if (event.edgeId) {
            this.deletedEdgeIds.add(event.edgeId);
            this.modelService.deleteEdges([event.edgeId]);
          }
          break;
      }

      this.updateStats();
    } finally {
      this.isApplyingRemoteEvent = false;
    }
  }

  private upsertRemoteNode(node: SimpleNode<WorkflowDiagramNodeData>): void {
    if (this.deletedNodeIds.has(node.id)) {
      return;
    }

    const exists = this.modelService.nodes().some((currentNode) => currentNode.id === node.id);
    if (exists) {
      this.modelService.updateNodes([node]);
      return;
    }

    this.modelService.addNodes([node]);
  }

  private upsertRemoteEdge(edge: Edge): void {
    if (this.deletedEdgeIds.has(edge.id)) {
      return;
    }

    const exists = this.modelService.edges().some((currentEdge) => currentEdge.id === edge.id);
    if (exists) {
      this.modelService.updateEdges([edge]);
      return;
    }

    this.modelService.addEdges([edge]);
  }

  private broadcastNode(node: SimpleNode<WorkflowDiagramNodeData>): void {
    if (this.isApplyingRemoteEvent || !this.currentWorkflowId) {
      return;
    }

    this.deletedNodeIds.delete(node.id);
    this.collaborationService.send({
      type: 'node-upserted',
      workflowId: this.currentWorkflowId,
      node: this.toCollaborationNode(node)
    });
  }

  private scheduleNodeCreatedBroadcast(nodeId: string, fallbackNode: SimpleNode<WorkflowDiagramNodeData>): void {
    if (typeof window === 'undefined') {
      this.broadcastNode(fallbackNode);
      return;
    }

    window.requestAnimationFrame(() => {
      const currentNode = this.modelService.nodes()
        .find((node) => node.id === nodeId) as SimpleNode<WorkflowDiagramNodeData> | undefined;

      this.broadcastNode(currentNode ?? fallbackNode);
    });
  }

  private broadcastNodes(nodes: SimpleNode<WorkflowDiagramNodeData>[]): void {
    nodes.forEach((node) => this.broadcastNode(node));
  }

  private broadcastNodeDeleted(nodeId: string): void {
    if (this.isApplyingRemoteEvent || !this.currentWorkflowId) {
      return;
    }

    this.deletedNodeIds.add(nodeId);
    this.collaborationService.send({
      type: 'node-deleted',
      workflowId: this.currentWorkflowId,
      nodeId
    });
  }

  private broadcastEdge(edge: Edge): void {
    if (this.isApplyingRemoteEvent || !this.currentWorkflowId) {
      return;
    }

    this.deletedEdgeIds.delete(edge.id);
    this.collaborationService.send({
      type: 'edge-upserted',
      workflowId: this.currentWorkflowId,
      edge: this.toCollaborationEdge(edge)
    });
  }

  private broadcastEdges(edges: Edge[]): void {
    edges.forEach((edge) => this.broadcastEdge(edge));
  }

  private broadcastEdgeDeleted(edgeId: string): void {
    if (this.isApplyingRemoteEvent || !this.currentWorkflowId) {
      return;
    }

    this.deletedEdgeIds.add(edgeId);
    this.collaborationService.send({
      type: 'edge-deleted',
      workflowId: this.currentWorkflowId,
      edgeId
    });
  }

  private toCollaborationNode(node: SimpleNode<WorkflowDiagramNodeData>): SimpleNode<WorkflowDiagramNodeData> {
    const kind = (node.type as WorkflowNodeKind | undefined) ?? 'task';

    return {
      id: node.id,
      type: kind,
      position: { ...node.position },
      size: node.size ? { ...node.size } : this.getNodeSize(kind),
      autoSize: kind !== 'lane',
      resizable: kind === 'lane',
      zOrder: kind === 'lane' ? 0 : 10,
      data: { ...node.data }
    };
  }

  private toCollaborationEdge(edge: Edge): Edge {
    return {
      id: edge.id,
      type: edge.type ?? 'flow',
      source: edge.source,
      sourcePort: edge.sourcePort,
      target: edge.target,
      targetPort: edge.targetPort,
      data: { ...(edge.data ?? {}) },
      routing: edge.routing ?? 'orthogonal'
    };
  }

  private getVisibleCenterFlowPosition(): Point {
    const canvasRef = this.diagramCanvas() as { nativeElement?: HTMLElement; elementRef?: ElementRef<HTMLElement> } | undefined;
    const canvas = canvasRef?.nativeElement ?? canvasRef?.elementRef?.nativeElement;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      return this.viewportService.clientToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }

    const viewport = this.viewportService.viewport();
    const metadata = this.modelService.metadata();
    const width = metadata.viewport?.width ?? 960;
    const height = metadata.viewport?.height ?? 640;

    return {
      x: (width / 2 - viewport.x) / viewport.scale,
      y: (height / 2 - viewport.y) / viewport.scale
    };
  }

  private centerNodePosition(anchor: Point, size: { width: number; height: number }): Point {
    return {
      x: anchor.x - size.width / 2,
      y: anchor.y - size.height / 2
    };
  }

  private normalizeLoadedNodes(nodes: SimpleNode<WorkflowDiagramNodeData>[]): SimpleNode<WorkflowDiagramNodeData>[] {
    const laneWidth = 320;
    const maxWidth = laneWidth * Math.max(this.laneLabels.length, 1);

    return [...nodes]
      .sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x)
      .map((node, index) => {
        const kind = ((node.type as WorkflowNodeKind | undefined) ?? 'task');
        const size = node.size ?? this.getNodeSize(kind);
        const rawX = node.position?.x;
        const rawY = node.position?.y;
        const xIsValid = Number.isFinite(rawX) && rawX >= -120 && rawX <= maxWidth + 120;
        const yIsValid = Number.isFinite(rawY) && rawY >= -120 && rawY <= 4800;
        const laneIndex = xIsValid
          ? this.resolveLaneIndexFromX((rawX as number) + size.width / 2)
          : index % this.laneLabels.length;

        return {
          ...node,
          type: kind,
          size,
          autoSize: kind !== 'lane',
          resizable: kind === 'lane',
          zOrder: kind === 'lane' ? 0 : 10,
          position: {
            x: xIsValid
              ? Math.max(24, Math.min(rawX as number, maxWidth - size.width - 24))
              : this.getLaneStartX(laneIndex, size),
            y: yIsValid ? Math.max(56, rawY as number) : 92 + index * 180
          },
          data: {
            ...this.buildNodeData(
              kind,
              node.data?.label ?? this.getDefaultLabel(kind),
              node.data?.role ?? this.getDefaultRole(kind),
              node.data?.hint ?? this.getDefaultHint(kind),
              index + 1
            ),
            ...node.data
          }
        } satisfies SimpleNode<WorkflowDiagramNodeData>;
      });
  }

  private createModel(model: WorkflowDiagramModel = {}): ModelAdapter {
    return runInInjectionContext(this.injector, () => initializeModel(model, this.injector));
  }

  private resolveOverlayPortPosition(
    node: SimpleNode<WorkflowDiagramNodeData>,
    portId: string | undefined,
    isSource: boolean
  ): Point {
    const width = node.size?.width ?? 0;
    const height = node.size?.height ?? 0;
    const centerX = node.position.x + width / 2;

    switch (portId) {
      case 'top':
      case 'in':
        return { x: centerX, y: node.position.y };
      case 'bottom':
      case 'out':
        return { x: centerX, y: node.position.y + height };
      case 'left':
        return { x: node.position.x, y: node.position.y + height / 2 };
      case 'right':
        return { x: node.position.x + width, y: node.position.y + height / 2 };
      default:
        return {
          x: centerX,
          y: isSource ? node.position.y + height : node.position.y
        };
    }
  }

  private buildOverlayPolylinePoints(
    sourcePoint: Point,
    targetPoint: Point,
    sourcePortId?: string,
    targetPortId?: string
  ): string {
    const clearance = 22;
    const sourceVector = this.resolvePortDirectionVector(sourcePortId, true);
    const targetVector = this.resolvePortDirectionVector(targetPortId, false);
    const sourceExit = {
      x: sourcePoint.x + sourceVector.x * clearance,
      y: sourcePoint.y + sourceVector.y * clearance
    };
    const targetEntry = {
      x: targetPoint.x + targetVector.x * clearance,
      y: targetPoint.y + targetVector.y * clearance
    };

    const horizontalFirst = Math.abs(sourceVector.x) > 0 || Math.abs(targetVector.x) > 0;

    if (horizontalFirst) {
      const corridorX = Math.abs(sourceExit.x - targetEntry.x) < 8
        ? sourceExit.x
        : sourceExit.x + (targetEntry.x - sourceExit.x) / 2;

      return [
        `${sourcePoint.x},${sourcePoint.y}`,
        `${sourceExit.x},${sourceExit.y}`,
        `${corridorX},${sourceExit.y}`,
        `${corridorX},${targetEntry.y}`,
        `${targetEntry.x},${targetEntry.y}`,
        `${targetPoint.x},${targetPoint.y}`
      ].join(' ');
    }

    const corridorY = Math.abs(sourceExit.y - targetEntry.y) < 8
      ? sourceExit.y
      : sourceExit.y + (targetEntry.y - sourceExit.y) / 2;

    return [
      `${sourcePoint.x},${sourcePoint.y}`,
      `${sourceExit.x},${sourceExit.y}`,
      `${sourceExit.x},${corridorY}`,
      `${targetEntry.x},${corridorY}`,
      `${targetEntry.x},${targetEntry.y}`,
      `${targetPoint.x},${targetPoint.y}`
    ].join(' ');
  }

  private resolvePortDirectionVector(portId: string | undefined, isSource: boolean): Point {
    switch (portId) {
      case 'top':
      case 'in':
        return { x: 0, y: -1 };
      case 'bottom':
      case 'out':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      default:
        return { x: 0, y: isSource ? 1 : -1 };
    }
  }

  private resolveConnectionPorts(
    sourceNode: SimpleNode<WorkflowDiagramNodeData>,
    targetNode: SimpleNode<WorkflowDiagramNodeData>
  ): { sourcePort: WorkflowPortId; targetPort: WorkflowPortId } {
    const sourceCenter = this.getNodeCenter(sourceNode);
    const targetCenter = this.getNodeCenter(targetNode);
    const deltaX = targetCenter.x - sourceCenter.x;
    const deltaY = targetCenter.y - sourceCenter.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX >= 0
        ? { sourcePort: 'right', targetPort: 'left' }
        : { sourcePort: 'left', targetPort: 'right' };
    }

    return deltaY >= 0
      ? { sourcePort: 'bottom', targetPort: 'top' }
      : { sourcePort: 'top', targetPort: 'bottom' };
  }

  private getNodeCenter(node: SimpleNode<WorkflowDiagramNodeData>): Point {
    return {
      x: node.position.x + (node.size?.width ?? 0) / 2,
      y: node.position.y + (node.size?.height ?? 0) / 2
    };
  }

  private getPalette(kind: WorkflowNodeKind, role: string): { accent: string; accentSoft: string } {
    if (kind === 'start') {
      return { accent: 'var(--surface-uml-700)', accentSoft: 'var(--p-primary-100)' };
    }

    if (kind === 'decision') {
      return { accent: 'var(--primary-uml)', accentSoft: 'var(--p-primary-100)' };
    }

    if (kind === 'fork') {
      return { accent: 'var(--surface-uml-800)', accentSoft: 'var(--text-uml-muted)' };
    }

    if (kind === 'join') {
      return { accent: 'var(--surface-uml-700)', accentSoft: 'var(--text-uml-muted)' };
    }

    if (kind === 'end') {
      return { accent: 'var(--accent-uml)', accentSoft: 'rgba(var(--accent-uml-rgb), 0.12)' };
    }

    const palettes = [
      { accent: 'var(--primary-uml-dark)', accentSoft: 'var(--p-primary-50)' },
      { accent: 'var(--primary-uml)', accentSoft: 'var(--p-primary-100)' },
      { accent: 'var(--surface-uml-700)', accentSoft: 'var(--p-primary-50)' }
    ];
    const hash = [...role].reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
    return palettes[hash % palettes.length];
  }

  private getTypeLabel(kind: WorkflowNodeKind): string {
    const labels: Record<WorkflowNodeKind, string> = {
      lane: 'Carril',
      start: 'Inicio',
      task: 'Actividad',
      decision: 'Decision',
      fork: 'Fork',
      join: 'Join',
      end: 'Fin'
    };

    return labels[kind];
  }

  private getDefaultLabel(kind: WorkflowNodeKind): string {
    const labels: Record<WorkflowNodeKind, string> = {
      lane: this.selectedLaneDepartment,
      start: 'Inicio del flujo',
      task: 'Actividad',
      decision: 'Decision o fusion',
      fork: 'Fork',
      join: 'Join',
      end: 'Fin del flujo'
    };

    return labels[kind];
  }

  private getDefaultRole(kind: WorkflowNodeKind): string {
    const roles: Record<WorkflowNodeKind, string> = {
      lane: 'CARRIL',
      start: 'DISPARADOR',
      task: 'ACTIVIDAD',
      decision: 'DECISION/FUSION',
      fork: 'DIVERGENCIA',
      join: 'CONVERGENCIA',
      end: 'CIERRE'
    };

    return roles[kind];
  }

  private getDefaultHint(kind: WorkflowNodeKind): string {
    const hints: Record<WorkflowNodeKind, string> = {
      lane: 'Agrupa actividades de un departamento.',
      start: 'Evento que activa la ejecucion del workflow.',
      task: 'Accion o actividad principal del proceso.',
      decision: 'Evalua una condicion o fusiona rutas alternativas.',
      fork: 'Divide el flujo en varios caminos paralelos.',
      join: 'Sincroniza varios caminos paralelos en uno solo.',
      end: 'Resultado o cierre del proceso.'
    };

    return hints[kind];
  }

  private resolveLaneLabels(workflow: DesignerWorkflow): string[] {
    const configuredDepartments = [...ADMIN_DEPARTMENTS];
    const workflowDepartments = workflow.pasos
      .map((step) => step.departamento?.trim())
      .filter((department): department is string => !!department && !configuredDepartments.includes(department as typeof ADMIN_DEPARTMENTS[number]));

    return [...configuredDepartments, ...new Set(workflowDepartments)];
  }

  private resolveLaneIndex(role: string | null | undefined): number {
    if (!role) {
      return 0;
    }

    const normalizedRole = role.trim().toLowerCase();
    const directIndex = this.laneLabels.findIndex((lane) => lane.trim().toLowerCase() === normalizedRole);
    if (directIndex >= 0) {
      return directIndex;
    }

    return 0;
  }

  private createLanePosition(laneIndex: number, size: { width: number; height: number }, y: number): Point {
    return {
      x: this.getLaneStartX(laneIndex, size),
      y
    };
  }

  private getLaneStartX(laneIndex: number, size: { width: number; height: number }): number {
    const laneWidth = 320;
    const lanePadding = 32;
    const safeIndex = Math.max(0, Math.min(laneIndex, this.laneLabels.length - 1));
    const laneLeft = safeIndex * laneWidth;

    return laneLeft + Math.max(lanePadding, (laneWidth - size.width) / 2);
  }

  private resolveLaneIndexFromX(x: number): number {
    const laneWidth = 320;
    if (!Number.isFinite(x)) {
      return 0;
    }

    return Math.max(0, Math.min(Math.floor(x / laneWidth), this.laneLabels.length - 1));
  }

  private getLaneLabel(index: number): string {
    return this.laneLabels[Math.max(0, Math.min(index, this.laneLabels.length - 1))] ?? 'Departamento';
  }

  private getCompactedLanePosition(lane: SimpleNode<WorkflowDiagramNodeData>): Point | null {
    const laneGap = 12;
    const snapThreshold = 72;
    const alignmentTolerance = 96;
    const laneWidth = lane.size?.width ?? 280;
    const laneHeight = lane.size?.height ?? 420;
    const laneRight = lane.position.x + laneWidth;
    const laneBottom = lane.position.y + laneHeight;
    const laneCenterX = lane.position.x + laneWidth / 2;
    const laneCenterY = lane.position.y + laneHeight / 2;
    const otherLanes = (this.modelService.nodes() as SimpleNode<WorkflowDiagramNodeData>[])
      .filter((node) => node.type === 'lane' && node.id !== lane.id);

    let bestPosition: Point | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const other of otherLanes) {
      const otherWidth = other.size?.width ?? 280;
      const otherHeight = other.size?.height ?? 420;
      const otherRight = other.position.x + otherWidth;
      const otherBottom = other.position.y + otherHeight;
      const otherCenterX = other.position.x + otherWidth / 2;
      const otherCenterY = other.position.y + otherHeight / 2;
      const verticalOverlap = lane.position.y < otherBottom && laneBottom > other.position.y;
      const horizontalOverlap = lane.position.x < otherRight && laneRight > other.position.x;
      const verticallyAligned = Math.abs(laneCenterY - otherCenterY) <= alignmentTolerance;
      const horizontallyAligned = Math.abs(laneCenterX - otherCenterX) <= alignmentTolerance;

      if (verticalOverlap || verticallyAligned) {
        const snapLeftDistance = Math.abs(lane.position.x - (otherRight + laneGap));
        if (snapLeftDistance < snapThreshold && snapLeftDistance < bestDistance) {
          bestDistance = snapLeftDistance;
          bestPosition = { x: otherRight + laneGap, y: lane.position.y };
        }

        const snapRightDistance = Math.abs(laneRight - (other.position.x - laneGap));
        if (snapRightDistance < snapThreshold && snapRightDistance < bestDistance) {
          bestDistance = snapRightDistance;
          bestPosition = { x: other.position.x - laneGap - laneWidth, y: lane.position.y };
        }
      }

      if (horizontalOverlap || horizontallyAligned) {
        const snapTopDistance = Math.abs(lane.position.y - (otherBottom + laneGap));
        if (snapTopDistance < snapThreshold && snapTopDistance < bestDistance) {
          bestDistance = snapTopDistance;
          bestPosition = { x: lane.position.x, y: otherBottom + laneGap };
        }

        const snapBottomDistance = Math.abs(laneBottom - (other.position.y - laneGap));
        if (snapBottomDistance < snapThreshold && snapBottomDistance < bestDistance) {
          bestDistance = snapBottomDistance;
          bestPosition = { x: lane.position.x, y: other.position.y - laneGap - laneHeight };
        }
      }
    }

    return bestPosition;
  }
}
