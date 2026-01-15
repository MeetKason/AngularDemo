import * as L from 'leaflet';

declare module 'leaflet' {
  // 扩展 L 命名空间
  export function velocityLayer(options: any): any;

  // 如果你需要更精确的类型，可以定义接口
  interface VelocityLayerOptions {
    displayValues?: boolean;
    displayOptions?: {
      velocityType?: string;
      displayPosition?: string;
      displayEmptyString?: string;
      [key: string]: any;
    };
    data: any; // 这里的 data 是风场 JSON 数据
    minVelocity?: number;
    maxVelocity?: number;
    velocityScale?: number;
    opacity?: number;
    [key: string]: any;
  }
}

declare module '*.png' {
  const value: string;
  export default value;
}
declare module '*.jpg';
declare module '*.svg';
