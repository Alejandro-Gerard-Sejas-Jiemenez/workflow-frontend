import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { DesignerWorkflow } from '../../../../data/designer-dashboard.data';

@Component({
  selector: 'app-designer-workflow-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Paginator],
  templateUrl: './workflow-list.component.html'
})
export class DesignerWorkflowListComponent {
  workflows = input.required<DesignerWorkflow[]>();
  currentUserId = input<string | null>(null);
  isLoading = input<boolean>(false);
  loadError = input<string | null>(null);
  deletingId = input<string | null>(null);

  open = output<string>();
  delete = output<DesignerWorkflow>();
  retry = output<void>();

  protected searchTerm = signal('');
  protected first = 0;
  protected rows = 5;

  protected handlePageChange(e: PaginatorState) { this.first = e.first ?? 0; this.rows = e.rows ?? 5; }
  protected updateSearch(val: string) { this.searchTerm.set(val); this.first = 0; }

  protected filteredWorkflows() {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.workflows();
    return term ? list.filter(w => w.nombre.toLowerCase().includes(term) || w.descripcion.toLowerCase().includes(term)) : list;
  }

  protected paginatedWorkflows() {
    return this.filteredWorkflows().slice(this.first, this.first + this.rows);
  }

  protected roleLabel(w: DesignerWorkflow) { return w.ownerUserId === this.currentUserId() ? 'Owner' : 'Invitado'; }
  protected roleClasses(w: DesignerWorkflow) {
    return w.ownerUserId === this.currentUserId() ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  protected initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join(''); }
}
