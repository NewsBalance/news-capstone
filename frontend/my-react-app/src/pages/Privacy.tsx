// src/pages/Privacy.tsx
import React, { useEffect } from 'react';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import '../styles/privacy.css';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t('privacy.title') + ' | NewsBalance';
  }, [t]);

  return (
    <>
      <div className="privacy-page">
        <main className="privacy-container" role="main">
          <h1 className="privacy-title">{t('privacy.title')}</h1>

          <section className="privacy-section">
            <h2 className="privacy-section-title">1. 개인정보 수집 항목</h2>
            <p>– 회원 가입, 서비스 이용 과정에서 아래 정보가 수집될 수 있습니다:</p>
            <ul className="privacy-list">
              <li>필수수집: 이메일, 비밀번호, 닉네임</li>
              <li>선택수집: 생년월일, 휴대전화번호</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-section-title">2. 개인정보 수집 방법</h2>
            <p>– 홈페이지(회원가입, 문의하기), 서비스 이용, 이벤트 응모 등 다양한 경로를 통해 수집합니다.</p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-section-title">3. 개인정보 이용 목적</h2>
            <ul className="privacy-list">
              <li>서비스 제공 및 회원 관리</li>
              <li>고지사항 전달, 불만처리 등 민원처리</li>
              <li>통계 분석 및 마케팅 활용</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-section-title">4. 개인정보 보유 및 이용 기간</h2>
            <p>– 회원 탈퇴 시까지 보유하며, 관계법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 별도 보관합니다.</p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-section-title">5. 개인정보 제3자 제공</h2>
            <p>– 원칙적으로 제공하지 않으며, 법령에 근거가 있거나 이용자의 동의가 있는 경우에만 제공합니다.</p>
          </section>

          <section className="privacy-section">
            <h2 className="privacy-section-title">6. 개인정보 파기 절차 및 방법</h2>
            <p>
              – 목적 달성 후에는 지체 없이 해당 정보를 파기하며,
              전자적 파일 형태는 기술적 방법으로 복원이 불가능하도록 삭제합니다.
            </p>
          </section>

          <div className="privacy-footer-text">
            문의: <a href="mailto:support@biascheck.com">support@biascheck.com</a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPage;
