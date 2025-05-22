import React, { createContext, useState, useEffect, ReactNode } from 'react';

const URL = "http://localhost:8080";

interface AuthContextType {
    isLoggedIn: boolean;
    nickname: string | null;
    email: string | null;
    loading: boolean;
    login: (nick: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    nickname: null,
    email: null,
    loading: true,
    login: () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 마운트 시 서버 세션 확인
    useEffect(() => {
        fetch(`${URL}/session/my`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setIsLoggedIn(true);
                    setNickname(data.result.nickname);
                    setEmail(data.result.email);
                } else {
                    setIsLoggedIn(false);
                    setNickname(null);
                    setEmail(null);
                }
            })
            .catch(() => {
                setIsLoggedIn(false);
                setNickname(null);
                setEmail(null);
            })
            .finally(() => setLoading(false));
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
        <AuthContext.Provider value={{ isLoggedIn, nickname, email, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
