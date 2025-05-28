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
  creator: string;
};

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
        <div className="card-header">
          <h3>{hl(room.title)}</h3>
          <div className="room-stats">
            <span>💬 {room.currentParticipants}</span>
            <span>👀 {room.totalVisits}</span>
            <span>📅 {room.createdAt}</span>
          </div>
        </div>
        <p>{hl(room.description)}</p>

        <div className="room-keywords">
          {room.keywords.map((k, i) => (
              <span key={i}>#{k}</span>
          ))}
        </div>

        <div className="room-creator">
          <span>생성자: {room.creator}</span>
        </div>

        <div className="card-actions">
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
  const [hotList, setHotList] = useState<Dialogue[]>([]);
  const [allRooms, setAllRooms] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);

  // 정렬 키 - 로컬스토리지 사용하지 않음
  const [allRoomsSortKey, setAllRoomsSortKey] = useState<'recent' | 'popular'>('recent');

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchPageSize, setSearchPageSize] = useState(5);

  // 정렬 키 - 로컬스토리지 사용하지 않음
  const [sortKey, setSortKey] = useState<'recent' | 'popular'>('recent');

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => setToastMsg(msg);

  const [showCreateForm, setShowCreateForm] = useState(false);

  /* ----- refs & side-effects ----------------------------------- */
  const scrollKeep = useRef<number>(0);
  const hotRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, checkAuth } = useAuth();

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

  // 토스트 타이머
  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(id);
  }, [toastMsg]);

  // API URL 상수 추가
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  // API 호출 함수 수정
  const fetchHotRooms = async () => {
    try {
      const response = await fetch(`/api/debate-rooms/hot`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 세션 쿠키 포함
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다');
        }
        throw new Error('인기 토론방을 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setHotList(data);
    } catch (error) {
      console.error('Error fetching hot rooms:', error);
      showToast(error instanceof Error ? error.message : '오류가 발생했습니다');
    }
  };

  const fetchAllRooms = async () => {
    try {
      const response = await fetch(`/api/debate-rooms`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 세션 쿠키 포함
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다');
        }
        throw new Error('토론방 목록을 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setAllRooms(sortRoomsBy(data, allRoomsSortKey));
    } catch (error) {
      console.error('Error fetching all rooms:', error);
      showToast(error instanceof Error ? error.message : '오류가 발생했습니다');
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHotRooms(),
        fetchAllRooms()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  /* ----- 정렬 & 필터 ------------------------------------------ */
  // 모든 토론방 정렬 변경 이벤트 핸들러 (로컬스토리지 저장 제거)
  const handleAllRoomsSortChange = (newSortKey: 'recent' | 'popular') => {
    setAllRoomsSortKey(newSortKey);
    
    // 모든 토론방 재정렬
    setAllRooms(prev => sortRoomsBy(prev, newSortKey));
  };

  const sortRooms = (rooms: Dialogue[]) =>
    [...rooms].sort((a, b) =>
      sortKey === 'popular'
        ? b.totalVisits - a.totalVisits
        : b.createdAt.localeCompare(a.createdAt),
    );

  const filtered = React.useMemo(
    () =>
      [...hotList, ...allRooms].filter(
        (r) =>
          r.title.includes(searchTerm) ||
          r.description.includes(searchTerm) ||
          r.keywords.some((k) => k.includes(searchTerm)),
      ),
    [searchTerm, hotList, allRooms],
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
    
    // 유효성 검사
    let hasError = false;
    if (newTitle.trim().length < 3 || newTitle.trim().length > 50) {
      setTitleError('제목은 3~50자 사이여야 합니다.');
      hasError = true;
    } else {
      setTitleError('');
    }
    
    if (newDesc.trim().length < 10 || newDesc.trim().length > 200) {
      setDescError('설명은 10~200자 사이여야 합니다.');
      hasError = true;
    } else {
      setDescError('');
    }
    
    if (hasError) return;

    try {
      setIsCreating(true);
      
      // 키워드 처리 - 쉼표로 분리하고 공백 제거, 빈 문자열 제거
      const processedKeywords = newKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
        .slice(0, 5); // 최대 5개만 사용
      
      const response = await fetch(`/api/debate-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 세션 쿠키 포함
        body: JSON.stringify({
          title: newTitle.trim(),
          topic: newDesc.trim(), // description을 topic으로 변경
          keywords: processedKeywords
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('방 생성 오류:', errorText);
        throw new Error(errorText || '토론방 생성에 실패했습니다');
      }

      const data = await response.json();
      console.log('생성된 토론방:', data);
      
      // 폼 초기화
      setNewTitle('');
      setNewDesc('');
      setNewKeywords('');
      setShowCreateForm(false);
      
      // 토론방 목록 새로고침
      await Promise.all([
        fetchHotRooms(),
        fetchAllRooms()
      ]);
      
      showToast('토론방이 생성되었습니다!');

      // 생성된 방으로 바로 입장
      navigate(`/discussion/${data.id}`);

    } catch (error) {
      console.error('방 생성 오류:', error);
      showToast(error instanceof Error ? error.message : '방 생성 중 오류가 발생했습니다');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRoom = async (id: number) => {
    if (deletingRoomId) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setDeletingRoomId(id);
      
      const response = await fetch(`/api/debate-rooms/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 세션 쿠키 포함
      });

      if (!response.ok) {
        throw new Error('토론방 삭제에 실패했습니다');
      }

      // 목록 갱신
      await Promise.all([
        fetchAllRooms(),
        fetchHotRooms()
      ]);
      
      showToast('토론방이 삭제되었습니다.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const joinRoom = async (id: number) => {
    if (!isAuthenticated) {
        showToast('로그인이 필요합니다.');
        return;
    }

    try {
        const response = await fetch(`/api/debate-rooms/${id}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // 세션 쿠키 포함
        });

        if (!response.ok) {
            throw new Error('토론방 참여에 실패했습니다.');
        }

        const updatedRoom = await response.json();
        
        // 참여자 수와 방문자 수 업데이트
        setAllRooms(prev => 
            prev.map(r => r.id === id ? {
                ...r, 
                currentParticipants: updatedRoom.currentParticipants,
                totalVisits: updatedRoom.totalVisits
            } : r)
        );
        setHotList(prev => 
            prev.map(r => r.id === id ? {
                ...r, 
                currentParticipants: updatedRoom.currentParticipants,
                totalVisits: updatedRoom.totalVisits
            } : r)
        );

        navigate(`/discussion/${id}`);
    } catch (error) {
        showToast(error instanceof Error ? error.message : '참여 중 오류가 발생했습니다');
    }
  };

  const scrollHot = (dir: number) =>
    hotRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  // 데이터 로드 함수 개선
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchHotRooms(),
        fetchAllRooms()
      ]);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      showToast('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드 및 주기적 새로고침
  useEffect(() => {
    loadAllData();
    
    // 5분마다 데이터 새로고침 (선택적)
    const refreshInterval = setInterval(() => {
      fetchHotRooms();
      fetchAllRooms();
    }, 300000); // 5분
    
    return () => clearInterval(refreshInterval);
  }, []);

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
                          allRooms.some((m) => m.id === r.id) ? deleteRoom : undefined
                        }
                        isMine={allRooms.some((m) => m.id === r.id)}
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
            {/* ── HOT한 토론방 ───────────────── */}
            <Section title="HOT한 토론방">
              <div className="hot-rooms-grid">
                {hotList.length > 0 ? (
                  hotList.map((r) => (
                    <Card 
                      key={r.id} 
                      room={r} 
                      onJoin={joinRoom} 
                      isMine={false} 
                    />
                  ))
                ) : (
                  <EmptyState message="아직 HOT한 토론방이 없습니다. 첫 토론을 시작해보세요! 🎉" />
                )}
              </div>
            </Section>

            {/* ── 모든 토론방 ────────────────── */}
            <Section title="모든 토론방">
              <div className="section-header-with-sort">
                <div className="create-room-button">
                  <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn-create-room"
                  >
                    {showCreateForm ? '✕ 닫기' : '+ 새 토론방 만들기'}
                  </button>
                </div>
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

              {/* 토론방 생성 폼 */}
              {showCreateForm && (
                <div className="create-room-form">
                  <div className="form-group">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="토론 주제를 입력하세요 (3~50자)"
                      className={titleError ? 'error' : ''}
                    />
                    {titleError && <div className="error-text">{titleError}</div>}
                  </div>
                  
                  <div className="form-group">
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="토론 설명을 입력하세요 (10~200자)"
                      className={descError ? 'error' : ''}
                    />
                    {descError && <div className="error-text">{descError}</div>}
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      value={newKeywords}
                      onChange={(e) => setNewKeywords(e.target.value)}
                      placeholder="키워드를 입력하세요 (쉼표로 구분, 최대 5개)"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      onClick={createRoom}
                      disabled={isCreating}
                      className="btn-submit"
                    >
                      {isCreating ? '생성 중...' : '토론방 생성하기'}
                    </button>
                  </div>
                </div>
              )}

              {/* 토론방 목록 */}
              {loading && allRooms.length === 0 ? (
                <div className="skeleton-grid">
                  {[...Array(5)].map((_, i) => (
                    <div key={`skeleton-all-${i}`} className="skeleton-card" />
                  ))}
                </div>
              ) : allRooms.length > 0 ? (
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
              ) : (
                <EmptyState message="등록된 토론방이 없습니다." />
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
