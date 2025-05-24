// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { JSX } from 'react/jsx-runtime';

interface Props { children: JSX.Element }

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const { isAuthenticated, checkAuth } = useAuth();
    const location = useLocation();

    // 인증 상태 확인 (컨텍스트 상태 또는 로컬 스토리지)
    const isLoggedIn = isAuthenticated || checkAuth();

    if (!isLoggedIn) {
        // 로그인이 필요한 서비스라는 알림
        alert("로그인이 필요한 서비스입니다.");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
};

export default ProtectedRoute;
