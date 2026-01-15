import { Component, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import shanxi from './shanxi.json';
import taiyuan from './taiyuan.json';
import tmp from './tmp.json';
import pre from './pre.json';
import radarData from './radar.json';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormsModule } from '@angular/forms';
import * as turf from '@turf/turf';
import { WeatherStateService } from '../../unit/WeatherStateService';
import 'leaflet-velocity';
import wind from './wind-global.json';
import { CommonModule } from '@angular/common';
const cloudImgUrl = 'assets/image/cloud-image.png';

// 天地图服务密钥 (请替换为你申请的 Key)
const TDT_KEY = 'e8cb3bd6051012ac5c1d1a6fe619dda6';
// 常用的天地图瓦片地址
const TDT_URLS = {
  vec_w: `https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`, // 矢量底图
  cva_w: `https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`, // 矢量注记
  img_w: `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`, // 影像底图
  cia_w: `https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`, // 影像注记
};
let tmpGeoJson: any = null; //温度图层
let preGeoJson: any = null; //降水图层
let sitesGeoJson: any = null; //站点名称图层
let velocityLayer: any = null; //风流场图层
let cloudLayer: any = null; //云图图层
let radarLayer: any = null; //雷达图层
@Component({
  selector: 'app-leaflet-component',
  standalone: true, // 确保这是 true
  imports: [NzSwitchModule, FormsModule, CommonModule],
  templateUrl: './leaflet-component.html',
  styleUrl: './leaflet-component.css',
})
export class LeafletComponent implements OnDestroy {
  map!: L.Map;
  switchValue = false;
  switchValueMarker = false;
  switchValueCircle = false;
  switchValueColorSpotMap = false;
  colorSpotMap: any = null;
  circle: any = null;
  marker: any = null;
  geoJson: any = null;
  grid: any = null;
  activeLayers: any[] = [];
  // mapContainer 是你地图 div 的引用
  public currentTheme = 'dark-theme-map';
  private currentPopup: L.Popup | null = null;
  private themeObserver: MutationObserver | null = null;
  private topPane: any = null;
  private currentMainLayer: string | null = null; // 当前激活的主图层（温度、降水、雷达、云图）

  toggleTheme(theme: string) {
    this.currentTheme = theme;
  }
  constructor(private stateService: WeatherStateService) {}

  // 获取当前主题的文字颜色
  private getTextColor(): string {
    const computedStyle = getComputedStyle(document.body);
    return computedStyle.getPropertyValue('--popup-title-color').trim() || '#fff';
  }

  // 更新 popup 的主题颜色
  private updatePopupTheme() {
    if (!this.currentPopup || !this.map) return;
    const textColor = this.getTextColor();
    const content = this.currentPopup.getContent();
    if (typeof content === 'string') {
      // 使用正则表达式更新 popup-title 的 color 样式
      const updatedContent = content.replace(
        /(<div[^>]*class="popup-title"[^>]*style="[^"]*)(color:\s*[^;]+;?)([^"]*")/,
        `$1color: ${textColor};$3`
      );
      // 如果内容有变化，更新 popup
      if (updatedContent !== content) {
        this.currentPopup.setContent(updatedContent);
      }
    }
  }

