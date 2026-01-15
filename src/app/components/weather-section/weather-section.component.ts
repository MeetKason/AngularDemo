import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { WeatherStateService } from '../../../unit/WeatherStateService';

interface WeatherParam {
  name: string;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-weather-section',
  imports: [CommonModule, NzIconModule, NzCardModule, NzButtonModule],
  templateUrl: './weather-section.component.html',
  styleUrl: './weather-section.component.css',
  standalone: true, // 确保是独立组件
})
export class WeatherSectionComponent {
  constructor() {}

  currentWeather = {
    location: '江西省上饶市横峰县上万高速公路',
    temperature: '34°C',
    condition: '多云',
    updateTime: '12:00:00',
    precipitation: '0mm',
    wind: '西风 3级',
    humidity: '33%',
    visibility: '19km',
  };

  getWeatherIcon(): string {
    // 根据天气状况返回对应的图标
    const condition = this.currentWeather.condition;
    if (condition.includes('多云')) {
      return '/assets/image/cloudy.png';
    } else if (condition.includes('晴')) {
      return '/assets/image/sunny.png';
    } else if (condition.includes('雨')) {
      return '/assets/image/rain.png';
    } else if (condition.includes('阴')) {
      return '/assets/image/overcast.png';
    }
    return '/assets/image/cloudy.png';
  }

  getWindDirection(): string {
    // 从 "西风 3级" 中提取风向
    return this.currentWeather.wind.split(' ')[0] || '西风';
  }

  getWindLevel(): string {
    // 从 "西风 3级" 中提取风力等级
    return this.currentWeather.wind.split(' ')[1] || '3级';
  }
}
