// src/pages/MyPage.tsx
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import Footer from '../components/Footer';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import '../styles/MyPage.css';
import { API_BASE } from '../api/config';
import { useNavigate } from 'react-router-dom';

// 타입 정의
type Tab = 'analytics' | 'security' | 'activity';
type BiasPeriod = '7' | '30' | '90' | '180' | 'Y';
type WatchTab = 'day' | 'week' | 'month';
interface WatchPoint { name: string; min: number; }

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

// async function fetchActivity(): Promise<TimelineItem[]> {
//   const res = await fetch(`${API_BASE}/activity`);
//   if (!res.ok) throw new Error('활동 히스토리를 불러오지 못했습니다.');
//   return res.json();
// }

// User 인터페이스 수정 (AuthContext와 호환되도록)
interface User {
  id: number; // AuthContext에서는 number 타입
  nickname: string;
  email: string; // loginEmail 대신 email 사용
  role: string;
  bio?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
  checks?: number;
  comments?: number;
  likes?: number;
  followers?: number;
  following?: number;
  bookmarks?: Bookmark[];
  sessions?: Session[];
  socialAccounts?: SocialAccount[];
  notifications?: Notification[];
}

// API 함수 수정
const changePassword = async (newPassword: string) => {
  try {
    const response = await fetch(`${API_BASE}/user/changePassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword }),
      credentials: 'include' // 세션 쿠키 포함
    });
    
    if (!response.ok) {
      if (response.headers.get('content-type')?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || '비밀번호 변경 실패');
      } else {
        throw new Error('비밀번호 변경 실패');
      }
    }
    
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
  }
};

const changeNickname = async (nickname: string) => {
  try {
    const response = await fetch(`${API_BASE}/user/changeNickname`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nickname }),
      credentials: 'include' // 세션 쿠키 포함
    });
    
    if (!response.ok) {
      if (response.headers.get('content-type')?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || '닉네임 변경 실패');
      } else {
        throw new Error('닉네임 변경 실패');
      }
    }
    
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || '닉네임 변경 중 오류가 발생했습니다.');
  }
};

const setBio = async (bio: string) => {
  try {
    const response = await fetch(`${API_BASE}/user/setBio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bio }),
      credentials: 'include' // 세션 쿠키 포함
    });
    
    if (!response.ok) {
      if (response.headers.get('content-type')?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || '자기소개 변경 실패');
      } else {
        throw new Error('자기소개 변경 실패');
      }
    }
    
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || '자기소개 변경 중 오류가 발생했습니다.');
  }
};

