import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input('pi pi-briefcase');
  readonly compact = input(false);
  readonly badgeText = input<string>('');
  readonly actionLabel = input('Salir');
  readonly actionIcon = input('pi pi-sign-out');
  readonly action = output<void>();
}
