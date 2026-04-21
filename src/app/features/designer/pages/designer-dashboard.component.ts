import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { GojsWorkflowEditorComponent } from '../../workflow-designer/components/gojs-workflow-editor.component';
import { AuthService } from '../../../core/services/auth.service';
import { DESIGNER_GUIDELINES, DESIGNER_INFO_ITEMS } from '../data/designer-dashboard.data';
import { DesignerSidebarComponent } from '../components/designer-sidebar/designer-sidebar.component';

@Component({
  selector: 'app-designer-dashboard',
  standalone: true,
  imports: [AsyncPipe, Button, GojsWorkflowEditorComponent, DesignerSidebarComponent],
  templateUrl: './designer-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerDashboardComponent {
  protected readonly infoItems = DESIGNER_INFO_ITEMS;
  protected readonly guidelines = DESIGNER_GUIDELINES;
  protected readonly user$ = inject(AuthService).currentUser$;
  private readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout();
  }
}
