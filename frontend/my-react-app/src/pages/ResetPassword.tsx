// src/pages/ResetPassword.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SettingsMenu from '../components/SettingsMenu';
import '../styles/AuthPages.css';
import { API_BASE } from '../api/config';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
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
      const res = await fetch(`${API_BASE}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage(t('resetPassword.successMessage'));
      } else if (res.status === 404) {
        setError(t('resetPassword.errorNotFound'));
      } else {
        setError(t('resetPassword.errorUnknown'));
      }
    } catch {
      setError(t('resetPassword.errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SettingsMenu />

      <Link to="#main" className="skip-link">
        {t('resetPassword.skip')}
      </Link>

      <section id="main" className="hero-section">
        <div className="form-card">
          <h1>{t('resetPassword.title')}</h1>
          <p
            dangerouslySetInnerHTML={{
              __html: t('resetPassword.instructions').replace('\n', '<br/>'),
            }}
          />

          <form onSubmit={submit} noValidate>
            <div className="form-group">
              <label htmlFor="email">{t('resetPassword.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                placeholder={t('resetPassword.placeholders.email')}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading
                ? t('resetPassword.sending')
                : t('resetPassword.sendButton')}
            </button>
          </form>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="link-row">
            <Link to="/login">{t('resetPassword.backToLogin')}</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResetPassword;
