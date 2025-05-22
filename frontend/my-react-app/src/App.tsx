// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import IndexPage from './pages/index';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import GoalsPage from './pages/goals';
import MyPage from './pages/myPage';
import UserPage from './pages/UserPage';
import DiscussionPage from './pages/DiscussionPage';
import VideosPage from './pages/Videos';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route
        path="/myPage"
        element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        }
      />
      <Route path="/Profile/:nickname" element={<UserPage />} />
      <Route
        path="/discussion"
        element={
          <ProtectedRoute>
            <DiscussionPage />
          </ProtectedRoute>
        }
      />
      <Route path="/videos" element={<VideosPage />} />
      <Route
        path="/reset-password"
        element={
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}