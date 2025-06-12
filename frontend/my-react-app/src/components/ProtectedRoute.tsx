// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { JSX } from 'react/jsx-runtime';

    interface Props {
    children: JSX.Element;
    }

    const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // 인증 상태 확인 중이면 로딩 처리
    if (loading) {
        return null; // 또는 <Spinner /> 컴포넌트 등
    }

    // 로그인 안 된 상태면 경고 후 로그인 페이지로
    if (!isAuthenticated) {
        alert('로그인이 필요한 서비스입니다.');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 인증 완료된 경우 자식 컴포넌트 렌더
    return children;
    };

export default ProtectedRoute;
