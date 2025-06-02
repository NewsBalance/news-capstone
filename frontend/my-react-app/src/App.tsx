// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import IndexPage from './pages/index';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import ResetPassword from './pages/ResetPassword';
import GoalsPage from './pages/goals';
import TermsPage from './pages/terms';
import PrivacyPage from './pages/Privacy';
import ContactPage from './pages/Contact';
import MyPage from './pages/myPage';
import DiscussionPage from './pages/DiscussionPage';
import VideosPage from './pages/Videos';
import VideoDetailPage from './pages/VideoDetail';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공통 레이아웃으로 모든 페이지를 감쌉니다 */}
        <Route element={<Layout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route path="/mypage" element={<MyPage />} />
          <Route path="/discussion" element={<DiscussionPage />} />

          <Route path="/videos" element={<VideosPage />} />
          <Route path="/videos/:videoId" element={<VideoDetailPage />} />

          {/* 매치되는 라우트가 없으면 NotFound */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
