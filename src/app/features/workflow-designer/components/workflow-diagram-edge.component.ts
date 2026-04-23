import { Component, computed, inject, input } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramEdgeTemplate, NgDiagramModelService, Node } from 'ng-diagram';

@Component({
  selector: 'app-workflow-diagram-edge',
  standalone: true,
  imports: [NgDiagramBaseEdgeComponent],
  template: `
    <ng-diagram-base-edge
      [edge]="renderedEdge()"
      stroke="var(--surface-uml-700)"
      [strokeWidth]="2.5"
      [strokeOpacity]="1">
    </ng-diagram-base-edge>
  `
})
export class WorkflowDiagramEdgeComponent implements NgDiagramEdgeTemplate {
  readonly edge = input.required<Edge>();
  private readonly modelService = inject(NgDiagramModelService);

  protected readonly renderedEdge = computed(() => {
    const edge = this.edge();
    const sourcePosition = edge.sourcePosition ?? this.resolvePortPosition(edge.source, edge.sourcePort, true);
    const targetPosition = edge.targetPosition ?? this.resolvePortPosition(edge.target, edge.targetPort, false);

    if (!sourcePosition || !targetPosition) {
      return edge;
    }

    const middleY = sourcePosition.y + (targetPosition.y - sourcePosition.y) / 2;
    return {
      ...edge,
      points: [
        { x: sourcePosition.x, y: sourcePosition.y },
        { x: sourcePosition.x, y: middleY },
        { x: targetPosition.x, y: middleY },
        { x: targetPosition.x, y: targetPosition.y }
      ],
      routing: 'polyline' as const,
      routingMode: 'manual' as const
    };
  });

  private resolvePortPosition(nodeId: string, portId: string | undefined, isSource: boolean): { x: number; y: number } | null {
    const node = this.modelService.nodes().find((candidate) => candidate.id === nodeId) as Node | undefined;
    if (!node) {
      return null;
    }

    const width = node.size?.width ?? 0;
    const height = node.size?.height ?? 0;
    const centerX = node.position.x + width / 2;

    if (portId === 'in') {
      return { x: centerX, y: node.position.y };
    }

    if (portId === 'out') {
      return { x: centerX, y: node.position.y + height };
    }

    return {
      x: centerX,
      y: isSource ? node.position.y + height : node.position.y
    };
  }
}
