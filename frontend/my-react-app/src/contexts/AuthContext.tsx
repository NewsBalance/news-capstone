// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const URL = "http://localhost:8080";

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, user: User) => void;
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
  token: null,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  checkAuth: () => false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 세션 기반 인증 검사로 변경
  useEffect(() => {
    // localStorage 관련 코드 제거하고 세션 검사만 수행
    fetch(`${URL}/session/my`, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsAuthenticated(true);
          setUser({
            id: data.result.email ? 0 : 0, // 백엔드에서 id 필드가 없으므로 임시로 0 설정
            nickname: data.result.nickname,
            email: data.result.email,
            role: 'USER', // 백엔드에서 role 필드가 없으므로 기본값 설정
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      })
      .catch((error) => {
        console.error('세션 확인 중 오류:', error);
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (newToken: string, newUser: User) => {
    // localStorage 사용 중단하고 세션만 사용
    setToken(newToken); // 토큰은 첫 로그인에만 사용
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 서버에 로그아웃 요청 보내기
    fetch(`${URL}/session/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(() => {
      // 클라이언트 상태 초기화
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    })
    .catch(error => {
      console.error('로그아웃 중 오류 발생:', error);
      // 오류가 발생해도 클라이언트 상태는 초기화
      setToken(null);
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
      value={{ isAuthenticated, token, user, loading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);