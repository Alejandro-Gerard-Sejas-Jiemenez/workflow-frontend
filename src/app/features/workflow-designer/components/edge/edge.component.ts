import { Component, input, ChangeDetectionStrategy, effect } from '@angular/core';
import { NgDiagramBaseEdgeComponent, Edge, NgDiagramEdgeTemplate, NgDiagramBaseEdgeLabelComponent } from 'ng-diagram';

@Component({
  selector: 'app-workflow-edge',
  standalone: true,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
  template: `
    <ng-diagram-base-edge
      [edge]="edge()"
      stroke="var(--edge-color, #64748b)"
      [strokeWidth]="3"
      targetArrowhead="ng-diagram-arrow"
    >
      @for (label of $any(edge()).labels; track label.id) {
        <ng-diagram-base-edge-label 
          [id]="label.id" 
          [positionOnEdge]="label.positionOnEdge">
          <div class="workflow-edge-label font-bold text-[10px] bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-300 text-slate-600">
            {{ edge().data?.label }}
          </div>
        </ng-diagram-base-edge-label>
      }
    </ng-diagram-base-edge>
  `,
  styles: [`
    :host {
      display: block;
      overflow: visible;
    }
    :host.selected {
      --edge-color: #3b82f6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EdgeComponent implements NgDiagramEdgeTemplate<any> {
  readonly edge = input.required<Edge<any>>();
}
