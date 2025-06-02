import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VideosPage from './Videos';
import '@testing-library/jest-dom/extend-expect';

describe('VideosPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <VideosPage />
      </MemoryRouter>
    );

  test('기본 렌더링', () => {
    renderPage();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByText('진보')).toBeInTheDocument();
    expect(screen.getByText('중도')).toBeInTheDocument();
    expect(screen.getByText('보수')).toBeInTheDocument();
  });

  test('빈 검색어 제출 시 검색되지 않는다', () => {
    renderPage();
    fireEvent.submit(screen.getByRole('search'));
    // 에러 메시지가 나타나지 않음
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
