// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import IndexPage from './pages/index';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import GoalsPage from './pages/goals';
import MyPage from './pages/myPage';
import DiscussionPage from './pages/DiscussionPage';
import VideosPage from './pages/Videos';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/discussion" element={<DiscussionPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
