import React, {
  useState,
  useEffect,
  useRef,
  ReactNode,
  FormEvent,
} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Discussion.css';
import { useAuth } from '../contexts/AuthContext';

/* ===============================================================
   타입 정의 & 샘플 데이터
================================================================ */
type Dialogue = {
  id: number;
  title: string;
  description: string;
  currentParticipants: number;
  totalVisits: number;
  createdAt: string;
  keywords: string[];
};

const hotSeed: Dialogue[] = [
  {
    id: 1,
    title: '대선후보 검증 토론',
    description: '공약·신뢰성 토론',
    currentParticipants: 20,
    totalVisits: 124,
    createdAt: '2025-04-16',
    keywords: ['정치', '대선'],
  },
  {
    id: 2,
    title: '기후변화 정책 분석',
    description: '국내외 대응 비교',
    currentParticipants: 15,
    totalVisits: 89,
    createdAt: '2025-04-15',
    keywords: ['환경', '정책'],
  },
  {
    id: 3,
    title: 'AI 윤리와 규제',
    description: '기술·윤리적 쟁점',
    currentParticipants: 8,
    totalVisits: 76,
    createdAt: '2025-04-14',
    keywords: ['AI', '윤리'],
  },
  {
    id: 4,
    title: '교육개혁 방향 토론',
    description: '입시·커리큘럼 개편',
    currentParticipants: 5,
    totalVisits: 54,
    createdAt: '2025-04-13',
    keywords: ['교육', '개혁'],
  },
  {
    id: 5,
    title: '부동산 시장 전망',
    description: '가격 동향 및 규제',
    currentParticipants: 12,
    totalVisits: 98,
    createdAt: '2025-04-12',
    keywords: ['경제', '부동산'],
  },
  {
    id: 6,
    title: '병역제도 개선',
    description: '모병제 vs 징병제',
    currentParticipants: 3,
    totalVisits: 47,
    createdAt: '2025-04-11',
    keywords: ['사회', '병역'],
  },
  {
    id: 7,
    title: '디지털 자산 규제',
    description: '암호화폐·NFT 정책',
    currentParticipants: 7,
    totalVisits: 63,
    createdAt: '2025-04-10',
    keywords: ['IT', '규제'],
  },
  {
    id: 8,
    title: '청년 일자리 해법',
    description: '창업·인턴십 지원',
    currentParticipants: 10,
    totalVisits: 82,
    createdAt: '2025-04-09',
    keywords: ['사회', '일자리'],
  },
];

// 모든 토론방을 위한 샘플 데이터
const allRoomsSeed: Dialogue[] = [
  ...hotSeed,
  {
    id: 9,
    title: '지방 분권과 지역균형발전',
    description: '수도권 집중 해소 방안',
    currentParticipants: 6,
    totalVisits: 45,
    createdAt: '2025-04-08',
    keywords: ['사회', '정책'],
  },
  {
    id: 10,
    title: '한류 문화와 소프트파워',
    description: '글로벌 영향력 확대',
    currentParticipants: 9,
    totalVisits: 71,
    createdAt: '2025-04-07',
    keywords: ['문화', '외교'],
  },
  {
    id: 11,
    title: '전기차 시장 전망',
    description: '배터리 기술과 인프라',
    currentParticipants: 11,
    totalVisits: 93,
    createdAt: '2025-04-06',
    keywords: ['기술', '환경'],
  },
  {
    id: 12,
    title: '음식물 쓰레기 저감 방안',
    description: '재활용과 순환경제',
    currentParticipants: 4,
    totalVisits: 38,
    createdAt: '2025-04-05',
    keywords: ['환경', '생활'],
  },
  {
    id: 13,
    title: '디지털 리터러시 교육',
    description: '미디어 비판적 이해',
    currentParticipants: 7,
    totalVisits: 61,
    createdAt: '2025-04-04',
    keywords: ['교육', '디지털'],
  },
  {
    id: 14,
    title: '프라이버시와 보안',
    description: '개인정보 보호 전략',
    currentParticipants: 8,
    totalVisits: 67,
    createdAt: '2025-04-03',
    keywords: ['IT', '보안'],
  },
  {
    id: 15,
    title: '식량 안보와 농업 정책',
    description: '자급률 향상 방안',
    currentParticipants: 5,
    totalVisits: 42,
    createdAt: '2025-04-02',
    keywords: ['경제', '농업'],
  },
  {
    id: 16,
    title: '공유 경제 사업 모델',
    description: '플랫폼과 규제 이슈',
    currentParticipants: 6,
    totalVisits: 59,
    createdAt: '2025-04-01',
    keywords: ['경제', '사회'],
  },
];

