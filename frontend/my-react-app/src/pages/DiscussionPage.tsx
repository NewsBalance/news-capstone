import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Discussion.css';

interface Dialogue {
  id: number;
  title: string;
  description: string;
  currentParticipants: number;
  totalVisits: number;
  createdAt: string;
  keywords: string[];
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// 샘플 Hot 토론방 8개
const hotSeed: Dialogue[] = [
  { id: 1, title: '대선후보 검증 토론', description: '공약·신뢰성 토론', currentParticipants: 20, totalVisits: 124, createdAt: '2025-04-16', keywords: ['정치','대선'] },
  { id: 2, title: '기후변화 정책 분석', description: '국내외 대응 비교',    currentParticipants: 15, totalVisits:  89, createdAt: '2025-04-15', keywords: ['환경','정책'] },
  { id: 3, title: 'AI 윤리와 규제',     description: '기술·윤리적 쟁점',    currentParticipants:  8, totalVisits:  76, createdAt: '2025-04-14', keywords: ['AI','윤리'] },
  { id: 4, title: '교육개혁 방향 토론', description: '입시·커리큘럼 개편',  currentParticipants:  5, totalVisits:  54, createdAt: '2025-04-13', keywords: ['교육','개혁'] },
  { id: 5, title: '부동산 시장 전망',   description: '가격 동향 및 규제',    currentParticipants: 12, totalVisits:  98, createdAt: '2025-04-12', keywords: ['경제','부동산'] },
  { id: 6, title: '병역제도 개선',     description: '모병제 vs 징병제',    currentParticipants:  3, totalVisits:  47, createdAt: '2025-04-11', keywords: ['사회','병역'] },
  { id: 7, title: '디지털 자산 규제',   description: '암호화폐·NFT 정책',   currentParticipants:  7, totalVisits:  63, createdAt: '2025-04-10', keywords: ['IT','규제'] },
  { id: 8, title: '청년 일자리 해법',   description: '창업·인턴십 지원',      currentParticipants: 10, totalVisits:  82, createdAt: '2025-04-09', keywords: ['사회','일자리'] },
];

// 이모지 레전드
const EmojiLegend: React.FC = () => (
  <div className="emoji-legend" role="note">
    <span>💬 실시간 참여자</span>
    <span>👀 총 방문자</span>
    <span>📅 생성 날짜</span>
  </div>
);

// 섹션 컴포넌트
interface SectionProps { title: string; children: ReactNode }
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="room-section" aria-labelledby={`section-${title}`}>
    <h2 id={`section-${title}`} className="section-title">{title}</h2>
    {children}
  </section>
);

// 카드 컴포넌트
interface CardProps {
  room: Dialogue;
  onJoin: (id: number) => void;
  onDelete?: (id: number) => void;
  isMine?: boolean;
  highlight?: string;
}
const Card: React.FC<CardProps> = ({ room, onJoin, onDelete, isMine, highlight }) => {
  const hl = (text: string) => {
    if (!highlight) return text;
    const re = new RegExp(`(${highlight})`, 'gi');
    return text.split(re).map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? <mark key={i}>{part}</mark> : part
    );
  };
  return (
    <div className="dialogue-card" role="region" aria-label={`토론방: ${room.title}`} tabIndex={0}>
      <h3 className="dialogue-title">{hl(room.title)}</h3>
      <p className="dialogue-desc">{hl(room.description)}</p>
      <div className="keyword-tags" aria-label="키워드">
        {room.keywords.map((k,i) => <span key={i} className="keyword-tag">#{k}</span>)}
      </div>
      <p className="dialogue-meta">
        <span className="meta-item">💬 {room.currentParticipants}</span>
        <span className="meta-item">👀 {room.totalVisits}</span>
        <span className="meta-item">📅 {room.createdAt}</span>
      </p>
      <div className="card-actions">
        <button className="btn-join" onClick={() => onJoin(room.id)} aria-label={`${room.title} 방 참여`}>참여</button>
        {isMine && onDelete && (
          <button className="btn-delete" onClick={() => onDelete(room.id)} aria-label={`${room.title} 방 삭제`}>삭제</button>
        )}
      </div>
    </div>
  );
};

// 생성 카드 컴포넌트
interface CreateCardProps {
  title: string;
  desc: string;
  keywords: string;
  titleError?: string;
  descError?: string;
  onTitle: (v: string) => void;
  onDesc: (v: string) => void;
  onKeywords: (v: string) => void;
  onCreate: (e: React.FormEvent) => void;
  isCreating: boolean;
}
const CreateCard: React.FC<CreateCardProps> = ({
  title, desc, keywords, titleError, descError,
  onTitle, onDesc, onKeywords, onCreate, isCreating
}) => (
  <div className="dialogue-card create-dialogue-card" role="form" aria-labelledby="create-form-title">
    <h3 id="create-form-title" className="create-header">🆕 새 토론방 생성</h3>
    <form onSubmit={onCreate} noValidate>
      <input
        type="text"
        value={title}
        onChange={e => onTitle(e.target.value)}
        placeholder="제목 (3~50자)"
        maxLength={50}
        aria-invalid={!!titleError}
      />
      {titleError && <div className="error-text">{titleError}</div>}
      <textarea
        value={desc}
        onChange={e => onDesc(e.target.value)}
        placeholder="설명 (10~200자)"
        maxLength={200}
        aria-invalid={!!descError}
      />
      {descError && <div className="error-text">{descError}</div>}
      <input
        type="text"
        value={keywords}
        onChange={e => onKeywords(e.target.value)}
        placeholder="키워드 (최대5개, 콤마 구분)"
      />
      <div className="point-info">포인트 제한: <strong>50</strong></div>
      <button type="submit" className="btn-create" disabled={isCreating} aria-busy={isCreating}>
        {isCreating ? '생성 중…' : '생성'}
      </button>
    </form>
  </div>
);

// 빈 상태
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="empty-state" role="alert">
    <div className="empty-illu" aria-hidden="true">📭</div>
    <p>{message}</p>
  </div>
);

