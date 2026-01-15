import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { WeatherStateService } from '../../../unit/WeatherStateService';

interface Station {
  rank: number;
  name: string;
  id: string;
  precipitation: number;
}

@Component({
  selector: 'app-precipitation-ranking',
  imports: [CommonModule, NzCardModule, NzSelectModule, NzButtonModule, NzTableModule, FormsModule],
  templateUrl: './precipitation-ranking.component.html',
  styleUrl: './precipitation-ranking.component.css',
})
export class PrecipitationRankingComponent {
  constructor(private stateService: WeatherStateService) {}

  ngOnInit() {
    this.stateService.weatherConditions$.subscribe((conditions) => {
      console.log('接收到新状态，当前激活天气现象：', conditions);
    });
  }

  selectedRegion = '太原市';
  selectedTime = '近10min';
  selectedTimeType = '分钟';

  timeOptions = ['分钟', '1h', '3h', '6h', '12h', '24h'];
  recentTimeOptions = ['近10min', '近30min', '近50min', '近60min'];

  stations: Station[] = [
    { rank: 1, name: '杨庄', id: 'V8338', precipitation: 0.1 },
    { rank: 2, name: '环城北路安远园', id: 'VV036', precipitation: 0 },
    { rank: 3, name: '等驾坡街办', id: 'VV014', precipitation: 0 },
    { rank: 4, name: '南门里', id: 'V8665', precipitation: 0 },
    { rank: 5, name: '汉城湖封禅广场', id: 'V8656', precipitation: 0 },
    { rank: 6, name: '丝绸之路群雕', id: 'V8655', precipitation: 0 },
    { rank: 7, name: '印钞广场', id: 'V8654', precipitation: 0 },
    { rank: 8, name: '文景山公园', id: 'V8646', precipitation: 0 },
    { rank: 9, name: '森林公园应用气象观测站', id: 'V8920', precipitation: 0 },
    { rank: 10, name: '小店区', id: 'V8899', precipitation: 0 },
    { rank: 11, name: '马术馆暑热压力仪', id: 'V8887', precipitation: 0 },
    { rank: 12, name: '滋水公园', id: 'V8886', precipitation: 0 },
    { rank: 13, name: '奥体综合观测站', id: 'V8885', precipitation: 0 },
    { rank: 14, name: '山西省体育训练中心', id: 'V8884', precipitation: 0 },
    { rank: 15, name: '省政府', id: 'V8883', precipitation: 0 },
    { rank: 16, name: '马术馆', id: 'V8881', precipitation: 0 },
  ];

  columns = [
    { title: '序号', key: 'rank', width: '60px' },
    { title: '站名', key: 'name', width: '120px' },
    { title: '站号', key: 'id', width: '80px' },
    { title: '降水/mm', key: 'precipitation', width: '80px' },
  ];
}