/* ===============================================================
   유틸리티 함수
================================================================ */
// 모든 토론방 전용 정렬 함수
const sortRoomsBy = (rooms: Dialogue[], key: 'recent' | 'popular') =>
  [...rooms].sort((a, b) =>
    key === 'popular'
      ? b.currentParticipants - a.currentParticipants
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* ===============================================================
   재사용 컴포넌트
================================================================ */
const EmojiLegend: React.FC = () => (
  <div className="emoji-legend" role="note">
    <span>💬 실시간 참여자</span>
    <span>👀 총 방문자</span>
    <span>📅 생성 날짜</span>
  </div>
);

interface SectionProps {
  title: string;
  children: ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="room-section" aria-labelledby={`section-${title}`}>
    <h2 id={`section-${title}`} className="section-title">
      {title}
    </h2>
    {children}
  </section>
);

interface CardProps {
  room: Dialogue;
  onJoin: (id: number) => void;
  onDelete?: (id: number) => void;
  isMine?: boolean;
  highlight?: string;
}
const Card: React.FC<CardProps> = ({
                                     room,
                                     onJoin,
                                     onDelete,
                                     isMine,
                                     highlight,
                                   }) => {
  const navigate = useNavigate();

  const hl = (text: string) => {
    if (!highlight) return text;
    const re = new RegExp(`(${highlight})`, 'gi');
    return text.split(re).map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i}>{part}</mark>
        ) : (
            part
        )
    );
  };

  return (
      <div className="dialogue-card">
        <h3>{hl(room.title)}</h3>
        <p>{hl(room.description)}</p>

        <div>
          {room.keywords.map((k, i) => (
              <span key={i}>#{k}</span>
          ))}
        </div>

        <p>
          💬 {room.currentParticipants} 👀 {room.totalVisits} 📅 {room.createdAt}
        </p>

        <div>
          <button onClick={() => navigate(`/discussion/${room.id}`)}>참여</button>
          {isMine && onDelete && (
              <button onClick={() => onDelete(room.id)}>삭제</button>
          )}
        </div>
      </div>
  );
};

interface CreateCardProps {
  title: string;
  desc: string;
  keywords: string;
  titleError?: string;
  descError?: string;
  onTitle: (v: string) => void;
  onDesc: (v: string) => void;
  onKeywords: (v: string) => void;
  onCreate: (e: FormEvent) => void;
  isCreating: boolean;
}
const CreateCard: React.FC<CreateCardProps> = ({
  title,
  desc,
  keywords,
  titleError,
  descError,
  onTitle,
  onDesc,
  onKeywords,
  onCreate,
  isCreating,
}) => (
  <div
    className="dialogue-card create-dialogue-card"
    role="form"
    aria-labelledby="create-form-title"
  >
    <h3 id="create-form-title" className="create-header">
      🆕 새 토론방 생성
    </h3>

    <form onSubmit={onCreate} noValidate>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="제목 (3~50자)"
        maxLength={50}
        aria-invalid={!!titleError}
      />
      {titleError && <div className="error-text">{titleError}</div>}

      <textarea
        value={desc}
        onChange={(e) => onDesc(e.target.value)}
        placeholder="설명 (10~200자)"
        maxLength={200}
        aria-invalid={!!descError}
      />
      {descError && <div className="error-text">{descError}</div>}

      <input
        type="text"
        value={keywords}
        onChange={(e) => onKeywords(e.target.value)}
        placeholder="키워드 (최대5개, 콤마 구분)"
      />

      <div className="point-info">
        포인트 제한: <strong>50</strong>
      </div>

      <button
        type="submit"
        className="btn-create"
        disabled={isCreating}
        aria-busy={isCreating}
      >
        {isCreating ? '생성 중…' : '생성'}
      </button>
    </form>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="empty-state" role="alert">
    <div className="empty-illu" aria-hidden="true">
      📭
    </div>
    <p>{message}</p>
  </div>
);

