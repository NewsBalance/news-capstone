/* 실제 구현 시 fetch → backend API */

import { BiasPeriod, WatchTab, WatchPoint } from '../pages/MyPage.types';
import { API_BASE } from './config';

export async function fetchUser() {
  const res = await fetch(`${API_BASE}/user`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.message) || 'Failed to fetch user';
    throw new Error(msg);
  }
  return data;
}

export async function fetchBias(period: BiasPeriod) {
  const res = await fetch(`${API_BASE}/bias?period=${period}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.message) || 'Failed to fetch bias data';
    throw new Error(msg);
  }
  return data;
}

export async function fetchWatchTime(tab: WatchTab): Promise<WatchPoint[]> {
  const res = await fetch(`${API_BASE}/watchTime?tab=${tab}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.message) || 'Failed to fetch watch data';
    throw new Error(msg);
  }
  return data;
}
