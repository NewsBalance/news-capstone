// src/pages/index.tsx
import React from 'react';
import { Link } from 'react-router-dom';
// CSS가 styles 폴더에 있다면, 예: '../styles/Index.css' or '../../styles/Index.css'
// 실제 폴더 구조에 맞춰 수정하세요!
import '../styles/Index.css'; 

function IndexPage() {
  return (
    <>
      {/* 상단 내비게이션(헤더) */}
      <header className="site-header">
        <div className="container header-inner">
          {/* 웹사이트 제목: index.html 대신 라우트 path="/" */}
          <Link to="/" className="site-logo">NewsBalance</Link>

          <nav className="nav-menu">
            <ul>
              {/* 기존 href="index.html" -> to="/" */}
              <li>
                <Link to="/" className="active">홈</Link>
              </li>

              {/* 토론장: 아직 라우트 설정 안 했다면 # 임시, or /discussion */}
              <li>
                <Link to="/discussion">토론장</Link>
              </li>

              {/* 마이페이지 -> /mypage */}
              <li>
                <Link to="/mypage">마이페이지</Link>
              </li>

              {/* 로그인 -> /login */}
              <li>
                <Link to="/login" className="login-btn">로그인</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* 메인 히어로 섹션 (홈) */}
      <section className="hero-section">
        {/* 상단 (타이틀, 문구) */}
        <div className="container hero-top">
          <h1 className="hero-title">NewsBalance</h1>
          <p className="hero-subtitle">
            {/* 기존 <a href="goals.html" ...> -> <Link to="/goals"> */}
            <Link to="/goals" title="개발 목표 페이지로 이동">
              언론은 진실을 밝히고 어둠을 헤치는 등불이 되어야 한다
            </Link>
          </p>
        </div>

        {/* 중간 (검색창) */}
        <div className="container hero-middle">
          <div className="search-bar-container">
            <input type="text" placeholder="검색어를 입력하세요..." />
            <button>검색</button>
          </div>
        </div>

        {/* 하단 (핫 키워드) */}
        <div className="container hero-bottom">
          <div className="hot-keywords-section">
            <h2 className="hot-keywords-title">실시간 핫 키워드</h2>
            <div className="hot-keywords-box">
              {/* 예시 키워드들 */}
              <div className="keyword">정치</div>
              <div className="keyword">경제</div>
              <div className="keyword">선거</div>
              <div className="keyword">사회</div>
              <div className="keyword">국제</div>
              <div className="keyword">IT</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default IndexPage;
