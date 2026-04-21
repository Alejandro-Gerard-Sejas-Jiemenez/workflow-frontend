import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../../../shared/components/auth-shell/auth-shell.component';
import { HomeHeroComponent } from '../components/home-hero/home-hero.component';
import { HomeLoginFormComponent, LoginCredentials } from '../components/home-login-form/home-login-form.component';
import { HOME_FEATURES } from '../data/home-content';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Toast, AuthShellComponent, HomeHeroComponent, HomeLoginFormComponent],
  providers: [MessageService],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  protected readonly features = HOME_FEATURES;
  protected readonly loading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  protected onLogin(credentials: LoginCredentials): void {
    if (this.loading()) return;
    this.loading.set(true);

    this.authService.login(credentials).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => this.handleSuccess(),
      error: () => this.handleError()
    });
  }

  private handleSuccess(): void {
    this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Bienvenido al sistema', life: 2000 });
    setTimeout(() => this.authService.redirectBasedOnRole(), 1000);
  }

  private handleError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Credenciales invalidas o servidor no disponible',
      life: 3000
    });
  }
}
