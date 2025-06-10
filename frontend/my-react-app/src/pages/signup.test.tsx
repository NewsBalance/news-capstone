import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from './signup';
import '@testing-library/jest-dom/extend-expect';

jest.mock('@amcharts/amcharts4/core', () => ({ create: () => ({ series: { push: () => ({ mapPolygons: { template: { events: { on: jest.fn() }, states: { create: jest.fn(() => ({ properties: {} })) } } } }) }, chartContainer: {}, dispose: jest.fn() }), color: jest.fn() }));
jest.mock('@amcharts/amcharts4/maps', () => ({ MapChart: function(){}, MapPolygonSeries: function(){}, projections: { Miller: function(){} } }));

// geodata is real file - no need to mock

describe('SignupPage', () => {
  const renderPage = () =>
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

  test('기본 렌더링', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /회원가입/ })).toBeInTheDocument();
  });

  test('폼 검증 메시지 표시', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /가입하기/ }));
    expect(screen.getByText(/이메일을 입력해주세요\./)).toBeInTheDocument();
    expect(screen.getByText(/닉네임을 입력해주세요\./)).toBeInTheDocument();
    expect(screen.getByText(/비밀번호를 입력해주세요\./)).toBeInTheDocument();
  });
});
