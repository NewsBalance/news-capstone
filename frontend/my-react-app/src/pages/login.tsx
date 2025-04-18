// src/pages/login.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// CSS 파일이 styles 폴더에 있다면, 예: ../styles/Login.css
import '../styles/Login.css';

function LoginPage() {
  // ------------ React States for form fields ------------
  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // ------------ React States for error / success messages ------------
  const [userIdError, setUserIdError] = useState('');
  const [userPwError, setUserPwError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ------------ Event Handlers ------------
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 초기화
    setUserIdError('');
    setUserPwError('');
    setSuccessMessage('');

    let isValid = true;

    // 이메일 유효성 검사
    if (!userId) {
      setUserIdError('아이디(이메일)을 입력하세요.');
      isValid = false;
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(userId)) {
        setUserIdError('이메일 형식이 올바르지 않습니다.');
        isValid = false;
      }
    }

    // 비밀번호 검사
    if (!userPw) {
      setUserPwError('비밀번호를 입력하세요.');
      isValid = false;
    } else if (userPw.length < 4) {
      setUserPwError('비밀번호는 최소 4자리 이상이어야 합니다.');
      isValid = false;
    }

    if (!isValid) return;

    // (데모) 서버로 로그인 요청
    fetch('https://example.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userPw,
        rememberMe,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          return { success: true, message: '로그인 성공!' };
        } else {
          return { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' };
        }
      })
      .then((data) => {
        if (data.success) {
          setSuccessMessage(data.message);
          // 실제로는 로그인 후 페이지 이동
          // window.location.href = '/'; // 예: 홈으로 이동
        } else {
          setUserPwError(data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        setUserPwError('서버 요청 중 오류가 발생했습니다.');
      });
  };

  // ------------ Render ------------
  return (
    <>
      {/* 헤더 */}
      <header className="site-header">
        <div className="container header-inner">
          {/* a href="index.html" -> <Link to="/" ...> */}
          <Link to="/" className="site-logo">
            NewsBalance
          </Link>
          <nav className="nav-menu">
            <ul>
              {/* 홈 -> / */}
              <li>
                <Link to="/">홈</Link>
              </li>
              {/* 토론장 (라우트 없으면 # 임시) */}
              <li>
                <Link to="/discussion">토론장</Link>
              </li>
              {/* 마이페이지 -> /mypage */}
              <li>
                <Link to="/mypage">마이페이지</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="login-section">
        <div className="login-box">
          <h2>로그인</h2>
          {/* 성공 메시지 */}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="userId">아이디(이메일)</label>
              <input
                type="text"
                id="userId"
                name="userId"
                placeholder="이메일 주소 입력"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={userIdError ? 'error' : ''}
              />
              {userIdError && <div className="error-message">{userIdError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="userPw">비밀번호</label>
              <input
                type="password"
                id="userPw"
                name="userPw"
                placeholder="비밀번호 입력"
                value={userPw}
                onChange={(e) => setUserPw(e.target.value)}
                className={userPwError ? 'error' : ''}
              />
              {userPwError && <div className="error-message">{userPwError}</div>}
            </div>

            <div className="form-group options">
              <div className="remember-me-wrap">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe" className="remember-me-label">
                  로그인 상태 유지
                </label>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              로그인
            </button>
          </form>

          {/* (회원가입 / 아이디 / 비밀번호 찾기) */}
          <div className="login-actions">
            {/* <a href="signup.html"> 회원가입 -> /signup */}
            <Link to="/signup">회원가입</Link>
            {/* 아이디 찾기, 라우트 없으면 # */}
            <Link to="#">아이디 찾기</Link>
            {/* 비밀번호 찾기 -> forgot_password 라우트 만들거나 # */}
            <Link to="#">비밀번호 찾기</Link>
          </div>

          {/* 빠른 로그인 */}
          <div className="quick-login">
            <span className="quick-login-label">빠른 로그인</span>
            <div className="social-icons">
              {/* Google */}
              <a href="#" className="social-icon google-icon" title="Google 로그인">
                <svg className="google-svg" viewBox="0 0 48 48">
                  <title>Google Logo</title>
                  <path
                    fill="#EA4335"
                    d="M24 10c3 0 5.6 1 7.7 3l4.7-4.7C33 5.2 28.8 4 24 4 14.3 4 6.2 10.6 3 19l6 4.7C10.7 17.4 16.7 10 24 10z"
                  />
                  <path
                    fill="#34A853"
                    d="M46 24c0-1.5-.14-2.9-.4-4.3H24v9h13.2c-.7 3.2-2.3 5.7-4.7 7.6l5.2 4C43.6 34.2 46 29.5 46 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.1 25.4c-.2-.8-.3-1.6-.3-2.4s.1-1.7.3-2.4L4 15.7C2.7 18.4 2 21.3 2 24s.7 5.6 2 8.3l6.1-4.9z"
                  />
                  <path
                    fill="#4285F4"
                    d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-5.2-4c-2 1.4-4.6 2.2-9.2 2.2-6.4 0-11.8-4.3-13.8-10.2l-6 4.7C6 39.5 14 46 24 46z"
                  />
                </svg>
              </a>

              {/* Naver */}
              <a href="#" className="social-icon" title="Naver 로그인">
                <i className="fab fa-neos" style={{ color: '#03C75A', fontSize: '1.4rem' }} />
              </a>

              {/* Facebook */}
              <a href="#" className="social-icon" title="Facebook 로그인">
                <i className="fab fa-facebook-f" style={{ color: '#1877F2' }} />
              </a>

              {/* X */}
              <a href="#" className="social-icon x-icon" title="X 로그인">
                <svg className="x-svg" viewBox="0 0 100 100">
                  <title>X Logo</title>
                  <path
                    fill="#000"
                    d="
                      M15,10  L35,10  L50,30  L65,10  L85,10
                      L60,40  L85,70  L65,70  L50,50  L35,70
                      L15,70  L40,40z
                    "
                  />
                </svg>
              </a>

              {/* Apple */}
              <a href="#" className="social-icon" title="Apple 로그인">
                <i className="fab fa-apple" style={{ color: '#000', fontSize: '1.3rem' }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 화면 왼쪽 하단: 언어 선택 */}
      <div className="footer-left">
        <label htmlFor="langSelect">언어:</label>
        <select id="langSelect">
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </div>

      {/* 화면 오른쪽 하단: 도움말 / 개인정보처리방침 / 약관 */}
      <div className="footer-right">
        <a href="#">도움말</a>
        <a href="#">개인정보처리방침</a>
        <a href="#">약관</a>
      </div>
    </>
  );
}

export default LoginPage;