  ngOnInit() {
    // 订阅状态流，只要 Sidebar 那边一变，这里立刻执行
    this.stateService.weatherParams$.subscribe((params) => {
      // 过滤出所有激活的参数
      this.activeLayers = params;
      console.log('接收到新状态，当前激活图层：', params);
      params.forEach((layer) => {
        switch (layer.name) {
          case '色斑图':
            if (
              this.stateService.selectedLayer === '温度' ||
              this.stateService.selectedLayer === '降水'
            ) {
              this.onSwitchChangeColorSpotMap(layer.active);
            }
            break;
          case '风流场':
            this.renderWindFlow(layer.active);
            break;
          case '实观测值':
            if (this.stateService.selectedLayer === '温度') {
              this.renderTmpGeoJsonMarkers(layer.active);
            } else if (this.stateService.selectedLayer === '降水') {
              this.renderPreGeoJsonMarkers(layer.active);
            }
            break;
          case '站点名称':
            if (
              this.stateService.selectedLayer === '温度' ||
              this.stateService.selectedLayer === '降水'
            ) {
              this.onSwitchChangeSites(layer.active);
            }
            break;
        }
      });
      // 在这里执行具体的逻辑，比如 leaflet 的 addLayer 或 removeLayer
    });
    this.stateService.weatherConditions$.subscribe((conditions) => {
      if (conditions && conditions.length > 0) {
        const selectedLayer = conditions[0].name;

        // 如果切换了主图层，先删除之前的主图层
        if (this.currentMainLayer && this.currentMainLayer !== selectedLayer) {
          this.removeMainLayer(this.currentMainLayer);
        }
        // 渲染新的主图层
        if (selectedLayer === '温度') {
          this.currentMainLayer = '温度';
          //this.renderTmpGeoJsonMarkers(true);
        } else if (selectedLayer === '降水') {
          this.currentMainLayer = '降水';
          //this.renderPreGeoJsonMarkers(true);
        } else if (selectedLayer === '雷达') {
          this.currentMainLayer = '雷达';
          this.renderRadarLayer();
        } else if (selectedLayer === '云图') {
          this.currentMainLayer = '云图';
          this.renderCloudGeoJsonMarkers();
        }
      } else {
        // 如果没有选中任何图层，删除当前主图层
        if (this.currentMainLayer) {
          this.removeMainLayer(this.currentMainLayer);
          this.currentMainLayer = null;
        }
      }
    });

    this.stateService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
      console.log('接收到新主题，当前主题：', theme);
    });

    // 监听雷达播放索引变化
    this.stateService.radarIndex$.subscribe((index) => {
      if (this.currentMainLayer === '雷达' && this.map) {
        this.updateRadarLayer(index);
      }
    });

    // 监听 body 的 class 变化（主题切换）
    this.setupThemeObserver();
  }

  ngOnDestroy() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }

    // 清理所有主图层
    if (this.currentMainLayer) {
      this.removeMainLayer(this.currentMainLayer);
    }

    // 清理其他图层
    if (sitesGeoJson && this.map.hasLayer(sitesGeoJson)) {
      this.map.removeLayer(sitesGeoJson);
    }
    if (velocityLayer && this.map.hasLayer(velocityLayer)) {
      this.map.removeLayer(velocityLayer);
    }
    if (this.colorSpotMap && this.map.hasLayer(this.colorSpotMap)) {
      this.map.removeLayer(this.colorSpotMap);
    }
  }

  // 设置主题监听器
  private setupThemeObserver() {
    this.themeObserver = new MutationObserver(() => {
      this.updatePopupTheme();
    });
    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
  // 初始化地图
  ngAfterViewInit() {
    let boundaries: any = null;
    // 1. 创建图层 (注意天地图通常需要 {s} 子域名轮询，默认是 0-7)
    const baseLayer = L.tileLayer(TDT_URLS.vec_w, {
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maxZoom: 18,
      attribution: 'Tianditu',
    });

    const labelLayer = L.tileLayer(TDT_URLS.cva_w, {
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maxZoom: 18,
    });

    this.map = L.map('map')
      .setView([37.853403, 112.540983], 9)
      .addLayer(baseLayer)
      .addLayer(labelLayer);
    this.topPane = this.map.createPane('myTopPane');

    // 创建雷达图层专用的pane，不受dark-theme-map的filter影响
    const radarPane = this.map.createPane('radarPane');
    if (radarPane) {
      radarPane.style.zIndex = '500';
      radarPane.style.filter = 'none'; // 重置filter，不受父容器影响
    }

    // 强制重新计算尺寸
    setTimeout(() => {
      this.map.invalidateSize();
      this.onSwitchChangeBoundary(true);
    }, 100);

    // 2. 设置该窗格的 z-index（600是Marker的层级，设为700确保在最上方）
    if (this.topPane) {
      this.topPane.style.zIndex = '600';
      // 如果不需要该图层拦截鼠标事件（让点击能穿透到下面），可以取消下面行的注释
      // topPane.style.pointerEvents = 'none';
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.stateService.updatePopup(true);
      // 模拟获取该点的天气数据（实际可根据坐标查询你的 wind 或 geoData）
      const temp = (Math.random() * 5 + 28).toFixed(1);
      const windSpeed = (Math.random() * 10).toFixed(1);

      // 获取当前主题的文字颜色
      const textColor = this.getTextColor();

      const content = `
      <div style="width: fit-content; min-width: fit-content;">
          <div class="popup-title" style="border-radius: 12px 12px 0 0;margin: 0 0 5px; border-bottom: 1px solid #eee; height: 32px; line-height: 32px; text-align: center; font-size: 16px; font-weight: bold; background:#43AEFE; color: ${textColor}; padding: 0 20px 0 10px; white-space: nowrap; display: inline-block; width: fit-content;">江西省上饶市横峰县上万高速公路</div>
          <div class="custom-popup">
          <p style="margin: 5px 0;">当前温度：<b>${temp} ℃</b></p>
          <p style="margin: 5px 0;">当前风速：<b>${windSpeed} m/s</b></p>
          <button onclick="console.log('查看详情')" style="cursor:pointer;">详细数据 ></button>
        </div>
      </div>

      `;

      this.currentPopup = L.popup({
        className: 'my-custom-popup', // 可在 CSS 中深度定制外观
        maxWidth: 1000,
      })
        .setLatLng(e.latlng)
        .setContent(content)
        .openOn(this.map);
    });

    this.map.on('popupclose', (e: L.PopupEvent) => {
      console.log('气泡已关闭');
      this.stateService.updatePopup(false);
      this.currentPopup = null;
    });

    // // 随机生成30个点数据
    // const randomPoint: any = turf.randomPoint(30, {
    //   bbox: [113.3206819, 38.5175585, 111.3518551, 37.3626125],
    // });
    // console.log(randomPoint);
    // // 给30个点数据添加value属性，value为0-100之间的随机数，保留2位小数
    // turf.featureEach(randomPoint, function (currentFeature, featureIndex) {
    //   currentFeature.properties = { value: (Math.random() * 100).toFixed(3) };
    // });
    // var interpolate_options: any = {
    //   gridType: 'points',
    //   property: 'value',
    //   units: 'degrees',
    //   weight: 10,
    // };
    // // 插值 反距离加权（IDW）方法
    // this.grid = turf.interpolate(randomPoint, 0.05, interpolate_options);
    // // 适当降低插值结果的精度便于显示， 保留3位小数，方便后续分级
    // this.grid.features.map((i: any) => (i.properties.value = i.properties.value.toFixed(3)));
    // var isobands_options = {
    //   zProperty: 'value',
    //   commonProperties: {
    //     'fill-opacity': 0.4,
    //   },
    //   breaksProperties: [
    //     { fill: 'rgb(234,234,234)' },
    //     { fill: 'rgb(140,246,130)' },
    //     { fill: 'rgb(0,191,27)' },
    //     { fill: 'rgb(62,185,255)' },
    //     { fill: 'rgb(25,0,235)' },
    //     { fill: 'rgb(255,0,255)' },
    //     { fill: 'rgb(140,0,65)' },
    //   ],
    // };
    // let levelV = [1, 10, 20, 30, 50, 70, 100];
    // // 等值线带 接收一个正方形或矩形网格的由具有 z 值的点要素组成的FeatureCollection以及一个值区间数组，并生成填充的等高线等值带。
    // let isobands: any = turf.isobands(this.grid, levelV, isobands_options);
    // //按照面积对图层进行排序，规避turf的一个bug
    // isobands.features.sort(this.sortArea);
    // //后面使用要求输入的参数为Feature<Polygon> ，而turf.isobands的是 MultiPolygon，需要先 flatten() 处理一下,同时去掉图形为空的记录
    // boundaries = turf.flatten(taiyuan as any); //行政边界
    // console.log(boundaries);
    // isobands = turf.flatten(isobands); //等值面边界
    // console.log(isobands);
    // // //console.log('isobands:'+JSON.stringify(isobands));

    // // 主逻辑
    // let clockwiseNum = 0; // 顺时针图形数量
    // let notClockwiseNum = 0; // 逆时针图形数量
    // let notClockwisePartNum = 0; // 逆时针图形部件数量
    // let notClockwiseIndex = -1; // 逆时针图形序号（初始化为-1，避免0值误判）
    // let iterationCount = 0; // 迭代计数器（防卡死）

    // // 前置校验：空数据直接返回
    // // if (!isobands?.features || !Array.isArray(isobands.features)) {
    // //   console.warn('isobands数据异常:', isobands);
    // // } else {
    // //   // 优化：缓存features长度，减少重复读取
    // //   const featuresLen = isobands.features.length;

    // //   for (let index = 0; index < featuresLen; index++) {
    // //     // 防卡死：超出最大迭代次数强制终止
    // //     iterationCount++;
    // //     if (iterationCount > this.CONFIG.MAX_ITERATION) {
    // //       console.error('迭代次数超出限制，强制终止');
    // //       break;
    // //     }

    // //     const feature = isobands.features[index];
    // //     // 数据校验：跳过无效feature
    // //     if (!feature?.geometry?.coordinates || !Array.isArray(feature.geometry.coordinates)) {
    // //       continue;
    // //     }

    // //     let partNum = 0; // 记录图形部件数
    // //     let haveNotClockwise = false; // 记录图形是否带逆时针部件
    // //     const coordsList = feature.geometry.coordinates;

    // //     // 遍历坐标部件
    // //     for (let i = 0; i < coordsList.length; i++) {
    // //       iterationCount++;
    // //       if (iterationCount > this.CONFIG.MAX_ITERATION) break;

    // //       const coords = coordsList[i];
    // //       // 跳过空坐标
    // //       if (this.CONFIG.CLOCKWISE_CHECK_SKIP_EMPTY && (!coords || coords.length === 0)) {
    // //         continue;
    // //       }

    // //       const booleanClockwise = this.safeBooleanClockwise(coords);
    // //       if (booleanClockwise === true) {
    // //         clockwiseNum++;
    // //       } else if (booleanClockwise === false) {
    // //         notClockwiseNum++;
    // //         haveNotClockwise = true;
    // //       }
    // //       partNum++;
    // //       console.log(`a${partNum}:${booleanClockwise}`);
    // //     }

    // //     // 有逆时针图形时记录信息（优化：只更新最新的逆时针图形）
    // //     if (haveNotClockwise) {
    // //       notClockwisePartNum = partNum;
    // //       notClockwiseIndex = index;
    // //     }

    // //     // 补救逻辑：只有一个逆时针部件的镂空图形补全外环
    // //     if (partNum === 1 && haveNotClockwise) {
    // //       // 优化：提前生成网格边界，失败则跳过
    // //       const gridBoxPolygon = this.generateGridBoxPolygon(this.grid);
    // //       if (!gridBoxPolygon) {
    // //         console.warn('网格边界生成失败，跳过补全逻辑');
    // //         continue;
    // //       }

    // //       const coords: any[] = [gridBoxPolygon];
    // //       // 优化：使用for循环替代forEach，便于中断
    // //       for (let i = 0; i < featuresLen; i++) {
    // //         iterationCount++;
    // //         if (iterationCount > this.CONFIG.MAX_ITERATION) break;

    // //         if (i === notClockwiseIndex) continue;

    // //         const subFeature = isobands.features[i];
    // //         if (!subFeature?.geometry?.coordinates) continue;

    // //         for (let j = 0; j < subFeature.geometry.coordinates.length; j++) {
    // //           iterationCount++;
    // //           if (iterationCount > this.CONFIG.MAX_ITERATION) break;

    // //           const item = subFeature.geometry.coordinates[j];
    // //           const itemClockwise = this.safeBooleanClockwise(item);
    // //           // 优化：避免重复reverse，缓存结果
    // //           coords.push(itemClockwise ? [...item].reverse() : item);
    // //         }
    // //       }

    // //       // 安全赋值：校验coords有效性
    // //       if (Array.isArray(coords) && coords.length > 0) {
    // //         isobands.features[notClockwiseIndex].geometry.coordinates = coords;
    // //       }

    // //       // 单图形时修复属性
    // //       if (featuresLen === 1) {
    // //         try {
    // //           const maxAttribute = this.getMaxAttribute(
    // //             levelV,
    // //             this.grid,
    // //             isobands_options.breaksProperties
    // //           );
    // //           const [value, fill] = maxAttribute || ['', ''];
    // //           if (value && fill) {
    // //             const targetFeature = isobands.features[notClockwiseIndex];
    // //             targetFeature.properties = {
    // //               ...targetFeature.properties,
    // //               value,
    // //               fill,
    // //             };
    // //           }
    // //         } catch (e) {
    // //           console.warn('补全属性失败:', e);
    // //         }
    // //       }
    // //     }

    // //     // 防卡死：每轮循环检查一次
    // //     if (iterationCount > this.CONFIG.MAX_ITERATION) break;
    // //   }
    // // }

    // //根据行政边界裁剪图形
    // let features = []; //裁剪后的结果集
    // isobands.features.forEach(function (feature1: any) {
    //   boundaries.features.forEach(function (feature2: any) {
    //     let intersection = null;
    //     try {
    //       intersection = turf.intersect(feature1, feature2);
    //     } catch (e) {
    //       try {
    //         //色斑图绘制之后，可能会生成一些非法 Polygon ，例如 在 hole 里存在一些形状（听不懂？去查一下 GeoJSON 的规范），
    //         //我遇到的一个意外情况大概是这样，这种 Polygon 在做 intersect() 操作的时候会报错，所以在代码中做了个容错操作。
    //         //解决的方法通常就是做一次 turf.buffer() 操作，这样可以把一些小的碎片 Polygon 清理掉。
    //         feature1 = turf.buffer(feature1, 0);
    //         intersection = turf.intersect(feature1, feature2);
    //       } catch (e) {
    //         intersection = feature1; //实在裁剪不了就不裁剪了,根据业务需求自行决定
    //       }
    //     }
    //     if (intersection != null) {
    //       intersection.properties = feature1.properties;
    //       intersection.id = (Math.random() * 100000).toFixed(0);
    //       features.push(intersection);
    //     }
    //   });
    // });

    // //turf.isobands有点不符合业务预期,只有一个等级时,结果集可能为空,无图形显示,写点程序(找出那一个等级，并添加进结果集)补救下
    // if (features.length == 0) {
    //   let maxAttribute = this.getMaxAttribute(levelV, this.grid, isobands_options.breaksProperties);
    //   let value = maxAttribute[0];
    //   let fill = maxAttribute[1];
    //   if (value != '' && fill != '') {
    //     //获取网格点Box
    //     let gridBox = turf.bbox(this.grid);
    //     //生成网格点范围的面
    //     let gridBoxPolygon = [
    //       [
    //         [gridBox[0], gridBox[1]],
    //         [gridBox[0], gridBox[3]],
    //         [gridBox[2], gridBox[3]],
    //         [gridBox[2], gridBox[1]],
    //         [gridBox[0], gridBox[1]],
    //       ],
    //     ];
    //     //获取网格范围的面与行政边界的交集 Polygon
    //     let intersectPolygon = null;
    //     let gridoxFeature: any = {
    //       type: 'Feature',
    //       properties: { 'fill-opacity': 0.4 },
    //       geometry: { type: 'Polygon', coordinates: gridBoxPolygon },
    //       id: 10,
    //     };
    //     try {
    //       intersectPolygon = turf.intersect(gridoxFeature, boundaries.features[0]);
    //     } catch (e) {
    //       try {
    //         //色斑图绘制之后，可能会生成一些非法 Polygon ，例如 在 hole 里存在一些形状（听不懂？去查一下 GeoJSON 的规范），
    //         //我遇到的一个意外情况大概是这样，这种 Polygon 在做 intersect() 操作的时候会报错，所以在代码中做了个容错操作。
    //         //解决的方法通常就是做一次 turf.buffer() 操作，这样可以把一些小的碎片 Polygon 清理掉。
    //         gridoxFeature = turf.buffer(gridoxFeature, 0);
    //         intersectPolygon = turf.intersect(gridoxFeature, boundaries.features[0]);
    //       } catch (e) {
    //         intersectPolygon = gridoxFeature; //实在裁剪不了就不裁剪了,根据业务需求自行决定
    //       }
    //     }
    //     //结果添加到结果数组
    //     if (intersectPolygon != null) {
    //       features.push({
    //         type: 'Feature',
    //         properties: { 'fill-opacity': 0.4, fill: fill, value: value },
    //         geometry: intersectPolygon.geometry,
    //         id: 0,
    //       });
    //     }
    //   }
    // }
    // //console.log('features:'+JSON.stringify(features));
    // let intersection = turf.featureCollection(features as any);
    // this.map.fitBounds([
    //   [113.3206819, 38.5175585, 10],
    //   [111.3518551, 37.3626125, 10],
    // ]);

    // // 逐个添加过程中的数据
    // L.geoJSON(boundaries, {
    //   style: function (feature) {
    //     return { color: '#4264fb', weight: 1, fillOpacity: 1 };
    //   },
    // }).addTo(this.map);

    // //   //由于leaflet中没有找到图层显示隐藏属性，建一个字符串记录leaflet地图中显示的图层
    // let layerstr = '';
    // var layerM = new Map(); //记录创建的图层列表
    // //原始点图层
    // var geojsonMarkerOptions = {
    //   // geojson点的样式
    //   radius: 3,
    //   fillColor: '#ff7800',
    //   color: '#000',
    //   weight: 1,
    //   opacity: 1,
    //   fillOpacity: 0.4,
    // };
    // var pointsLay = L.geoJSON(randomPoint, {
    //   // 添加geojson数据
    //   pointToLayer: function (feature, latlng) {
    //     return L.circleMarker(latlng, geojsonMarkerOptions);
    //   },
    // }).addTo(this.map);
    // var pointsTxtLay = L.geoJSON(randomPoint, {
    //   // 添加geojson数据
    //   pointToLayer: function (feature, latlng) {
    //     //marker的icon文字
    //     var myIcon = L.divIcon({
    //       html: "<div style='color:#000;margin-top:-5px'>" + feature.properties.value + '</div>',
    //       className: 'my-div-icon',
    //       iconSize: [30, 30],
    //     });
    //     return L.marker(latlng, { icon: myIcon });
    //   },
    // }).addTo(this.map);
    // layerstr = layerstr + 'points,';
    // layerM.set('points', pointsLay);
    // layerM.set('pointsTxt', pointsTxtLay);
    // //网格差值结果
    // var gridLay: any = L.geoJSON(this.grid, {
    //   pointToLayer: function (feature, latlng) {
    //     //marker的icon文字
    //     var myIcon = L.divIcon({
    //       html: "<div style='color:#FF0000'>" + feature.properties.value + '</div>',
    //       className: '',
    //       iconSize: [30, 30],
    //     });
    //     return L.marker(latlng, { icon: myIcon });
    //   },
    // });
    // //显示信息
    // let identifyGrid = (e: any) => {
    //   if (e.value !== null) {
    //     //let v = e.value.toFixed(3);
    //     let v = e.layer.feature.properties.value;
    //     let html = `<span class="popupText">Surface currents velocity ${v} ml</span>`;
    //     let popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(this.map);
    //   }
    // };
    // // Bilinear interpolation
    // gridLay.interpolate = true;
    // gridLay.on('click', identifyGrid);
    // layerM.set('grid', gridLay);
    // //差值结果分级
    // var isobandsLay = L.geoJSON(isobands, {
    //   style: function (feature: any) {
    //     return {
    //       color: '#4264fb',
    //       fillColor: feature.properties.fill,
    //       weight: 0,
    //       fillOpacity: 0.2,
    //     };
    //   },
    // });
    // layerM.set('isobands', isobandsLay);
    // //差值分级后再根据行政区裁剪后的图层
    // var intersectionLay = L.geoJSON(intersection, {
    //   style: function (feature: any) {
    //     return {
    //       color: '#ffffff',
    //       fillColor: feature.properties.fill,
    //       weight: 0,
    //       fillOpacity: 0.2,
    //     };
    //   },
    // }).addTo(this.map);
    // //显示属性信息
    // let identify = (e: any) => {
    //   if (e.value !== null) {
    //     //let v = e.layer.feature.properties.value;//获取的值为区间值
    //     let v = this.getPointValue(e.latlng.lat, e.latlng.lng); //获取的值为IDW差的值
    //     let html = `<span class="popupText">当前流速 ${v} ml</span>`;
    //     let popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(this.map);
    //   }
    // };
    // intersectionLay.on('click', identify);
    // //定位到geojson数据上
    // //map.fitBounds(intersectionLay.getBounds());
    // layerstr = layerstr + 'intersection,';
    // layerM.set('intersection', intersectionLay);

    // // 右上角的导航菜单
    // var layers: any = document.getElementById('menu-ui');
    // var toggleableLayerIds = ['points', 'grid', 'isobands', 'intersection'];

    // for (var i = 0; i < toggleableLayerIds.length; i++) {
    //   var id = toggleableLayerIds[i];
    //   var link = document.createElement('a');
    //   link.href = '#';
    //   link.className = layerstr.indexOf(id + ',') == -1 ? '' : 'active';
    //   link.textContent = id;

    //   link.onclick = (e) => {
    //     console.log('link.onclick', e);
    //     console.log('link', link);
    //     console.log('link.textContent', link.textContent);
    //     let clickedLayer = link.textContent;
    //     e.preventDefault();
    //     e.stopPropagation();

    //     let visibility = layerstr.indexOf(clickedLayer + ',');

    //     if (visibility === -1) {
    //       link.className = 'active';
    //       this.map.addLayer(layerM.get(clickedLayer));
    //       if (clickedLayer == 'points') {
    //         this.map.addLayer(layerM.get(clickedLayer + 'Txt'));
    //       }
    //       layerstr = layerstr + clickedLayer + ',';
    //     } else {
    //       this.map.removeLayer(layerM.get(clickedLayer));
    //       if (clickedLayer == 'points') {
    //         this.map.removeLayer(layerM.get(clickedLayer + 'Txt'));
    //       }
    //       link.className = '';
    //       layerstr = layerstr.replace(clickedLayer + ',', '');
    //     }
    //   };
    //   console.log(link);
    //   layers.appendChild(link);
    // }
  }
  /* 安全检查坐标是否为顺时针
   * @param coords 坐标数组
   * @returns boolean | null（异常返回null）
   */
  safeBooleanClockwise = (coords: any): boolean | null => {
    if (!coords || !Array.isArray(coords) || coords.length < 4) {
      return null; // 无效坐标（至少4个点才能构成闭合图形）
    }
    try {
      return turf.booleanClockwise(coords);
    } catch (e) {
      console.warn('顺时针检测失败:', e);
      return null;
    }
  };

  // 优化：提取常量配置，方便维护
  CONFIG = {
    MAX_ITERATION: 10000, // 最大迭代次数（防止卡死）
    GRID_BOX_PADDING: 0, // 网格边界内边距（可选）
    CLOCKWISE_CHECK_SKIP_EMPTY: true, // 跳过空坐标数组
  };

  /**
   * 生成网格边界多边形
   * @param grid 网格数据
   * @returns 边界坐标数组
   */
  generateGridBoxPolygon = (grid: any) => {
    if (!grid) return null;
    try {
      const gridBox = turf.bbox(grid);
      // 增加边界校验，防止非法坐标
      if (!gridBox || gridBox.length !== 4 || gridBox.some((v: any) => isNaN(v))) {
        return null;
      }
      // 可选：添加内边距，避免超出可视范围
      const [minX, minY, maxX, maxY] = gridBox;
      const padding = this.CONFIG.GRID_BOX_PADDING;
      return [
        [minX + padding, minY + padding],
        [minX + padding, maxY - padding],
        [maxX - padding, maxY - padding],
        [maxX - padding, minY + padding],
        [minX + padding, minY + padding],
      ];
    } catch (e) {
      console.warn('生成网格边界失败:', e);
      return null;
    }
  };

  //根据网格点计算任意经纬度值
  getPointValue(lat: any, lon: any) {
    let latMin = 0.0,
      latMax = 0.0,
      lonMin = 0.0,
      lonMax = 0.0;
    let leftTopV = 0,
      rightTopV = 0,
      rightButtomV = 0,
      leftButtomV = 0;
    //先求任意经纬度点所在的网格坐标
    this.grid.features.forEach(function (item: any) {
      if (item.geometry.coordinates[0] <= lon && item.geometry.coordinates[1] >= lat) {
        //lonMin = item.geometry.coordinates[0];
        //latMax = item.geometry.coordinates[1];
        if (lonMin == 0.0) {
          lonMin = item.geometry.coordinates[0];
          latMax = item.geometry.coordinates[1];
        } else {
          lonMin =
            lon - item.geometry.coordinates[0] < lon - lonMin
              ? item.geometry.coordinates[0]
              : lonMin;
          latMax =
            item.geometry.coordinates[1] - lat < latMax - lat
              ? item.geometry.coordinates[1]
              : latMax;
        }
        //leftTopV = item.properties.value;
      }
      //if(item.geometry.coordinates[0]>=lon && item.geometry.coordinates[1]>=lat){
      //lonMax = item.geometry.coordinates[0];
      //latMax = item.geometry.coordinates[1];
      //lonMax = ((item.geometry.coordinates[0]-lon)<(lonMax-lon)?item.geometry.coordinates[0]:lonMax);
      //latMax = ((item.geometry.coordinates[1]-lat)<(latMax-lat))?item.geometry.coordinates[1]:latMax;
      //rightTopV = item.properties.value;
      //}
      if (item.geometry.coordinates[0] >= lon && item.geometry.coordinates[1] <= lat) {
        //lonMax = item.geometry.coordinates[0];
        //latMin = item.geometry.coordinates[1];
        if (lonMax == 0.0) {
          lonMax = item.geometry.coordinates[0];
          latMin = item.geometry.coordinates[1];
        } else {
          lonMax =
            item.geometry.coordinates[0] - lon < lonMax - lon
              ? item.geometry.coordinates[0]
              : lonMax;
          latMin =
            lat - item.geometry.coordinates[1] < lat - latMin
              ? item.geometry.coordinates[1]
              : latMin;
        }
        //rightButtomV = item.properties.value;
      }
      //if(item.geometry.coordinates[0]<=lon && item.geometry.coordinates[1]<=lat){
      //lonMin = item.geometry.coordinates[0];
      //latMin = item.geometry.coordinates[1];
      //lonMin = ((lon-item.geometry.coordinates[0])<(lon-lonMin)?item.geometry.coordinates[0]:lonMin);
      //latMin = ((lat-item.geometry.coordinates[1])<(lat-latMin))?item.geometry.coordinates[1]:latMin;
      //leftButtomV = item.properties.value;
      //}
    });
    //再求任意经纬度点所在的网格上点的值
    this.grid.features.forEach(function (item: any) {
      if (item.geometry.coordinates[0] == lonMin && item.geometry.coordinates[1] == latMax) {
        leftTopV = item.properties.value;
      }
      if (item.geometry.coordinates[0] == lonMax && item.geometry.coordinates[1] == latMax) {
        rightTopV = item.properties.value;
      }
      if (item.geometry.coordinates[0] == lonMax && item.geometry.coordinates[1] == latMin) {
        rightButtomV = item.properties.value;
      }
      if (item.geometry.coordinates[0] == lonMin && item.geometry.coordinates[1] == latMin) {
        leftButtomV = item.properties.value;
      }
    });
    //开始通过IDW算法计算网格上任意点的值
    let idwdatas = [
      { x: lonMin, y: latMax, v: leftTopV },
      { x: lonMax, y: latMax, v: rightTopV },
      { x: lonMax, y: latMin, v: rightButtomV },
      { x: lonMin, y: latMin, v: leftButtomV },
    ];
    var idwresult = [{ x: lon, y: lat, v: 0 }];
    this.idwcomputer(idwdatas, idwresult);
    //console.info(idwresult);
    //结束通过IDW算法计算网格上任意点的值
    let rValue = idwresult[0].v.toFixed(2); //获取任意经纬度点的值
    return rValue;
  }
  //idw算法
  idwcomputer(datas: any, result: any) {
    if (datas.lenght < 3) return result;
    var m0 = datas.length;
    var m1 = result.length;
    //距离列表
    var r = [];
    for (var i = 0; i < m1; i++) {
      for (var j = 0; j < m0; j++) {
        var tmpDis = Math.sqrt(
          Math.pow(result[i].x - datas[j].x, 2) + Math.pow(result[i].y - datas[j].y, 2)
        );
        r.push(tmpDis);
      }
    }

    //插值函数
    for (var i = 0; i < m1; i++) {
      //查找重复
      var ifFind = false;
      for (var j = m0 * i; j < m0 * i + m0; j++) {
        if (Math.abs(r[j]) < 0.0001) {
          result[i].v = datas[j - m0 * i].v;
          ifFind = true;
          break;
        }
      }

      if (ifFind) continue;

      var numerator = 0;
      var denominator = 0;

      for (var j = m0 * i; j < m0 * i + m0; j++) {
        numerator += datas[j - m0 * i].v / (r[j] * r[j]);
        denominator += 1 / (r[j] * r[j]);
      }
      result[i].v = numerator / denominator;
    }
    return result;
  }
  //取网格点中等级包含最多的点的等级属性
  getMaxAttribute(inLevelV: any, inGrid: any, inBreaksProperties: any) {
    //定义变量
    let levelArray: any = [];
    let levelLength = inLevelV.length;
    inLevelV.forEach(function (item: any, index: any) {
      if (index < levelLength - 2) levelArray.push(0);
    });
    //统计每个等级中网格点数量
    inGrid.features.map((i: any) => {
      inLevelV.forEach((item: any, index: any) => {
        if (index < levelLength - 3) {
          if (i.properties.value >= inLevelV[index] && i.properties.value < inLevelV[index + 1])
            levelArray[index]++;
        }
        if (index == levelLength - 2) {
          if (i.properties.value >= inLevelV[index]) levelArray[index]++;
        }
      });
    });
    //取等级中网格点最多的值
    let maxIndex = -1;
    let maxV = 0;
    levelArray.forEach((item: any, index: any) => {
      if (maxV < item) {
        maxV = item;
        maxIndex = index;
      }
    });
    let value = '';
    let fill = '';
    if (maxIndex != -1) {
      value = inLevelV[maxIndex] + '-' + inLevelV[maxIndex + 1];
      fill = inBreaksProperties[maxIndex].fill;
    }
    return [value, fill];
  }

  sortArea(a: any, b: any) {
    return turf.area(b) - turf.area(a);
  }

  // 行政边界
  onSwitchChangeBoundary(event: boolean) {
    if (event) {
      this.geoJson = L.geoJSON(taiyuan as any, {
        pane: 'myTopPane',
        style: {
          color: '#43AEFE', // 线条颜色（描边）
          weight: 3, // 线条宽度
          opacity: 1, // 线条透明度
          fillColor: '#43AEFE', // 填充颜色
          fillOpacity: 0.2, // 填充透明度
        },
      }).addTo(this.map);
      // 强制将该图层移到其所属窗格（Pane）的最顶层
      this.geoJson.bringToFront();
    } else {
      this.map.removeLayer(this.geoJson);
    }
  }
  // 点标记
  onSwitchChangeMarker(event: boolean) {
    console.log(event);
    if (event) {
      this.marker = L.marker([37.983403, 112.350983]).addTo(this.map);
    } else {
      this.map.removeLayer(this.marker);
    }
  }

  // 色斑图
  onSwitchChangeColorSpotMap(event: boolean) {
    console.log(event);
    if (event) {
      this.colorSpotMap = L.geoJSON(taiyuan as any, { style: this.style.bind(this) }).addTo(
        this.map
      );
    } else {
      this.map.removeLayer(this.colorSpotMap);
    }
  }

  getColor(d: number) {
    return d == 140121
      ? '#800026'
      : d == 140122
      ? '#000000'
      : d == 140123
      ? '#E31A1C'
      : d == 140181
      ? '#FC4E2A'
      : d == 140103
      ? '#FD8D3C'
      : d == 140104
      ? '#FEB24C'
      : d == 140105
      ? '#FED976'
      : d == 140106
      ? '#FFEDA0'
      : d == 140107
      ? '#FFFF00'
      : d == 140108
      ? '#00FF00'
      : d == 140100
      ? '#00FFFF'
      : d == 140110
      ? '#0000FF'
      : '#FFEDA0';
  }

  style(feature: any) {
    return {
      fillColor: this.getColor(feature.properties.adcode),
      weight: 0,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
    };
  }

  // 删除主图层（互斥切换时使用）
  private removeMainLayer(layerName: string) {
    if (!this.map) return;

    try {
      switch (layerName) {
        case '温度':
          if (tmpGeoJson) {
            if (this.map.hasLayer(tmpGeoJson)) {
              this.map.removeLayer(tmpGeoJson);
            }
            tmpGeoJson = null;
          }
          break;
        case '降水':
          if (preGeoJson) {
            if (this.map.hasLayer(preGeoJson)) {
              this.map.removeLayer(preGeoJson);
            }
            preGeoJson = null;
          }
          break;
        case '雷达':
          if (radarLayer) {
            if (this.map.hasLayer(radarLayer)) {
              this.map.removeLayer(radarLayer);
            }
            radarLayer = null;
          }
          break;
        case '云图':
          if (cloudLayer) {
            if (this.map.hasLayer(cloudLayer)) {
              this.map.removeLayer(cloudLayer);
            }
            cloudLayer = null;
          }
          break;
      }
    } catch (error) {
      console.error(`删除图层 ${layerName} 时出错:`, error);
    }
  }

  // 温度观测值
  renderTmpGeoJsonMarkers(event: boolean) {
    // 先删除之前的图层（如果存在）
    if (tmpGeoJson && this.map.hasLayer(tmpGeoJson)) {
      this.map.removeLayer(tmpGeoJson);
      tmpGeoJson = null;
    }

    if (event) {
      tmpGeoJson = L.geoJSON(tmp as any, {
        // 将 Point 转为带文字的图标
        pointToLayer: (feature, latlng) => {
          const tempValue = feature.properties.temp || 0;

          // 创建自定义 HTML 图标
          const tempIcon = L.divIcon({
            className: 'temp-marker-container',
            // 关键：在这里控制数字的颜色和样式
            html: `<div class="temp-value" style="color: ${tempValue > 33.5 ? '#ff4d4f' : '#333'}">
                   ${tempValue}
                 </div>`,
            iconSize: [40, 20],
            iconAnchor: [20, 10],
          });

          return L.marker(latlng, { icon: tempIcon });
        },
      }).addTo(this.map);
    }
  }

  // 降水观测值
  renderPreGeoJsonMarkers(event: boolean) {
    // 先删除之前的图层（如果存在）
    if (preGeoJson && this.map.hasLayer(preGeoJson)) {
      this.map.removeLayer(preGeoJson);
      preGeoJson = null;
    }

    if (event) {
      preGeoJson = L.geoJSON(pre as any, {
        pointToLayer: (feature, latlng) => {
          const tempValue = feature.properties.temp || 0;

          // 创建自定义 HTML 图标
          const tempIcon = L.divIcon({
            className: 'temp-marker-container',
            // 关键：在这里控制数字的颜色和样式
            html: `<div class="temp-value" style="color: ${tempValue > 33.5 ? '#ff4d4f' : '#333'}">
                     ${tempValue}
                   </div>`,
            iconSize: [40, 20],
            iconAnchor: [20, 10],
          });

          return L.marker(latlng, { icon: tempIcon });
        },
      }).addTo(this.map);
    }
  }

  // 渲染风流场
  renderWindFlow(event: boolean) {
    // 提取自 HTML 的颜色阶梯（已按速度从 0 到 18 重新排序）
    const windColorScale = [
      'rgb(0, 77, 255)', // 0
      'rgb(0, 117, 255)', // 1
      'rgb(0, 166, 255)', // 2
      'rgb(0, 207, 255)', // 3
      'rgb(0, 255, 181)', // 4
      'rgb(132, 255, 0)', // 5.5
      'rgb(214, 255, 0)', // 7
      'rgb(255, 207, 0)', // 8.5
      'rgb(255, 174, 0)', // 10
      'rgb(255, 154, 0)', // 12
      'rgb(255, 130, 0)', // 14
      'rgb(255, 81, 0)', // 16
      'rgb(255, 0, 0)', // 18
    ];
    if (event) {
      velocityLayer = L.velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: 'GBR Wind',
          position: 'bottomleft',
          emptyString: 'No wind data',
          showCardinal: true,
        },
        data: wind,
        // 以下为控制参数，后面为默认值
        //minVelocity: 0, // 粒子最小速度（ m/s ）
        //maxVelocity: 10, // 粒子最大速度（ m/s ）
        velocityScale: 0.01, // 风速的比例 ( 粒子的小尾巴长度 )
        //particleAge: 90, // 粒子在再生之前绘制的最大帧数
        lineWidth: 2, // 绘制粒子的线宽
        //particleMultiplier: 1 / 300, // 粒子计数标量（ 粒子密度 ）
        // frameRate: 15, // 每秒所需的帧数
        colorScale: windColorScale,
      });

      velocityLayer.addTo(this.map);
    } else {
      this.map.removeLayer(velocityLayer);
    }
  }

  // 站点名称
  onSwitchChangeSites(event: boolean) {
    if (event) {
      sitesGeoJson = L.geoJSON(pre as any, {
        pointToLayer: (feature, latlng) => {
          const tempValue = feature.properties.name || '';

          // 创建自定义 HTML 图标
          const tempIcon = L.divIcon({
            className: 'temp-marker-container',
            // 关键：在这里控制数字的颜色和样式
            html: `<div class="temp-value" style="color: ${tempValue > 33.5 ? '#ff4d4f' : '#333'}">
                     ${tempValue}
                   </div>`,
            iconSize: [40, 20],
            iconAnchor: [20, 10],
            popupAnchor: [0, -10],
          });

          return L.marker(latlng, { icon: tempIcon });
        },
      }).addTo(this.map);
    } else {
      this.map.removeLayer(sitesGeoJson);
    }
  }

  // 雷达图层
  renderRadarLayer() {
    // 先删除之前的图层（如果存在）
    if (radarLayer && this.map.hasLayer(radarLayer)) {
      this.map.removeLayer(radarLayer);
      radarLayer = null;
    }

    // 显示第一张雷达图
    if (radarData && radarData.length > 0) {
      this.updateRadarLayer(0);
    }
  }

  // 更新雷达图层（根据索引）
  private updateRadarLayer(index: number) {
    if (!radarData || !Array.isArray(radarData) || radarData.length === 0 || !this.map) {
      return;
    }

    // 确保索引在有效范围内
    const validIndex = Math.max(0, Math.min(index, radarData.length - 1));
    const radarItem = radarData[validIndex];

    if (!radarItem || !radarItem.url) {
      console.warn('雷达数据无效:', radarItem);
      return;
    }

    try {
      // 先删除之前的图层
      if (radarLayer) {
        if (this.map.hasLayer(radarLayer)) {
          this.map.removeLayer(radarLayer);
        }
        radarLayer = null;
      }

      // 定义雷达图片的经纬度范围（根据实际雷达覆盖范围调整）
      const imageBounds: L.LatLngBoundsExpression = [
        [54.75, 135.91], // 左下角 (纬度, 经度)
        [11, 73.31], // 右上角 (纬度, 经度)
      ];

      // 创建图片图层，使用radarPane避免受dark-theme-map的filter影响
      radarLayer = L.imageOverlay(radarItem.url, imageBounds, {
        opacity: 0.8, // 设置透明度
        interactive: true,
        zIndex: 500,
        pane: 'radarPane', // 使用专门的pane，不受filter影响
      });

      // 添加到地图
      radarLayer.addTo(this.map);

      console.log(`更新雷达图层: 索引 ${validIndex}, URL: ${radarItem.url}`);
    } catch (error) {
      console.error('更新雷达图层失败:', error);
    }
  }

  // 云图
  renderCloudGeoJsonMarkers() {
    // 先删除之前的图层（如果存在）
    if (cloudLayer && this.map.hasLayer(cloudLayer)) {
      this.map.removeLayer(cloudLayer);
      cloudLayer = null;
    }

    // 1. 定义图片的经纬度范围 [西南角, 东北角]
    // 请务必确保这个范围与你的云图实际覆盖的地理位置一致
    let imageBounds: any = [
      [54.75, 135.91], // 左下角 (纬度, 经度)
      [11, 73.31], // 右上角 (纬度, 经度)
    ];

    // 2. 创建图片图层
    cloudLayer = L.imageOverlay(cloudImgUrl, imageBounds, {
      opacity: 0.7, // 设置透明度，方便看到底图
      interactive: true, // 如果需要点击图片触发事件，设为 true
      zIndex: 500, // 层级设置
      //pane: 'overlayPane', // 默认在覆盖物层
    });

    // 3. 添加到地图
    cloudLayer.addTo(this.map);
  }
}
