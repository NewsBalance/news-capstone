// src/pages/goals.tsx
import React, { useEffect } from 'react';
import Footer from '../components/Footer';
import '../styles/Goals.css'; // 예: styles 폴더에서 가져온다면 이렇게 수정

function GoalsPage() {
  useEffect(() => {
    // 팀 소개(IntersectionObserver)
    const row1 = document.querySelector('.row1') as HTMLElement | null;
    const row2 = document.querySelector('.row2') as HTMLElement | null;

    const options = {
      root: null,
      threshold: 0.2,
    };

    const callback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === row1) {
            row1?.classList.add('row1-animate');
          } else if (entry.target === row2) {
            row2?.classList.add('row2-animate');
          }
          observer.unobserve(entry.target);
        }
      });
    };

    const observerTeam = new IntersectionObserver(callback, options);
    if (row1) observerTeam.observe(row1);
    if (row2) observerTeam.observe(row2);

    // 핵심 가치 카드: 올라오는 애니메이션
    const coreValues = document.querySelectorAll('.core-value');
    const options2 = {
      root: null,
      threshold: 0.2,
    };
    const callback2 = (entries: IntersectionObserverEntry[], obs: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-up');
          obs.unobserve(entry.target);
        }
      });
    };
    const observerValues = new IntersectionObserver(callback2, options2);
    coreValues.forEach(cv => observerValues.observe(cv));

    // Cleanup
    return () => {
      observerTeam.disconnect();
      observerValues.disconnect();
    };
  }, []);

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="hero">
        <h1>뉴스 균형의 이정표</h1>
        <p>
          NewsBalance는 언론/영상 콘텐츠의 정치적 편향성과 정확도를 한눈에 파악할 수 있게 돕습니다.
          <br />
          객관적 시각을 제공하여, 누구나 공정하고 투명한 정보를 얻을 수 있도록 노력합니다.
        </p>
      </section>

      {/* 메인 컨테이너 */}
      <div className="page-container">
        {/* 소개 섹션 */}
        <h2 className="section-title">NewsBalance의 핵심 목표</h2>
        <section className="intro-section">
          <p>
            현대는 정보가 넘쳐나는 시대이자, 각종 미디어와 SNS가 여론 형성에 결정적인 역할을 합니다.
            <span className="intro-highlight">NewsBalance</span>는 이를 분석, 정리하여
            <strong>정치적 편향성</strong>과 <strong>정확도</strong>를 지표로 제공합니다.
          </p>
          <p>
            뉴스 소비자들은 한쪽으로 치우친 정보에 현혹되지 않고,
            다양한 시각에서 사건과 이슈를 바라볼 수 있게 됩니다.
            이는 단순 지식 전달을 넘어, 견해를 교환하고 투명한 토론 문화를 형성하는 데 핵심이 됩니다.
          </p>
        </section>

        {/* 핵심 포인트 섹션 (카드) */}
        <div className="key-points">
          <div className="point-card">
            <h3>정치적 편향도 분석</h3>
            <p>
              각종 기사나 영상에서 편향된 표현과 서술을 AI가 포착하고,
              수치화해 사용자에게 제공합니다.
            </p>
          </div>
          <div className="point-card">
            <h3>정확도 평가</h3>
            <p>
              잘못된 정보나 과장된 주장을 팩트체킹하고,
              진실성 지표를 통해 콘텐츠 신뢰도를 확인할 수 있습니다.
            </p>
          </div>
          <div className="point-card">
            <h3>투명하고 공정한 토론</h3>
            <p>
              이용자들이 서로 다른 견해를 공유하고,
              증거와 데이터에 기초해 올바른 여론을 형성하도록 돕습니다.
            </p>
          </div>
        </div>

        {/* CTA 섹션 */}
        <section className="cta-section">
          <h2>함께 만들어가는 미디어 환경</h2>
          <p>
            NewsBalance와 함께라면, 정보를 소비하는 데 그치지 않고 스스로 올바른 판단을 내릴 수 있습니다.
            <br />
            누구나 참여하고, 사실을 확인하며, 편향에서 벗어난 공정한 시각을 갖길 바랍니다.
          </p>
          {/* 여긴 기존에 href="#" 그대로 두어도 되지만,
              필요하다면 <Link to="/about"> 등 새 라우트로 전환 가능 */}
          <a href="#" className="cta-btn">더 알아보기</a>
        </section>

        {/* 팀원 소개 (2행 3명씩) */}
        <section className="team-section">
          <div className="team-heading-simple">
            <h2 className="meet-our-team">Meet Our Team</h2>
            <p className="team-intro">
              편향 없는 뉴스를 위해 열정을 다하는 NewsBalance 팀원을 소개합니다.
              <br />
              투명하고 객관적인 팩트체크와 정치적 편향 분석으로, 더 나은 세상을 꿈꿉니다.
            </p>
          </div>

          {/* 윗줄: 오른쪽 -> 왼쪽 */}
          <div className="team-row row1">
            <div className="team-member">
              <img
                src="https://via.placeholder.com/350x220?text=Member1"
                alt="팀원1"
                className="team-img"
              />
              <div className="team-info">
                <p className="team-name">장대규</p>
                <p className="team-role">Backend Developer</p>
                <p className="team-desc-text">서버와 DB, API를 책임지며 안정적인 서비스를 제공합니다.</p>
              </div>
            </div>
            <div className="team-member">
              <img
                src="https://via.placeholder.com/350x220?text=Member2"
                alt="팀원2"
                className="team-img"
              />
              <div className="team-info">
                <p className="team-name">최성</p>
                <p className="team-role">Frontend Developer</p>
                <p className="team-desc-text">UI/UX를 구현하며 사용자에게 직관적인 경험을 제공합니다.</p>
              </div>
            </div>
            <div className="team-member">
              <img
                src="https://via.placeholder.com/350x220?text=Member3"
                alt="팀원3"
                className="team-img"
              />
              <div className="team-info">
                <p className="team-name">신의진</p>
                <p className="team-role">AI Researcher</p>
                <p className="team-desc-text">인공지능 모델을 연구하여 정치적 편향성과 정확도를 분석합니다.</p>
              </div>
            </div>
          </div>

          {/* 아랫줄: 왼쪽 -> 오른쪽 */}
          <div className="team-row row2">
            <div className="team-member">
              <img
                src="https://via.placeholder.com/350x220?text=Member4"
                alt="팀원4"
                className="team-img"
              />
              <div className="team-info">
                <p className="team-name">이익호</p>
                <p className="team-role">QA Engineer</p>
                <p className="team-desc-text">세심한 테스트와 품질 관리를 통해 서비스 안정성을 보장합니다.</p>
              </div>
            </div>
            <div className="team-member">
              <img
                src="https://via.placeholder.com/350x220?text=Member5"
                alt="팀원5"
                className="team-img"
              />
              <div className="team-info">
                <p className="team-name">김승재</p>
                <p className="team-role">UI/UX Designer</p>
                <p className="team-desc-text">깔끔하고 직관적인 디자인으로 이용자의 편의를 돕습니다.</p>
              </div>
            </div>
            <div className="team-member">
              <img
                src="https://via.placeholder.com/350x220?text=Member6"
                alt="팀원6"
                className="team-img"
              />
              <div className="team-info">
                <p className="team-name">박수인</p>
                <p className="team-role">Product Manager</p>
                <p className="team-desc-text">기능 기획부터 일정 관리까지 전반적인 프로젝트를 조율합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 팀이 추구하는 가치 (6개, 3열) */}
        <h2 className="section-title">우리 팀이 추구하는 핵심 가치</h2>
        <div className="core-values-list">
          <div className="core-value">
            <h3>투명성</h3>
            <p>
              모든 분석 과정을 공개하고, 출처를 명확히 밝혀
              왜곡 없는 정보를 제공하는 것을 최우선으로 합니다.
            </p>
          </div>
          <div className="core-value">
            <h3>객관성</h3>
            <p>
              정치적 성향이나 사건을 배제한 순수 데이터 기반 평가를 통해
              공정한 결과물을 제시합니다.
            </p>
          </div>
          <div className="core-value">
            <h3>혁신</h3>
            <p>
              최신 기술 트렌드를 적극 도입하고,
              끊임없는 개선을 통해 더욱 정확하고 편리한 서비스를 제공하고자 합니다.
            </p>
          </div>
          <div className="core-value">
            <h3>협업</h3>
            <p>
              팀원 각자의 전문 분야와 역량을 결합하여 시너지를 극대화하고,
              문제 해결에 있어 창의적 접근을 시도합니다.
            </p>
          </div>
          <div className="core-value">
            <h3>사용자 중심</h3>
            <p>
              누구나 쉽게 편향도와 정치적 이슈 정보를 이해할 수 있도록
              UI/UX를 설계하고, 방문자 피드백을 적극 반영합니다.
            </p>
          </div>
          <div className="core-value">
            <h3>공정성</h3>
            <p>
              분석·평가 결과를 제시할 때 어떤 편견이나 이익을 배제하고,
              데이터에 기반해 공정한 시각을 유지합니다.
            </p>
          </div>
        </div>
    </div>


<Footer />

    </>
  );
}

export default GoalsPage;
