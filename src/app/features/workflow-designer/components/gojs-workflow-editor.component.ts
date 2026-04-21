import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as go from 'gojs';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-gojs-workflow-editor',
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: './gojs-workflow-editor.component.html',
  styleUrl: './gojs-workflow-editor.component.css'
})
export class GojsWorkflowEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;

  private diagram!: go.Diagram;
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initDiagram();
    }
  }

  ngOnDestroy(): void {
    if (this.diagram) {
      this.diagram.div = null;
    }
  }

  private initDiagram(): void {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      layout: $(go.TreeLayout, { angle: 90, layerSpacing: 35 }),
      model: $(go.GraphLinksModel, { linkKeyProperty: 'key' })
    });

    this.diagram.nodeTemplate =
      $(go.Node, 'Auto',
        $(go.Shape, 'RoundedRectangle', {
          stroke: '#7C3AED',
          strokeWidth: 2,
          fill: 'white',
          portId: '',
          cursor: 'pointer',
          fromLinkable: true,
          toLinkable: true
        }),
        $(go.Panel, 'Vertical',
          $(go.TextBlock, {
            margin: 8,
            font: 'bold 12pt sans-serif',
            stroke: '#1F2937'
          }, new go.Binding('text', 'name')),
          $(go.TextBlock, {
            margin: 4,
            font: 'italic 9pt sans-serif',
            stroke: '#6B7280'
          }, new go.Binding('text', 'role'))
        )
      );

    const model = this.diagram.model as go.GraphLinksModel;
    model.nodeDataArray = [
      { key: 1, name: 'Inicio', role: 'Admin' },
      { key: 2, name: 'Revision', role: 'Designer' },
      { key: 3, name: 'Aprobacion', role: 'Employee' }
    ];

    model.linkDataArray = [
      { from: 1, to: 2 },
      { from: 2, to: 3 }
    ];
  }
}
