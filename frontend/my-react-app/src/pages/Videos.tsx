// src/pages/Videos.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export interface YTVideo {
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

export const LABEL: Record<Bias, string> = {
  left: '진보',
  center: '중도',
  right: '보수',
};

export default function VideosPage() {
  const { t } = useTranslation();
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
      setError(t('videos.error.apiKeyMissing'));
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
      setError(err.message || t('videos.error.default'));
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- URL 파라미터 감지 -------------------- */
  useEffect(() => {
    if (param) {
      setQuery(param);
      fetchVideos(param);
    }
  }, [param]);

  /* ------------------------- 검색 폼 ------------------------- */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchParams({ search: trimmed });
  };

  /* ------------------------- 카드 ------------------------- */
  const Card = ({ v }: { v: YTVideo }) => (
    <div
      className="video-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/videos/${v.videoId}`, { state: { video: v } })}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          navigate(`/videos/${v.videoId}`, { state: { video: v } });
        }
      }}
    >
      <img src={v.thumbnail} alt={v.title} />
      <div className="info">
        <h3>{v.title}</h3>
        <p>{v.channel}</p>
      </div>
    </div>
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
        {t(`videos.bias.${bias}`)}
      </h2>

      {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}

      {!loading && videos[bias].length === 0 && searched && (
        <p className="msg empty">{t('videos.noResults')}</p>
      )}

      {!loading &&
        videos[bias].map((v) => <Card key={v.videoId} v={v} />)}
    </section>
  );

  /* -------------------------- UI ------------------------- */
  return (
    <>
      <main className="videos-page">
        {/* 검색창 */}
        <div className="container hero-middle">
          <form onSubmit={handleSearch} className="search-bar-container" role="search">
            <input
              type="text"
              placeholder={t('videos.searchPlaceholder')}
              aria-label={t('videos.searchAria')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? t('videos.searching') : t('videos.search')}
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
