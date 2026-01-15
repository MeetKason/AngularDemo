import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root', // 全局单例
})
export class WeatherStateService {
  // 定义一个流，初始值为当前的参数列表
  private weatherParamsSubject = new BehaviorSubject<any[]>([]);
  // 暴露给其他组件订阅的 Observable
  weatherParams$ = this.weatherParamsSubject.asObservable();

  // 定义一个流，初始值为当前的要素现象列表
  private weatherConditionsSubject = new BehaviorSubject<any[]>([]);
  // 暴露给其他组件订阅的 Observable
  weatherConditions$ = this.weatherConditionsSubject.asObservable();

  // 定义一个流，初始值为当前的主题
  private themeSubject = new BehaviorSubject<string>('white-theme-map');
  // 暴露给其他组件订阅的 Observable
  theme$ = this.themeSubject.asObservable();

  // 定义一个流，初始值为当前的气泡状态
  private popupSubject = new BehaviorSubject<boolean>(false);
  // 暴露给其他组件订阅的 Observable
  popup$ = this.popupSubject.asObservable();

  // 定义一个流，初始值为当前的雷达播放索引
  private radarIndexSubject = new BehaviorSubject<number>(0);
  // 暴露给其他组件订阅的 Observable
  radarIndex$ = this.radarIndexSubject.asObservable();

  // 记录当前选中的图层 图层名称 (温度, 降水, 雷达， 云图)
  public selectedLayer: any = null;

  // 更新要素现象状态的方法
  updateParams(params: any[]) {
    this.weatherParamsSubject.next([...params]);
  }

  // 更新天气现象状态的方法
  updateWeatherConditions(conditions: any[]) {
    console.log('--------', conditions);
    this.selectedLayer = conditions[0].name;
    this.weatherConditionsSubject.next([...conditions]);
  }

  // 更新主题状态的方法
  updateTheme(theme: string) {
    this.themeSubject.next(theme || 'white-theme-map');
  }

  // 更新气泡状态的方法
  updatePopup(popup: boolean) {
    this.popupSubject.next(popup || false);
  }

  // 更新雷达播放索引的方法
  updateRadarIndex(index: number) {
    this.radarIndexSubject.next(index);
  }
}
