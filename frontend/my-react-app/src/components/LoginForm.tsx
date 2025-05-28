import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LocationState {
  returnTo?: string;
}

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력하세요');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/session/login`;
      console.log('로그인 요청 시작:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: username,
          password,
        }),
      });
      
      console.log('로그인 응답 상태:', response.status);
      
      const responseText = await response.text();
      console.log('응답 원본:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('로그인 응답 데이터:', data);
      } catch (e) {
        console.error('JSON 파싱 오류:', e);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }
      
      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다');
      }
      
      // 사용자 정보 객체 생성
      const userObj = {
        nickname: data.result?.nickname || username,
        id: data.result?.id || 0,
        email: data.result?.email || username,
        role: data.result?.role || 'USER'
      };
      
      // 전역 인증 상태에 저장 - 토큰 없이 사용자 정보만 전달
      auth.login(userObj);
      
      // 로그인 성공 콜백 실행
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      // 리다이렉트 처리
      const state = location.state as LocationState;
      const returnTo = state?.returnTo || '/';
      navigate(returnTo);
      
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 폼 부분 */}
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div>
          <label htmlFor="username">이메일</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm; 