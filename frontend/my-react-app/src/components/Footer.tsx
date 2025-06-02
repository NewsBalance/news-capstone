import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-info">
          <p className="footer-logo">NewsBalance</p>
          <p className="footer-desc">
            {t('footer.tagline1')}<br/>
            {t('footer.tagline2')}
          </p>
          <p className="footer-contact">
            ✉ jdg.broadcast@gmail.com&nbsp;|&nbsp;☎ +82 2-000-0000
          </p>
        </div>
      </div>
      <div className="footer-copy">
        <nav className="footer-nav">
          <Link to="/">{t('header.home')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/contact">{t('footer.contact')}</Link>
        </nav>
        <div className="footer-separator" />
        <p className="footer-text">
          © 2025 NewsBalance Team. All rights reserved.<br/>
          {t('footer.copyright')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