export default function MyPage() {
  // AuthContext에서 사용자 정보 가져오기
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  // 기본 상태
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('security');

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

  // AuthContext의 사용자 정보를 활용하여 상태 초기화
  useEffect(() => {
    if (authLoading) return; // 인증 정보가 로딩 중이면 대기
    
    if (authUser) {
      // AuthContext에서 가져온 기본 정보로 사용자 상태 설정
      const userData: User = {
        id: authUser.id,
        nickname: authUser.nickname,
        email: authUser.email,
        role: authUser.role,
        avatar: DEFAULT_AVATAR, // 기본값
        bio: '', // 기본값
        checks: 0,
        comments: 0,
        likes: 0,
        followers: 0,
        following: 0,
        bookmarks: [],
        twoFactorEnabled: false
      };
      
      setUser(userData);
      setFormNickname(userData.nickname);
      setFormBio(userData.bio || '');
      setAvatarPreview(userData.avatar || DEFAULT_AVATAR);
      setTwoFA(userData.twoFactorEnabled || false);

    } else {
      setError('로그인이 필요합니다.');
    }
    
    setLoading(false);
  }, [authUser, authLoading]);

  // 추가 사용자 정보 가져오기 (필요한 경우)
  // const fetchAdditionalUserData = async (userId: number) => {
  //   try {
  //     // 필요한 추가 정보가 있을 경우 API 호출
  //     const res = await fetch(`${API_BASE}/api/users/${userId}/profile`, {
  //       credentials: 'include' // 세션 쿠키 포함
  //     });
      
  //     if (!res.ok) {
  //       // 서버 오류 응답 처리
  //       throw new Error('프로필 정보를 불러오지 못했습니다.');
  //     }
      
  //     // 응답 헤더 확인
  //     const contentType = res.headers.get('content-type');
  //     if (!contentType || !contentType.includes('application/json')) {
  //       console.error('서버가 JSON 응답을 반환하지 않았습니다:', contentType);
  //     }
      
  //     const additionalData = await res.json();
      
  //     // 사용자 정보 업데이트
  //     setUser(prevUser => {
  //       if (!prevUser) return null;
  //       return {
  //         ...prevUser,
  //         bio: additionalData.bio || prevUser.bio,
  //         avatar: additionalData.avatar || prevUser.avatar,
  //         checks: additionalData.checks || 0,
  //         comments: additionalData.comments || 0,
  //         likes: additionalData.likes || 0,
  //         followers: additionalData.followers || 0,
  //         following: additionalData.following || 0,
  //         bookmarks: additionalData.bookmarks || [],
  //         sessions: additionalData.sessions || [],
  //         socialAccounts: additionalData.socialAccounts || [],
  //         notifications: additionalData.notifications || [],
  //         twoFactorEnabled: additionalData.twoFactorEnabled || false
  //       };
  //     });
      
  //     // 업적 설정
  //     if (additionalData.checks >= 100) {
  //       setAchievements([{ id: 1, name: '팩트체크 100회 달성', icon: '/icons/check100.png' }]);
  //     }
      
  //     // 댓글 통계 설정
  //     setCommentStats({
  //       likesReceived: Math.floor(additionalData.likes * 0.5) || 0,
  //       repliesReceived: Math.floor(additionalData.comments * 0.3) || 0,
  //     });
      
  //     return additionalData;
  //   } catch (error) {
  //     console.error('추가 사용자 정보 로드 오류:', error);
  //   }
  // };

  // 타임라인 데이터 로드
  // const loadTimelineData = async () => {
  //   setTimelineLoading(true);
  //   try {
  //     const data = await fetchActivity();
  //     setTimelineItems(data);
  //   } catch (error: any) {
  //     setTimelineError(error.message || '활동 히스토리를 불러올 수 없습니다.');
  //   } finally {
  //     setTimelineLoading(false);
  //   }
  // };

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

  // // Bias 데이터 로드
  // useEffect(() => {
  //   setBiasLoading(true);
  //   fetchBias(period)
  //     .then(data => {
  //       const arr = Array.isArray(data) ? data : [];
  //       setBiasData(arr);
  //     })
  //     .catch((e: Error) => setBiasError(e.message || '편향 데이터를 불러오지 못했습니다.'))
  //     .finally(() => setBiasLoading(false));
  // }, [period]);

  // // Watch time 데이터 로드
  // useEffect(() => {
  //   setWatchLoading(true);
  //   fetchWatchTime(watchTab)
  //     .then(data => setWatchData(data))
  //     .catch((e: Error) => setWatchError(e.message || '시청 시간 데이터를 불러오지 못했습니다.'))
  //     .finally(() => setWatchLoading(false));
  // }, [watchTab]);

  // // 활동량 (주간/월간) 로드
  // useEffect(() => {
  //   setActivityLoading(true);
  //   fetchWatchTime(activityPeriod)
  //     .then(data =>
  //       setActivityData(data.map(pt => ({ name: pt.name, count: pt.min })))
  //     )
  //     .catch((e: Error) => setActivityError(e.message || '활동 데이터를 불러오지 못했습니다.'))
  //     .finally(() => setActivityLoading(false));
  // }, [activityPeriod]);

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
  
  const saveProfile = async () => {
    if (!user) return;
    
    try {
      // 닉네임 변경 (원래 닉네임과 다를 경우에만)
      if (formNickname !== user.nickname) {
        await changeNickname(formNickname);
        
        // 닉네임 변경 후 로그아웃 및 로그인 페이지로 이동
        alert('닉네임이 변경되었습니다. 다시 로그인해주세요.');
        await logout(); // AuthContext의 logout 함수 호출
        navigate('/login'); // 로그인 페이지로 이동
        return; // 함수 종료
      }
      
      // 자기소개 변경 (원래 자기소개와 다를 경우에만)
      if (formBio !== user.bio) {
        await setBio(formBio);
      }
      
      // 상태 업데이트
      setUser({
        ...user,
        bio: formBio,
        avatar: avatarPreview
      });
      
      setEditingProfile(false);
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error: any) {
      alert(error.message || '프로필 업데이트 중 오류가 발생했습니다.');
      console.error('프로필 업데이트 오류:', error);
    }
  };

  const openEmailModal = () => {
    if (!user) return;
    setFormNewEmail(user.email);
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
    setUser({ ...user, email: formNewEmail });
    closeEmailModal();
    alert('이메일이 변경되었습니다.');
  };

  const toggle2FA = () => {
    if (!user) return;
    const updated = !twoFA;
    setTwoFA(updated);
    setUser({ ...user, twoFactorEnabled: updated });
  };

  const handlePwdSave = async () => {
    // 현재 비밀번호 입력 검증
    if (!currentPwd) {
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }
    
    // 새 비밀번호와 확인 비밀번호 일치 여부 검증
    if (newPwd !== confirmPwd) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    try {
      await changePassword(newPwd);
      
      alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      setShowPwdModal(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      
      // 비밀번호 변경 후 로그아웃 및 로그인 페이지로 이동
      await logout(); // AuthContext의 logout 함수 호출
      navigate('/login'); // 로그인 페이지로 이동
    } catch (error: any) {
      alert(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
      console.error('비밀번호 변경 오류:', error);
    }
  };

  const markAllNotificationsRead = () => {
    if (!user) return;
    setUser({ ...user, notifications: [] });
  };

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

  if (loading || authLoading) return <div className="spinner">로딩 중…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return <div className="error">사용자 정보를 불러올 수 없습니다.</div>;

  const sessions = user.sessions ?? [];
  const notifications = user.notifications ?? [];
  const bookmarks = user.bookmarks ?? [];

  const biasArray = Array.isArray(biasData) ? biasData : [];
  const orderedBiasData = ['진보','중도','보수']
    .map(label => biasData.find(d => d.name === label) || { name: label, value: 0 });

  const filteredTimeline = timelineItems
    .filter(item => timelineFilter === 'all' || item.type === timelineFilter)
    .filter(item => item.title.includes(timelineSearch))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mypage">
      <div className="mypage__inner">
        <aside className="sidebar">
          <div className="profile-box">
            <div className="avatar"><img src={avatarPreview} alt="avatar" /></div>
            <h2 className="nickname">{user.nickname}</h2>
            {/* <p className="bio">{user.bio || '소개 없음'}</p> */}
            <div className="follow-info">
              <span>👥 {user.followers}</span>
              <span>➡️ {user.following}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <button className={tab==='security'?'active':''} onClick={()=>setTab('security')}>Security</button>
          </nav>
        </aside>

        <section className="content">
          {/* Security Tab */}
          {tab==='security' && (
            <div className="security-grid">
              <article className="card">
                <h3>계정 & 보안</h3>
                {/* <div className="info-row">
                  <span className="label">이메일</span>
                  <div className="display-group">
                    <span>{user.loginEmail}</span>
                    <button className="btn edit" onClick={openEmailModal}>변경</button>
                  </div>
                </div> */}
                <div className="info-row">
                  <span className="label">비밀번호</span>
                  <button className="btn" onClick={()=>setShowPwdModal(true)}>변경</button>
                </div>
                {/* <div className="info-row">
                  <span className="label">2단계 인증</span>
                  <label className="toggle">
                    <input type="checkbox" checked={twoFA} onChange={toggle2FA} />
                    <span>{twoFA?'활성화':'비활성화'}</span>
                  </label>
                </div> */}
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
                    {/* <div className="form-row">
                      <label htmlFor="bioInput">소개</label>
                      <textarea
                        id="bioInput"
                        rows={3}
                        value={formBio}
                        onChange={e=>setFormBio(e.target.value)}
                        className="textarea-field"
                      />
                    </div> */}
                    <div className="form-actions">
                      <button type="button" className="btn cancel" onClick={()=>{ setEditingProfile(false); setAvatarPreview(user.avatar||DEFAULT_AVATAR); }}>취소</button>
                      <button type="submit" className="btn save">저장</button>
                    </div>
                  </form>
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

          {/* 비밀번호 변경 모달 */}
          {showPwdModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>비밀번호 변경</h2>
                <form onSubmit={e => { e.preventDefault(); handlePwdSave(); }}>
                  <div className="form-row">
                    <label htmlFor="currentPwd">현재 비밀번호</label>
                    <input
                      id="currentPwd"
                      type="password"
                      value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="newPwd">새 비밀번호</label>
                    <input
                      id="newPwd"
                      type="password"
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="confirmPwd">비밀번호 확인</label>
                    <input
                      id="confirmPwd"
                      type="password"
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn cancel" onClick={() => setShowPwdModal(false)}>취소</button>
                    <button type="submit" className="btn save">저장</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
