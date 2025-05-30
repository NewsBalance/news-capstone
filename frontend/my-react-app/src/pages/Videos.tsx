// src/pages/Videos.tsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Videos.css';
import parse from 'html-react-parser';

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
  id: string;             // 내부 UUID
  title: string;
  videoUrl: string;       // https://www.youtube.com/watch?v=...
  biasScore: number;      // –2.0 ~ 2.0
  publishedAt: number | null;
}

// 숫자 bias → 카테고리 매핑
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

// videoUrl에서 v 파라미터만 뽑아서 리턴
const extractVideoId = (url: string): string => {
  try {
    const params = new URL(url).searchParams;
    return params.get('v') || '';
  } catch {
    return '';
  }
};

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('search') || '';

  const [query, setQuery] = useState(param);
  const [searched, setSearched] = useState(false);
  const [videos, setVideos] = useState<Record<Bias, YTVideo[]>>({
    left: [], center: [], right: [],
  });

  // 정렬 상태
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

        // 1) 서버에서 숫자 bias로 된 배열을 받는다
        const rawData: RawVideo[] = await res.json();

        // 2) videoId/thumbnail 생성, bias 카테고리 변환
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

        // 3) 편향별로 그룹핑
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

  // 폼 제출 → URL 파라미터 갱신
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = query.trim();
    if (!t) return;
    setSearchParams({ search: t });
  };

  // 영상 카드 컴포넌트
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
        업로드:{" "}
        {v.publishedAt
          ? new Date(v.publishedAt).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          }) 
          : "알 수 없음"}
      </p>
      <p className="bias-info">
        편향도: ({v.score.toFixed(2)})
      </p>
    </div>
  </Link>
);

  // 편향별 컬럼 렌더링
  const Column = ({ bias }: { bias: Bias }) => {
  // 정렬 기준에 따라 복사본을 정렬
  const sorted = [...videos[bias]].sort((a, b) => {
    if (a.publishedAt == null || b.publishedAt == null) return 0;
    return sortOrder === 'newest'
      ? b.publishedAt - a.publishedAt
      : a.publishedAt - b.publishedAt;
  });

  return (
    <section className={`col ${bias}`} aria-labelledby={`${bias}-heading`}>
      <h2 id={`${bias}-heading`} className="col-heading">{LABEL[bias]}</h2>
      {!searched && <p className="msg empty">검색어를 입력하세요.</p>}
      {searched && sorted.length === 0 && <p className="msg empty">결과 없음</p>}
      {sorted.map(v => <Card key={v.videoId} v={v} />)}
    </section>
  );
};

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
            <button type="submit">조회</button>
          </form>
        </div>

        {/* 정렬 컨트롤 */}
        <div className="container sort-bar">
          <label htmlFor="sortOrder">정렬:</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된 순</option>
          </select>
        </div>

        {/* 결과 영역 */}
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