import { Component, inject, input, output, effect, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NgDiagramComponent, NgDiagramModelService, NgDiagramViewportService, NgDiagramSelectionService, NgDiagramService, provideNgDiagram, NgDiagramNodeTemplateMap, NgDiagramEdgeTemplateMap, NgDiagramConfig, initializeModel } from 'ng-diagram';

import { WorkflowDesignerSidebarComponent } from '../sidebar/sidebar.component';
import { NodeComponent } from '../node/node.component';
import { EdgeComponent } from '../edge/edge.component';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';

import { WorkflowDesignerStateService } from '../../core/services/workflow-designer-state.service';
import { WorkflowDesignerConfigService } from '../../core/services/workflow-designer-config.service';
import { WorkflowDesignerActionService } from '../../core/services/workflow-designer-action.service';
import { WORKFLOW_PALETTE_ITEMS, SUPPORTED_PATTERNS } from '../../core/data/workflow-designer.data';
import { WorkflowCollaborationService } from '../../../designer/services/workflow-collaboration.service';
import { WorkflowDesignerCollaborationService } from '../../core/services/workflow-designer-collaboration.service';

@Component({
  selector: 'app-ng-diagram-workflow-editor',
  standalone: true,
  imports: [CommonModule, NgDiagramComponent, WorkflowDesignerSidebarComponent, PropertiesPanelComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class WorkflowEditorComponent {
  workflow = input<any>(null);
  departments = input<any[]>([]);
  saveDiagram = output<string>();
  diagramDraftChanged = output<string>();

  public stateService = inject(WorkflowDesignerStateService);
  public actionService = inject(WorkflowDesignerActionService);
  private configService = inject(WorkflowDesignerConfigService);
  public modelService = inject(NgDiagramModelService);
  private selectionService = inject(NgDiagramSelectionService);
  private collabService = inject(WorkflowDesignerCollaborationService);
  private genericCollabService = inject(WorkflowCollaborationService);
  private diagramService = inject(NgDiagramService);

  protected readonly diagramConfig: NgDiagramConfig = this.configService.getDiagramConfig();

  private readonly emptyModel = initializeModel({ nodes: [], edges: [] });
  protected readonly model = computed(() => {
    const ms = this.modelService as any;
    if (!ms) return this.emptyModel;

    const m = ms.model;
    const value = typeof m === 'function' ? m() : m;

    // Si tenemos un valor pero no es un "modelo vivo" (le falta getMetadata), lo activamos
    if (value && typeof value.getMetadata !== 'function') {
      console.log('[Editor] Detectado modelo plano, inicializando motor...');
      return initializeModel(value);
    }

    return value || this.emptyModel;
  });

  public isEngineReady = this.diagramService.isInitialized;

  get selection() { return this.selectionService.selection(); }
  get selectedNode() { return this.selection.nodes[0] as any; }
  get selectedEdge() { return this.selection.edges[0] as any; }

  protected readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['start', NodeComponent], ['task', NodeComponent], ['decision', NodeComponent],
    ['merge', NodeComponent], ['end', NodeComponent], ['flow-final', NodeComponent],
    ['lane', NodeComponent], ['fork', NodeComponent], ['join', NodeComponent],
    ['signal-send', NodeComponent], ['signal-receive', NodeComponent], ['note', NodeComponent]
  ]);
  protected readonly edgeTemplateMap = new NgDiagramEdgeTemplateMap([['flow', EdgeComponent]]);

  paletteItems = WORKFLOW_PALETTE_ITEMS;
  supportedPatterns = SUPPORTED_PATTERNS;

  constructor() {
    this.genericCollabService.messages$.pipe(takeUntilDestroyed())
      .subscribe(e => this.collabService.handleEvent(e));

    effect(() => {
      const wf = this.workflow();
      const ready = this.isEngineReady();
      if (wf && ready) {
        console.log('[Editor] Cargando datos del workflow reactivamente...');
        try {
          this.actionService.loadWorkflow(wf);
        } catch(e) {
          console.error('[Editor] Error cargando workflow:', e);
        }
      }
    });
  }

  // Acciones de UI delegadas al ActionService y StateService
  manualSave() { this.saveDiagram.emit(this.actionService.getModelJSON()); this.stateService.resetDirty(); }
  zoomIn() { this.actionService.zoomIn(); }
  zoomOut() { this.actionService.zoomOut(); }
  fitToScreen() { this.actionService.fitToScreen(); }
  relayout() { this.actionService.relayout(); }
  exportDiagram() { return this.actionService.getModelJSON(); }
  getSelectedNode() { return this.configService.getSelectedNode(); }

  onDiagramInit() {
    console.log('[Editor] Motor NgDiagram inicializado.');
    try {
      const config = (this.diagramService as any).config;
      if (config) (config as any).resize = { enabled: true, types: ['lane', 'note'] };
    } catch (e) { }

    const wf = this.workflow();
    if (wf) {
      requestAnimationFrame(() => {
        this.actionService.loadWorkflow(wf);
        this.stateService.updateStats(this.modelService.nodes().length, this.modelService.edges().length);
      });
    }
  }

  onPaletteDrop(e: any) {
    if (e?.item && e?.position) {
      this.actionService.addNodeFromPalette(e.item, e.position);
      this.stateService.markDirty();
    }
  }

  onSelectionChanged(e: any) { }

  get isDirty() { return this.stateService.isDirty(); }

  // Métodos vacíos de IA para mantener compatibilidad con HTML actual
  isGeneratingAi = () => false;
  aiProposal = () => null;
  insertFlowPattern(k: any) { }
  proposeWithAi(p: any) { }
  applyAiProposal() { }

  onGlobalKeyDown(event: KeyboardEvent) {
    if ((event.key === 'c' || event.key === 'C') && !event.ctrlKey && !event.altKey && !event.metaKey) {
      if (this.selection.nodes.length === 2) {
        this.actionService.connectSelectedNodes();
        event.preventDefault();
      }
    }
  }
}
