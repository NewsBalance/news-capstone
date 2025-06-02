// src/pages/terms.tsx
import React, { useEffect } from 'react';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import '../styles/terms.css';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t('terms.title') + ' | NewsBalance';
  }, [t]);

  return (
    <>
      <div className="terms-page">
        <main className="terms-container" role="main">
          <h1 className="terms-title">{t('terms.title')}</h1>

          <section className="terms-section">
            <h2 className="terms-section-title">제1조 (목적)</h2>
            <p>
              이 약관은 정치 편향도 측정 웹사이트(이하 “웹사이트”)가 제공하는 서비스의
              이용조건 및 절차, 이용자와 웹사이트의 권리·의무·책임사항을 규정함을
              목적으로 합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제2조 (정의)</h2>
            <ul className="terms-list">
              <li>
                “이용자”란 이 약관에 따라 웹사이트가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
              </li>
              <li>
                “회원”이란 웹사이트에 개인정보를 제공하여 회원등록을 한 자로서, 웹사이트가 제공하는
                서비스를 지속적으로 이용할 수 있는 자를 말합니다.
              </li>
              <li>
                “비회원”이란 회원에 가입하지 않고 웹사이트가 제공하는 서비스를 이용하는 자를 말합니다.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제3조 (약관의 게시·개정)</h2>
            <p>
              ① 웹사이트는 본 약관의 내용을 웹페이지 초기 화면에 게시합니다.<br />
              ② 웹사이트는 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 현행약관과 함께
              초기 화면에 게시하거나 이메일로 통지합니다.<br />
              ③ 개정된 약관은 적용일자 이후 이용자에게 효력이 발생합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제4조 (서비스 이용)</h2>
            <p>
              ① 웹사이트의 서비스는 연중무휴·1일 24시간 제공함을 원칙으로 합니다. 단, 정기점검·긴급점검·시스템
              장애 등의 사유로 중단될 수 있습니다.<br />
              ② 웹사이트는 서비스를 일정 범위로 분할하여 각 범위별로 이용가능 시간을 별도로 지정할 수 있습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제5조 (회원가입 및 탈퇴)</h2>
            <p>
              ① 회원가입은 웹사이트가 정한 절차에 따라 이용자가 약관에 동의하고, 개인정보를 제공하며,
              서비스 이용을 신청함으로써 완료됩니다.<br />
              ② 회원은 언제든지 탈퇴를 요청할 수 있으며, 웹사이트는 즉시 처리합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제6조 (회원의 의무)</h2>
            <ul className="terms-list">
              <li>회원은 가입정보를 최신 상태로 유지해야 합니다.</li>
              <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
              <li>법령, 공서양속에 위반되는 행위를 해서는 안 됩니다.</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제7조 (서비스 제공의 변경 등)</h2>
            <p>
              웹사이트는 운영상·기술상 상당한 이유가 있는 경우에는 제공하고 있는 전부 또는 일부
              서비스를 변경·중단할 수 있으며, 사전 공지합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제8조 (게시물의 관리)</h2>
            <p>
              ① 회원이 게시·등록한 게시물의 저작권은 해당 회원에게 귀속됩니다.<br />
              ② 웹사이트는 이용자의 게시물이 약관에 위반되거나 불법·유해하다고 판단될 경우
              사전 통지 없이 삭제하거나 접근을 차단할 수 있습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제9조 (지적재산권)</h2>
            <p>
              웹사이트가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 웹사이트에 귀속되며,
              이용자는 이를 무단 복제·전송·배포·2차적 저작물 작성 등에 이용할 수 없습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제10조 (개인정보 보호)</h2>
            <p>
              웹사이트는 개인정보처리방침에 따라 이용자의 개인정보를 보호합니다. 자세한 내용은
              “개인정보 처리방침” 페이지를 참조하세요.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제11조 (서비스 이용 제한 및 강제 종료)</h2>
            <p>
              웹사이트는 회원이 본 약관을 위반하거나 부정 이용 시 경고, 일시 정지, 영구 이용 제한 등을 할 수 있습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제12조 (면책 조항)</h2>
            <p>
              ① 웹사이트는 천재지변·불가항력적 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.<br />
              ② 웹사이트는 이용자가 서비스를 통해 기대하는 이익을 얻지 못하거나 서비스 중단으로 손해가 발생한 경우에도 책임을 지지 않습니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제13조 (분쟁 해결)</h2>
            <p>
              이 약관과 서비스 이용에 관한 분쟁은 대한민국 법을 준거법으로 하며, 본사 소재지 관할 법원에 제소합니다.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="terms-section-title">제14조 (약관의 공고 및 시행일)</h2>
            <p>
              이 약관은 2025년 5월 23일부터 적용되며, 변경된 약관은 공지된 날로부터 효력이 발생합니다.
            </p>
          </section>

                    <div className="terms-footer-text">
            문의: <a href="mailto:support@biascheck.com">support@biascheck.com</a>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsPage;
