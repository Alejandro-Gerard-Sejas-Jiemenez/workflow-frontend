import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { DesignerInfoItem } from '../../data/designer-dashboard.data';

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
}
