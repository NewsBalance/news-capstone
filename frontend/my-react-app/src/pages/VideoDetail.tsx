// src/pages/VideoDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SettingsMenu from '../components/SettingsMenu';
import '../styles/VideoDetail.css';
import { YTVideo, LABEL } from './Videos';
import { API_BASE } from '../api/config';

type Bias = YTVideo['bias'];

interface TranscriptAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  summary: string;
  bias: Bias;
}

interface VideoStats {
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

interface Article {
  title: string;
  source: string;
  url: string;
}

interface Room {
  id: string;
  name: string;
  participants: number;
}

export default function VideoDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { video: YTVideo } };
  const { videoId: paramId } = useParams<{ videoId: string }>();

  const [video, setVideo] = useState<YTVideo | null>(state?.video ?? null);

  useEffect(() => {
    if (!video && paramId) {
      setVideo({
        videoId: paramId,
        title: t('videoDetail.testTitle'),
        channel: t('videoDetail.testChannel'),
        bias: 'center',
        thumbnail: `https://img.youtube.com/vi/${paramId}/hqdefault.jpg`,
      });
    }
  }, [video, paramId, t]);

  useEffect(() => {
    if (!video && !paramId) {
      navigate('/videos', { replace: true });
    }
  }, [video, paramId, navigate]);

  const [stats, setStats] = useState<VideoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');

  const [articles, setArticles] = useState<Article[]>([]);
  const [artLoading, setArtLoading] = useState(false);
  const [artError, setArtError] = useState('');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');

  const API_KEY =
    // @ts-ignore
    (import.meta as any)?.env?.VITE_YT_API_KEY ??
    process.env.REACT_APP_YT_API_KEY ??
    '';

  const biasDesc: Record<Bias, string> = {
    left: t('videoDetail.biasDesc.left'),
    center: t('videoDetail.biasDesc.center'),
    right: t('videoDetail.biasDesc.right'),
  };

  // 1) 메타데이터 fetch
  useEffect(() => {
    if (!video) return;
    setStatsLoading(true);
    setStatsError('');
    fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${video.videoId}&key=${API_KEY}`
    )
      .then(res =>
        res.json().then(data => {
          if (!res.ok || !data.items?.length) throw new Error();
          const it = data.items[0];
          setStats({
            publishedAt: it.snippet.publishedAt,
            viewCount: it.statistics.viewCount,
            likeCount: it.statistics.likeCount,
            commentCount: it.statistics.commentCount,
          });
        })
      )
      .catch(() => setStatsError(t('videoDetail.error.stats')))
      .finally(() => setStatsLoading(false));
  }, [video, API_KEY, t]);

  // 2) 자막 분석 fetch
  useEffect(() => {
    if (!video) return;
    setSubLoading(true);
    setSubError('');
    fetch(`${API_BASE}/analyzeTranscript?videoId=${video.videoId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: TranscriptAnalysis) => setAnalysis(data))
      .catch(() => setSubError(t('videoDetail.error.transcript')))
      .finally(() => setSubLoading(false));
  }, [video, t]);

  // 3) 관련 기사 fetch
  useEffect(() => {
    if (!video) return;
    setArtLoading(true);
    setArtError('');
    fetch(`${API_BASE}/getRelatedArticles?videoId=${video.videoId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Article[]) => setArticles(data))
      .catch(() => setArtError(t('videoDetail.error.articles')))
      .finally(() => setArtLoading(false));
  }, [video, t]);

  // 4) 토론방 fetch
  useEffect(() => {
    if (!video) return;
    setRoomsLoading(true);
    setRoomsError('');
    fetch(`${API_BASE}/getDiscussionRooms?videoId=${video.videoId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Room[]) => setRooms(data))
      .catch(() => setRoomsError(t('videoDetail.error.rooms')))
      .finally(() => setRoomsLoading(false));
  }, [video, t]);

  if (!video) return null;

  return (
    <>
      <SettingsMenu />

      <main className="video-detail-page">
        <div className="video-header">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <h1 className="video-title">{video.title}</h1>
          <p className="video-channel">📺 {video.channel}</p>

          <div className="classification">
            <span className={`bias-tag ${video.bias}`}>
              {t('videoDetail.titleBased')}: {LABEL[video.bias]}
            </span>
            {analysis && (
              <span className={`bias-tag ${analysis.bias}`}>
                {t('videoDetail.subtitleBased')}: {LABEL[analysis.bias]}
              </span>
            )}
          </div>
          <p className="bias-desc">
            {biasDesc[analysis?.bias ?? video.bias]}
          </p>
        </div>

        <aside className="sidebar">
          <h2>{t('videoDetail.relatedArticlesTitle')}</h2>
          {artLoading && <p className="loading">{t('videoDetail.loading')}</p>}
          {artError && <p className="error">{artError}</p>}
          <div className="articles-grid">
            {articles.map(a => (
              <a
                key={a.url}
                href={a.url}
                className="article-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                <h3>{a.title}</h3>
                <p>{a.source}</p>
              </a>
            ))}
          </div>
        </aside>

        <section className="summary-details">
          <h2>{t('videoDetail.transcriptSummaryTitle')}</h2>
          {subLoading && <p className="loading">{t('videoDetail.loading')}</p>}
          {subError && <p className="error">{subError}</p>}
          {analysis && (
            <>
              <p>
                <strong>{t('videoDetail.sentiment')}:</strong>{' '}
                {analysis.sentiment === 'positive'
                  ? t('videoDetail.sentimentPositive')
                  : analysis.sentiment === 'negative'
                  ? t('videoDetail.sentimentNegative')
                  : t('videoDetail.sentimentNeutral')}
              </p>
              <p>
                <strong>{t('videoDetail.keywords')}:</strong>{' '}
                {analysis.keywords.map(k => (
                  <span key={k} className="keyword">
                    {k}
                  </span>
                ))}
              </p>
              <p className="summary-text">
                <strong>{t('videoDetail.summary')}:</strong> {analysis.summary}
              </p>
            </>
          )}
        </section>

        <section className="metadata">
          <h2>{t('videoDetail.videoStatsTitle')}</h2>
          {statsLoading && <p className="loading">{t('videoDetail.loading')}</p>}
          {statsError && <p className="error">{statsError}</p>}
          {stats && (
            <ul className="video-stats">
              <li>{t('videoDetail.publishedAt', { date: new Date(stats.publishedAt) })}</li>
              <li>{t('videoDetail.viewCount', { count: Number(stats.viewCount) })}</li>
              <li>{t('videoDetail.likeCount', { count: Number(stats.likeCount) })}</li>
              <li>{t('videoDetail.commentCount', { count: Number(stats.commentCount) })}</li>
            </ul>
          )}
        </section>

        <section className="discussion-rooms">
          <h2>{t('videoDetail.discussionRoomsTitle')}</h2>
          {roomsLoading && <p className="loading">{t('videoDetail.loading')}</p>}
          {roomsError && <p className="error">{roomsError}</p>}
          <ul>
            {rooms.map(r => (
              <li key={r.id} className="room-item">
                <button onClick={() => navigate(`/discussions/${r.id}`)}>
                  {r.name}
                </button>
                <span>{t('videoDetail.participants', { count: r.participants })}</span>
              </li>
            ))}
          </ul>
        </section>

        <button className="back-button" onClick={() => navigate(-1)}>
          ← {t('videoDetail.back')}
        </button>
      </main>
    </>
  );
}
