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

const LABEL: Record<Bias, string> = {
  left: '진보',
  center: '중도',
  right: '보수',
};

// 프로토타입용 하드코딩 데이터 (키: '대선')
const HARD_CODED_VIDEOS: Record<string, Record<Bias, YTVideo[]>> = {
  '대선': {
    left: [
      {
        videoId: '4jnnpkBBCcM',
        title: 'LIVE] 진보당 김재연 대선 후보, KBS 인터뷰 풀영상/2025년 4월 24일',
        channel: 'KBS사사건건',
        thumbnail: 'https://img.youtube.com/vi/4jnnpkBBCcM/mqdefault.jpg',
        bias: 'left',
      }, // 
      {
        videoId: 'kteQm8O3A_4',
        title: '새로운 대한민국 [진보당 2025 대통령후보 선출선거 온라인 토론회]',
        channel: '진보당',
        thumbnail: 'https://img.youtube.com/vi/kteQm8O3A_4/mqdefault.jpg',
        bias: 'left',
      }, // 
    ],
    center: [
      {
        videoId: 'FyVCNmxR2G8',
        title: '[다시보기] 제21대 대통령선거 후보자 토론회 | 2025년 5월 18일',
        channel: '중앙선거관리위원회',
        thumbnail: 'https://img.youtube.com/vi/FyVCNmxR2G8/mqdefault.jpg',
        bias: 'center',
      }, // :contentReference[oaicite:2]{index=2}
      {
        videoId: 'k8fXryqIUms',
        title: '[다시보기] 논/쟁｜미리 보는 대선 2차 토론 (25.5.21) / JTBC News',
        channel: 'JTBC News',
        thumbnail: 'https://img.youtube.com/vi/k8fXryqIUms/mqdefault.jpg',
        bias: 'center',
      }, // :contentReference[oaicite:3]{index=3}
    ],
    right: [
      {
        videoId: '1rZTj857DiU',
        title: "LIVE] 국민의힘 김문수 대선후보 '경제 공약' 발표 생중계/2025년 5월",
        channel: '국민의힘',
        thumbnail: 'https://img.youtube.com/vi/1rZTj857DiU/mqdefault.jpg',
        bias: 'right',
      }, // :contentReference[oaicite:4]{index=4}
      {
        videoId: 'zdayE5-7jkw',
        title: "이재명·김문수, 집중 유세…이준석 '단일화 없다' / 연합뉴스",
        channel: '연합뉴스TV',
        thumbnail: 'https://img.youtube.com/vi/zdayE5-7jkw/mqdefault.jpg',
        bias: 'right',
      }, // :contentReference[oaicite:5]{index=5}
    ],
  },
};

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('search') || '';

  const [query, setQuery] = useState(param);
  const [searched, setSearched] = useState(false);
  const [videos, setVideos] = useState<Record<Bias, YTVideo[]>>({
    left: [], center: [], right: [],
  });

  // URL 파라미터(search)가 바뀌면 하드코딩된 데이터 로드
  useEffect(() => {
    if (param) {
      setQuery(param);
      setSearched(true);
      setVideos(HARD_CODED_VIDEOS[param] ?? { left: [], center: [], right: [] });
    }
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
