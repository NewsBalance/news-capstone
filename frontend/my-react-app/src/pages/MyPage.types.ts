export type BiasPeriod = '7' | '30' | '90' | '180' | 'Y';
export type WatchTab = 'day' | 'week' | 'month';

export interface WatchPoint {
  name: string;
  min: number;
}
