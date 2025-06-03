// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from '../api/config';


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

interface User {
  id: number;
  nickname: string;
  email: string;
  role: string;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  checkAuth: () => false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 세션 기반 인증 검사로 변경
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 기본 에러 처리를 위한 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${URL}/session/my`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          if (res.status === 401) {
            // 인증되지 않은 상태는 정상적인 응답으로 처리
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
          }
          throw new Error(`세션 확인 실패: ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          console.log('세션 정보:', data.result);
          setIsAuthenticated(true);
          setUser({
            id: data.result.id || 0,
            nickname: data.result.nickname,
            email: data.result.email,
            role: data.result.role || 'USER',
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        // 성공이든 실패든 항상 로딩 상태 해제
        setLoading(false);
      }
    };

    // 세션 체크 실행
    checkSession();
  }, []);

  const login = (newUser: User) => {
    // 세션 기반 인증에서는 사용자 정보만 상태에 저장
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 서버에 로그아웃 요청 보내기
    fetch(`${API_BASE}/session/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
        .then(() => {
          // 클라이언트 상태 초기화
          setUser(null);
          setIsAuthenticated(false);
        })
        .catch(error => {
          console.error('로그아웃 중 오류 발생:', error);
          // 오류가 발생해도 클라이언트 상태는 초기화
          setUser(null);
          setIsAuthenticated(false);
        });
  };

  const checkAuth = () => {
    // 세션 기반 인증 확인으로 변경
    return isAuthenticated;
  };

  return (
      <AuthContext.Provider
          value={{ isAuthenticated, user, loading, login, logout, checkAuth }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);