import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherStateService } from '../../../unit/WeatherStateService';
import radarData from '../../leaflet-component/radar.json';

@Component({
  selector: 'app-radar-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './radar-player.component.html',
  styleUrl: './radar-player.component.css',
})
export class RadarPlayerComponent implements OnInit, OnDestroy {
  isPlaying = false;
  currentIndex = 0;
  private playInterval: any = null;
  private readonly PLAY_INTERVAL = 2000; // 2秒间隔

  // 生成时间点（示例：从当前时间往前30分钟，每分钟一个点）
  timePoints: Date[] = [];
  startTime: Date = new Date();
  endTime: Date = new Date();

  constructor(private stateService: WeatherStateService) {}

  ngOnInit() {
    this.initializeTimePoints();
    // 初始化时通知地图组件当前索引
    this.stateService.updateRadarIndex(this.currentIndex);
  }

  ngOnDestroy() {
    this.stop();
  }

  // 初始化时间点（根据雷达数据）
  initializeTimePoints() {
    if (radarData && Array.isArray(radarData) && radarData.length > 0) {
      // 根据雷达数据生成时间点
      this.timePoints = [];
      const now = new Date();
      const intervalMinutes = 2; // 每2分钟一个时间点

      // 从当前时间往前推，生成与雷达数据数量相同的时间点
      // 确保时间点数量与雷达数据数量一致
      for (let i = 0; i < radarData.length; i++) {
        const time = new Date(
          now.getTime() - (radarData.length - 1 - i) * intervalMinutes * 60 * 1000
        );
        this.timePoints.push(time);
      }

      this.startTime = this.timePoints[0];
      this.endTime = this.timePoints[this.timePoints.length - 1];

      // 设置当前索引为第一个（索引0）
      this.currentIndex = 0;
    } else {
      // 如果没有雷达数据，使用默认时间点
      const now = new Date();
      this.endTime = new Date(now);
      this.startTime = new Date(now.getTime() - 30 * 60 * 1000);

      this.timePoints = [];
      for (let i = 0; i <= 30; i++) {
        const time = new Date(this.startTime.getTime() + i * 60 * 1000);
        this.timePoints.push(time);
      }

      this.currentIndex = 0;
    }
  }

  // 播放/暂停
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 播放
  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playInterval = setInterval(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.timePoints.length) {
        this.currentIndex = 0; // 循环播放
      }
      // 通知地图组件更新雷达图层（索引直接对应雷达数据数组索引）
      this.stateService.updateRadarIndex(this.currentIndex);
    }, this.PLAY_INTERVAL);
  }

  // 暂停
  pause() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  // 停止
  stop() {
    this.pause();
    this.currentIndex = 0; // 回到第一个
    this.stateService.updateRadarIndex(this.currentIndex);
  }

  // 手动选择时间点
  onSliderChange(index: number) {
    this.currentIndex = index;
    // 如果正在播放，暂停
    if (this.isPlaying) {
      this.pause();
    }
    // 通知地图组件更新雷达图层
    this.stateService.updateRadarIndex(this.currentIndex);
  }

  // 格式化时间显示
  formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 获取当前时间
  getCurrentTime(): string {
    if (this.timePoints.length === 0) return '';
    return this.formatTime(this.timePoints[this.currentIndex]);
  }

  // 获取进度百分比
  getProgressPercent(): number {
    if (this.timePoints.length === 0) return 0;
    if (this.timePoints.length === 1) return 0;
    return (this.currentIndex / (this.timePoints.length - 1)) * 100;
  }

  // 获取时间点索引（用于滑块）
  getTimePointIndex(time: Date): number {
    return this.timePoints.findIndex((t) => t.getTime() === time.getTime());
  }

  // 获取滑块最大值
  getMaxIndex(): number {
    if (radarData && Array.isArray(radarData) && radarData.length > 0) {
      return radarData.length - 1;
    }
    return Math.max(0, this.timePoints.length - 1);
  }
}
