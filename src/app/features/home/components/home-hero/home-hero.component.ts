import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HomeFeature } from '../../data/home-content';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeHeroComponent {
  readonly features = input.required<HomeFeature[]>();
}
