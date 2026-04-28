import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workflow-designer-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="editor-topbar">
      <div class="editor-topbar__brand">
        <div class="editor-topbar__badge">W</div>
        <div>
          <p class="editor-topbar__eyebrow">DISEÑADOR</p>
          <h4 class="editor-topbar__title">{{ workflowName() }}</h4>
        </div>
      </div>

      <div class="editor-topbar__meta">
        <span class="editor-chip editor-chip--name">Draft</span>
        @if (isDirty()) {
          <span class="editor-chip editor-chip--dirty">Pendiente de guardado</span>
        }
      </div>

      <div class="editor-topbar__actions">
        <div class="editor-zoom">
          <button (click)="zoomOut.emit()" class="editor-icon-button" title="Alejar">
            <i class="pi pi-minus"></i>
          </button>
          <span class="mx-3">{{ zoomLevel() }}%</span>
          <button (click)="zoomIn.emit()" class="editor-icon-button" title="Acercar">
            <i class="pi pi-plus"></i>
          </button>
        </div>
        
        <button (click)="fitToScreen.emit()" class="editor-icon-button" title="Ajustar">
          <i class="pi pi-expand"></i>
        </button>
        
        <button (click)="relayout.emit()" class="editor-icon-button" title="Auto-diseño">
          <i class="pi pi-sitemap"></i>
        </button>

        <button (click)="save.emit()" [disabled]="isSaving()" class="editor-save-button">
          <i class="pi" [class.pi-save]="!isSaving()" [class.pi-spin]="isSaving()" [class.pi-spinner]="isSaving()"></i>
          <span>{{ isSaving() ? 'Guardando...' : 'Guardar' }}</span>
        </button>
      </div>
    </header>
  `,
  styleUrl: '../editor/editor.component.css'
})
export class WorkflowDesignerToolbarComponent {
  workflowName = input<string>('Sin nombre');
  isDirty = input<boolean>(false);
  isSaving = input<boolean>(false);
  zoomLevel = input<number>(100);

  zoomIn = output<void>();
  zoomOut = output<void>();
  fitToScreen = output<void>();
  relayout = output<void>();
  save = output<void>();
}
