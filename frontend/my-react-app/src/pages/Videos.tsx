// src/pages/Videos.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Videos.css';
import parse from 'html-react-parser';
import { useTranslation } from 'react-i18next';

type Bias = 'left' | 'center' | 'right';

export interface YTVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  bias: Bias;
  score: number;
  publishedAt: number | null;
}

// 서버 원본 데이터 타입
interface RawVideo {
  id: string;
  title: string;
  videoUrl: string;
  biasScore: number;
  publishedAt: number | null;
}

const mapBias = (value: number): Bias => {
  if (value <= -0.3) return 'left';
  if (value <= 0.3) return 'center';
  return 'right';
};

export const LABEL: Record<Bias, string> = {
  left: '진보',
  center: '중도',
  right: '보수',
};

const extractVideoId = (url: string): string => {
  try {
    const params = new URL(url).searchParams;
    return params.get('v') || '';
  } catch {
    return '';
  }
};

export default function VideosPage() {
  const { t } = useTranslation(); // i18n 지원
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('search') || '';

  const [query, setQuery] = useState(param);
  const [searched, setSearched] = useState(false);
  const [videos, setVideos] = useState<Record<Bias, YTVideo[]>>({
    left: [], center: [], right: [],
  });

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (!param) return;
    setQuery(param);
    setSearched(true);

    const fetchVideos = async () => {
      try {
        const res = await fetch(
            `http://localhost:8080/search/titles?query=${encodeURIComponent(param)}`
        );
        if (!res.ok) throw new Error(res.statusText);

        const rawData: RawVideo[] = await res.json();

        const converted: YTVideo[] = rawData.map(v => {
          const videoId = extractVideoId(v.videoUrl);
          return {
            videoId,
            title: v.title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoUrl: v.videoUrl,
            bias: mapBias(v.biasScore),
            score: v.biasScore,
            publishedAt: v.publishedAt,
          };
        });

        setVideos({
          left:   converted.filter(v => v.bias === 'left'),
          center: converted.filter(v => v.bias === 'center'),
          right:  converted.filter(v => v.bias === 'right'),
        });
      } catch (err) {
        console.error('검색 중 에러 발생:', err);
        setVideos({ left: [], center: [], right: [] });
      }
    };

    fetchVideos();
  }, [param]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = query.trim();
    if (!t) return;
    setSearchParams({ search: t });
  };

  const Card = ({ v }: { v: YTVideo }) => (
      <Link
          to={`/videos/${v.videoId}`}
          state={{ video: v, videoUrl: v.videoUrl }}
          className="video-card"
      >
        <img src={v.thumbnail} alt={v.title} />
        <div className="info">
          <h3>{parse(v.title)}</h3>
          <p className="upload-date">
            {t('videos.uploaded')}:{" "}
            {v.publishedAt
                ? new Date(v.publishedAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                })
                : t('videos.unknown')}
          </p>
          <p className="bias-info">
            {t('videos.biasScore')}: ({v.score.toFixed(2)})
          </p>
        </div>
      </Link>
  );

  const Column = ({ bias }: { bias: Bias }) => {
    const sorted = [...videos[bias]].sort((a, b) => {
      if (a.publishedAt == null || b.publishedAt == null) return 0;
      return sortOrder === 'newest'
          ? b.publishedAt - a.publishedAt
          : a.publishedAt - b.publishedAt;
    });

    return (
        <section className={`col ${bias}`} aria-labelledby={`${bias}-heading`}>
          <h2 id={`${bias}-heading`} className="col-heading">{t(`videos.bias.${bias}`)}</h2>
          {!searched && <p className="msg empty">{t('videos.enterKeyword')}</p>}
          {searched && sorted.length === 0 && <p className="msg empty">{t('videos.noResults')}</p>}
          {sorted.map(v => <Card key={v.videoId} v={v} />)}
        </section>
    );
  };

  return (
      <>
        <Header />
        <main className="videos-page">
          <div className="container hero-middle">
            <form onSubmit={handleSearch} className="search-bar-container" role="search">
              <input
                  type="text"
                  placeholder={t('videos.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={t('videos.searchAria')}
              />
              <button type="submit">{t('videos.search')}</button>
            </form>
          </div>

          <div className="container sort-bar">
            <label htmlFor="sortOrder">{t('videos.sort')}:</label>
            <select
                id="sortOrder"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
            >
              <option value="newest">{t('videos.newest')}</option>
              <option value="oldest">{t('videos.oldest')}</option>
            </select>
          </div>

          <div className="container">
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
