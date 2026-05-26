import { ChangeDetectionStrategy, Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { ADMIN_DEPARTMENTS, AdminRole, AdminUserCreate } from '../../data/admin-dashboard.data';

import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-admin-user-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, MultiSelectModule],
  templateUrl: './admin-user-creator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUserCreatorComponent implements OnInit {
  readonly roles = input<AdminRole[]>([]);
  readonly departments = input<any[]>([]);
  readonly createUser = output<AdminUserCreate>();
  private readonly formBuilder = new FormBuilder();
  ngOnInit(): void {
    console.log('AdminUserCreatorComponent initialized');
    console.log('Roles input:', this.roles());
    console.log('Departments input:', this.departments());
  }
  protected readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    departamentos: [[] as string[]],
    rolId: ['', Validators.required]
  });

  protected isClient(): boolean {
    const selectedRole = this.roles().find(r => r.id === this.form.controls.rolId.value);
    const roleName = selectedRole?.name || '';
    return roleName === 'Cliente' || roleName === 'ROLE_CLIENTE';
  }

  protected submit(): void {
    console.log('Submitting form with value:', this.form.getRawValue());
    if (this.isClient()) {
      this.form.controls.departamentos.setValue([]);
    } else if (this.form.controls.departamentos.value.length === 0) {
      this.form.controls.departamentos.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.createUser.emit(this.form.getRawValue());
    this.form.reset({
      nombre: '',
      email: '',
      password: '',
      departamentos: [] as string[],
      rolId: ''
    });
  }
}
