// src/pages/login.tsx
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Login.css';
import { API_BASE } from '../api/config';


function LoginPage() {
  /* -------------------- 상태 -------------------- */
  const [email, setEmail]       = useState('');
  const [password, setPassword]       = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [EmailError, setEmailError] = useState('');
  const [passwordError, setpasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  /* -------------------- 제출 -------------------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError(''); setpasswordError(''); setSuccessMessage('');
    setLoading(true);
    let valid = true;

    /* 이메일 검사 */
    if (!email) {
      setEmailError('아이디(이메일)을 입력하세요.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('이메일 형식이 올바르지 않습니다.');
      valid = false;
    }

    /* 비밀번호 검사 */
    if (!password) {
      setpasswordError('비밀번호를 입력하세요.');
      valid = false;
    } else if (password.length < 4) {
      setpasswordError('비밀번호는 최소 4자리 이상이어야 합니다.');
      valid = false;
    }
    if (!valid) {
      setLoading(false);
      return;
    }

    try{
      const response = await fetch(`${API_BASE}/session/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        }),
        credentials: 'include'  // 세션 쿠키를 받기 위해 필요
      });

      // 모든 응답 결과 확인
      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: '서버 응답을 처리할 수 없습니다.' };
      }

      if (response.ok) {
        // 세션 인증으로 전환: 사용자 정보만 컨텍스트에 저장
        login({
          nickname: result.nickname,
          email: result.email || email,
          id: result.id || 0,
          role: result.role || 'USER'
        });

        // 로그인 성공 메시지
        alert('로그인이 완료되었습니다.');
        
        // 메인 화면으로 이동
        navigate('/');
        
        // 메인 화면 도착 후 잠시 대기 후 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 300); // 1.5초 후 새로고침
      } else {
        alert(`로그인 실패: ${result.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch(err) {
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
      <>

        <section className="login-section">
          <div className="login-box">
            <h2>로그인</h2>

            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {/* 이메일 */}
              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className={EmailError ? 'error' : ''}
                    disabled={loading}
                />
                {EmailError && <div className="error-message">{EmailError}</div>}
              </div>

              {/* 비밀번호 */}
              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className={passwordError ? 'error' : ''}
                    disabled={loading}
                />
                {passwordError && <div className="error-message">{passwordError}</div>}
              </div>

              {/* 옵션 */}
              <div className="form-group options">
                <div className="remember-me-wrap">
                  <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      disabled={loading}
                  />
                  <label htmlFor="rememberMe" className="remember-me-label">
                    로그인 상태 유지
                  </label>
                </div>
              </div>

              <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* 추가 링크 */}
            <div className="login-actions">
              <Link to="/signup">회원가입</Link>
              {/* <Link to="/find-id">아이디 찾기</Link> 삭제 */}
              <Link to="/reset-password">비밀번호 찾기</Link>
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