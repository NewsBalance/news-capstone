import { render, screen, fireEvent } from '@testing-library/react';
import MyPage from './myPage';
import '@testing-library/jest-dom/extend-expect';

test('기본 섹션이 렌더링된다', () => {
  render(<MyPage />);

  expect(screen.getByText(/내 프로필/)).toBeInTheDocument();
  expect(screen.getByText(/정치 성향/)).toBeInTheDocument();
});

test('복구 이메일을 수정·저장할 수 있다', () => {
  render(<MyPage />);

  fireEvent.click(screen.getByRole('button', { name: /수정/ }));
  const input = screen.getByPlaceholderText(/example@domain/);
  fireEvent.change(input, { target: { value: 'new@domain.com' } });
  fireEvent.click(screen.getByRole('button', { name: /저장/ }));

  expect(screen.getByText('new@domain.com')).toBeInTheDocument();
});
