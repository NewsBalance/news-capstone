// src/pages/Videos.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Videos.css';

type Bias = 'left' | 'center' | 'right';

interface YTVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  bias: Bias;
}

// 서버 원본 데이터 타입
interface RawVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  bias: number;      // –2.0 ~ 2.0
}

// 숫자 bias → 카테고리 매핑
const mapBias = (value: number): Bias => {
  if (value < -0.5) return 'left';
  if (value <= 0.5) return 'center';
  return 'right';
};

const LABEL: Record<Bias, string> = {
  left: '진보',
  center: '중도',
  right: '보수',
};

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('search') || '';

  const [query, setQuery] = useState(param);
  const [searched, setSearched] = useState(false);
  const [videos, setVideos] = useState<Record<Bias, YTVideo[]>>({
    left: [], center: [], right: [],
  });

  useEffect(() => {
    if (!param) return;
    setQuery(param);
    setSearched(true);

    const fetchVideos = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/search?query=${encodeURIComponent(param)}`
        );
        if (!res.ok) throw new Error(res.statusText);

        // 1) 서버에서 숫자 bias로 된 배열을 받는다
        const rawData: RawVideo[] = await res.json();

        // 2) mapBias로 변환
        const converted: YTVideo[] = rawData.map(v => ({
          videoId:   v.videoId,
          title:     v.title,
          channel:   v.channel,
          thumbnail: v.thumbnail,
          bias:      mapBias(v.bias),
        }));

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

  // 편향별 컬럼 렌더링
  const Column = ({ bias }: { bias: Bias }) => (
    <section className={`col ${bias}`} aria-labelledby={`${bias}-heading`}>
      <h2 id={`${bias}-heading`} className="col-heading">{LABEL[bias]}</h2>
      {!searched && <p className="msg empty">검색어를 입력하세요.</p>}
      {searched && videos[bias].length === 0 && <p className="msg empty">결과 없음</p>}
      {videos[bias].map((v) => <Card key={v.videoId} v={v} />)}
    </section>
  );

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
