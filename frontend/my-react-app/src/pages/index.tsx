// src/pages/index.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Index.css';

export default function IndexPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 폼 제출
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) {
      // /videos?search=키워드 형태로 내보냄
      navigate(`/videos?search=${encodeURIComponent(term)}`);
    }
  };

  const hotKeywords = ['정치', '경제', '선거', '탄핵'];

  return (
    <>
      <Header />

      <section className="hero-section">
        <div className="container hero-top">
          <h1 className="hero-title">NewsBalance</h1>
          <p className="hero-subtitle">
            <Link to="/goals" title="개발 목표 페이지로 이동">
              언론은 진실을 밝히고 어둠을 헤치는 등불이 되어야 한다
            </Link>
          </p>
        </div>

        <div className="container hero-middle">
          <form className="search-bar-container" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">검색</button>
          </form>
        </div>

        <div className="container hero-bottom">
          <div className="hot-keywords-section">
            <h2 className="hot-keywords-title">실시간 핫 키워드</h2>
            <div className="hot-keywords-box">
              {hotKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="keyword"
                  onClick={() =>
                    navigate(`/videos?search=${encodeURIComponent(keyword)}`)
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
