import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContactPage from './Contact';
import '@testing-library/jest-dom/extend-expect';

describe('ContactPage', () => {
  const renderPage = () =>
    render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>
    );

  test('renders contact form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /제보\/문의/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  test('shows validation messages', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /제출/ }));
    expect(screen.getByText(/이름을 입력하세요/)).toBeInTheDocument();
    expect(screen.getByText(/유효한 이메일을 입력하세요/)).toBeInTheDocument();
    expect(screen.getByText(/제목을 입력하세요/)).toBeInTheDocument();
    expect(screen.getByText(/내용을 입력하세요/)).toBeInTheDocument();
  });
});
