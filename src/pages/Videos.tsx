// src/pages/Videos.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Videos.css';

/* -------------------------------------------------- */
/*  환경 변수 : YouTube API KEY                       */
/* -------------------------------------------------- */
const API_KEY: string =
  //  Vite / CRA 어느 쪽이든 동작하도록 처리
  //  @ts-ignore
  (import.meta as any)?.env?.VITE_YT_API_KEY ??
  process.env.REACT_APP_YT_API_KEY ??
  '';

type Bias = 'left' | 'center' | 'right';

interface YTVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  bias: Bias;
}

/* 간단 편향 분류 */
const classifyBias = ({ title }: Pick<YTVideo, 'title'>): Bias => {
  const t = title.toLowerCase();
  if (/(progressive|민주|진보|left|bernie|복지)/.test(t)) return 'left';
  if (/(conservative|보수|trump|우파|gop|market)/.test(t)) return 'right';
  return 'center';
};

const LABEL: Record<Bias, string> = {
  left: '좌파',
  center: '중도',
  right: '우파',
};

export default function VideosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('search') || '';

  /* ------------------------- 상태 ------------------------- */
  const [query, setQuery]       = useState(param);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [searched, setSearched] = useState(false);
  const [videos, setVideos]     = useState<Record<Bias, YTVideo[]>>({
    left:   [],
    center: [],
    right:  [],
  });

  /* ------------------------- API 호출 ------------------------- */
  const fetchVideos = async (q: string) => {
    setLoading(true);
    setError('');
    setSearched(true);

    if (!API_KEY) {
      setError('YouTube API 키가 설정되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const url =
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=30` +
        `&q=${encodeURIComponent(q)}&key=${API_KEY}`;
      const data = await (await fetch(url)).json();
      if (data.error) throw new Error(data.error.message);

      const bucket: Record<Bias, YTVideo[]> = { left: [], center: [], right: [] };
      data.items.forEach((it: any) => {
        const v: YTVideo = {
          videoId:   it.id.videoId,
          title:     it.snippet.title,
          channel:   it.snippet.channelTitle,
          thumbnail: it.snippet.thumbnails.medium.url,
          bias:      classifyBias(it.snippet),
        };
        bucket[v.bias].push(v);
      });
      setVideos(bucket);
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- URL 파라미터 감지 -------------------- */
  useEffect(() => {
    if (param) {
      // URL 쿼리(search) 가 변경되면 API 재호출
      setQuery(param);
      fetchVideos(param);
    }
  }, [param]);

  /* ------------------------- 검색 폼 ------------------------- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // URL 쿼리 갱신 → useEffect 에서 fetchVideos 호출
    setSearchParams({ search: trimmed });
    // (원한다면 navigate(`/videos?search=${encodeURIComponent(trimmed)}`); 로도 가능)
  };

  /* ------------------------- 카드 ------------------------- */
  const Card = ({ v }: { v: YTVideo }) => (
    <a
      href={`https://youtu.be/${v.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
    >
      <img src={v.thumbnail} alt={v.title} />
      <div className="info">
        <h3>{v.title}</h3>
        <p>{v.channel}</p>
      </div>
    </a>
  );

  /* ---------------------- 스켈레톤 ----------------------- */
  const Skeleton = () => (
    <div className="video-card skeleton">
      <div className="thumb" />
      <div className="info">
        <div className="line w80" />
        <div className="line w50" />
      </div>
    </div>
  );

  /* ------------------------- 컬럼 ------------------------ */
  const Column = ({ bias }: { bias: Bias }) => (
    <section className={`col ${bias}`} aria-labelledby={`${bias}-heading`}>
      <h2 id={`${bias}-heading`} className="col-heading">
        {LABEL[bias]}
      </h2>

      {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}

      {!loading && videos[bias].length === 0 && searched && (
        <p className="msg empty">결과 없음</p>
      )}

      {!loading &&
        videos[bias].map((v) => (
          <Card key={v.videoId} v={v} />
        ))}
    </section>
  );

  /* -------------------------- UI ------------------------- */
  return (
    <>
      <Header />

      <main className="videos-page">
        {/* 검색창 */}
        <div className="container hero-middle">
          <form onSubmit={handleSearch} className="search-bar-container" role="search">
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="동영상 검색어 입력"
            />
            <button type="submit" disabled={loading}>
              {loading ? '검색 중…' : '검색'}
            </button>
          </form>
        </div>

        {/* 결과 영역 */}
        <div className="container">
          {error && (
            <p className="msg error" role="alert">
              {error}
            </p>
          )}

          <div className="grid">
            {(['left', 'center', 'right'] as Bias[]).map((b) => (
              <Column bias={b} key={b} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
