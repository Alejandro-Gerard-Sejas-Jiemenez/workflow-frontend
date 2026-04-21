import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

export type LoginCredentials = {
  email: string;
  password: string;
};

@Component({
  selector: 'app-home-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputText, Password, Button, IconField, InputIcon],
  templateUrl: './home-login-form.component.html',
  styleUrl: './home-login-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeLoginFormComponent {
  readonly loading = input(false);
  readonly loginSubmit = output<LoginCredentials>();

  protected email = '';
  protected password = '';

  protected submit(): void {
    this.loginSubmit.emit({ email: this.email, password: this.password });
  }
}
