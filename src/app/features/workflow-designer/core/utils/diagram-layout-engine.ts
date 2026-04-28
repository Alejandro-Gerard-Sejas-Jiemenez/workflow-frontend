import { SimpleNode, Point } from 'ng-diagram';

export const LANE_COLUMN_WIDTH = 320;
export const VERTICAL_GAP = 190;
export const START_Y = 120;

export function resolveLaneIndexFromNodePosition(x: number): number {
  return Math.max(0, Math.floor(x / LANE_COLUMN_WIDTH));
}

export function getNodeCenter(node: SimpleNode<any>): Point {
  return {
    x: node.position.x + (node.size?.width ?? 0) / 2,
    y: node.position.y + (node.size?.height ?? 0) / 2
  };
}

export function resolveConnectionPorts(source: SimpleNode<any>, target: SimpleNode<any>) {
  // Simplified logic for brevity, can be expanded if needed
  const sCenter = getNodeCenter(source);
  const tCenter = getNodeCenter(target);
  
  if (Math.abs(tCenter.x - sCenter.x) > Math.abs(tCenter.y - sCenter.y)) {
    return tCenter.x > sCenter.x ? { sP: 'right', tP: 'left' } : { sP: 'left', tP: 'right' };
  }
  return tCenter.y > sCenter.y ? { sP: 'bottom', tP: 'top' } : { sP: 'top', tP: 'bottom' };
}
