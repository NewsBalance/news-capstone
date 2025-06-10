import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VideoDetailPage from './VideoDetail';
import '@testing-library/jest-dom/extend-expect';

describe('VideoDetailPage', () => {
  const video = {
    videoId: 'abc123',
    title: 'Test Video',
    channel: 'Test Channel',
    thumbnail: '',
    bias: 'left' as const,
  };

  const renderPage = () => {
    (global as any).fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [{ snippet: { publishedAt: '2024-01-01T00:00:00Z' }, statistics: { viewCount: '1', likeCount: '1', commentCount: '1' } }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sentiment: 'neutral', keywords: [], summary: '', bias: 'center' })
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('transcript')
      });

    return render(
      <MemoryRouter initialEntries={[{ pathname: '/detail', state: { video } } as any]}>
        <Routes>
          <Route path="/detail" element={<VideoDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('renders video information', async () => {
    renderPage();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('📺 Test Channel')).toBeInTheDocument();
  });
});
