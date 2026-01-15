/* tslint:disable */
/* eslint-disable */
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from './api-configuration';
import { BaseService } from './base-service';
import { StrictHttpResponse } from './strict-http-response';

@Injectable({ providedIn: 'root' })
export class Service extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `irrigationWaterStatistics()` */
  static readonly IrrigationWaterStatisticsPath = '/api/IMM/water/statistics';

  /**
   * 灌区水量统计
   * @param returnResponse 为 true 时返回 StrictHttpResponse<any>，为 false 时返回 body
   */
  irrigationWaterStatistics(
    params: any,
    returnResponse = false,
    context?: HttpContext
  ): Observable<any> {
    const response$ = this.http.request<any>(
      'get', // 或者你的接口定义的 method
      `${this.rootUrl}${Service.IrrigationWaterStatisticsPath}`,
      { params, context, observe: 'response' }
    );

    return response$.pipe(map((r) => (returnResponse ? r : r.body)));
  }
}
