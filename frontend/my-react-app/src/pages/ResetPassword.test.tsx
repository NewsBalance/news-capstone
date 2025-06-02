import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import '@testing-library/jest-dom/extend-expect';

describe('ResetPassword', () => {
  const renderPage = () =>
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  test('renders form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /비밀번호 재설정/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument();
  });

  test('shows success message on valid email', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    renderPage();
    fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: 'a@b.c' } });
    fireEvent.click(screen.getByRole('button', { name: /재설정 메일 발송/ }));
    expect(await screen.findByText(/재설정 메일을 발송했습니다/)).toBeInTheDocument();
  });

  test('shows error when email not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    renderPage();
    fireEvent.change(screen.getByLabelText(/이메일/), { target: { value: 'a@b.c' } });
    fireEvent.click(screen.getByRole('button', { name: /재설정 메일 발송/ }));
    expect(await screen.findByText(/존재하지 않는 이메일입니다/)).toBeInTheDocument();
  });
});
