// src/pages/MyPage.tsx
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import Header from '../components/Header';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import {
  fetchUser,
  fetchBias,
  fetchWatchTime
} from '../api';
import { BiasPeriod, WatchTab, WatchPoint } from './MyPage.types';
import '../styles/MyPage.css';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>" +
  "<circle cx='40' cy='24' r='20' fill='%23ccc'/>" +
  "<path d='M10,78 C10,58 70,58 70,78 Z' fill='%23ccc'/>" +
  "</svg>";
const PIE_COLORS = ['#6699FF', '#C8BFFF', '#FF6B6B'];
const BAR_COLOR = '#5c3c91';
const LINE_COLOR = '#5c3c91';

interface Bookmark     { id: number; title: string; url: string }
interface Session      { id: string; device: string; lastActive: string }
interface SocialAccount{ provider: string; connected: boolean }
interface Notification { id: number; message: string; date: string }
interface TimelineItem { id: number; type: 'check'|'comment'|'like'|'bookmark'; title: string; date: string }

async function fetchActivity(): Promise<TimelineItem[]> {
  const res = await fetch('/api/activity');
  if (!res.ok) throw new Error('활동 히스토리를 불러오지 못했습니다.');
  return res.json();
}

interface User {
  id: string;
  nickname: string;
  bio: string;
  avatar?: string;
  loginEmail: string;
  twoFactorEnabled: boolean;
  checks: number;
  comments: number;
  likes: number;
  followers: number;
  following: number;
  bookmarks: Bookmark[];
  sessions?: Session[];
  socialAccounts?: SocialAccount[];
  notifications?: Notification[];
}

