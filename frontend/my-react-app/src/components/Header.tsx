import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Header.css';

const URL = "http://localhost:8080";

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const isActive = (path: string) => (pathname === path ? 'active' : '');
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch(`${URL}/session/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    logout();          // ★ 컨텍스트 상태 초기화
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="site-logo">NewsBalance</Link>
        <nav className="nav-menu">
          <ul>
            <li><Link to="/" className={isActive('/')}>홈</Link></li>
            <li><Link to="/discussion" className={isActive('/discussion')}>토론장</Link></li>
            <li><Link to="/videos" className={isActive('/videos')}>영상분석</Link></li>
            <li><Link to="/mypage" className={isActive('/mypage')}>마이페이지</Link></li>

            {isAuthenticated ? (
              <>
                <li>
                  <span className="nickname">{user?.nickname}님</span>
                </li>
                <li>
                  <button
                    className={`login-btn ${isActive('/logout')}`}
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </li>   
              </>
            ) : (
              <li>
                <Link to="/login" className={`login-btn ${isActive('/login')}`}>
                  로그인
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
