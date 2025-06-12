// src/pages/Index.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Index.css';
import heroImage from '../assets/hero-cave-ai.png';

const HOT_KEYWORDS = ['검찰', '이재명', '선거', '경제', '연금'];

// 입력 검증 및 소독 함수
const sanitizeInput = (input: string): string => {
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '');
  return sanitized.substring(0, 100);
};

export default function IndexPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) {
      const sanitizedTerm = sanitizeInput(term);
      if (sanitizedTerm) {
        setSearchError(null);
        navigate(`/videos?search=${encodeURIComponent(sanitizedTerm)}`);
      } else {
        setSearchError("유효하지 않은 검색어입니다.");
      }
    }
  };

  const handleKeywordClick = (keyword: string) => {
    const sanitizedKeyword = sanitizeInput(keyword);
    if (sanitizedKeyword) {
      navigate(`/videos?search=${encodeURIComponent(sanitizedKeyword)}`);
    }
  };

  return (
    <>
      <main
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImage})`,
        }}
      >
        <div className="container hero-top">
          <h1 className="hero-title">NewsBalance</h1>
          <p className="hero-subtitle">
            <Link to="/goals" title={t('index.goalsTitle')}>
              {t('index.quote')}
            </Link>
          </p>
        </div>

        <div className="container hero-middle">
          <form
            className="search-bar-container"
            onSubmit={handleSubmit}
            role="search"
          >
            <input
              type="text"
              placeholder={t('index.searchPlaceholder')}
              aria-label={t('index.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              maxLength={100}
            />
            <button type="submit">{t('index.search')}</button>
          </form>
          {searchError && (
            <div
              className="search-error"
              role="alert"
              style={{ color: 'red', marginTop: '8px' }}
            >
              {searchError}
            </div>
          )}
        </div>

        <div className="container hero-bottom">
          <h2 className="hot-keywords-title">{t('index.hotKeywords')}</h2>
          <div className="hot-keywords-box">
            {HOT_KEYWORDS.map(keyword => (
              <span
                key={keyword}
                className="keyword"
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
