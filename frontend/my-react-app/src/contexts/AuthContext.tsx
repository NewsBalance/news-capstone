import React, { createContext, useState, useEffect, ReactNode } from 'react';

const URL = "http://localhost:8080";

interface AuthContextType {
    isLoggedIn: boolean;
    nickname: string | null;
    login: (nick: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    nickname: null,
    login: () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState<string | null>(null);

  // 마운트 시 서버 세션 확인
    useEffect(() => {
        fetch(`${URL}/Login/session`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
        if (data.success) {
            setIsLoggedIn(true);
            setNickname(data.nickname);
        }   
    })
    .catch(() => {}); 
}, []);

    const login = (nick: string) => {
        setIsLoggedIn(true);
        setNickname(nick);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setNickname(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, nickname, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
