import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';

@Component({
  selector: 'app-gojs-workflow-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full border border-gray-200 rounded-lg shadow-sm bg-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-lg font-semibold text-gray-800">Diseñador de Workflow</h3>
        <div class="flex gap-2">
          <button (click)="saveModel()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
            Guardar Diagrama
          </button>
        </div>
      </div>
      <div #diagramDiv class="flex-grow w-full bg-gray-50" style="min-height: 500px;"></div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class GojsWorkflowEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  private diagram!: go.Diagram;

  constructor() {}

  ngAfterViewInit() {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      layout: $(go.LayeredDigraphLayout, { direction: 90, layerSpacing: 50 }),
      model: $(go.GraphLinksModel, {
        linkKeyProperty: 'key'
      })
    });

    // Define Node Template
    this.diagram.nodeTemplate =
      $(go.Node, 'Auto',
        {
          doubleClick: (e, obj) => {
            const node = obj as go.Node;
            console.log('Nodo editado:', node.data);
            // Aquí se abriría el formulario de ngx-formly
          }
        },
        $(go.Shape, 'RoundedRectangle',
          { 
            strokeWidth: 2, 
            fill: 'white',
            portId: '', cursor: 'pointer',
            fromLinkable: true, toLinkable: true
          },
          new go.Binding('stroke', 'color'),
          new go.Binding('fill', 'color', c => go.Brush.lighten(c))
        ),
        $(go.TextBlock,
          { margin: 12, font: 'bold 14px sans-serif' },
          new go.Binding('text', 'nombre')
        )
      );

    // Initial Data Sample
    this.diagram.model = new go.GraphLinksModel(
      [
        { key: 1, nombre: 'Inicio', color: '#3b82f6' },
        { key: 2, nombre: 'Aprobación', color: '#10b981' },
        { key: 3, nombre: 'Revisión', color: '#f59e0b' },
        { key: 4, nombre: 'Fin', color: '#ef4444' }
      ],
      [
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 2 },
        { from: 2, to: 4 }
      ]
    );
  }

  saveModel() {
    const modelJson = this.diagram.model.toJson();
    console.log('Modelo Guardado:', modelJson);
    // Aquí se llamaría al servicio del backend
  }

  ngOnDestroy() {
    if (this.diagram) {
      this.diagram.div = null;
    }
  }
}
