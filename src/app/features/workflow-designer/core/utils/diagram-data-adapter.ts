import type { Edge, SimpleNode } from 'ng-diagram';
import type { WorkflowDiagramNodeData } from '../../components/node/node.component';
import * as parser from './diagram-bpmn-parser';
import * as layout from './diagram-layout-engine';

export type WorkflowDiagramModel = {
  nodes?: SimpleNode<WorkflowDiagramNodeData>[];
  edges?: Edge[];
};

export function deserializeDiagramData(data: string): WorkflowDiagramModel | null {
  if (!data?.trim()) return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed.nodes && parsed.edges) return parsed;
  } catch {}
  if (!/^\s*</.test(data)) return null;
  return convertBpmnToModel(data);
}

export function serializeDiagramDataForEditor(data: string): string | null {
  const model = deserializeDiagramData(data);
  return model ? JSON.stringify(model) : null;
}

function convertBpmnToModel(xml: string): WorkflowDiagramModel | null {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return null;

  const bounds = parser.extractBounds(doc);
  const { laneByNodeId } = parser.extractLaneNames(doc);
  
  const nodes: SimpleNode<WorkflowDiagramNodeData>[] = [];
  const tags = ['startEvent', 'task', 'userTask', 'serviceTask', 'exclusiveGateway', 'endEvent'];
  
  tags.forEach(tag => {
    parser.getElementsByLocalName(doc, tag).forEach(el => {
      const id = el.getAttribute('id')!;
      const b = bounds.get(id);
      nodes.push({
        id,
        type: resolveKind(tag),
        position: b ? { x: b.x, y: b.y } : { x: 100, y: 100 },
        size: b ? { width: b.width, height: b.height } : { width: 200, height: 80 },
        data: { label: el.getAttribute('name') || tag, kind: resolveKind(tag) } as any
      });
    });
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const edges: Edge[] = parser.getElementsByLocalName(doc, 'sequenceFlow').map(el => {
    const sourceId = el.getAttribute('sourceRef')!;
    const targetId = el.getAttribute('targetRef')!;
    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);
    
    const ports = (sourceNode && targetNode) 
      ? layout.resolveConnectionPorts(sourceNode, targetNode)
      : { sP: 'bottom', tP: 'top' };

    return {
      id: el.getAttribute('id')!,
      type: 'flow',
      source: sourceId,
      target: targetId,
      sourcePort: ports.sP,
      targetPort: ports.tP,
      data: { label: el.getAttribute('name') || '' }
    };
  });

  return { nodes, edges };
}

function resolveKind(tag: string): any {
  if (tag.includes('start')) return 'start';
  if (tag.includes('end')) return 'end';
  if (tag.includes('Gateway')) return 'decision';
  return 'task';
}
