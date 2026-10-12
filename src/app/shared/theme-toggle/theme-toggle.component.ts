import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ThemingService } from './theming.service';
import { SettingsService } from 'app/settings/settings.service';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuItem } from '@angular/material/menu';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  host: {
    '[class.menu-item]': 'menuItem'
  },
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIconButton,
    MatIcon,
    MatMenuItem
  ]
})
export class ThemeToggleComponent implements OnInit, OnChanges {
  /** Renders as a profile-menu row instead of a toolbar icon button. */
  @Input() menuItem = false;

  darkModeOn: boolean;

  constructor(
    private themingService: ThemingService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.darkModeOn = !!this.settingsService.themeDarkEnabled;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.darkModeOn = !!this.settingsService.themeDarkEnabled;
  }

  toggleTheme() {
    this.darkModeOn = !this.darkModeOn;
    this.settingsService.setThemeDarkEnabled(this.darkModeOn);
    this.themingService.setDarkMode(this.darkModeOn);
  }
}
