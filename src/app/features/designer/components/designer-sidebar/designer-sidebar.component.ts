import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { DesignerInfoItem, DesignerWorkflow } from '../../data/designer-dashboard.data';

@Component({
  selector: 'app-designer-sidebar',
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: './designer-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerSidebarComponent {
  readonly infoItems = input.required<DesignerInfoItem[]>();
  readonly guidelines = input.required<string>();
  readonly workflows = input<DesignerWorkflow[]>([]);
  readonly selectedWorkflowId = input<string | null>(null);
  readonly selectWorkflow = output<string>();
}
