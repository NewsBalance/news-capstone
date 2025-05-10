// src/pages/ResetPassword.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/AuthPages.css';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage('재설정 메일을 발송했습니다. 이메일을 확인해주세요.');
      } else if (res.status === 404) {
        setError('존재하지 않는 이메일입니다.');
      } else {
        setError('알 수 없는 오류가 발생했습니다. 다시 시도하세요.');
      }
    } catch {
      setError('네트워크 오류입니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link to="#main" className="skip-link">본문 바로가기</Link>
      <Header />

      <section id="main" className="hero-section">
        <div className="form-card">
          <h1>비밀번호 재설정</h1>
          <p>이메일을 입력하면<br/>재설정 링크를 보내드립니다.</p>

          <form onSubmit={submit} noValidate>
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? '전송 중…' : '재설정 메일 발송'}
            </button>
          </form>

          {message && <div className="success-message">{message}</div>}
          {error   && <div className="error-message">{error}</div>}

          <div className="link-row">
            <Link to="/login">로그인으로 돌아가기</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResetPassword;
