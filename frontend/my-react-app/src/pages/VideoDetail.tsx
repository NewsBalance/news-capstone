import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SettingsMenu from '../components/SettingsMenu';
import '../styles/VideoDetail.css';
import parse from 'html-react-parser';
import { YTVideo, LABEL } from './Videos';
import { useTranslation } from 'react-i18next';

type Bias = YTVideo['bias'];

const API_BASE = 'http://localhost:8080';

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

interface SummarySentenceDTO {
  content: string;
  score: number;
}

interface RelatedArticle {
  link: string;
  title: string;
}

interface YoutubeContentResponse {
  id: number;
  title: string;
  videoUrl: string;
  biasScore: number;
  publishedAt: number;
  url: string | null;
  keywords: string[];
  relatedArticles: RelatedArticle[];
  sentencesScore: SummarySentenceDTO[];
}

interface LocationState {
  video: YTVideo;
  videoUrl: string;
}

export default function VideoDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const video = state?.video;
  const videoUrl = state?.videoUrl;

  const [stats, setStats] = useState<VideoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');

  const [sentences, setSentences] = useState<SummarySentenceDTO[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [keywordsList, setKeywordsList] = useState<string[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentError, setSentError] = useState('');

  const API_KEY =
      // @ts-ignore
      (import.meta as any)?.env?.VITE_YT_API_KEY ?? process.env.REACT_APP_YT_API_KEY ?? '';

  useEffect(() => {
    if (!video) navigate('/videos', { replace: true });
  }, [video]);

  // 1) 메타데이터
  useEffect(() => {
    if (!video) return;
    setStatsLoading(true);
    setStatsError('');
    fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${video.videoId}&key=${API_KEY}`
    )
        .then(res => res.json().then(data => {
          if (!res.ok || !data.items?.length) throw new Error();
          const it = data.items[0];
          setStats({
            publishedAt: it.snippet.publishedAt,
            viewCount: it.statistics.viewCount,
            likeCount: it.statistics.likeCount,
            commentCount: it.statistics.commentCount,
          });
        }))
        .catch(() => setStatsError(t('videoDetail.error.stats')))
        .finally(() => setStatsLoading(false));
  }, [video, API_KEY, t]);

  // 2) 상세 분석
  useEffect(() => {
    if (!videoUrl) return;
    setSentLoading(true);
    setSentError('');
    fetch(`${API_BASE}/search/info?videoUrl=${encodeURIComponent(videoUrl)}`)
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json() as Promise<YoutubeContentResponse>;
        })
        .then(data => {
          setSentences(data.sentencesScore || []);
          setRelatedArticles(data.relatedArticles || []);
          setKeywordsList(data.keywords || []);
        })
        .catch(() => {
          setSentError(t('videoDetail.error.analysis'));
          setSentences([]);
          setRelatedArticles([]);
          setKeywordsList([]);
        })
        .finally(() => setSentLoading(false));
  }, [videoUrl, t]);

  // 3) 자막 분석
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

  const biasDesc: Record<Bias, string> = {
    left: t('videoDetail.biasDesc.left'),
    center: t('videoDetail.biasDesc.center'),
    right: t('videoDetail.biasDesc.right'),
  };

  if (!video) return null;

  return (
      <>
        <Header />
        <SettingsMenu />

        <main className="video-detail-page">
          <div className="video-header">
            <iframe
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
            <h1 className="video-title">{parse(video.title)}</h1>

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
            {sentLoading && <p className="loading">{t('videoDetail.loading')}</p>}
            {sentError && <p className="error">{sentError}</p>}
            {!sentLoading && relatedArticles.length === 0 && (
                <p className="msg empty">{t('videoDetail.noArticles')}</p>
            )}
            <div className="articles-grid">
              {relatedArticles.map((a, i) => (
                  <a
                      key={i}
                      href={a.link}
                      className="article-card"
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                    <h3>{parse(a.title)}</h3>
                  </a>
              ))}
            </div>
          </aside>

          <section className="summary-details">
            <h2>{t('videoDetail.transcriptSummaryTitle')}</h2>

            {sentences.map((s, idx) => (
                <div key={idx} className="sentence-item">
                  <span className="sentence-text">{parse(s.content)}</span>
                  <span className="score">
                {t('videoDetail.biasScore')}: {s.score.toFixed(2)}
              </span>
                </div>
            ))}

            {subLoading && <p className="loading">{t('videoDetail.loading')}</p>}
            {subError && <p className="error">{subError}</p>}
            {analysis && (
                <>
                  <p>
                    <strong>{t('videoDetail.sentiment')}:</strong>{' '}
                    {t(`videoDetail.sentimentValue.${analysis.sentiment}`)}
                  </p>
                  <p>
                    <strong>{t('videoDetail.keywords')}:</strong>{' '}
                    {analysis.keywords.map(k => (
                        <span key={k} className="keyword">{k}</span>
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

          <button className="back-button" onClick={() => navigate(-1)}>
            ← {t('videoDetail.back')}
          </button>
        </main>
      </>
  );
}