const Toast: React.FC<{ message: string }> = ({ message }) => (
  <div className="toast" role="status" aria-live="polite">
    {message}
  </div>
);

/* ===============================================================
   메인 페이지 컴포넌트
================================================================ */
export default function DiscussionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ----- 상태 -------------------------------------------------- */
  // HOT 토론방은 항상 인기순 (totalVisits 기준)
  const [hotList, setHotList] = useState<Dialogue[]>(
    [...hotSeed].sort((a, b) => b.totalVisits - a.totalVisits)
  );

  const [myList, setMyList] = useState<Dialogue[]>(() => {
    const s = localStorage.getItem('myDiscussionRooms');
    return s ? (JSON.parse(s) as Dialogue[]) : [];
  });

  // 모든 토론방 정렬 기준 (모든 토론방에만 적용)
  const [allRoomsSortKey, setAllRoomsSortKey] = useState<'recent' | 'popular'>(
    localStorage.getItem('allRoomsSortKey') === 'popular'
      ? 'popular'
      : 'recent',
  );

  // 모든 토론방 상태 초기화 - 처음에 초기 데이터 로드 (정렬 기준 적용)
  const [allRooms, setAllRooms] = useState<Dialogue[]>(() => {
    // 처음 5개 항목만 초기 로드하고 정렬
    return sortRoomsBy(allRoomsSeed.slice(0, 5), allRoomsSortKey);
  });

  const [loadingAllRooms, setLoadingAllRooms] = useState(false);
  const [allRoomsPage, setAllRoomsPage] = useState(0); 
  const [hasMoreAllRooms, setHasMoreAllRooms] = useState(allRoomsSeed.length > 5);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchPageSize, setSearchPageSize] = useState(5);

  const [sortKey, setSortKey] = useState<'recent' | 'popular'>(
    localStorage.getItem('discussionSortKey') === 'popular'
      ? 'popular'
      : 'recent',
  );

  const [hotPageSize, setHotPageSize] = useState(8);
  const [myPageSize, setMyPageSize] = useState(4);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => setToastMsg(msg);

  /* ----- refs & side-effects ----------------------------------- */
  const scrollKeep = useRef<number>(0);
  const hotRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, token, checkAuth } = useAuth();

  // 스크롤 기억
  useEffect(() => {
    const onScroll = () => {
      scrollKeep.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    window.scrollTo(0, scrollKeep.current);
  }, [location.key]);

  // 로컬스토리지
  useEffect(() => {
    localStorage.setItem('discussionSortKey', sortKey);
  }, [sortKey]);
  useEffect(() => {
    localStorage.setItem('myDiscussionRooms', JSON.stringify(myList));
  }, [myList]);

  // 토스트 타이머
  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(id);
  }, [toastMsg]);

  // 컴포넌트 마운트 시 초기 데이터 로드 효과
  useEffect(() => {
    // 모든 토론방 초기 로딩 효과
    const loadInitialAllRooms = async () => {
      setLoadingAllRooms(true);
      await delay(500); // 로딩 효과를 위한 짧은 지연
      setLoadingAllRooms(false);
    };
    
    loadInitialAllRooms();
  }, []);

  /* ----- 정렬 & 필터 ------------------------------------------ */
  // 모든 토론방 정렬 변경 이벤트 핸들러
  const handleAllRoomsSortChange = (newSortKey: 'recent' | 'popular') => {
    setAllRoomsSortKey(newSortKey);
    
    // 모든 토론방 재정렬
    setAllRooms(prev => sortRoomsBy(prev, newSortKey));
    
    // 로컬 스토리지에 저장
    localStorage.setItem('allRoomsSortKey', newSortKey);
  };

  const sortRooms = (rooms: Dialogue[]) =>
    [...rooms].sort((a, b) =>
      sortKey === 'popular'
        ? b.totalVisits - a.totalVisits
        : b.createdAt.localeCompare(a.createdAt),
    );

  const filtered = React.useMemo(
    () =>
      [...hotList, ...myList].filter(
        (r) =>
          r.title.includes(searchTerm) ||
          r.description.includes(searchTerm) ||
          r.keywords.some((k) => k.includes(searchTerm)),
      ),
    [searchTerm, hotList, myList],
  );

  /* ----- 이벤트 핸들러 ---------------------------------------- */
  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoadingSearch(true);
    await delay(300);
    setSearchTerm(searchInput.trim());
    setSearchPageSize(4);
    setIsLoadingSearch(false);
  };

  const createRoom = async (e: FormEvent) => {
    e.preventDefault();
    setTitleError('');
    setDescError('');
    const t = newTitle.trim();
    const d = newDesc.trim();

    if (t.length < 3 || t.length > 50) {
      setTitleError('제목은 3~50자 사이입니다.');
      return;
    }
    if (d.length < 10 || d.length > 200) {
      setDescError('설명은 10~200자 사이입니다.');
      return;
    }

    const kws = Array.from(
      new Set(
        newKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      ),
    ).slice(0, 5);

    try {
      setIsCreating(true);
      
      // 로그인 확인 - 컨텍스트 API 사용
      if (!isAuthenticated || !token || !checkAuth()) {
        console.log("인증 상태:", isAuthenticated);
        console.log("토큰 존재 여부:", !!token);
        
        showToast('로그인이 필요한 기능입니다.');
        navigate('/login', { state: { returnTo: location.pathname } });
        return;
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      // 인증 관련 헤더 설정
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log("요청 헤더:", headers);
      
      // 방 생성 요청
      const response = await fetch(`${apiUrl}/api/debate-rooms`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',  // 쿠키 포함
        body: JSON.stringify({
          title: t,
          description: d,
          keywords: kws,
        }),
      });
      
      console.log('API 응답 상태:', response.status);
      
      // 응답 본문 로깅 (디버깅용)
      const responseText = await response.text();
      console.log('API 응답:', responseText);
      
      // 응답이 JSON인 경우에만 파싱
      let data;
      if (responseText && responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('JSON 파싱 오류:', e);
        }
      }
      
      if (response.status === 401 || response.status === 403) {
        // 로컬 스토리지의 토큰 제거 (만료된 토큰일 수 있음)
        localStorage.removeItem('token');
        showToast(data?.message || '로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login', { state: { returnTo: location.pathname } });
        return;
      }
      
      if (!response.ok) {
        throw new Error(data?.message || '방 생성에 실패했습니다');
      }
      
      // 성공적으로 처리된 경우
      const next: Dialogue = {
        id: data.id || Date.now(),
        title: t,
        description: d,
        currentParticipants: 1,
        totalVisits: 1,
        createdAt: new Date().toISOString().slice(0, 10),
        keywords: kws,
      };
      
      // 내가 만든 토론방 목록에 추가
      setMyList((prev) => [next, ...prev]);
      
      // 모든 토론방 목록에도 추가
      setAllRooms((prev) => [next, ...prev]);
      
      setNewTitle('');
      setNewDesc('');
      setNewKeywords('');
      showToast('토론방이 생성되었습니다!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '생성 중 오류가 발생했습니다.';
      showToast(errorMessage);
      console.error('방 생성 오류:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRoom = async (id: number) => {
    if (deletingRoomId) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setDeletingRoomId(id);
      await delay(300);
      
      // 내가 만든 토론방 목록에서 제거
      setMyList((prev) => prev.filter((r) => r.id !== id));
      
      // 모든 토론방 목록에서도 제거
      setAllRooms((prev) => prev.filter((r) => r.id !== id));
      
      showToast('토론방이 삭제되었습니다.');
    } catch {
      showToast('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const joinRoom = (id: number) => {
    const mine = myList.some((r) => r.id === id);

    if (mine) {
      setMyList((arr) =>
        arr.map((r) =>
          r.id === id ? { ...r, totalVisits: r.totalVisits + 1 } : r,
        ),
      );
    } else {
      setHotList((arr) =>
        arr.map((r) =>
          r.id === id
            ? {
                ...r,
                currentParticipants: r.currentParticipants + 1,
                totalVisits: r.totalVisits + 1,
              }
            : r,
        ),
      );
    }

    navigate(`/discussion/${id}`);
  };

  const scrollHot = (dir: number) =>
    hotRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  // 모든 토론방 더 불러오기 - 페이지 크기 5로 변경
  const loadMoreAllRooms = async () => {
    if (loadingAllRooms || !hasMoreAllRooms) return;
    
    try {
      setLoadingAllRooms(true);
      await delay(800);
      
      // 페이징 로직
      const pageSize = 5;
      const nextPage = allRoomsPage + 1;
      const startIndex = nextPage * pageSize;
      const endIndex = startIndex + pageSize;
      
      // 샘플 데이터에서 해당 범위의 항목만 가져오기
      const moreRoomsUnsorted = allRoomsSeed.slice(startIndex, endIndex);
      
      // 현재 정렬 설정에 따라 정렬
      const moreRooms = sortRoomsBy(moreRoomsUnsorted, allRoomsSortKey);
      
      // 더 로드할 항목이 있는지 확인
      const hasMore = endIndex < allRoomsSeed.length;
      
      if (moreRooms.length > 0) {
        setAllRooms(prev => [...prev, ...moreRooms]);
        setAllRoomsPage(nextPage);
        setHasMoreAllRooms(hasMore);
      } else {
        setHasMoreAllRooms(false);
      }
    } catch (error) {
      console.error('추가 토론방을 불러오는 중 오류가 발생했습니다:', error);
    } finally {
      setLoadingAllRooms(false);
    }
  };

  /* =============================================================
     렌더링
  ============================================================ */
  return (
    <>
      <Header />

      {/* ────────────────── 메인 ────────────────── */}
      <main className="discussion-container container">
        {/* ── 검색 + 정렬 ─────────────────────── */}
        <div className="search-sort-row">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="토론방 검색..."
            />
            {searchInput && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchInput('')}
                aria-label="검색어 지우기"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="search-btn"
              disabled={isLoadingSearch}
              aria-label="검색"
            >
              🔍
            </button>
          </form>
        </div>

        {/* ── 이모지 레전드 ──────────────────── */}
        <EmojiLegend />

        {/* ── 검색 결과 Active ────────────────── */}
        {searchTerm ? (
          <Section title={`"${searchTerm}" 검색 결과`}>
            {isLoadingSearch ? (
              <div className="skeleton-grid">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="skeleton-card" />
                  ))}
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div className="room-grid">
                  {sortRooms(filtered)
                    .slice(0, searchPageSize)
                    .map((r) => (
                      <Card
                        key={r.id}
                        room={r}
                        onJoin={joinRoom}
                        onDelete={
                          myList.some((m) => m.id === r.id) ? deleteRoom : undefined
                        }
                        isMine={myList.some((m) => m.id === r.id)}
                        highlight={searchTerm}
                      />
                    ))}
                </div>

                {filtered.length > searchPageSize && (
                  <button
                    className="load-more"
                    onClick={() => setSearchPageSize((s) => s + 4)}
                    aria-label="더 보기"
                  >
                    더 보기
                  </button>
                )}
              </>
            ) : (
              <EmptyState message="검색된 토론방이 없습니다." />
            )}
          </Section>
        ) : (
          <>
            {/* ── Hot한 토론방 ───────────────── */}
            <Section title="인기 토론방">
              <div className="carousel-wrapper">
                <button
                  className="hot-nav hot-nav--prev"
                  onClick={() => scrollHot(-1)}
                  aria-label="이전 Hot 방"
                >
                  ◀
                </button>

                <div
                  ref={hotRef}
                  className="hot-carousel"
                  role="region"
                  aria-label="Hot 토론방 목록"
                >
                  {sortRooms(hotList)
                    .slice(0, hotPageSize)
                    .map((r) => (
                      <Card key={r.id} room={r} onJoin={joinRoom} isMine={false} />
                    ))}
                </div>

                <button
                  className="hot-nav hot-nav--next"
                  onClick={() => scrollHot(1)}
                  aria-label="다음 Hot 방"
                >
                  ▶
                </button>
              </div>
            </Section>

            {/* ── 모든 토론방 ────────────────── */}
            <Section title="모든 토론방">
              <div className="section-header-with-sort">
                <div></div> {/* 빈 div로 왼쪽 공간 유지 */}
                <div className="sort-controls">
                  <button
                    className={allRoomsSortKey === 'recent' ? 'active' : ''}
                    onClick={() => handleAllRoomsSortChange('recent')}
                  >
                    최신순
                  </button>
                  <button
                    className={allRoomsSortKey === 'popular' ? 'active' : ''}
                    onClick={() => handleAllRoomsSortChange('popular')}
                  >
                    참여자순
                  </button>
                </div>
              </div>

              {loadingAllRooms && allRooms.length === 0 ? (
                <div className="skeleton-grid">
                  {[...Array(5)].map((_, i) => (
                    <div key={`skeleton-all-${i}`} className="skeleton-card" />
                  ))}
                </div>
              ) : allRooms.length > 0 ? (
                <>
                  <div className="room-grid">
                    {allRooms.map((room) => (
                      <Card 
                        key={`all-${room.id}`} 
                        room={room} 
                        onJoin={joinRoom}
                        highlight={searchTerm} 
                      />
                    ))}
                  </div>
                  {hasMoreAllRooms && (
                    <button 
                      className="load-more" 
                      onClick={loadMoreAllRooms}
                      disabled={loadingAllRooms}
                    >
                      {loadingAllRooms ? '로딩 중...' : '더 보기'}
                    </button>
                  )}
                </>
              ) : (
                <EmptyState message="등록된 토론방이 없습니다." />
              )}
            </Section>

            {/* ── 내 방 ──────────────────────── */}
            <Section title="내 방">
              <div className="room-grid">
                <CreateCard
                  title={newTitle}
                  desc={newDesc}
                  keywords={newKeywords}
                  titleError={titleError}
                  descError={descError}
                  onTitle={setNewTitle}
                  onDesc={setNewDesc}
                  onKeywords={setNewKeywords}
                  onCreate={createRoom}
                  isCreating={isCreating}
                />

                {myList.length > 0 ? (
                  sortRooms(myList)
                    .slice(0, myPageSize)
                    .map((r) => (
                      <Card
                        key={r.id}
                        room={r}
                        onJoin={joinRoom}
                        onDelete={
                          deletingRoomId === r.id ? undefined : deleteRoom
                        }
                        isMine
                      />
                    ))
                ) : (
                  <EmptyState message="아직 생성된 방이 없습니다. ✨" />
                )}
              </div>

              {myList.length > myPageSize && (
                <button
                  className="load-more"
                  onClick={() => setMyPageSize((s) => s + 4)}
                  aria-label="더 보기"
                >
                  더 보기
                </button>
              )}
            </Section>
          </>
        )}
      </main>

      {/* ────────────────── 토스트 ────────────────── */}
      {toastMsg && <Toast message={toastMsg} />}
    </>
  );
}
