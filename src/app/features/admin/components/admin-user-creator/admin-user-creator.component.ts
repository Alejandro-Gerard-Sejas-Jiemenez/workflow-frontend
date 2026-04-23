import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { ADMIN_DEPARTMENTS, AdminRole, AdminUserCreate } from '../../data/admin-dashboard.data';

@Component({
  selector: 'app-admin-user-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button],
  templateUrl: './admin-user-creator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUserCreatorComponent {
  protected readonly departments = ADMIN_DEPARTMENTS;
  readonly roles = input<AdminRole[]>([]);
  readonly createUser = output<AdminUserCreate>();
  private readonly formBuilder = new FormBuilder();

  protected readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    departamento: ['', Validators.required],
    rolId: ['', Validators.required]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.createUser.emit(this.form.getRawValue());
    this.form.reset({
      nombre: '',
      email: '',
      password: '',
      departamento: '',
      rolId: ''
    });
  }
}
