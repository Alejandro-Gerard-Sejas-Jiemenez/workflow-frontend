import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { ADMIN_DEPARTMENTS, AdminRole, AdminUser, AdminUserUpdate } from '../../data/admin-dashboard.data';

import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-admin-user-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, MultiSelectModule],
  templateUrl: './admin-user-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUserEditorComponent {
  readonly user = input.required<AdminUser>();
  readonly roles = input<AdminRole[]>([]);
  readonly departments = input<any[]>([]);
  readonly saveUser = output<AdminUserUpdate>();
  readonly cancelEdit = output<void>();
  private readonly formBuilder = new FormBuilder();

  protected readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    departamentos: [[] as string[], Validators.required],
    rolId: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const user = this.user();
      const currentRole = this.roles().find((role) => role.name === user.role);
      this.form.setValue({
        nombre: user.name,
        departamentos: user.departments || [],
        rolId: currentRole?.id ?? ''
      });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saveUser.emit({
      id: this.user().id,
      ...this.form.getRawValue()
    });
  }
}
