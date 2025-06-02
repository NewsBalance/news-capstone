// src/pages/login.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Login.css';
import { API_BASE } from '../api/config';
import { useAuth } from '../contexts/AuthContext';

interface LoginResponse {
  token: string;
  user: Record<string, any>;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();

  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [userIdError, setUserIdError] = useState('');
  const [userPwError, setUserPwError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserIdError('');
    setUserPwError('');
    setSuccessMessage('');

    let valid = true;
    if (!userId) {
      setUserIdError(t('login.errors.emailRequired'));
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userId)) {
      setUserIdError(t('login.errors.emailInvalid'));
      valid = false;
    }

    if (!userPw) {
      setUserPwError(t('login.errors.passwordRequired'));
      valid = false;
    } else if (userPw.length < 4) {
      setUserPwError(t('login.errors.passwordLength'));
      valid = false;
    }

    if (!valid) return;

    fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userPw, rememberMe }),
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(t('login.errors.loginFailed'));
        }
        return (await res.json()) as LoginResponse;
      })
      .then(data => {
        login(data.token, data.user);
        setSuccessMessage(t('login.success'));
      })
      .catch(err => {
        setUserPwError(err.message || t('login.errors.server'));
      });
  };

  return (
    <>
      <section className="login-section">
        <div className="login-box">
          <h2>{t('login.title')}</h2>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 이메일 */}
            <div className="form-group">
              <label htmlFor="userId">{t('login.email')}</label>
              <input
                id="userId"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="example@email.com"
                className={userIdError ? 'error' : ''}
              />
              {userIdError && (
                <div className="error-message">{userIdError}</div>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label htmlFor="userPw">{t('login.password')}</label>
              <input
                type="password"
                id="userPw"
                value={userPw}
                onChange={e => setUserPw(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className={userPwError ? 'error' : ''}
              />
              {userPwError && (
                <div className="error-message">{userPwError}</div>
              )}
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
                  {t('login.remember')}
                </label>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              {t('login.submit')}
            </button>
          </form>

          <div className="login-actions">
            <Link to="/signup">{t('login.signup')}</Link>
            <Link to="/reset-password">{t('login.forgot')}</Link>
          </div>

          {/* 소셜 로그인 */}
          <div className="quick-login">
            <span className="quick-login-label">{t('login.quick')}</span>
            <div className="social-icons">
              <a
                href="#/oauth/google"
                title="Google 로그인"
                className="social-icon"
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
                  alt="Google 로그인"
                  style={{ width: '60%', height: '60%' }}
                />
              </a>
              <a
                href="#/oauth/naver"
                title="Naver 로그인"
                className="social-icon"
              >
                <img src="/images/naver-logo.png" alt="Naver 로그인" />
              </a>
              <a
                href="#/oauth/kakao"
                title="Kakao 로그인"
                className="social-icon"
              >
                <img src="/images/kakao-logo.png" alt="Kakao 로그인" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
