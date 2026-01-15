import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormsModule } from '@angular/forms';
import { WeatherStateService } from '../../../unit/WeatherStateService';
import { ThemeService } from '../../../unit/theme.service';

@Component({
  selector: 'app-navbar-component',
  imports: [CommonModule, DatePipe, NzSwitchModule, FormsModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css',
})
export class NavbarComponent {
  switchValue = true;
  currentTime = new Date();

  constructor(private stateService: WeatherStateService, private themeService: ThemeService) {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  getFormattedTime(): string {
    return this.currentTime
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-');
  }

  onSwitchChangeBoundary(event: boolean) {
    console.log(event);
    this.themeService.toggleTheme();

    if (event) {
      this.switchValue = true;
      this.stateService.updateTheme('white-theme-map');
    } else {
      this.switchValue = false;
      this.stateService.updateTheme('dark-theme-map');
    }
  }
}
