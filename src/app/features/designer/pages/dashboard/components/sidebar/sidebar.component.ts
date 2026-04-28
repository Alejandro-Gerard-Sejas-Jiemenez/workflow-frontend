import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-designer-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './sidebar.component.html'
})
export class DesignerDashboardSidebarComponent {
  isCreating = input<boolean>(false);
  createError = input<string | null>(null);
  
  createWorkflow = output<{ nombre: string, descripcion: string }>();
  openAi = output<void>();

  protected createModel = { nombre: '', descripcion: '' };

  protected onSubmit() {
    const nombre = this.createModel.nombre.trim();
    const descripcion = this.createModel.descripcion.trim();
    if (nombre && descripcion && !this.isCreating()) {
      this.createWorkflow.emit({ nombre, descripcion });
      this.createModel = { nombre: '', descripcion: '' };
    }
  }
}
