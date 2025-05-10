import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const isActive = (path: string) => (pathname === path ? 'active' : '');

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="site-logo">
          NewsBalance
        </Link>

        <nav className="nav-menu">
          <ul>
            <li>
              <Link to="/" className={isActive('/')}>
                홈
              </Link>
            </li>
            <li>
              <Link to="/discussion" className={isActive('/discussion')}>
                토론장
              </Link>
            </li>
            <li>
              <Link to="/videos" className={isActive('/videos')}>
                영상분석
              </Link>
            </li>
            <li>
              <Link to="/mypage" className={isActive('/mypage')}>
                마이페이지
              </Link>
            </li>
            <li>
              <Link to="/login" className={`login-btn ${isActive('/login')}`}>
                로그인
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
