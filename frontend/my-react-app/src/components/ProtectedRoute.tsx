// src/components/ProtectedRoute.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { JSX } from 'react/jsx-runtime';

const URL = 'http://localhost:8080';

interface Props { children: JSX.Element }

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const [checking, setChecking] = useState(true);
    const [authed, setAuthed] = useState(false);
    const location = useLocation();

    useEffect(() => {
    // 세션 확인 API 호출 (백엔드에 /api/check-session 등 구현)
    fetch(`${URL}/Login/session`, {
        method: 'GET',
        credentials: 'include',           // 쿠키 포함
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => {
        if (res.ok) setAuthed(true);
        else setAuthed(false);
    })
    .catch(() => setAuthed(false))
    .finally(() => setChecking(false));
}, []);

    if (checking) {
        return <div>로딩 중…</div>;
    }
    if (!authed) {
    // 로그인 화면으로 리다이렉트
    alert("로그인이 필요한 서비스입니다.");
    return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
};

export default ProtectedRoute;
