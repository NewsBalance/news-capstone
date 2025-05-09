/* 실제 구현 시 fetch → backend API */

import { BiasPeriod, WatchTab, WatchPoint } from '../pages/MyPage.types';

/* mock delay */
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

export async function fetchUser() {
  await delay();
  return {
    id: 'u123',
    nickname: '뉴스헌터',
    avatar: '',
    bio: '팩트를 사랑하는 저널리즘 지망생',
    loginEmail: 'user@example.com',
    recoveryEmail: 'recovery@example.com',
    joinDate: '2024-04-12',
    checks: 78,
    comments: 44,
    likes: 120,
    followers: 35,
    following: 11,
    bookmarks: [
      { id: 1, title: '대선 토론 팩트체크: 주요 주장 검증', url: '/article/1' },
      { id: 2, title: '경제 성장률 분쟁, 실제 수치는?', url: '/article/2' },
    ],
    sessions: [
      { id: 'sess1', device: 'Chrome · Windows', lastActive: '2025-04-28' },
      { id: 'sess2', device: 'Safari · iPhone', lastActive: '2025-04-25' },
    ],
    twoFactorEnabled: false,
    socialAccounts: [
      { provider: 'Google', linked: true },
      { provider: 'Facebook', linked: false },
    ],
  };
}

export async function fetchBias(period: BiasPeriod) {
  await delay();
  const table: Record<BiasPeriod, any[]> = {
    '7': [
      { name: '보수', value: 45 },
      { name: '진보', value: 40 },
      { name: '중도', value: 15 },
    ],
    '30': [
      { name: '보수', value: 40 },
      { name: '진보', value: 35 },
      { name: '중도', value: 25 },
    ],
    '90': [
      { name: '보수', value: 38 },
      { name: '진보', value: 37 },
      { name: '중도', value: 25 },
    ],
    '180': [
      { name: '보수', value: 35 },
      { name: '진보', value: 35 },
      { name: '중도', value: 30 },
    ],
    Y: [
      { name: '보수', value: 33 },
      { name: '진보', value: 37 },
      { name: '중도', value: 30 },
    ],
  };
  return table[period];
}

export async function fetchWatchTime(tab: WatchTab): Promise<WatchPoint[]> {
  await delay();
  if (tab === 'day')
    return [
      { name: 'Mon', min: 32 },
      { name: 'Tue', min: 15 },
      { name: 'Wed', min: 42 },
      { name: 'Thu', min: 28 },
      { name: 'Fri', min: 18 },
      { name: 'Sat', min: 55 },
      { name: 'Sun', min: 21 },
    ];
  if (tab === 'week')
    return [
      { name: 'W-12', min: 210 },
      { name: 'W-11', min: 150 },
      { name: 'W-10', min: 185 },
      { name: 'W-09', min: 240 },
    ];
  return [
    { name: '1월', min: 840 },
    { name: '2월', min: 920 },
    { name: '3월', min: 780 },
    { name: '4월', min: 860 },
  ];
}
