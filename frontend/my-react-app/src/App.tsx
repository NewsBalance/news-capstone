// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 우리가 만든 컴포넌트들 (파일명 소문자)
import IndexPage from './pages/index';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import GoalsPage from './pages/goals';
import MyPage from './pages/myPage';
import DiscussionPage from './pages/DiscussionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/discussion" element={<DiscussionPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
