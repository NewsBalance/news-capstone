// src/pages/Signup.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Signup.css';
import { API_BASE } from '../api/config';

export default function SignupPage() {
  const { t } = useTranslation();

  // ---- 폼 필드 상태 ----
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const mapRef = useRef<any>(null);

  // ---- 에러 메시지 상태 ----
  const [emailError, setEmailError] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');
  const [birthdateError, setBirthdateError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [termsError, setTermsError] = useState('');

  // ---- 이메일 인증 코드 상태 ----
  const [verificationCode, setVerificationCode] = useState('');
  const [sendCodeMessage, setSendCodeMessage] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // ---- 약관 동의 ----
  const [agreeAll, setAgreeAll] = useState(false);
  const [serviceAgree, setServiceAgree] = useState(false);
  const [ageAgree, setAgeAgree] = useState(false);
  const [collectAgree, setCollectAgree] = useState(false);
  const [thirdPartyAgree, setThirdPartyAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [locationAgree, setLocationAgree] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  // ---- 비밀번호 강도 표시 ----
  const [pwStrengthText, setPwStrengthText] = useState('');
  const [pwStrengthClass, setPwStrengthClass] = useState('');

  // ---- 이메일 아이콘 상태 ----
  const [emailIconState, setEmailIconState] =
    useState<'default' | 'duplicate' | 'available'>('default');
  const [iconLabel, setIconLabel] = useState('');

  // ---- Terms 스타일 선언 ----
  const termsStyle: React.CSSProperties = {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '15px',
    border: '1px solid #ddd',
    backgroundColor: '#fafafa',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
    fontSize: '0.9rem',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  };

  // ---- 약관 펼치기/접기 ----
  const handleToggleTerms = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // ---- 약관 전체 체크 (전체 동의 클릭) ----
  const handleAgreeAllChange = (checked: boolean) => {
    setAgreeAll(checked);
    setServiceAgree(checked);
    setAgeAgree(checked);
    setCollectAgree(checked);
    setThirdPartyAgree(checked);
    setMarketingAgree(checked);
    setLocationAgree(checked);
  };

  // ---- 개별 항목이 모두 체크되면 전체 동의 자동 체크 ----
  useEffect(() => {
    if (
      serviceAgree &&
      ageAgree &&
      collectAgree &&
      thirdPartyAgree &&
      marketingAgree &&
      locationAgree
    ) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [
    serviceAgree,
    ageAgree,
    collectAgree,
    thirdPartyAgree,
    marketingAgree,
    locationAgree,
  ]);

  // ---- 인증번호 전송 ---
  const handleSendCode = async () => {
    setVerifyMessage('');
    setIsEmailVerified(false);
    if (!email.trim()) {
      setSendCodeMessage('이메일을 먼저 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`${URL}/user/sendcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (res.ok) {
        setSendCodeMessage(json.message || '인증 코드가 전송되었습니다.');
      } else {
        setSendCodeMessage(json.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (e) {
      setSendCodeMessage('서버 통신 중 오류가 발생했습니다.');
    }
  };

  // ---- 인증번호 확인 ---- 
  const handleVerifyCode = async () => {
    setSendCodeMessage('');
    if (!verificationCode.trim()) {
      setVerifyMessage('인증번호를 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`${URL}/user/verifycode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const json = await res.json();
      if(res.ok)
        setIsEmailVerified(true);
      setVerifyMessage(
        res.ok
          ? json.message || '인증 완료'
          : json.message || '인증 코드가 올바르지 않습니다.'
      );
    } catch {
      setVerifyMessage('서버 통신 중 오류가 발생했습니다.');
    }
  };

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
      setPwStrengthText(t('signup.passwordStrength.strong'));
      setPwStrengthClass('strong');
    } else {
      let score = 0;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasDigit) score++;
      if (hasSpecial) score++;
      if (lengthOk && score >= 3) {
        setPwStrengthText(t('signup.passwordStrength.medium'));
        setPwStrengthClass('medium');
      } else {
        setPwStrengthText(t('signup.passwordStrength.weak'));
        setPwStrengthClass('weak');
      }
    }
  };

  // ---- 비밀번호 입력 시 호출 ----
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    checkPasswordStrength(val);
  };

  // ---- 비밀번호 확인 입력 시 호출 ----
  const handleConfirmPwChange = (val: string) => {
    setConfirmPw(val);
    if (val && val !== password) {
      setConfirmPwError(t('signup.errors.passwordMatch'));
    } else {
      setConfirmPwError('');
    }
  };

  // ---- 생년월일(만 14세 이상) 검사 ----
  const handleBirthdateChange = (val: string) => {
    setBirthdate(val);
    if (val) {
      const birthDate = new Date(val);
      const now = new Date();
      const minDate = new Date(
        now.getFullYear() - 14,
        now.getMonth(),
        now.getDate()
      );
      if (birthDate > minDate) {
        setBirthdateError(t('signup.errors.ageRestriction'));
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
        onlyDigits = onlyDigits.replace(
          /^(\d{3})(\d{3,4})(\d{1,4})?$/,
          '$1-$2-$3'
        );
      } else {
        onlyDigits = onlyDigits.replace(
          /^(\d{3})(\d{4})(\d{4})$/,
          '$1-$2-$3'
        );
      }
    }
    setPhone(onlyDigits);
  };

  // ---- 지도 초기화 (amCharts4) ----
  useLayoutEffect(() => {
    const am4core = require('@amcharts/amcharts4/core');
    const am4maps = require('@amcharts/amcharts4/maps');
    const geodata = require('../geodata/southKoreaLow').default;

    const chart = am4core.create('signupMap', am4maps.MapChart);
    chart.geodata = geodata;
    chart.projection = new am4maps.projections.Miller();
    chart.chartContainer.wheelable = false;
    chart.chartContainer.resizable = false;

    const series = chart.series.push(new am4maps.MapPolygonSeries());
    series.useGeodata = true;

    const template = series.mapPolygons.template;
    template.tooltipText = '{name}';
    template.fill = am4core.color('#f4effc');
    const hs = template.states.create('hover');
    hs.properties.fill = am4core.color('#5c3c91');
    template.events.on('hit', (ev: any) => {
      const name = (ev.target.dataItem.dataContext as any).name;
      setSelectedRegion(name);
    });

    mapRef.current = chart;
    return () => {
      chart.dispose();
      mapRef.current = null;
    };
  }, []);

  // ---- 이메일 중복 확인 API 호출 ----
  const handleCheckEmail = async () => {
    setEmailCheckResult('');
    if (!email.trim()) {
      setEmailCheckResult(t('signup.emailCheck.noInput'));
      setEmailIconState('default');
      setIconLabel('');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/user/checkemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setEmailCheckResult(
          result.message || t('signup.emailCheck.duplicate')
        );
        setEmailIconState('duplicate');
        setIconLabel(t('signup.emailCheck.label.duplicate'));
      } else {
        setEmailCheckResult(
          result.message || t('signup.emailCheck.available')
        );
        setEmailIconState('available');
        setIconLabel(t('signup.emailCheck.label.available'));
      }
    } catch {
      setEmailCheckResult(t('signup.emailCheck.error'));
      setEmailIconState('default');
      setIconLabel('');
    }
  };

  // ---- 닉네임 유효성 검사 ----
  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (val.trim().length < 2 || val.trim().length > 12) {
      setNicknameError(t('signup.errors.nicknameLength'));
    } else {
      setNicknameError('');
    }
  };

  // ---- 폼 제출 처리 ----
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let valid = true;

    // 이메일 유효성 검사
    if (!email.trim()) {
      setEmailError(t('signup.errors.emailRequired'));
      valid = false;
    } else {
      const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailPattern.test(email.trim())) {
        setEmailError(t('signup.errors.emailInvalid'));
        valid = false;
      } else {
        setEmailError('');
      }
    }

    // 이메일 인증 확인
    if (!verificationCode.trim()){
      setVerifyMessage('인증번호를 입력해주세요.');
      alert('인증번호를 입력해주세요.')
      valid = false;
    } else if (!isEmailVerified){
      setVerifyMessage('이메일 인증을 완료해주세요.');
      alert('이메일 인증을 완료해주세요.')
      valid = false;
    } else {
      setVerifyMessage('');
    }

    // 닉네임 유효성 검사
    if (!nickname.trim()) {
      setNicknameError(t('signup.errors.nicknameRequired'));
      valid = false;
    } else if (nickname.trim().length < 2 || nickname.trim().length > 12) {
      setNicknameError(t('signup.errors.nicknameLength'));
      valid = false;
    } else {
      setNicknameError('');
    }

    // 비밀번호 유효성 검사
    if (!password.trim()) {
      setPasswordError(t('signup.errors.passwordRequired'));
      valid = false;
    } else if (password.trim().length < 8) {
      setPasswordError(t('signup.errors.passwordLength'));
      valid = false;
    } else {
      setPasswordError('');
    }

    // 비밀번호 확인
    if (confirmPw !== password) {
      setConfirmPwError(t('signup.errors.passwordMatch'));
      valid = false;
    } else {
      setConfirmPwError('');
    }

    // 생년월일(만 14세 이상) 검사
    if (!birthdate) {
      setBirthdateError(t('signup.errors.birthdateRequired'));
      valid = false;
    } else {
      const bDate = new Date(birthdate);
      const now = new Date();
      const minDate = new Date(
        now.getFullYear() - 14,
        now.getMonth(),
        now.getDate()
      );
      if (bDate > minDate) {
        setBirthdateError(t('signup.errors.ageRestriction'));
        valid = false;
      } else {
        setBirthdateError('');
      }
    }

    // 휴대전화 번호 검사
    if (!phone.trim()) {
      setPhoneError(t('signup.errors.phoneRequired'));
      valid = false;
    } else {
      const phonePattern = /^010-?\d{3,4}-?\d{1,4}$/;
      if (!phonePattern.test(phone)) {
        setPhoneError(t('signup.errors.phoneInvalid'));
        valid = false;
      } else {
        setPhoneError('');
      }
    }

    // 필수 약관 체크(서비스, 만 14세, 개인정보 수집·이용, 개인정보 제3자 제공)
    if (!serviceAgree || !ageAgree || !collectAgree || !thirdPartyAgree) {
      setTermsError(t('signup.errors.termsRequired'));
      valid = false;
    } else {
      setTermsError('');
    }

    if (!valid) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/regi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          password,
          email,
          birth: birthdate,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        alert(t('signup.success'));
      } else {
        alert(`${t('signup.failure')}: ${result.message}`);
      }
    } catch {
      alert(t('signup.errors.server'));
    }
  };

  return (
    <section className="signup-section">
      <div className="signup-box">
        <h2>{t('signup.title')}</h2>

        <form id="signupForm" onSubmit={handleSubmit} noValidate>
          {/* 이메일 입력 + 중복 확인 버튼 */}
          <div className="form-group">
            <label htmlFor="email">{t('signup.email')}</label>
            <div className="form-row">
              <input
                type="email"
                id="email"
                name="email"
                aria-label={t('signup.email')}
                placeholder={t('signup.placeholders.email')}
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                id="checkEmailBtn"
                aria-label={t('signup.buttons.checkEmail')}
                title={t('signup.buttons.checkEmail')}
                onClick={handleCheckEmail}
              >
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

          {/* 이메일 인증 + 인증번호 입력 */}
          {emailIconState === 'available' && (
              <div className="form-group">
                <label htmlFor="sendCodeBtn">이메일 인증</label>
                <div className="form-row">
                  <input
                    type="text"
                    id="verificationCode"
                    name="verificationCode"
                    placeholder="인증번호 입력"
                    style={{width: '200px'}}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="check-btn"
                    id="checkEmailBtn"
                    onClick={handleSendCode}
                  >
                    전송
                  </button>
                  <button
                    type="button"
                    id="verifyCodeBtn"
                    className="check-btn"
                    onClick={handleVerifyCode}
                  >
                    인증
                  </button>
                </div>
                {/* 전송 결과 메시지 */}
                {sendCodeMessage && (
                  <div className={sendCodeMessage.includes('성공') ? 'success-message' : 'error-message'}>
                    {sendCodeMessage}
                  </div>
                )}
                {/* 확인 결과 메시지 */}
                {verifyMessage && (
                  <div 
                    className={verifyMessage.includes('완료') ? 'success-message' : 'error-message'}
                    style={{ textAlign: 'left'}}
                  >
                    {verifyMessage}
                  </div>
                )}
              </div>
            )}

          {/* 닉네임 입력 */}
          <div className="form-group">
            <label htmlFor="nickname">{t('signup.nickname')}</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              aria-label={t('signup.nickname')}
              placeholder={t('signup.placeholders.nickname')}
              required
              minLength={2}
              maxLength={12}
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
            />
            {nicknameError && <div className="error-message">{nicknameError}</div>}
          </div>

          {/* 비밀번호 입력 */}
          <div className="form-group">
            <label htmlFor="password">{t('signup.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              aria-label={t('signup.password')}
              placeholder={t('signup.placeholders.password')}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
            />
            {pwStrengthText && (
              <div id="passwordStrength" className={`pw-strength ${pwStrengthClass}`}>
                {pwStrengthText}
              </div>
            )}
            {passwordError && <div className="error-message">{passwordError}</div>}
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('signup.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              aria-label={t('signup.confirmPassword')}
              placeholder={t('signup.placeholders.confirmPassword')}
              required
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => handleConfirmPwChange(e.target.value)}
            />
            {confirmPwError && <div className="error-message">{confirmPwError}</div>}
          </div>

          {/* 생년월일 입력 */}
          <div className="form-group">
            <label htmlFor="birthdate">{t('signup.birthdate')}</label>
            <input
              type="date"
              id="birthdate"
              name="birthdate"
              aria-label={t('signup.birthdate')}
              required
              value={birthdate}
              onChange={(e) => handleBirthdateChange(e.target.value)}
            />
            {birthdateError && <div className="error-message">{birthdateError}</div>}
          </div>

          {/* 휴대전화 입력 */}
          <div className="form-group">
            <label htmlFor="phone">{t('signup.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              aria-label={t('signup.phone')}
              placeholder={t('signup.placeholders.phone')}
              required
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            {phoneError && <div className="error-message">{phoneError}</div>}
          </div>

          {/* 지역 선택 지도 */}
          <div className="form-group">
            <label>{t('signup.regionLabel')}</label>
            <div className="signup-map">
              <div id="signupMap" />
            </div>
            {selectedRegion && (
              <div className="selected-region">
                {t('signup.selectedRegion')}: {selectedRegion}
              </div>
            )}
          </div>

          {/* 약관 동의 섹션 */}
          <div className="terms-section">
            <div className="all-agree">
              <label>
                <input
                  type="checkbox"
                  id="agreeAll"
                  name="agreeAll"
                  checked={agreeAll}
                  onChange={(e) => handleAgreeAllChange(e.target.checked)}
                />
                {t('signup.terms.agreeAll')}
              </label>
            </div>

            <div className="terms-details">
              {/* 서비스 이용약관 동의 */}
              <div className="terms-item">
                <div
                  className="terms-item-header"
                  onClick={() => handleToggleTerms('termsContentService')}
                >
                  <label>
                    <input
                      type="checkbox"
                      id="serviceAgree"
                      name="serviceAgree"
                      checked={serviceAgree}
                      onChange={(e) => setServiceAgree(e.target.checked)}
                    />
                    {t('signup.terms.service')}
                  </label>
                  <span
                    className={`arrow ${
                      openSections['termsContentService'] ? 'open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  id="termsContentService"
                  className={`terms-content ${
                    openSections['termsContentService'] ? 'open' : ''
                  }`}
                >
                  <div className="terms-text" style={termsStyle}>
                    {t('signup.termsContent.service')}
                  </div>
                </div>
              </div>

              {/* 만 14세 이상 이용 동의 */}
              <div className="terms-item">
                <div
                  className="terms-item-header"
                  onClick={() => handleToggleTerms('termsContentAge')}
                >
                  <label>
                    <input
                      type="checkbox"
                      id="ageAgree"
                      name="ageAgree"
                      checked={ageAgree}
                      onChange={(e) => setAgeAgree(e.target.checked)}
                    />
                    {t('signup.terms.age')}
                  </label>
                  <span
                    className={`arrow ${
                      openSections['termsContentAge'] ? 'open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  id="termsContentAge"
                  className={`terms-content ${
                    openSections['termsContentAge'] ? 'open' : ''
                  }`}
                >
                  <div className="terms-text" style={termsStyle}>
                    {t('signup.termsContent.age')}
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
                    {t('signup.terms.collect')}
                  </label>
                  <span
                    className={`arrow ${
                      openSections['termsContentCollect'] ? 'open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  id="termsContentCollect"
                  className={`terms-content ${
                    openSections['termsContentCollect'] ? 'open' : ''
                  }`}
                >
                  <div className="terms-text" style={termsStyle}>
                    {t('signup.termsContent.collect')}
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
                    {t('signup.terms.thirdParty')}
                  </label>
                  <span
                    className={`arrow ${
                      openSections['termsContentThirdParty'] ? 'open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  id="termsContentThirdParty"
                  className={`terms-content ${
                    openSections['termsContentThirdParty'] ? 'open' : ''
                  }`}
                >
                  <div className="terms-text" style={termsStyle}>
                    {t('signup.termsContent.thirdParty')}
                  </div>
                </div>
              </div>

              {/* 마케팅 정보 수신 동의 */}
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
                    {t('signup.terms.marketing')}
                  </label>
                  <span
                    className={`arrow ${
                      openSections['termsContentMarketing'] ? 'open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  id="termsContentMarketing"
                  className={`terms-content ${
                    openSections['termsContentMarketing'] ? 'open' : ''
                  }`}
                >
                  <div className="terms-text" style={termsStyle}>
                    {t('signup.termsContent.marketing')}
                  </div>
                </div>
              </div>

              {/* 위치정보 수집·이용 동의 */}
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
                    {t('signup.terms.location')}
                  </label>
                  <span
                    className={`arrow ${
                      openSections['termsContentLocation'] ? 'open' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
                <div
                  id="termsContentLocation"
                  className={`terms-content ${
                    openSections['termsContentLocation'] ? 'open' : ''
                  }`}
                >
                  <div className="terms-text" style={termsStyle}>
                    {t('signup.termsContent.location')}
                  </div>
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
            {t('signup.buttons.submit')}
          </button>
        </form>

        {/* 로그인 페이지 링크 */}
        <Link to="/login" className="login-link">
          {t('signup.alreadyHaveAccount')}
        </Link>
      </div>
    </section>
  );
}
