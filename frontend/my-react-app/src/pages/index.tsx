// src/pages/Index.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Index.css';

const HOT_KEYWORDS = ['정치', '경제', '선거', '탄핵', '관세'];

// 입력 검증 및 소독 함수
const sanitizeInput = (input: string): string => {
  // HTML 태그 제거
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  
  // 스크립트 실행 방지를 위한 문자열 치환
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '');
  
  // 길이 제한 (예: 100자)
  sanitized = sanitized.substring(0, 100);
  
  return sanitized;
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
      // 입력 검증 및 소독
      const sanitizedTerm = sanitizeInput(term);
      
      // 빈 문자열이거나 공격 코드만 있었던 경우 검색하지 않음
      if (sanitizedTerm) {
        setSearchError(null);
        navigate(`/videos?search=${encodeURIComponent(sanitizedTerm)}`);
      } else {
        setSearchError("유효하지 않은 검색어입니다.");
      }
    }
  };

  // 키워드 클릭 핸들러 수정
  const handleKeywordClick = (keyword: string) => {
    // 키워드도 검증 및 소독
    const sanitizedKeyword = sanitizeInput(keyword);
    if (sanitizedKeyword) {
      navigate(`/videos?search=${encodeURIComponent(sanitizedKeyword)}`);
    }
  };

  return (
    <>
      <main className="hero-section">
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
              maxLength={100} // 최대 입력 길이 제한
            />
            <button type="submit">{t('index.search')}</button>
          </form>
          {/* 검색 오류 메시지 표시 */}
          {searchError && (
            <div className="search-error" role="alert" style={{ color: 'red', marginTop: '8px' }}>
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
