// src/index.tsx (병합 결과)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './styles/global.css'; // 프론트최종에만 있음
import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// 꼭 i18n import 를 App 렌더링 전에 해주세요
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <I18nextProvider i18n={i18n}>
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    </I18nextProvider>
);

reportWebVitals();
