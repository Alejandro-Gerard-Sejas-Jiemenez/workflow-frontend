import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent, NgDiagramModelService } from 'ng-diagram';
import { inject } from '@angular/core';
import { WorkflowDesignerStateService } from '../../core/services/workflow-designer-state.service';
import { WORKFLOW_PALETTE_ITEMS, SUPPORTED_PATTERNS } from '../../core/data/workflow-designer.data';

@Component({
  selector: 'app-workflow-designer-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: '../editor/editor.component.css'
})
export class WorkflowDesignerSidebarComponent {
  paletteItems = input<any[]>([]);
  supportedPatterns = input<any[]>([]);
  isGeneratingAi = input<boolean>(false);
  aiProposal = input<any>(null);

  insertPattern = output<string>();
  proposeWithAi = output<string>();
  applyAiProposal = output<void>();

  activeCategory = signal<'shapes' | 'patterns' | 'ai'>('shapes');
  isPanelOpen = signal(false);
  aiPrompt = signal('');

  setCategory(cat: any) { this.activeCategory.set(cat); this.isPanelOpen.set(true); }
  closePanel() { this.isPanelOpen.set(false); }

  onPropose() {
    this.proposeWithAi.emit(this.aiPrompt());
  }
}
