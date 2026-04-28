import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDepartment } from '../../data/admin-dashboard.data';

@Component({
  selector: 'app-admin-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-department-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDepartmentManagementComponent {
  @Input() departments: AdminDepartment[] = [];
  @Output() createDepartment = new EventEmitter<AdminDepartment>();
  @Output() updateDepartment = new EventEmitter<AdminDepartment>();
  @Output() deleteDepartment = new EventEmitter<string>();

  protected isModalOpen = false;
  protected isEditing = false;
  protected currentDept: AdminDepartment = { nombre: '', descripcion: '' };

  protected openCreateModal(): void {
    this.isEditing = false;
    this.currentDept = { nombre: '', descripcion: '' };
    this.isModalOpen = true;
  }

  protected openEditModal(dept: AdminDepartment): void {
    this.isEditing = true;
    this.currentDept = { ...dept };
    this.isModalOpen = true;
  }

  protected save(): void {
    if (this.isEditing) {
      this.updateDepartment.emit(this.currentDept);
    } else {
      this.createDepartment.emit(this.currentDept);
    }
    this.isModalOpen = false;
  }

  protected delete(id: string): void {
    if (confirm('¿Estás seguro de desactivar este departamento?')) {
      this.deleteDepartment.emit(id);
    }
  }
}
