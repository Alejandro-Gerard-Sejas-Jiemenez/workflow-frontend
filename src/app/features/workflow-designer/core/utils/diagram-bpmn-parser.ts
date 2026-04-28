export function getElementsByLocalName(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', localName));
}

export function extractLaneNames(doc: Document): { laneByNodeId: Map<string, string>; laneOrder: string[] } {
  const result = new Map<string, string>();
  const laneOrder: string[] = [];
  for (const lane of getElementsByLocalName(doc, 'lane')) {
    const name = lane.getAttribute('name')?.trim();
    if (!name) continue;
    if (!laneOrder.includes(name)) laneOrder.push(name);
    for (const nodeRef of getElementsByLocalName(lane, 'flowNodeRef')) {
      const id = nodeRef.textContent?.trim();
      if (id) result.set(id, name);
    }
  }
  return { laneByNodeId: result, laneOrder };
}

export function extractBounds(doc: Document) {
  const result = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const shape of getElementsByLocalName(doc, 'BPMNShape')) {
    const elementId = shape.getAttribute('bpmnElement');
    const bounds = getElementsByLocalName(shape, 'Bounds')[0];
    if (!elementId || !bounds) continue;
    result.set(elementId, {
      x: Number(bounds.getAttribute('x')),
      y: Number(bounds.getAttribute('y')),
      width: Number(bounds.getAttribute('width')),
      height: Number(bounds.getAttribute('height'))
    });
  }
  return result;
}
