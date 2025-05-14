// src/pages/signup.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Signup.css';

const URL = 'http://localhost:8080';

function SignupPage() {
  // ---- 폼 필드 상태 ----
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');

  // ---- 에러 메시지 상태 ----
  const [emailError, setEmailError] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');
  const [birthdateError, setBirthdateError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [termsError, setTermsError] = useState('');

  // ---- 약관 동의 ----
  const [agreeAll, setAgreeAll] = useState(false);
  const [ageAgree, setAgeAgree] = useState(false);
  const [collectAgree, setCollectAgree] = useState(false);
  const [thirdPartyAgree, setThirdPartyAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [locationAgree, setLocationAgree] = useState(false);

  // ---- 비밀번호 강도 표시 ----
  const [pwStrengthText, setPwStrengthText] = useState('');
  const [pwStrengthClass, setPwStrengthClass] = useState('');

  // ---- 이메일 아이콘 상태 ----
  // 'default' | 'duplicate' | 'available'
  const [emailIconState, setEmailIconState] = useState<'default' | 'duplicate' | 'available'>('default');
  const [iconLabel, setIconLabel] = useState('');

  // ---- 약관 펼치기/접기 ----
  const handleToggleTerms = (targetId: string) => {
    const content = document.getElementById(targetId);
    if (content) {
      content.classList.toggle('open');
    }
  };

  // ---- 약관 전체 체크 ----
  const handleAgreeAllChange = (checked: boolean) => {
    setAgreeAll(checked);
    setAgeAgree(checked);
    setCollectAgree(checked);
    setThirdPartyAgree(checked);
    setMarketingAgree(checked);
    setLocationAgree(checked);
  };

  // ---- 개별 항목이 모두 체크되면 전체도 체크 ----
  useEffect(() => {
    if (ageAgree && collectAgree && thirdPartyAgree && marketingAgree && locationAgree) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [ageAgree, collectAgree, thirdPartyAgree, marketingAgree, locationAgree]);

  // ---- 비밀번호 강도 판단 ----
  const checkPasswordStrength = (val: string) => {
    if (!val) {
      setPwStrengthText('');
      setPwStrengthClass('');
      return;
    }
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasDigit = /\d/.test(val);
    const hasSpecial = /[^a-zA-Z0-9]/.test(val);
    const lengthOk = val.length >= 8;

    if (hasUpper && hasLower && hasDigit && hasSpecial && lengthOk) {
      setPwStrengthText('비밀번호 강도: 강함');
      setPwStrengthClass('strong');
    } else {
      let score = 0;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasDigit) score++;
      if (hasSpecial) score++;
      if (lengthOk && score >= 3) {
        setPwStrengthText('비밀번호 강도: 보통');
        setPwStrengthClass('medium');
      } else {
        setPwStrengthText('비밀번호 강도: 약함');
        setPwStrengthClass('weak');
      }
    }
  };

  // ---- 이벤트 핸들러: 비밀번호 입력 변화 ----
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    checkPasswordStrength(val);
  };

  // ---- 이벤트 핸들러: 비밀번호 확인 ----
  const handleConfirmPwChange = (val: string) => {
    setConfirmPw(val);
    if (val && val !== password) {
      setConfirmPwError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPwError('');
    }
  };

  // ---- 이벤트 핸들러: 생년월일(만14세 이상) ----
  const handleBirthdateChange = (val: string) => {
    setBirthdate(val);
    if (val) {
      const birthDate = new Date(val);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate());
      if (birthDate > minDate) {
        setBirthdateError('만 14세 미만은 가입할 수 없습니다.');
      } else {
        setBirthdateError('');
      }
    } else {
      setBirthdateError('');
    }
  };

  // ---- 전화번호 자동 포맷 ----
  const handlePhoneChange = (val: string) => {
    let onlyDigits = val.replace(/[^0-9]/g, '');
    if (onlyDigits.startsWith('010')) {
      if (onlyDigits.length <= 7) {
        onlyDigits = onlyDigits.replace(/^(\d{3})(\d{1,4})/, '$1-$2');
      } else if (onlyDigits.length <= 10) {
        onlyDigits = onlyDigits.replace(/^(\d{3})(\d{3,4})(\d{1,4})?$/, '$1-$2-$3');
      } else {
        onlyDigits = onlyDigits.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
      }
    }
    setPhone(onlyDigits);
  };

  // ---- 이메일 중복확인 ----
  const handleCheckEmail = async () => {
    setEmailCheckResult('');
    if (!email.trim()) {
      setEmailCheckResult('이메일을 먼저 입력해주세요.');
      setEmailIconState('default');
      setIconLabel('');
      return;
    }
    try {
      // 실제 API 엔드포인트로 수정
      const response = await fetch(`${URL}/user/checkemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) {
        setEmailCheckResult(result.message || '이미 사용 중인 이메일입니다.');
        setEmailIconState('duplicate');
        setIconLabel('중복');
      } else {
        setEmailCheckResult(result.message || '사용 가능한 이메일입니다.');
        setEmailIconState('available');
        setIconLabel('OK');
      }
    } catch (error) {
      setEmailCheckResult('중복 확인에 실패했습니다.');
      setEmailIconState('default');
      setIconLabel('');
    }
  };

  // ---- 닉네임 실시간 검증 ----
  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (val.trim().length < 2 || val.trim().length > 12) {
      setNicknameError('닉네임은 2자 이상 12자 이하입니다.');
    } else {
      setNicknameError('');
    }
  };

  // ---- 폼 제출 ----
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let valid = true;

    // 이메일
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      valid = false;
    } else {
      const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailPattern.test(email.trim())) {
        setEmailError('올바른 이메일 형식이 아닙니다.');
        valid = false;
      } else {
        setEmailError('');
      }
    }

    // 닉네임
    if (!nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.');
      valid = false;
    } else if (nickname.trim().length < 2 || nickname.trim().length > 12) {
      setNicknameError('닉네임은 2자 이상 12자 이하입니다.');
      valid = false;
    } else {
      setNicknameError('');
    }

    // 비밀번호
    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      valid = false;
    } else if (password.trim().length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      valid = false;
    } else {
      setPasswordError('');
    }

    // 비밀번호 확인
    if (confirmPw !== password) {
      setConfirmPwError('비밀번호가 일치하지 않습니다.');
      valid = false;
    } else {
      setConfirmPwError('');
    }

    // 생년월일 만14세 이상
    if (!birthdate) {
      setBirthdateError('생년월일을 입력해주세요.');
      valid = false;
    } else {
      const bDate = new Date(birthdate);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate());
      if (bDate > minDate) {
        setBirthdateError('만 14세 미만은 가입할 수 없습니다.');
        valid = false;
      } else {
        setBirthdateError('');
      }
    }

    // 휴대전화
    if (!phone.trim()) {
      setPhoneError('휴대전화번호를 입력해주세요.');
      valid = false;
    } else {
      const phonePattern = /^010-?\d{3,4}-?\d{4}$/;
      if (!phonePattern.test(phone)) {
        setPhoneError('유효한 휴대전화번호 형식이 아닙니다.');
        valid = false;
      } else {
        setPhoneError('');
      }
    }

    // 약관 체크(필수: age, collect, thirdParty)
    if (!ageAgree || !collectAgree || !thirdPartyAgree) {
      setTermsError('만 14세 이상, 개인정보 수집 및 이용, 개인정보 제3자 제공 동의는 필수입니다.');
      valid = false;
    } else {
      setTermsError('');
    }

    if (!valid) {
      return;
    }

    // 실제 서버 통신 예시
    // fetch('/signup', { method: 'POST', body: ... })
    //   .then(...)
    //   .catch(...)

    alert('회원가입이 완료되었습니다(예시). 실제 서버 통신은 별도 로직으로 처리하세요.');
  };

  return (
    <>
      <Header />

      {/* 회원가입 섹션 */}
      <section className="signup-section">
        <div className="signup-box">
          <h2>회원가입</h2>

          <form id="signupForm" onSubmit={handleSubmit} noValidate>
            {/* 이메일 입력 + 중복확인 */}
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <div className="form-row">
                <input
                  type="email"
                  id="email"
                  name="email"
                  aria-label="이메일"
                  placeholder="이메일 입력"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {/* 아이콘 버튼 */}
                <button
                  type="button"
                  className="icon-btn"
                  id="checkEmailBtn"
                  aria-label="이메일 중복확인"
                  title="이메일 중복확인"
                  onClick={handleCheckEmail}
                >
                  {/* 아이콘 상태에 따라 클래스 변경 */}
                  <svg
                    className={
                      emailIconState === 'default'
                        ? 'icon-default'
                        : emailIconState === 'duplicate'
                        ? 'icon-duplicate'
                        : 'icon-available'
                    }
                    id="emailIcon"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z" />
                  </svg>
                </button>
                <span
                  className="icon-label"
                  style={{
                    color: emailIconState === 'available' ? '#4CAF50' : '#777',
                  }}
                >
                  {iconLabel}
                </span>
              </div>
              {emailError && <div className="error-message">{emailError}</div>}
              {emailCheckResult && (
                <div
                  className="error-message"
                  style={{
                    color:
                      emailIconState === 'duplicate'
                        ? '#d9534f'
                        : emailIconState === 'available'
                        ? '#5F3DC4'
                        : '#d9534f',
                  }}
                >
                  {emailCheckResult}
                </div>
              )}
            </div>

            {/* 닉네임 */}
            <div className="form-group">
              <label htmlFor="nickname">닉네임</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                aria-label="닉네임"
                placeholder="닉네임 입력 (2~12자)"
                required
                minLength={2}
                maxLength={12}
                autoComplete="nickname"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
              />
              {nicknameError && <div className="error-message">{nicknameError}</div>}
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                aria-label="비밀번호"
                placeholder="비밀번호 (8자 이상 권장)"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              {/* 비밀번호 강도 표시 */}
              {pwStrengthText && (
                <div id="passwordStrength" className={`pw-strength ${pwStrengthClass}`}>
                  {pwStrengthText}
                </div>
              )}
              {passwordError && <div className="error-message">{passwordError}</div>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                aria-label="비밀번호 확인"
                placeholder="비밀번호 재입력"
                required
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => handleConfirmPwChange(e.target.value)}
              />
              {confirmPwError && <div className="error-message">{confirmPwError}</div>}
            </div>

            {/* 생년월일 */}
            <div className="form-group">
              <label htmlFor="birthdate">생년월일</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                aria-label="생년월일"
                required
                autoComplete="bday"
                value={birthdate}
                onChange={(e) => handleBirthdateChange(e.target.value)}
              />
              {birthdateError && <div className="error-message">{birthdateError}</div>}
            </div>

            {/* 휴대전화번호 */}
            <div className="form-group">
              <label htmlFor="phone">휴대전화번호</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                aria-label="휴대전화번호"
                placeholder="예: 010-1234-5678"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
              {phoneError && <div className="error-message">{phoneError}</div>}
            </div>

            {/* 약관 동의 섹션 */}
            <div className="terms-section">
              {/* 모두 동의 체크 */}
              <div className="all-agree">
                <input
                  type="checkbox"
                  id="agreeAll"
                  checked={agreeAll}
                  onChange={(e) => handleAgreeAllChange(e.target.checked)}
                />
                <label htmlFor="agreeAll">
                  <strong>모두 동의</strong>
                </label>
              </div>

              <div className="terms-details">
                {/* 만 14세 이상 */}
                <div className="terms-item">
                  <div className="terms-item-header" onClick={() => handleToggleTerms('termsContentAge')}>
                    <label>
                      <input
                        type="checkbox"
                        id="ageAgree"
                        name="ageAgree"
                        checked={ageAgree}
                        onChange={(e) => setAgeAgree(e.target.checked)}
                      />
                      [필수] 만 14세 이상입니다
                    </label>
                    <span>▼</span>
                  </div>
                  <div className="terms-content" id="termsContentAge">
                    <div className="terms-text">
                      <p>
                        <strong>[만 14세 이상 동의 안내]</strong>
                        <br />
                        ... (본문 생략)
                      </p>
                      <p>만 14세 이상이라는 사실에 동의함으로써 ...</p>
                    </div>
                  </div>
                </div>

                {/* 개인정보 수집 및 이용 동의 */}
                <div className="terms-item">
                  <div
                    className="terms-item-header"
                    onClick={() => handleToggleTerms('termsContentCollect')}
                  >
                    <label>
                      <input
                        type="checkbox"
                        id="collectAgree"
                        name="collectAgree"
                        checked={collectAgree}
                        onChange={(e) => setCollectAgree(e.target.checked)}
                      />
                      [필수] 개인정보 수집 및 이용 동의
                    </label>
                    <span>▼</span>
                  </div>
                  <div className="terms-content" id="termsContentCollect">
                    <div className="terms-text">
                      <p>
                        <strong>[개인정보의 수집 및 이용 목적]</strong>
                        <br />
                        ...
                      </p>
                    </div>
                  </div>
                </div>

                {/* 개인정보 제3자 제공 동의 */}
                <div className="terms-item">
                  <div
                    className="terms-item-header"
                    onClick={() => handleToggleTerms('termsContentThirdParty')}
                  >
                    <label>
                      <input
                        type="checkbox"
                        id="thirdPartyAgree"
                        name="thirdPartyAgree"
                        checked={thirdPartyAgree}
                        onChange={(e) => setThirdPartyAgree(e.target.checked)}
                      />
                      [필수] 개인정보 제3자 제공 동의
                    </label>
                    <span>▼</span>
                  </div>
                  <div className="terms-content" id="termsContentThirdParty">
                    <div className="terms-text">...</div>
                  </div>
                </div>

                {/* 마케팅 정보 수신 동의 (선택) */}
                <div className="terms-item">
                  <div
                    className="terms-item-header"
                    onClick={() => handleToggleTerms('termsContentMarketing')}
                  >
                    <label>
                      <input
                        type="checkbox"
                        id="marketingAgree"
                        name="marketingAgree"
                        checked={marketingAgree}
                        onChange={(e) => setMarketingAgree(e.target.checked)}
                      />
                      [선택] 마케팅 정보 수신 동의
                    </label>
                    <span>▼</span>
                  </div>
                  <div className="terms-content" id="termsContentMarketing">
                    <div className="terms-text">...</div>
                  </div>
                </div>

                {/* 위치정보 수집·이용 동의 (선택) */}
                <div className="terms-item">
                  <div
                    className="terms-item-header"
                    onClick={() => handleToggleTerms('termsContentLocation')}
                  >
                    <label>
                      <input
                        type="checkbox"
                        id="locationAgree"
                        name="locationAgree"
                        checked={locationAgree}
                        onChange={(e) => setLocationAgree(e.target.checked)}
                      />
                      [선택] 위치정보 수집·이용 동의
                    </label>
                    <span>▼</span>
                  </div>
                  <div className="terms-content" id="termsContentLocation">
                    <div className="terms-text">...</div>
                  </div>
                </div>
              </div>
              {termsError && (
                <div className="error-message" id="termsError">
                  {termsError}
                </div>
              )}
            </div>

            {/* 가입하기 버튼 */}
            <button type="submit" className="submit-btn">
              가입하기
            </button>
          </form>

          {/* 로그인 페이지 링크: 기존 a href="login.html" -> <Link to="/login"> */}
          <Link to="/login" className="login-link">
            이미 회원이신가요? 로그인 하기
          </Link>
        </div>
      </section>
    </>
  );
}

export default SignupPage;
