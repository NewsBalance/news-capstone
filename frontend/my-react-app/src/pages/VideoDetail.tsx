// src/pages/VideoDetail.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/VideoDetail.css';
import { YTVideo, LABEL } from './Videos';

type Bias = YTVideo['bias'];

const URL = 'http://localhost:8080';

interface TranscriptAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords:   string[];
  summary:    string;
  bias:       Bias;
}

interface LocationState { video: YTVideo; videoUrl: string; }

interface SummarySentenceDTO {
  content: string;
  score: number;
}

interface VideoStats {
  publishedAt: string;
  viewCount:   string;
  likeCount:   string;
  commentCount:string;
}

export default function VideoDetailPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const video      = state?.video;
  const videoUrl = state.videoUrl;

  // 상태 훅
  const [stats, setStats]               = useState<VideoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError]     = useState('');

  const [analysis, setAnalysis]         = useState<TranscriptAnalysis | null>(null);
  const [subLoading, setSubLoading]     = useState(false);
  const [subError, setSubError]         = useState('');

  const [transcript, setTranscript]            = useState('');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError]     = useState('');

  // 요약 문장 목록
  const [sentences, setSentences] = useState<SummarySentenceDTO[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentError, setSentError] = useState('');

  const API_KEY =
    // @ts-ignore
    (import.meta as any)?.env?.VITE_YT_API_KEY ??
    process.env.REACT_APP_YT_API_KEY ??
    '';

  // video 없으면 목록으로
  useEffect(() => {
    if (!video) navigate('/videos', { replace: true });
  }, [video]);

  // 1) 메타데이터
  useEffect(() => {
    if (!video) return;
    setStatsLoading(true);
    setStatsError('');
    fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics` +
      `&id=${video.videoId}&key=${API_KEY}`
    )
      .then(res => res.json().then(data => {
        if (!res.ok || !data.items?.length) throw new Error();
        const it = data.items[0];
        setStats({
          publishedAt: it.snippet.publishedAt,
          viewCount:   it.statistics.viewCount,
          likeCount:   it.statistics.likeCount,
          commentCount:it.statistics.commentCount,
        });
      }))
      .catch(e => setStatsError('메타데이터 로딩 실패'))
      .finally(() => setStatsLoading(false));
  }, [video]);

  // 2) 자막 분석
  useEffect(() => {
    if (!video) return;
    setSentLoading(true);
    setSentError('');
    fetch(`${URL}/search/summaries?videoUrl=${encodeURIComponent(video.videoUrl)}`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json() as Promise<SummarySentenceDTO[]>;
      })
      .then(data => setSentences(data))
      .catch(() => setSentError('요약 문장 로딩 실패'))
      .finally(() => setSentLoading(false));
  }, [videoUrl]);

  // 3) 자막 원문
  useEffect(() => {
    if (!video) return;
    setTranscriptLoading(true);
    setTranscriptError('');
    fetch(`/api/getTranscript?videoId=${video.videoId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(text => setTranscript(text))
      .catch(() => setTranscriptError('자막 로딩 실패'))
      .finally(() => setTranscriptLoading(false));
  }, [video]);

  const biasDesc: Record<Bias,string> = {
    left:   '진보 키워드가 많이 포함되었습니다.',
    center: '중립 키워드가 주를 이룹니다.',
    right:  '보수 키워드가 많이 포함되었습니다.',
  };

  if (!video) return null;

  return (
    <>
      <Header/>
      <main className="video-detail-page">

        {/* 1️⃣ 상단: 비디오 + 제목/채널, 오른쪽: 분류 + 요약 헤딩 */}
        <div className="top-row">
          <div className="video-section">
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <h1 className="video-title">{video.title}</h1>
          </div>
          <aside className="sidebar">
            <div className="classification">
              <div className={`bias-tag ${video.bias}`}>
                <span>제목기반</span>
                <strong>{LABEL[video.bias]}</strong>
              </div>
              {analysis && (
                <div className={`bias-tag ${analysis.bias}`}>
                  <span>자막기반</span>
                  <strong>{LABEL[analysis.bias]}</strong>
                </div>
              )}
              <p className="bias-desc">
                {biasDesc[analysis?.bias ?? video.bias]}
              </p>
            </div>
            <h2 className="summary-heading">📝 자막 분석 요약</h2>
          </aside>
        </div>

        {/* 2️⃣ 하단: 요약 결과, 메타데이터, 전체 자막, 뒤로 가기 */}
        <div className="bottom-row">
          <section className="summary-details">
            <h2>🔖 요약 문장</h2>
            {sentLoading && <p className="loading">로딩 중…</p>}
            {sentError   && <p className="error">{sentError}</p>}
            {!sentLoading && !sentError && sentences.length === 0 && (
              <p className="empty">요약 문장이 없습니다.</p>
            )}
            {sentences.map((s, idx) => (
              <div key={idx} className="sentence-item">
                <p>{s.content}</p>
                <p className="score">점수: {s.score.toFixed(2)}</p>
              </div>
            ))}

            {subLoading && <p className="loading">분석 중…</p>}
            {subError   && <p className="error">{subError}</p>}
            {analysis && (
              <>
                <p>
                  <strong>감성:</strong>{' '}
                  {analysis.sentiment === 'positive' ? '긍정'
                    : analysis.sentiment === 'negative' ? '부정'
                    : '중립'}
                </p>
                <p>
                  <strong>핵심 키워드:</strong>{' '}
                  {analysis.keywords.map(k => (
                    <span key={k} className="keyword">{k}</span>
                  ))}
                </p>
                <p className="summary-text">
                  <strong>요약:</strong> {analysis.summary}
                </p>
              </>
            )}
          </section>

          <section className="metadata">
            {statsLoading && <p className="loading">로딩…</p>}
            {statsError   && <p className="error">{statsError}</p>}
            {stats && (
              <ul className="video-stats">
                <li>📅 {new Date(stats.publishedAt).toLocaleDateString()}</li>
                <li>👁️ {Number(stats.viewCount).toLocaleString()}회</li>
                <li>👍 {Number(stats.likeCount).toLocaleString()}개</li>
                <li>💬 {Number(stats.commentCount).toLocaleString()}개</li>
              </ul>
            )}
          </section>

          <section className="transcript-raw">
            <h2>📃 전체 자막</h2>
            {transcriptLoading && <p className="loading">불러오는 중…</p>}
            {transcriptError   && <p className="error">{transcriptError}</p>}
            {transcript && <pre>{transcript}</pre>}
          </section>

          <button className="back-button" onClick={() => navigate(-1)}>
            ← 뒤로
          </button>
        </div>
      </main>
    </>
  );
}
