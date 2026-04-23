import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { AdminRole, AdminUser, AdminUserUpdate } from '../../data/admin-dashboard.data';
import { AdminUserEditorComponent } from '../admin-user-editor/admin-user-editor.component';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, Button, Paginator, AdminUserEditorComponent],
  templateUrl: './admin-user-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUserManagementComponent {
  readonly activeUsers = input<AdminUser[]>([]);
  readonly inactiveUsers = input<AdminUser[]>([]);
  readonly roles = input<AdminRole[]>([]);

  readonly deactivateUser = output<string>();
  readonly restoreUser = output<string>();
  readonly updateUser = output<AdminUserUpdate>();
  protected readonly editingUserId = signal<string | null>(null);
  protected readonly filter = signal<'active' | 'inactive' | 'all'>('active');
  protected readonly first = signal(0);
  protected readonly rows = signal(5);

  protected get visibleUsers(): AdminUser[] {
    switch (this.filter()) {
      case 'inactive':
        return this.inactiveUsers();
      case 'all':
        return [...this.activeUsers(), ...this.inactiveUsers()];
      default:
        return this.activeUsers();
    }
  }

  protected get visibleCount(): number {
    return this.visibleUsers.length;
  }

  protected get paginatedUsers(): AdminUser[] {
    return this.visibleUsers.slice(this.first(), this.first() + this.rows());
  }

  protected setFilter(filter: 'active' | 'inactive' | 'all'): void {
    this.filter.set(filter);
    this.first.set(0);
    this.stopEditing();
  }

  protected startEditing(userId: string): void {
    this.editingUserId.set(userId);
  }

  protected stopEditing(): void {
    this.editingUserId.set(null);
  }

  protected saveUser(user: AdminUserUpdate): void {
    this.updateUser.emit(user);
    this.stopEditing();
  }

  protected handlePageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(5);
    this.stopEditing();
  }
}
