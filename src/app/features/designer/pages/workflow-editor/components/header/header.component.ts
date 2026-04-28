import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignerWorkflow, DesignerUser, WorkflowCollaborator } from '../../../../data/designer-dashboard.data';

@Component({
  selector: 'app-designer-workflow-editor-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html'
})
export class DesignerWorkflowEditorHeaderComponent {
  workflow = input.required<DesignerWorkflow>();
  collaborators = input<WorkflowCollaborator[]>([]);
  availableDesigners = input<DesignerUser[]>([]);
  invitationStatus = input<string | null>(null);

  goBack = output<void>();
  save = output<void>();
  toggleState = output<void>();
  invite = output<string>();

  protected selectedInviteUserId = '';

  protected onInvite() {
    if (this.selectedInviteUserId) {
      this.invite.emit(this.selectedInviteUserId);
      this.selectedInviteUserId = '';
    }
  }

  protected initials(name: string | null) {
    if (!name) return 'U';
    return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }
}
