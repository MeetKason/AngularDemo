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
  temperature: number;
}

@Component({
  selector: 'app-temperature-ranking',
  imports: [CommonModule, NzCardModule, NzSelectModule, NzButtonModule, NzTableModule, FormsModule],
  templateUrl: './temperature-ranking.component.html',
  styleUrl: './temperature-ranking.component.css',
})
export class TemperatureRankingComponent {
  constructor(private stateService: WeatherStateService) {}

  selectedRegion = '太原市';
  selectedTime = '1h';
  selectedDataType = '平均气温';

  timeOptions = ['1h', '12h', '24h', '48h'];
  dataTypeOptions = ['平均气温', '最高气温', '最低气温'];

  stations: Station[] = [
    { rank: 1, name: '月湖区', id: 'V8552', temperature: 33.8 },
    { rank: 2, name: '江北', id: 'V8552', temperature: 33.5 },
    { rank: 3, name: '童家镇', id: 'V8552', temperature: 33.4 },
    { rank: 4, name: '贵溪市政府', id: 'V8552', temperature: 33.3 },
    { rank: 5, name: '云锦山酒店', id: 'V8552', temperature: 33.2 },
    { rank: 6, name: '人民公园', id: 'V8552', temperature: 33.2 },
    { rank: 7, name: '社会路', id: 'V8552', temperature: 33.1 },
    { rank: 8, name: '中山路', id: 'V8552', temperature: 32.8 },
    { rank: 9, name: '月湖区', id: 'V8552', temperature: 32.7 },
    { rank: 10, name: '白鹿', id: 'V8552', temperature: 32.6 },
    { rank: 11, name: '里毛', id: 'V8552', temperature: 32.5 },
    { rank: 12, name: '毕家', id: 'V8552', temperature: 32.4 },
    { rank: 13, name: '乌石峰', id: 'V8552', temperature: 32.0 },
    { rank: 14, name: '余门', id: 'V8552', temperature: 31.0 },
    { rank: 15, name: '雷公咀', id: 'V8552', temperature: 30.6 },
    { rank: 16, name: '范川', id: 'V8552', temperature: 30.5 },
    { rank: 17, name: '太阳界', id: 'V8552', temperature: 30.2 },
    { rank: 18, name: '黄庄乡', id: 'V8552', temperature: 29.8 },
    { rank: 19, name: '礼湖', id: 'V8552', temperature: 29.5 },
  ];

  columns = [
    { title: '排名', key: 'rank', width: '60px' },
    { title: '站点名称', key: 'name', width: '120px' },
    { title: '站点ID', key: 'id', width: '80px' },
    { title: '温度', key: 'temperature', width: '80px' },
  ];
}
