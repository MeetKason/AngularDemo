import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LeafletComponent } from './leaflet-component/leaflet-component';
import { NavbarComponent } from './components/navbar/navbar-component';
import { WeatherSidebarComponent } from './components/weather-sidebar/weather-sidebar.component';
import { TemperatureRankingComponent } from './components/temperature-ranking/temperature-ranking.component';
import { PrecipitationRankingComponent } from './components/precipitation-ranking/precipitation-ranking.component';
import { WeatherForecastComponent } from './components/weather-forecast/weather-forecast.component';
import { WeatherStateService } from '../unit/WeatherStateService';
import { FormsModule } from '@angular/forms';
import { WeatherSectionComponent } from './components/weather-section/weather-section.component';
import { RadarPlayerComponent } from './components/radar-player/radar-player.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    LeafletComponent,
    NavbarComponent,
    WeatherSidebarComponent,
    TemperatureRankingComponent,
    PrecipitationRankingComponent,
    WeatherForecastComponent,
    WeatherSectionComponent,
    RadarPlayerComponent,
    FormsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('AngularDemo');
  popupSignal = false;
  selectedRankingType: 'temperature' | 'precipitation' | 'none' = 'none';
  selectedLayer: string | null = null;
  windFieldActive = false;
  currentTime = new Date();
  layerTitle = '';
  windFieldTitle = '';
  rightSidebarCollapsed = false; // 右侧边栏是否收起
  isRadarSelected = false; // 是否选中雷达

  constructor(private stateService: WeatherStateService, private cdr: ChangeDetectorRef) {
    // 更新时间
    setInterval(() => {
      this.currentTime = new Date();
      this.updateTitles();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnInit() {
    this.stateService.weatherConditions$.subscribe((conditions) => {
      console.log('接收到新状态，当前激活天气现象：', conditions);
      if (conditions && conditions.length > 0) {
        this.selectedLayer = conditions[0].name;
        this.isRadarSelected = conditions[0].name === '雷达';
        if (conditions[0].name === '温度') {
          this.selectedRankingType = 'temperature';
        } else if (conditions[0].name === '降水') {
          this.selectedRankingType = 'precipitation';
        } else {
          this.selectedRankingType = 'none';
          this.stateService.updatePopup(false);
        }
      } else {
        this.selectedLayer = null;
        this.selectedRankingType = 'none';
        this.isRadarSelected = false;
      }
      this.updateTitles();
      this.cdr.detectChanges();
    });

    // 监听开关状态（风流场等）
    this.stateService.weatherParams$.subscribe((params) => {
      const windField = params.find((p: any) => p.name === '风流场');
      this.windFieldActive = windField ? windField.active : false;
      this.updateTitles();
      this.cdr.detectChanges();
    });

    this.stateService.popup$.subscribe((popup) => {
      this.popupSignal = popup;
      this.cdr.detectChanges(); // 强制更新视图
    });
  }

  // 更新标题
  updateTitles() {
    this.layerTitle = this.getLayerTitle();
    this.windFieldTitle = this.getWindFieldTitle();
  }

  switchRanking(type: 'temperature' | 'precipitation') {
    this.selectedRankingType = type;
  }

  // 格式化时间：2025年01月15日12时
  getFormattedTime(): string {
    const year = this.currentTime.getFullYear();
    const month = String(this.currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(this.currentTime.getDate()).padStart(2, '0');
    const hour = String(this.currentTime.getHours()).padStart(2, '0');
    return `${year}年${month}月${day}日${hour}时`;
  }

  // 获取图层标题
  getLayerTitle(): string {
    if (!this.selectedLayer) {
      return '';
    }

    const timeStr = this.getFormattedTime();
    const layerMap: { [key: string]: string } = {
      温度: '平均气温图',
      降水: '降水量图',
      雷达: '雷达回波图',
      云图: '卫星云图',
    };

    const layerDesc = layerMap[this.selectedLayer] || '图';
    // 这里可以根据需要添加地区信息，暂时使用默认
    return `太原市${timeStr}${layerDesc}`;
  }

  // 获取风流场标题
  getWindFieldTitle(): string {
    if (!this.windFieldActive) {
      return '';
    }
    const timeStr = this.getFormattedTime();
    return `${timeStr}风流场图`;
  }

  // 切换右侧边栏展开/收起
  toggleRightSidebar() {
    this.rightSidebarCollapsed = !this.rightSidebarCollapsed;
  }
}
