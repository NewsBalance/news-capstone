// src/pages/Index.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Index.css';

const HOT_KEYWORDS = ['정치', '경제', '선거', '탄핵', '관세'];

export default function IndexPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) {
      navigate(`/videos?search=${encodeURIComponent(term)}`);
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
            />
            <button type="submit">{t('index.search')}</button>
          </form>
        </div>

        <div className="container hero-bottom">
          <h2 className="hot-keywords-title">{t('index.hotKeywords')}</h2>
          <div className="hot-keywords-box">
            {HOT_KEYWORDS.map(keyword => (
              <span
                key={keyword}
                className="keyword"
                onClick={() =>
                  navigate(`/videos?search=${encodeURIComponent(keyword)}`)
                }
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
