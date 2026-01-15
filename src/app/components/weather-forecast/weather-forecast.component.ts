import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import * as echarts from 'echarts';

interface DayForecast {
  date: string;
  day: string;
  condition: string;
  icon: string;
  high: number;
  low: number;
}

interface HourForecast {
  time: string;
  temperature: number;
  icon: string;
}

@Component({
  selector: 'app-weather-forecast',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzIconModule],
  templateUrl: './weather-forecast.component.html',
  styleUrl: './weather-forecast.component.css',
})
export class WeatherForecastComponent implements OnDestroy, AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;
  private myChart: echarts.ECharts | null = null;
  private themeObserver: MutationObserver | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {}
  // 将你提供的 Base64 图标数据放入常量
  private readonly ICON_MAP: any = {
    大雪: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACc...', // 保持原 base64
    大雨: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQ...',
    多云: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACY...',
    雨加雪: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACc...',
  };

  private readonly ZH_EN: any = {
    大雪: 'MajorSnow',
    大雨: 'heavyRain',
    多云: 'cloudy',
    雨加雪: 'sleet',
  };
  location = '江西省上饶市横峰县上万高速公路';

  sevenDayForecast: DayForecast[] = [
    {
      date: '06-06',
      day: '明天',
      condition: '多云',
      icon: '/assets/image/cloudy.png',
      high: 34,
      low: 25,
    },
    {
      date: '06-07',
      day: '后天',
      condition: '多云转阵雨',
      icon: '/assets/image/sunny.png',
      high: 34,
      low: 25,
    },
    {
      date: '06-09',
      day: '周一',
      condition: '中雨',
      icon: '/assets/image/sunny.png',
      high: 29,
      low: 24,
    },
    {
      date: '06-10',
      day: '周二',
      condition: '小雨转多云',
      icon: '/assets/image/sunny.png',
      high: 29,
      low: 23,
    },
    {
      date: '06-11',
      day: '周三',
      condition: '阴转晴',
      icon: '/assets/image/cloudy.png',
      high: 29,
      low: 23,
    },
    {
      date: '06-12',
      day: '周四',
      condition: '阴转晴',
      icon: '/assets/image/cloudy.png',
      high: 29,
      low: 23,
    },
  ];

  hourlyForecast: HourForecast[] = [
    { time: '13:00', temperature: 34.0, icon: '/assets/image/sunny.png' },
    { time: '14:00', temperature: 34.1, icon: '/assets/image/sunny.png  ' },
    { time: '15:00', temperature: 33.5, icon: '/assets/image/sunny.png' },
    { time: '16:00', temperature: 32.0, icon: '/assets/image/sunny.png' },
    { time: '17:00', temperature: 30.5, icon: '/assets/image/sunny.png' },
    { time: '18:00', temperature: 29.0, icon: '/assets/image/sunny.png' },
    { time: '19:00', temperature: 27.5, icon: '/assets/image/sunny.png' },
    { time: '20:00', temperature: 26.0, icon: '/assets/image/sunny.png' },
    { time: '21:00', temperature: 25.0, icon: '/assets/image/sunny.png' },
    { time: '22:00', temperature: 24.5, icon: '/assets/image/sunny.png' },
    { time: '23:00', temperature: 24.0, icon: '/assets/image/sunny.png' },
    { time: '00:00', temperature: 23.5, icon: '/assets/image/sunny.png' },
    { time: '01:00', temperature: 24.0, icon: '/assets/image/sunny.png' },
    { time: '02:00', temperature: 24.5, icon: '/assets/image/sunny.png' },
    { time: '03:00', temperature: 24.9, icon: '/assets/image/sunny.png' },
    { time: '04:00', temperature: 25.5, icon: '/assets/image/sunny.png' },
    { time: '05:00', temperature: 26.5, icon: '/assets/image/sunny.png' },
    { time: '06:00', temperature: 28.0, icon: '/assets/image/sunny.png' },
    { time: '07:00', temperature: 30.0, icon: '/assets/image/sunny.png' },
    { time: '08:00', temperature: 31.5, icon: '/assets/image/sunny.png' },
    { time: '09:00', temperature: 32.5, icon: '/assets/image/sunny.png' },
    { time: '10:00', temperature: 33.5, icon: '/assets/image/sunny.png' },
    { time: '11:00', temperature: 34.0, icon: '/assets/image/sunny.png' },
    { time: '12:00', temperature: 34.0, icon: '/assets/image/sunny.png' },
  ];

  getMaxTemp() {
    return Math.max(...this.hourlyForecast.map((h) => h.temperature));
  }

  getMinTemp() {
    return Math.min(...this.hourlyForecast.map((h) => h.temperature));
  }

  getTempPosition(temp: number) {
    const max = this.getMaxTemp();
    const min = this.getMinTemp();
    const range = max - min;
    if (range === 0) return 50;
    return ((temp - min) / range) * 100;
  }

  getHourlyLinePoints(): string {
    const max = this.getMaxTemp();
    const min = this.getMinTemp();
    const range = max - min || 1;
    const width = 1000;
    const height = 200;

    return this.hourlyForecast
      .map((hour, index) => {
        const x = (index / (this.hourlyForecast.length - 1)) * width;
        const y = height - ((hour.temperature - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }

  ngAfterViewInit() {
    // 使用 requestAnimationFrame 确保 DOM 完全渲染
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.initializeChartWithRetry();
      }, 100);
    });
  }

  private initializeChartWithRetry(retries = 5) {
    if (!this.chartContainer?.nativeElement) {
      if (retries > 0) {
        setTimeout(() => this.initializeChartWithRetry(retries - 1), 100);
      } else {
        console.error('Chart container not found after retries');
      }
      return;
    }

    const container = this.chartContainer.nativeElement;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      if (retries > 0) {
        setTimeout(() => this.initializeChartWithRetry(retries - 1), 100);
      } else {
        console.warn('Chart container has no dimensions');
      }
      return;
    }

    this.initChart();
    // 监听窗口大小变化
    this.resizeHandler = () => {
      if (this.myChart) {
        this.myChart.resize();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    // 监听主题变化
    this.setupThemeObserver();
  }

  ngOnDestroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    if (this.myChart) {
      this.myChart.dispose();
      this.myChart = null;
    }
  }

  // 获取当前主题的文字颜色
  private getTextColor(): string {
    const computedStyle = getComputedStyle(document.body);
    return computedStyle.getPropertyValue('--text-color').trim() || '#333333';
  }

  // 设置主题监听器
  private setupThemeObserver() {
    this.themeObserver = new MutationObserver(() => {
      this.updateChartTheme();
    });
    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // 更新图表主题
  private updateChartTheme() {
    if (!this.myChart) return;
    const textColor = this.getTextColor();
    this.myChart.setOption({
      xAxis: {
        axisLabel: {
          color: textColor,
        },
      },
      series: [
        {
          label: {
            color: textColor,
          },
        },
      ],
    });
  }

  private initChart() {
    if (!this.chartContainer?.nativeElement) {
      console.error('Chart container element not available');
      return;
    }

    try {
      const container = this.chartContainer.nativeElement;

      // 如果图表已存在，先销毁
      if (this.myChart) {
        this.myChart.dispose();
        this.myChart = null;
      }

      // 初始化图表
      this.myChart = echarts.init(container, null, {
        renderer: 'canvas',
        useDirtyRect: false,
      });

      const weatherData = this.generateWeatherData();
      const { data, iconPaths } = weatherData;
      const richStyles = this.generateRichStyles(iconPaths);
      const textColor = this.getTextColor();
      const nowHour = new Date().getHours();
      const currentTimeIndex = data.findIndex((d: any) => {
        const hour = parseInt(d.time.split(':')[0]);
        return hour === nowHour || (hour === nowHour - 1 && nowHour === 0);
      });

      const option: echarts.EChartsOption = {
        grid: {
          top: '40',
          bottom: '60', // 为图标留出更多空间
          left: '10',
          right: '12',
          containLabel: false,
        },
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: 0,
            startValue: 0,
            endValue: 10,
            filterMode: 'empty',
          },
        ],
        xAxis: {
          type: 'category',
          data: data.map((v: any) => v.time),
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: {
            interval: 0,
            margin: 8,
            color: textColor,
            fontSize: 10,
            formatter: (v: string, i: number) => {
              const item = data[i];
              const iconKey = item.iconKey || 'icon0';
              // 第一行显示图标，第二行显示时间
              return `{${iconKey}|}\n${i === 0 ? '现在' : v}`;
            },
            rich: richStyles,
          },
        },
        yAxis: {
          type: 'value',
          show: false,
          min: 'dataMin',
          max: 'dataMax',
        },
        graphic:
          currentTimeIndex >= 0
            ? [
                {
                  type: 'line',
                  left: (currentTimeIndex / (data.length - 1)) * 100 + '%',
                  top: 0,
                  bottom: 0,
                  shape: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  style: {
                    stroke: '#ff0000',
                    lineWidth: 2,
                  },
                  z: 100,
                },
              ]
            : [],
        series: [
          {
            type: 'line',
            data: data.map((v: any) => v.value),
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: { width: 2, color: '#1890ff' },
            itemStyle: {
              color: '#1890ff',
            },
            label: {
              show: true,
              position: 'top',
              offset: [0, 5],
              formatter: '{c}°',
              color: textColor,
              fontSize: 11,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0)' },
              ]),
            },
          },
        ],
      };

      this.myChart.setOption(option);

      // 强制调整大小
      setTimeout(() => {
        this.myChart?.resize();
      }, 100);
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  // 根据实际图标路径生成 rich 样式
  private generateRichStyles(iconPaths: string[]): any {
    const rich: any = {};
    const uniqueIcons = [...new Set(iconPaths)];

    uniqueIcons.forEach((iconPath, index) => {
      const iconKey = `icon${index}`;
      // ECharts rich 样式配置
      rich[iconKey] = {
        width: 26,
        height: 26,
        padding: [1, 1, 1, 1],
        backgroundColor: {
          image: iconPath,
        },

        // 使用 align 和 verticalAlign 确保图标居中
        align: 'center',
        verticalAlign: 'middle',
      };
    });

    return rich;
  }

  private generateWeatherData() {
    const data: any[] = [];
    const nowHour = new Date().getHours();
    const iconMap: Map<string, string> = new Map();
    const iconPaths: string[] = [];

    // 使用 hourlyForecast 数据
    if (this.hourlyForecast && this.hourlyForecast.length > 0) {
      this.hourlyForecast.forEach((hour) => {
        const iconPath = hour.icon.trim();
        let iconKey = iconMap.get(iconPath);
        if (!iconKey) {
          iconKey = `icon${iconMap.size}`;
          iconMap.set(iconPath, iconKey);
          iconPaths.push(iconPath);
        }
        data.push({
          time: hour.time,
          value: hour.temperature,
          iconPath: iconPath,
          iconKey: iconKey,
        });
      });
    } else {
      // 生成模拟数据
      for (let i = 0; i < 24; i++) {
        const h = (nowHour + i) % 24;
        const iconPath = '/assets/image/sunny.png';
        let iconKey = iconMap.get(iconPath);
        if (!iconKey) {
          iconKey = `icon${iconMap.size}`;
          iconMap.set(iconPath, iconKey);
          iconPaths.push(iconPath);
        }
        data.push({
          time: (h < 10 ? '0' + h : h) + ':00',
          value: 15 + Math.floor(Math.random() * 10),
          iconPath: iconPath,
          iconKey: iconKey,
        });
      }
    }

    return { data, iconPaths };
  }
}
