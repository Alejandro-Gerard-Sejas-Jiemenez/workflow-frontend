import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { NgDiagramNodeService, NgDiagramNodeTemplate, NgDiagramPortComponent, NgDiagramViewportService, SimpleNode } from 'ng-diagram';

export type WorkflowDiagramNodeData = {
  kind: string;
  label: string;
  role: string;
  hint: string;
  accent: string;
  accentSoft: string;
  typeLabel: string;
};

@Component({
  selector: 'app-workflow-diagram-node',
  standalone: true,
  imports: [CommonModule, NgDiagramPortComponent],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true'
  },
  template: `
    <div class="workflow-node-shell" [class.workflow-node-shell--selected]="node().selected">
      @if (nodeType !== 'lane') {
        <ng-diagram-port id="top" class="workflow-node__port" side="top" type="both"></ng-diagram-port>
        <ng-diagram-port id="right" class="workflow-node__port" side="right" type="both"></ng-diagram-port>
      }
      <div
        class="workflow-node"
        [class.workflow-node--lane]="nodeType === 'lane'"
        [class.workflow-node--start]="nodeType === 'start'"
        [class.workflow-node--decision]="nodeType === 'decision'"
        [class.workflow-node--fork]="nodeType === 'fork'"
        [class.workflow-node--join]="nodeType === 'join'"
        [class.workflow-node--note]="nodeType === 'note'"
        [class.workflow-node--data]="nodeType === 'data'"
        [class.workflow-node--end]="nodeType === 'end'">
        @if (nodeType === 'lane') {
          <div
            class="workflow-node__lane"
            [style.width.px]="laneWidth"
            [style.height.px]="laneHeight">
            <div class="workflow-node__lane-header">
              <span class="workflow-node__lane-title">{{ node().data.label }}</span>
            </div>
            <div class="workflow-node__lane-body"></div>
            @if (node().selected) {
              <button type="button" class="workflow-node__resize workflow-node__resize--top" (pointerdown)="startLaneResize($event, 'top')"></button>
              <button type="button" class="workflow-node__resize workflow-node__resize--right" (pointerdown)="startLaneResize($event, 'right')"></button>
              <button type="button" class="workflow-node__resize workflow-node__resize--bottom" (pointerdown)="startLaneResize($event, 'bottom')"></button>
              <button type="button" class="workflow-node__resize workflow-node__resize--left" (pointerdown)="startLaneResize($event, 'left')"></button>
            }
          </div>
        } @else if (nodeType === 'start') {
          <div class="workflow-node__initial"></div>
        } @else if (nodeType === 'end') {
          <div class="workflow-node__final">
            <div class="workflow-node__final-core"></div>
          </div>
        } @else if (nodeType === 'fork' || nodeType === 'join') {
          <div class="workflow-node__fork-bar"></div>
          <span class="workflow-node__caption">{{ node().data.label }}</span>
        } @else {
          <div class="workflow-node__body">
            <h4 class="workflow-node__title">{{ node().data.label }}</h4>
            @if (nodeType === 'task' && node().data.role) {
              <p class="workflow-node__role">{{ node().data.role }}</p>
            }
          </div>
        }
      </div>
      @if (nodeType !== 'lane') {
        <ng-diagram-port id="bottom" class="workflow-node__port" side="bottom" type="both"></ng-diagram-port>
        <ng-diagram-port id="left" class="workflow-node__port" side="left" type="both"></ng-diagram-port>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: max-content;
      height: max-content;
    }

    .workflow-node-shell {
      position: relative;
      width: max-content;
      height: max-content;
    }

    .workflow-node-shell--selected .workflow-node:not(.workflow-node--start):not(.workflow-node--end):not(.workflow-node--fork):not(.workflow-node--join) {
      box-shadow: 0 0 0 3px rgba(var(--primary-uml-rgb), 0.18);
    }

    .workflow-node-shell--selected .workflow-node__initial,
    .workflow-node-shell--selected .workflow-node__final {
      box-shadow: 0 0 0 3px rgba(var(--primary-uml-rgb), 0.18);
    }

    .workflow-node-shell--selected .workflow-node__fork-bar {
      box-shadow: 0 0 0 3px rgba(var(--primary-uml-rgb), 0.18);
    }

    .workflow-node {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: var(--surface-uml-700);
      position: relative;
      z-index: 1;
    }

    .workflow-node--lane {
      align-items: stretch;
    }

    .workflow-node__lane {
      width: 280px;
      height: 420px;
      border: 2px solid var(--surface-uml-700);
      border-radius: 0;
      background: transparent;
      overflow: hidden;
      cursor: grab;
    }

    .workflow-node-shell--selected .workflow-node__lane {
      cursor: default;
    }

    .workflow-node__lane-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 62px;
      padding: 0 18px;
      border-bottom: 2px solid var(--surface-uml-700);
      background: rgba(var(--primary-uml-rgb), 0.04);
    }

    .workflow-node__lane-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--surface-uml-800);
    }

    .workflow-node__lane-body {
      height: calc(100% - 62px);
      background: transparent;
    }

    .workflow-node__resize {
      position: absolute;
      border: 0;
      padding: 0;
      background: transparent;
      z-index: 4;
      touch-action: none;
    }

    .workflow-node__resize--top,
    .workflow-node__resize--bottom {
      left: 8px;
      right: 8px;
      height: 18px;
      cursor: ns-resize;
    }

    .workflow-node__resize--top {
      top: -9px;
    }

    .workflow-node__resize--bottom {
      bottom: -9px;
    }

    .workflow-node__resize--left,
    .workflow-node__resize--right {
      top: 8px;
      bottom: 8px;
      width: 18px;
      cursor: ew-resize;
    }

    .workflow-node__resize--left {
      left: -9px;
    }

    .workflow-node__resize--right {
      right: -9px;
    }

    .workflow-node__resize::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: rgba(var(--primary-uml-rgb), 0.22);
      opacity: 0;
      transition: opacity 0.14s ease;
    }

    .workflow-node__resize:hover::before {
      opacity: 1;
    }

    .workflow-node__body {
      display: flex;
      width: 220px;
      min-height: 78px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4px;
      border: 2px solid var(--surface-uml-700);
      border-radius: 18px;
      background: var(--p-primary-50);
      padding: 14px 18px;
      text-align: center;
    }

    .workflow-node--decision .workflow-node__body {
      width: 142px;
      min-height: 142px;
      border-radius: 0;
      transform: rotate(45deg);
      padding: 20px;
    }

    .workflow-node--decision .workflow-node__title {
      transform: rotate(-45deg);
      max-width: 84px;
      margin: 0 auto;
    }

    .workflow-node--fork {
      width: 220px;
      gap: 10px;
    }

    .workflow-node__fork-bar {
      width: 220px;
      height: 14px;
      background: var(--surface-uml-700);
      border-radius: 2px;
    }

    .workflow-node__caption {
      font-size: 12px;
      color: var(--text-uml-soft);
      text-align: center;
    }

    .workflow-node__initial {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: var(--surface-uml-700);
    }

    .workflow-node__final {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border: 3px solid var(--surface-uml-700);
      border-radius: 999px;
      background: #ffffff;
    }

    .workflow-node__final-core {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: var(--surface-uml-700);
    }

    .workflow-node--note .workflow-node__body {
      border-style: dashed;
      background: var(--p-primary-50);
    }

    .workflow-node--data .workflow-node__body {
      clip-path: polygon(0 0, 88% 0, 100% 18%, 100% 100%, 0 100%);
    }

    .workflow-node__title {
      margin: 0;
      font-size: 15px;
      line-height: 1.35;
      font-weight: 500;
    }

    .workflow-node__role {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0;
      line-height: 1.4;
      color: var(--text-uml-soft);
    }

    .workflow-node__port {
      opacity: 0;
      transition: opacity 0.14s ease;
      --ngd-port-size: 0.7rem;
      --ngd-port-border-size: 0.16rem;
      --ngd-port-border-size-hover: 0.22rem;
      --ngd-port-background-color: var(--p-primary-50);
      --ngd-port-border-color: var(--primary-uml);
      --ngd-port-background-color-hover: var(--primary-uml);
      --ngd-port-border-color-hover: rgba(var(--primary-uml-rgb), 0.25);
    }

    .workflow-node-shell--selected .workflow-node__port {
      opacity: 1;
    }
  `]
})
export class WorkflowDiagramNodeComponent implements NgDiagramNodeTemplate<WorkflowDiagramNodeData, SimpleNode<WorkflowDiagramNodeData>> {
  readonly node = input.required<SimpleNode<WorkflowDiagramNodeData>>();
  private readonly nodeService = inject(NgDiagramNodeService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private resizeCleanup: (() => void) | null = null;
  private readonly minLaneWidth = 220;
  private readonly minLaneHeight = 220;

  protected get nodeType(): string {
    return this.node().type ?? 'task';
  }

  protected get laneWidth(): number {
    return this.node().size?.width ?? 280;
  }

  protected get laneHeight(): number {
    return this.node().size?.height ?? 420;
  }

  protected startLaneResize(event: PointerEvent, side: 'top' | 'right' | 'bottom' | 'left'): void {
    if (this.nodeType !== 'lane') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.resizeCleanup?.();

    const initialNode = this.node();
    const initialWidth = initialNode.size?.width ?? 280;
    const initialHeight = initialNode.size?.height ?? 420;
    const initialX = initialNode.position.x;
    const initialY = initialNode.position.y;
    const startClientX = event.clientX;
    const startClientY = event.clientY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const scale = this.viewportService.scale() || 1;
      const deltaX = (moveEvent.clientX - startClientX) / scale;
      const deltaY = (moveEvent.clientY - startClientY) / scale;

      let width = initialWidth;
      let height = initialHeight;
      let x = initialX;
      let y = initialY;

      if (side === 'right') {
        width = Math.max(this.minLaneWidth, initialWidth + deltaX);
      }

      if (side === 'left') {
        width = Math.max(this.minLaneWidth, initialWidth - deltaX);
        x = initialX + (initialWidth - width);
      }

      if (side === 'bottom') {
        height = Math.max(this.minLaneHeight, initialHeight + deltaY);
      }

      if (side === 'top') {
        height = Math.max(this.minLaneHeight, initialHeight - deltaY);
        y = initialY + (initialHeight - height);
      }

      this.nodeService.resizeNode(
        initialNode.id,
        { width, height },
        { x, y },
        true
      );
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      this.resizeCleanup = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    this.resizeCleanup = onPointerUp;
  }
}
