// src/components/Layout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import SettingsMenu from './SettingsMenu';
import '../styles/Layout.css';

export default function Layout() {
  return (
    <>
      <Header />

      <main className="content">
        <Outlet />
      </main>

      {/* SettingsMenu 는 항상 우측 하단에 뜹니다 */}
      <SettingsMenu />
    </>
  );
}
