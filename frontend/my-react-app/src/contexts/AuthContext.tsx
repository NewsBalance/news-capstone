import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  nickname: string;
  id: number;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

// 초기 값으로 AuthContextType 타입의 객체 제공
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  checkAuth: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 초기 로딩 시 저장된 인증 정보 확인
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('초기화 시 토큰 존재 여부:', !!storedToken);
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('저장된 사용자 정보로 인증됨:', parsedUser.nickname);
      } catch (e) {
        console.error('저장된 사용자 정보 파싱 오류:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 로그인 함수
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    console.log('로그인 성공:', newUser.nickname);
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('로그아웃됨');
  };

  // 인증 상태 확인 함수
  const checkAuth = (): boolean => {
    const storedToken = localStorage.getItem('token');
    return !!storedToken;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