// 토스트
const Toast: React.FC<{ message: string }> = ({ message }) => (
  <div className="toast" role="status" aria-live="polite">{message}</div>
);

const DiscussionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<number>(0);
  const hotCarouselRef = useRef<HTMLDivElement>(null);

  // 상태 정의
  const [hotList, setHotList] = useState<Dialogue[]>(hotSeed);
  const [myList, setMyList]   = useState<Dialogue[]>(() => {
    const s = localStorage.getItem('myDiscussionRooms');
    return s ? JSON.parse(s) : [];
  });

  const [searchInput, setSearchInput]       = useState('');
  const [searchTerm, setSearchTerm]         = useState('');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchPageSize, setSearchPageSize]   = useState(4);

  const [sortKey, setSortKey] = useState<'recent'|'popular'>(() =>
    localStorage.getItem('discussionSortKey') === 'popular' ? 'popular' : 'recent'
  );

  const [hotPageSize, setHotPageSize] = useState(8);
  const [myPageSize, setMyPageSize]   = useState(4);

  const [newTitle, setNewTitle]       = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [isCreating, setIsCreating]   = useState(false);
  const [titleError, setTitleError]   = useState('');
  const [descError, setDescError]     = useState('');
  const [deletingRoomId, setDeletingRoomId] = useState<number|null>(null);

  const [toastMsg, setToastMsg] = useState<string|null>(null);
  const showToast = (msg: string) => setToastMsg(msg);

  // 사이드 이펙트
  useEffect(() => {
    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { window.scrollTo(0, scrollRef.current); }, [location.key]);

  useEffect(() => {
    localStorage.setItem('discussionSortKey', sortKey);
  }, [sortKey]);

  useEffect(() => {
    localStorage.setItem('myDiscussionRooms', JSON.stringify(myList));
  }, [myList]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(id);
  }, [toastMsg]);

  // 정렬 함수
  const sortRooms = (rooms: Dialogue[]) => {
    return [...rooms].sort((a, b) => {
      if (sortKey === 'popular') {
        return b.totalVisits - a.totalVisits;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // 검색 제출
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSearch(true);
    await delay(300);
    setSearchTerm(searchInput.trim());
    setSearchPageSize(4);
    setIsLoadingSearch(false);
  };

  // 방 생성
  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');
    setDescError('');
    const t = newTitle.trim(), d = newDesc.trim();
    if (t.length < 3 || t.length > 50) {
      setTitleError('제목은 3~50자 사이입니다.');
      return;
    }
    if (d.length < 10 || d.length > 200) {
      setDescError('설명은 10~200자 사이입니다.');
      return;
    }
    const kws = Array.from(new Set(
      newKeywords.split(',').map(k => k.trim()).filter(k => !!k)
    ));
    if (kws.length > 5) {
      showToast('키워드는 최대 5개까지 허용됩니다.');
      return;
    }
    try {
      setIsCreating(true);
      await delay(500);
      const next: Dialogue = {
        id: Date.now(),
        title: t,
        description: d,
        currentParticipants: 1,
        totalVisits: 1,
        createdAt: new Date().toISOString().slice(0,10),
        keywords: kws,
      };
      setMyList(prev => [next, ...prev]);
      setNewTitle(''); setNewDesc(''); setNewKeywords('');
      showToast('토론방이 생성되었습니다!');
    } catch {
      showToast('생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 방 삭제
  const deleteRoom = async (id: number) => {
    if (deletingRoomId) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      setDeletingRoomId(id);
      await delay(300);
      setMyList(prev => prev.filter(r => r.id !== id));
      showToast('토론방이 삭제되었습니다.');
    } catch {
      showToast('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingRoomId(null);
    }
  };

  // 방 참여
  const joinRoom = (id: number) => {
    const mine = myList.some(r => r.id === id);
    if (mine) {
      setMyList(list =>
        list.map(r => r.id === id ? { ...r, totalVisits: r.totalVisits + 1 } : r)
      );
    } else {
      setHotList(list =>
        list.map(r =>
          r.id === id
            ? { ...r, currentParticipants: r.currentParticipants + 1, totalVisits: r.totalVisits + 1 }
            : r
        )
      );
    }
    navigate(`/discussion/${id}`);
  };

  // 검색 필터
  const filtered = React.useMemo(() => {
    return [...hotList, ...myList].filter(r =>
      r.title.includes(searchTerm) ||
      r.description.includes(searchTerm) ||
      r.keywords.some(k => k.includes(searchTerm))
    );
  }, [searchTerm, hotList, myList]);

  // Hot 캐러셀 스크롤
  const scrollHot = (dir: number) => {
    if (!hotCarouselRef.current) return;
    hotCarouselRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="site-logo">NewsBalance</Link>
          <nav className="nav-menu">
            <ul>
              <li><Link to="/">홈</Link></li>
              <li><Link to="/discussion" className="active">토론장</Link></li>
              <li><Link to="/mypage">마이페이지</Link></li>
              <li><Link to="/login" className="login-btn">로그인</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="discussion-container container">
        {/* 검색 + 정렬 */}
        <form className="search-bar" onSubmit={handleSearchSubmit} aria-label="토론방 검색 및 정렬">
          <div className="search-container">
            <div className="search-wrapper">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="토론방 검색"
                aria-label="검색어 입력"
              />
              {searchInput && (
                <button type="button" className="clear-btn" onClick={() => { setSearchInput(''); setSearchTerm(''); }} aria-label="검색어 삭제">×</button>
              )}
              <button type="submit" className="search-submit" aria-label="검색">🔎</button>
            </div>
            <div className="sort-buttons" role="group" aria-label="정렬 옵션">
              <button type="button" className={`sort-btn ${sortKey==='recent'?'active':''}`} onClick={() => setSortKey('recent')}>최신순</button>
              <button type="button" className={`sort-btn ${sortKey==='popular'?'active':''}`} onClick={() => setSortKey('popular')}>인기순</button>
            </div>
          </div>
        </form>

        <EmojiLegend />

        {searchTerm ? (
          <Section title={`“${searchTerm}” 검색 결과`}>
            {isLoadingSearch ? (
              <div className="skeleton-grid">
                {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton-card"/>)}
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div className="room-grid">
                  {sortRooms(filtered).slice(0, searchPageSize).map(r => (
                    <Card
                      key={r.id}
                      room={r}
                      onJoin={joinRoom}
                      onDelete={myList.some(m => m.id === r.id) ? deleteRoom : undefined}
                      isMine={myList.some(m => m.id === r.id)}
                      highlight={searchTerm}
                    />
                  ))}
                </div>
                {filtered.length > searchPageSize && (
                  <button className="load-more" onClick={() => setSearchPageSize(s => s + 4)} aria-label="더 보기">
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
            {/* Hot한 토론방 */}
            <Section title="Hot한 토론방">
              <div className="carousel-wrapper">
                <button className="hot-nav hot-nav--prev" onClick={() => scrollHot(-1)} aria-label="이전 Hot 방">◀</button>
                <div
                  ref={hotCarouselRef}
                  className="hot-carousel"
                  role="region"
                  aria-label="Hot 토론방 목록"
                >
                  {sortRooms(hotList).slice(0, hotPageSize).map(r => (
                    <Card key={r.id} room={r} onJoin={joinRoom} isMine={false}/>
                  ))}
                </div>
                <button className="hot-nav hot-nav--next" onClick={() => scrollHot(1)} aria-label="다음 Hot 방">▶</button>
              </div>
            </Section>

            {/* 내 방 */}
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
                  sortRooms(myList).slice(0, myPageSize).map(r => (
                    <Card
                      key={r.id}
                      room={r}
                      onJoin={joinRoom}
                      onDelete={deletingRoomId === r.id ? undefined : deleteRoom}
                      isMine
                    />
                  ))
                ) : (
                  <EmptyState message="아직 생성된 방이 없습니다. ✨" />
                )}
              </div>
              {myList.length > myPageSize && (
                <button className="load-more" onClick={() => setMyPageSize(s => s + 4)} aria-label="더 보기">
                  더 보기
                </button>
              )}
            </Section>
          </>
        )}
      </main>

      {toastMsg && <Toast message={toastMsg}/>}
    </>
  );
};

export default DiscussionPage;
