import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';      // ← 추가!
import './SettingsMenu.css';

export default function SettingsMenu() {
  const { i18n } = useTranslation();                  // ← i18n 가져오기
  const [open, setOpen] = useState(false);
  const [openLang, setOpenLang] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (open) setOpenLang(false);
    setOpen(o => !o);
  };
  const toggleLang = () => setOpenLang(l => !l);

  const goPrivacy = () => {
    window.location.href = '/privacy';
    setOpen(false);
  };
  const goNotice = () => {
    window.location.href = '/contact'
    setOpen(false);
  };

  // 실제 언어 변경 호출
  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);    // ← 여기서 i18next에 언어 바꿔달라고 요청
    setOpen(false);
    setOpenLang(false);
  };

  const onBackdropClick = (e: MouseEvent) => {
    if (!menuRef.current?.contains(e.target as Node)) {
      if (openLang) setOpenLang(false);
      else setOpen(false);
    }
  };
  useEffect(() => {
    if (open) document.addEventListener('mousedown', onBackdropClick);
    return () => document.removeEventListener('mousedown', onBackdropClick);
  }, [open, openLang]);

  return (
    <>
      {!open && (
        <button className="settings-button" onClick={toggleMenu} aria-label="설정 열기">
          ⚙️
        </button>
      )}

      <div ref={menuRef} className={`settings-menu${open ? ' open' : ''}`}>
        {!openLang && (
          <button className="collapse-button" onClick={toggleMenu} aria-label="설정 닫기">
            ✖️
          </button>
        )}

        <button
          className={`menu-item item-lang${openLang ? ' active' : ''}`}
          onClick={toggleLang}
          aria-label="언어 설정"
        >
          🌐
        </button>

        {openLang ? (
          <>
            <button className="submenu-item lang-ko" onClick={() => changeLang('ko')} aria-label="한국어">🇰🇷</button>
            <button className="submenu-item lang-en" onClick={() => changeLang('en')} aria-label="English">🇬🇧</button>
            <button className="submenu-item lang-ja" onClick={() => changeLang('ja')} aria-label="日本語">🇯🇵</button>
            <button className="submenu-item lang-zh" onClick={() => changeLang('zh')} aria-label="中文">🇨🇳</button>
          </>
        ) : (
          <>
            <button className="menu-item item-privacy" onClick={goPrivacy} aria-label="개인정보 처리방침">📄</button>
            <button className="menu-item item-notice" onClick={goNotice} aria-label="공지사항">📢</button>
          </>
        )}
      </div>
    </>
  );
}
