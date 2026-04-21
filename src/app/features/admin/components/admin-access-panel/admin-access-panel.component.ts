import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-access-panel',
  standalone: true,
  templateUrl: './admin-access-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAccessPanelComponent {}
