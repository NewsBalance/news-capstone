import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './login';
import '@testing-library/jest-dom/extend-expect';

describe('LoginPage', () => {
  const renderPage = () =>
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

  test('기본 렌더링', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /로그인/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/)).toBeInTheDocument();
  });

  test('폼 검증 메시지 표시', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^로그인$/ }));
    expect(screen.getByText(/아이디\(이메일\)을 입력하세요\./)).toBeInTheDocument();
    expect(screen.getByText(/비밀번호를 입력하세요\./)).toBeInTheDocument();
  });
});
