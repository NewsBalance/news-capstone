// src/pages/login.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';          // ★ 공통 헤더
import '../styles/Login.css';

function LoginPage() {
  /* -------------------- 상태 -------------------- */
  const [userId, setUserId]       = useState('');
  const [userPw, setUserPw]       = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [userIdError, setUserIdError] = useState('');
  const [userPwError, setUserPwError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /* -------------------- 제출 -------------------- */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserIdError(''); setUserPwError(''); setSuccessMessage('');
    let valid = true;

    /* 이메일 검사 */
    if (!userId) {
      setUserIdError('아이디(이메일)을 입력하세요.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userId)) {
      setUserIdError('이메일 형식이 올바르지 않습니다.');
      valid = false;
    }

    /* 비밀번호 검사 */
    if (!userPw) {
      setUserPwError('비밀번호를 입력하세요.');
      valid = false;
    } else if (userPw.length < 4) {
      setUserPwError('비밀번호는 최소 4자리 이상이어야 합니다.');
      valid = false;
    }
    if (!valid) return;

    /* (데모) 로그인 요청 */
    fetch('https://example.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userPw, rememberMe }),
    })
      .then(res => res.ok
        ? { success: true, message: '로그인 성공!' }
        : { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' })
      .then(data => {
        if (data.success) setSuccessMessage(data.message);
        else setUserPwError(data.message);
      })
      .catch(() => setUserPwError('서버 요청 중 오류가 발생했습니다.'));
  };

  /* -------------------- UI -------------------- */
  return (
    <>
      <Header />   {/* 공통 상단바 */}

      <section className="login-section">
        <div className="login-box">
          <h2>로그인</h2>

          {successMessage && <div className="success-message">{successMessage}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* 이메일 */}
            <div className="form-group">
              <label htmlFor="userId">이메일</label>
              <input
                id="userId"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="example@email.com"
                className={userIdError ? 'error' : ''}
              />
              {userIdError && <div className="error-message">{userIdError}</div>}
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label htmlFor="userPw">비밀번호</label>
              <input
                type="password"
                id="userPw"
                value={userPw}
                onChange={e => setUserPw(e.target.value)}
                placeholder="비밀번호 입력"
                className={userPwError ? 'error' : ''}
              />
              {userPwError && <div className="error-message">{userPwError}</div>}
            </div>

            {/* 옵션 */}
            <div className="form-group options">
              <div className="remember-me-wrap">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe" className="remember-me-label">
                  로그인 상태 유지
                </label>
              </div>
            </div>

            <button type="submit" className="submit-btn">로그인</button>
          </form>

          {/* 추가 링크 */}
          <div className="login-actions">
            <Link to="/signup">회원가입</Link>
            {/* <Link to="/find-id">아이디 찾기</Link> 삭제 */}
            <Link to="/reset-password">비밀번호 찾기</Link>
          </div>

          {/* 소셜 로그인 */}
          <div className="quick-login">
            <span className="quick-login-label">빠른 로그인</span>
            <div className="social-icons">
              {/* Google */}
              <a className="social-icon" title="Google 로그인">
                <svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 10c3 0 5.6 1 7.7 3l4.7-4.7C33 5.2 28.8 4 24 4 14.3 4 6.2 10.6 3 19l6 4.7C10.7 17.4 16.7 10 24 10z"/><path fill="#34A853" d="M46 24c0-1.5-.14-2.9-.4-4.3H24v9h13.2c-.7 3.2-2.3 5.7-4.7 7.6l5.2 4C43.6 34.2 46 29.5 46 24z"/><path fill="#FBBC05" d="M10.1 25.4c-.2-.8-.3-1.6-.3-2.4s.1-1.7.3-2.4L4 15.7C2.7 18.4 2 21.3 2 24s.7 5.6 2 8.3l6.1-4.9z"/><path fill="#4285F4" d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-5.2-4c-2 1.4-4.6 2.2-9.2 2.2-6.4 0-11.8-4.3-13.8-10.2l-6 4.7C6 39.5 14 46 24 46z"/></svg>
              </a>
              {/* Naver */}
              <a className="social-icon" title="Naver 로그인">
                <i className="fab fa-neos" style={{ color:'#03C75A',fontSize:'1.4rem' }} />
              </a>
              {/* Facebook */}
              <a className="social-icon" title="Facebook 로그인">
                <i className="fab fa-facebook-f" style={{ color:'#1877F2' }} />
              </a>
              {/* X */}
              <a className="social-icon x-icon" title="X 로그인">
                <svg viewBox="0 0 100 100"><path d="M15 10h20l15 20 15-20h20L60 40l25 30H65L50 50 35 70H15l25-30z"/></svg>
              </a>
              {/* Apple */}
              <a className="social-icon" title="Apple 로그인">
                <i className="fab fa-apple" style={{ fontSize:'1.3rem' }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 고정 링크 */}
      <div className="footer-left">
        <label htmlFor="langSelect">언어:</label>
        <select id="langSelect">
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </div>
      <div className="footer-right">
        <a>도움말</a><a>개인정보처리방침</a><a>약관</a>
      </div>
    </>
  );
}

export default LoginPage;
