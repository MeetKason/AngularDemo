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
  active_icon: string;
}

@Component({
  selector: 'app-weather-sidebar',
  imports: [CommonModule, NzIconModule, NzCardModule, NzButtonModule],
  templateUrl: './weather-sidebar.component.html',
  styleUrl: './weather-sidebar.component.css',
  standalone: true, // 确保是独立组件
})
export class WeatherSidebarComponent {
  constructor(private stateService: WeatherStateService) {
    // 初始化时把初始状态发出去
    this.stateService.updateParams(this.weatherParams);
  }

  // @Input() set isOpen(value: boolean) {
  //   if (value) {
  //     this.weatherParamsSubject.next(this.weatherParams);
  //   } else {
  //     this.weatherParamsSubject.next([]);
  //   }
  // }

  // 顶部组：单选按钮组（温度、降水、雷达回波、卫星）
  weatherParams: WeatherParam[] = [
    {
      name: '温度',
      icon: '/assets/image/Temperature.png',
      active_icon: '/assets/image/Temperature_on.png',
      active: false,
    },
    {
      name: '降水',
      icon: '/assets/image/rain.png',
      active_icon: '/assets/image/rain_on.png',
      active: false,
    },
    {
      name: '雷达',
      icon: '/assets/image/Radar.png',
      active_icon: '/assets/image/Radar_on.png',
      active: false,
    },
    {
      name: '云图',
      icon: '/assets/image/Cloud.png',
      active_icon: '/assets/image/Cloud_on.png',
      active: false,
    },
  ];

  // 中间组：开关组（风流场、实观测值、站点名称）
  weatherConditions: any[] = [
    {
      name: '风流场',
      icon: '/assets/image/Wind.png',
      active_icon: '/assets/image/Wind_on.png',
      active: false,
    },
    {
      name: '实观测值',
      icon: '/assets/image/Value.png',
      active_icon: '/assets/image/Value_on.png',
      active: false,
    },
    {
      name: '站点名称',
      icon: '/assets/image/Sites.png',
      active_icon: '/assets/image/Sites_on.png',
      active: false,
    },
    {
      name: '色斑图',
      icon: '/assets/image/ColorSpots.png',
      active_icon: '/assets/image/ColorSpots_on.png',
      active: false,
    },
  ];

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

  // 根据选中状态获取图标地址
  getIcon(param: WeatherParam): string {
    return param.active ? param.active_icon : param.icon;
  }

  toggleParam(param: WeatherParam) {
    if (param.active) return;
    // 2. 将所有参数设为非激活
    this.weatherParams.forEach((p) => (p.active = false));
    // 3. 激活当前项
    param.active = true;
    // 4. 同步状态到 Service（发送给其他组件，如地图）
    this.stateService.updateWeatherConditions([param]);
  }

  toggleCondition(condition: any) {
    condition.active = !condition.active;
    this.stateService.updateParams([condition]);
  }
}
