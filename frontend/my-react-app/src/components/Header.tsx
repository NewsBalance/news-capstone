// src/components/Header.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';   // ← 추가
import '../styles/Header.css';

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const { token, logout } = useAuth();
  const { t } = useTranslation();                  // ← useTranslation 훅 사용

  const isActive = (path: string) =>
    pathname === path ? 'active' : '';

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="site-logo">
          {/* 사이트 로고는 보통 고정 텍스트로 두거나, 필요하면 번역키로 뺄 수 있습니다. */}
          NewsBalance
        </Link>

        <nav className="nav-menu" aria-label={t('header.navAria', '사이트 내비게이션')}>
          <ul>
            <li>
              <Link to="/" className={isActive('/')}>
                {t('header.home', '홈')}
              </Link>
            </li>
            <li>
              <Link to="/discussion" className={isActive('/discussion')}>
                {t('header.discussion', '토론장')}
              </Link>
            </li>
            <li>
              <Link to="/videos" className={isActive('/videos')}>
                {t('header.videos', '영상분석')}
              </Link>
            </li>
            <li>
              <Link to="/mypage" className={isActive('/mypage')}>
                {t('header.mypage', '마이페이지')}
              </Link>
            </li>

            {token ? (
              <li>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={logout}
                >
                  {t('header.logout', '로그아웃')}
                </button>
              </li>
            ) : (
              <li>
                <Link
                  to="/login"
                  className={`header-login-btn ${isActive('/login')}`}
                >
                  {t('header.login', '로그인')}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