export default function MyPage() {
  // 기본 상태
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'analytics'|'security'|'activity'>('analytics');

  // 프로필 편집
  const [editingProfile, setEditingProfile] = useState(false);
  const [formNickname, setFormNickname] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);

  // 이메일 변경 모달
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [formNewEmail, setFormNewEmail] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  // 2FA
  const [twoFA, setTwoFA] = useState(false);

  // 편향 데이터
  const [period, setPeriod] = useState<BiasPeriod>('30');
  const [biasData, setBiasData] = useState<any[]>([]);
  const [biasLoading, setBiasLoading] = useState(false);
  const [biasError, setBiasError] = useState<string | null>(null);

  // 시청 시간
  const [watchTab, setWatchTab] = useState<WatchTab>('day');
  const [watchData, setWatchData] = useState<WatchPoint[]>([]);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchError, setWatchError] = useState<string | null>(null);

  // 활동량 (주간/월간)
  const [activityPeriod, setActivityPeriod] = useState<'week'|'month'>('week');
  const [activityData, setActivityData] = useState<{ name: string; count: number }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // 업적 & 댓글 통계
  const [achievements, setAchievements] = useState<{ id: number; name: string; icon: string }[]>([]);
  const [commentStats, setCommentStats] = useState<{ likesReceived: number; repliesReceived: number } | null>(null);

  // 세션/알림/북마크 로딩 상태
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksError, setBookmarksError] = useState<string | null>(null);

  // 타임라인 (Activity)
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all'|'check'|'comment'|'like'|'bookmark'>('all');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelinePage, setTimelinePage] = useState(1);

  // 맵 참조
  const mapRef = useRef<any>(null);

  // 비밀번호 모달
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // 카운트다운 타이머
  useEffect(() => {
    let interval: number;
    if (timer > 0) {
      interval = window.setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  // 사용자 정보 로드 및 타임라인 로드
  useEffect(() => {
    setLoading(true);
    fetchUser()
      .then(u => {
        const avatarURL = u.avatar || DEFAULT_AVATAR;
        const accounts = u.socialAccounts?.map(sa => ({
          provider: sa.provider,
          connected: (sa as any).linked
        }));
        setUser({ ...u, avatar: avatarURL, socialAccounts: accounts });

        if (u.checks >= 100) {
          setAchievements([{ id: 1, name: '팩트체크 100회 달성', icon: '/icons/check100.png' }]);
        }
        setCommentStats({
          likesReceived: Math.floor(u.likes * 0.5),
          repliesReceived: Math.floor(u.comments * 0.3),
        });

        // 타임라인: API 호출
        setTimelineLoading(true);
        fetchActivity()
          .then(data => setTimelineItems(data))
          .catch(() => setTimelineError('활동 히스토리를 불러올 수 없습니다.'))
          .finally(() => setTimelineLoading(false));
      })
      .catch(() => setError('유저 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  // Bias 데이터 로드
  useEffect(() => {
    setBiasLoading(true);
    fetchBias(period)
      .then(data => setBiasData(data))
      .catch(() => setBiasError('편향 데이터를 불러오지 못했습니다.'))
      .finally(() => setBiasLoading(false));
  }, [period]);

  // Watch time 데이터 로드
  useEffect(() => {
    setWatchLoading(true);
    fetchWatchTime(watchTab)
      .then(data => setWatchData(data))
      .catch(() => setWatchError('시청 시간 데이터를 불러오지 못했습니다.'))
      .finally(() => setWatchLoading(false));
  }, [watchTab]);

  // 활동량 (주간/월간) 로드
  useEffect(() => {
    setActivityLoading(true);
    fetchWatchTime(activityPeriod)
      .then(data =>
        setActivityData(data.map(pt => ({ name: pt.name, count: pt.min })))
      )
      .catch(() => setActivityError('활동 데이터를 불러오지 못했습니다.'))
      .finally(() => setActivityLoading(false));
  }, [activityPeriod]);

  // 세션·알림·북마크 로드
  useEffect(() => {
    setSessionsLoading(true);
    Promise.resolve(user?.sessions || [])
      .catch(() => setSessionsError('세션 데이터를 불러오지 못했습니다.'))
      .finally(() => setSessionsLoading(false));

    setNotificationsLoading(true);
    Promise.resolve(user?.notifications || [])
      .catch(() => setNotificationsError('알림 데이터를 불러오지 못했습니다.'))
      .finally(() => setNotificationsLoading(false));

    setBookmarksLoading(true);
    Promise.resolve(user?.bookmarks || [])
      .catch(() => setBookmarksError('북마크 데이터를 불러오지 못했습니다.'))
      .finally(() => setBookmarksLoading(false));
  }, [user]);

  // 지도 초기화
  useLayoutEffect(() => {
    if (tab !== 'analytics' || !user) return;
    const am4core = require('@amcharts/amcharts4/core');
    const am4maps = require('@amcharts/amcharts4/maps');
    const geodata = require('../geodata/southKoreaLow').default;

    const chart = am4core.create('koreaMap', am4maps.MapChart);
    chart.geodata = geodata;
    chart.projection = new am4maps.projections.Miller();
    chart.chartContainer.wheelable = false;
    chart.chartContainer.resizable = false;

    const series = chart.series.push(new am4maps.MapPolygonSeries());
    series.useGeodata = true;

    const template = series.mapPolygons.template;
    template.tooltipText = '{name}';
    template.fill = am4core.color('#f4effc');
    template.states.create('hover').properties.fill = am4core.color('#5c3c91');
    template.events.on('hit', (ev: any) => {
      alert(`클릭한 지역: ${(ev.target.dataItem.dataContext as any).name}`);
    });

    mapRef.current = chart;
    return () => {
      chart.dispose();
      mapRef.current = null;
    };
  }, [tab, user]);

  // 핸들러
  const handleAvatarChange = (file: File) => {
    setFormAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  const handleAvatarReset = () => {
    if (!user) return;
    setFormAvatarFile(null);
    setAvatarPreview(user.avatar || DEFAULT_AVATAR);
  };
  const saveProfile = () => {
    if (!user) return;
    setUser({
      ...user,
      nickname: formNickname,
      bio: formBio,
      avatar: avatarPreview
    });
    setEditingProfile(false);
  };

  const openEmailModal = () => {
    if (!user) return;
    setFormNewEmail(user.loginEmail);
    setIsCodeSent(false);
    setVerificationCode('');
    setIsVerified(false);
    setTimer(0);
    setShowEmailModal(true);
  };
  const closeEmailModal = () => setShowEmailModal(false);
  const sendVerification = () => {
    alert('인증 메일을 전송했습니다.');
    setIsCodeSent(true);
    setTimer(300);
  };
  const verifyCode = () => {
    if (verificationCode === '123456') {
      setIsVerified(true);
      alert('이메일 인증 완료');
    } else {
      alert('인증 코드가 일치하지 않습니다.');
    }
  };
  const handleEmailUpdate = () => {
    if (!user || !isVerified) return;
    setUser({ ...user, loginEmail: formNewEmail });
    closeEmailModal();
    alert('이메일이 변경되었습니다.');
  };

  const toggle2FA = () => {
    if (!user) return;
    const updated = !twoFA;
    setTwoFA(updated);
    setUser({ ...user, twoFactorEnabled: updated });
  };

  const handlePwdSave = () => {
    if (newPwd !== confirmPwd) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    alert('비밀번호가 변경되었습니다.');
    setShowPwdModal(false);
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const markAllNotificationsRead = () => {
    if (!user) return;
    setUser({ ...user, notifications: [] });
  };

  if (loading) return <div className="spinner">로딩 중…</div>;
  if (error)   return <div className="error">{error}</div>;
  if (!user)   return null;

  const sessions      = user.sessions     ?? [];
  const notifications = user.notifications?? [];
  const bookmarks     = user.bookmarks;

  const orderedBiasData = ['진보','중도','보수']
    .map(label => biasData.find(d => d.name === label) || { name: label, value: 0 });

  const filteredTimeline = timelineItems
    .filter(item => timelineFilter === 'all' || item.type === timelineFilter)
    .filter(item => item.title.includes(timelineSearch))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mypage">
      <Header />
      <div className="mypage__inner">
        <aside className="sidebar">
          <div className="profile-box">
            <div className="avatar"><img src={avatarPreview} alt="avatar" /></div>
            <h2 className="nickname">{user.nickname}</h2>
            <p className="bio">{user.bio || '소개 없음'}</p>
            <div className="follow-info">
              <span>👥 {user.followers}</span>
              <span>➡️ {user.following}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button className={tab==='analytics'?'active':''} onClick={()=>setTab('analytics')}>Analytics</button>
            <button className={tab==='security'?'active':''} onClick={()=>setTab('security')}>Security</button>
            <button className={tab==='activity'?'active':''} onClick={()=>setTab('activity')}>Activity</button>
          </nav>
        </aside>

        <section className="content">
          {/* Analytics Tab */}
          {tab==='analytics' && (
            <div className="content-grid">
              <article className="card">
                <h3>정치 성향</h3>
                <div className="inline-group">
                  {(['7','30','90','180','Y'] as BiasPeriod[]).map(p => (
                    <button
                      key={p}
                      className={period===p?'btn-mini active':'btn-mini'}
                      onClick={()=>setPeriod(p)}
                    >{label(p)}</button>
                  ))}
                </div>
                {biasLoading
                  ? <div className="spinner">로딩 중…</div>
                  : biasError
                    ? <div className="error">{biasError}</div>
                    : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={orderedBiasData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                            cornerRadius={6}
                            stroke="#f0f2f5"
                            strokeWidth={2}
                          >
                            {orderedBiasData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={20} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
              </article>

              <article className="card">
                <h3>활동량</h3>
                <div className="inline-group">
                  {(['week','month'] as ('week'|'month')[]).map(p => (
                    <button
                      key={p}
                      className={activityPeriod===p?'btn-mini active':'btn-mini'}
                      onClick={()=>setActivityPeriod(p)}
                    >{p==='week'?'주간':'월간'}</button>
                  ))}
                </div>
                {activityLoading
                  ? <div className="spinner">로딩 중…</div>
                  : activityError
                    ? <div className="error">{activityError}</div>
                    : (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={activityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" height={20} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke={LINE_COLOR} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
              </article>

              <article className="card">
                <h3>시청 시간</h3>
                <div className="inline-group">
                  {(['day','week','month'] as WatchTab[]).map(t => (
                    <button
                      key={t}
                      className={watchTab===t?'btn-mini active':'btn-mini'}
                      onClick={()=>setWatchTab(t)}
                    >{t==='day'?'Day': t==='week'?'Week':'Month'}</button>
                  ))}
                </div>
                {watchLoading
                  ? <div className="spinner">로딩 중…</div>
                  : watchError
                    ? <div className="error">{watchError}</div>
                    : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={watchData} barSize={10} barCategoryGap="25%">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" height={20} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="min" fill={BAR_COLOR} radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
              </article>

              <article className="card korea-card">
                <h3>팩트체크 분포</h3>
                <div className="korea-map"><div id="koreaMap" /></div>
              </article>
            </div>
          )}

          {/* Security Tab */}
          {tab==='security' && (
            <div className="security-grid">
              <article className="card">
                <h3>계정 & 보안</h3>
                <div className="info-row">
                  <span className="label">이메일</span>
                  <div className="display-group">
                    <span>{user.loginEmail}</span>
                    <button className="btn edit" onClick={openEmailModal}>변경</button>
                  </div>
                </div>
                <div className="info-row">
                  <span className="label">비밀번호</span>
                  <button className="btn" onClick={()=>setShowPwdModal(true)}>변경</button>
                </div>
                <div className="info-row">
                  <span className="label">2단계 인증</span>
                  <label className="toggle">
                    <input type="checkbox" checked={twoFA} onChange={toggle2FA} />
                    <span>{twoFA?'활성화':'비활성화'}</span>
                  </label>
                </div>
              </article>

              <article className="card">
                <h3>프로필 설정</h3>
                {!editingProfile ? (
                  <div className="profile-display">
                    <div className="avatar-large"><img src={avatarPreview} alt="avatar" /></div>
                    <div className="profile-info">
                      <h4 className="profile-name">{user.nickname}</h4>
                      <p className="profile-bio">{user.bio || '소개가 아직 없습니다.'}</p>
                    </div>
                    <button className="btn btn-edit-profile" onClick={()=>setEditingProfile(true)}>✎ 수정</button>
                  </div>
                ) : (
                  <form className="profile-form" onSubmit={e=>{ e.preventDefault(); saveProfile(); }}>
                    <div className="form-row avatar-row">
                      <label htmlFor="avatarUpload">프로필 사진</label>
                      <div className="avatar-upload">
                        <img src={avatarPreview} alt="미리보기" className="avatar-preview" />
                        <input
                          id="avatarUpload"
                          type="file"
                          accept="image/*"
                          onChange={e=>e.target.files && handleAvatarChange(e.target.files[0])}
                        />
                      </div>
                      <button type="button" className="btn reset-photo" onClick={handleAvatarReset}>기본으로 되돌리기</button>
                    </div>
                    <div className="form-row">
                      <label htmlFor="nicknameInput">닉네임</label>
                      <input
                        id="nicknameInput"
                        type="text"
                        value={formNickname}
                        onChange={e=>setFormNickname(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="bioInput">소개</label>
                      <textarea
                        id="bioInput"
                        rows={3}
                        value={formBio}
                        onChange={e=>setFormBio(e.target.value)}
                        className="textarea-field"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn cancel" onClick={()=>{ setEditingProfile(false); setAvatarPreview(user.avatar||DEFAULT_AVATAR); }}>취소</button>
                      <button type="submit" className="btn save">저장</button>
                    </div>
                  </form>
                )}
              </article>

              <article className="card">
                <h3>앱 연결</h3>
                {user.socialAccounts && user.socialAccounts.length > 0 ? (
                  <ul className="apps-list">
                    {user.socialAccounts.map(sa => (
                      <li key={sa.provider} className="app-item">
                        <span>{sa.provider}</span>
                        <button className="btn edit" onClick={() => {
                          setUser({
                            ...user,
                            socialAccounts: user.socialAccounts!.map(x =>
                              x.provider === sa.provider
                                ? { ...x, connected: !x.connected }
                                : x
                            )
                          });
                        }}>
                          {sa.connected ? '해제' : '연결'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">연결된 앱이 없습니다.</p>
                )}
              </article>

              <article className="card delete-card">
                <h3 className="danger">계정 삭제</h3>
                <p>데이터가 영구 삭제됩니다. 신중히 결정하세요.</p>
                <button className="btn delete-account" onClick={() => {
                  if (window.confirm('정말 삭제하시겠습니까?')) {
                    alert('삭제되었습니다.');
                  }
                }}>계정 삭제</button>
              </article>
            </div>
          )}

          {/* Activity Tab */}
          {tab==='activity' && (
            <div className="activity-grid">
              <article className="card stats-card">
                <h3>활동 요약</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-value">{user.checks}</span>
                    <span className="stat-label">팩트체크</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{user.comments}</span>
                    <span className="stat-label">댓글</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{user.likes}</span>
                    <span className="stat-label">좋아요</span>
                  </div>
                </div>
              </article>

              <article className="card">
                <h3>업적 배지</h3>
                {achievements.length > 0 ? (
                  <ul className="achievements-list">
                    {achievements.map(a => (
                      <li key={a.id} className="achievement-item">
                        <img src={a.icon} alt="" className="achievement-icon" />
                        <span className="achievement-name">{a.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">🏅 달성한 업적이 없습니다.</p>
                )}
              </article>

              <article className="card">
                <h3>댓글 반응 통계</h3>
                {commentStats ? (
                  <ul className="comment-stats-list">
                    <li>받은 좋아요: {commentStats.likesReceived}</li>
                    <li>받은 답글: {commentStats.repliesReceived}</li>
                  </ul>
                ) : (
                  <p className="empty">통계가 없습니다.</p>
                )}
              </article>

              <article className="card timeline-card">
                <div className="notification-header">
                  <h3>활동 히스토리</h3>
                  <button className="btn mark-all-read" onClick={markAllNotificationsRead} aria-label="모든 알림 읽음 처리">모두 읽음</button>
                </div>
                <div className="timeline-controls">
                  <select aria-label="활동 유형 필터" value={timelineFilter} onChange={e => { setTimelineFilter(e.target.value as any); setTimelinePage(1); }}>
                    <option value="all">전체</option>
                    <option value="check">팩트체크</option>
                    <option value="comment">댓글</option>
                    <option value="like">좋아요</option>
                    <option value="bookmark">북마크</option>
                  </select>
                  <input type="text" placeholder="검색어 입력" aria-label="활동 검색" value={timelineSearch} onChange={e => { setTimelineSearch(e.target.value); setTimelinePage(1); }} />
                </div>
                {timelineLoading
                  ? <div className="spinner">로딩 중…</div>
                  : timelineError
                    ? <div className="error">{timelineError}</div>
                    : filteredTimeline.length === 0
                      ? <p className="empty">활동 기록이 없습니다.</p>
                      : (
                        <ul className="timeline-list">
                          {filteredTimeline
                            .slice(0, timelinePage * 5)
                            .map(item => (
                              <li key={item.id} className="timeline-item">
                                <span className="timeline-time">{formatDate(item.date)}</span>
                                <span className="timeline-desc">[{item.type}] {item.title}</span>
                              </li>
                            ))}
                        </ul>
                      )}
                {filteredTimeline.length > timelinePage * 5 && (
                  <button className="btn load-more" onClick={() => setTimelinePage(p => p + 1)} aria-label="더 많은 활동 보기">더 보기</button>
                )}
              </article>

              <article className="card bookmark-card">
                <h3>북마크</h3>
                {bookmarksLoading
                  ? <div className="spinner">로딩 중…</div>
                  : bookmarksError
                    ? <div className="error">{bookmarksError}</div>
                    : bookmarks.length > 0
                      ? (
                        <ul className="bookmark-list">
                          {bookmarks.map(b => (
                            <li key={b.id}>
                              <a href={b.url} target="_blank" rel="noopener noreferrer">{b.title}</a>
                              <span className="text-sub">{formatDate(b.url /* date not available, replace if you have date */)}</span>
                            </li>
                          ))}
                        </ul>
                      )
                      : <p className="empty">북마크한 글이 없습니다.</p>}
              </article>

              <article className="card session-card">
                <h3>세션</h3>
                {sessionsLoading
                  ? <div className="spinner">로딩 중…</div>
                  : sessionsError
                    ? <div className="error">{sessionsError}</div>
                    : sessions.length > 0
                      ? (
                        <ul className="session-list">
                          {sessions.map(s => (
                            <li key={s.id}>
                              <span>{s.device}</span>
                              <span className="text-sub">{formatDate(s.lastActive)}</span>
                            </li>
                          ))}
                        </ul>
                      )
                      : <p className="empty">로그인 세션이 없습니다.</p>}
              </article>

              <article className="card notification-card">
                <h3>알림</h3>
                {notificationsLoading
                  ? <div className="spinner">로딩 중…</div>
                  : notificationsError
                    ? <div className="error">{notificationsError}</div>
                    : notifications.length > 0
                      ? (
                        <ul className="notification-list">
                          {notifications.map(n => (
                            <li key={n.id}>
                              <p>{n.message}</p>
                              <span className="text-sub">{formatDate(n.date)}</span>
                            </li>
                          ))}
                        </ul>
                      )
                      : <p className="empty">받은 알림이 없습니다.</p>}
              </article>
            </div>
          )}
        </section>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div tabIndex={-1} className="modal email-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="modal-title">이메일 변경</h3>
              <button className="close-btn" onClick={closeEmailModal} aria-label="모달 닫기">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="newEmail">새 이메일</label>
                <input id="newEmail" type="email" className="input-field" value={formNewEmail} onChange={e => setFormNewEmail(e.target.value)} />
                {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formNewEmail) && formNewEmail && (
                  <p className="error-text">유효한 이메일을 입력하세요.</p>
                )}
              </div>
              <div className="form-group">
                <button className="btn send-code" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formNewEmail) || timer>0} onClick={sendVerification}>인증 메일 보내기</button>
                {isCodeSent && timer>0 && <span className="timer">{formatTime(timer)} 남음</span>}
              </div>
              <div className="form-group inline-group">
                <input id="verificationCode" type="text" className="input-field" placeholder="인증 코드" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} />
                <button className="btn verify-code" disabled={!verificationCode || timer===0} onClick={verifyCode}>인증하기</button>
              </div>
              {isVerified && <p className="success-text">이메일 인증 완료</p>}
            </div>
            <div className="modal-footer">
              <button className="btn cancel-btn" onClick={closeEmailModal}>취소</button>
              <button className="btn save-btn" disabled={!isVerified} onClick={handleEmailUpdate}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPwdModal && (
        <div className="modal-overlay">
          <div tabIndex={-1} className="modal password-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="modal-title">비밀번호 변경</h3>
              <button className="close-btn" onClick={() => setShowPwdModal(false)} aria-label="모달 닫기">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="currentPwd">현재 비밀번호</label>
                <input id="currentPwd" type="password" className="input-field" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="newPwd">새 비밀번호</label>
                <input id="newPwd" type="password" className="input-field" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPwd">확인</label>
                <input id="confirmPwd" type="password" className="input-field" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn cancel-btn" onClick={() => setShowPwdModal(false)}>취소</button>
              <button className="btn save-btn" onClick={handlePwdSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: bias label
function label(p: BiasPeriod) {
  switch(p) {
    case '7': return '7일';
    case '30': return '30일';
    case '90': return '90일';
    case '180': return '180일';
    default: return '연간';
  }
}

// Helper: format date/time consistently
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}