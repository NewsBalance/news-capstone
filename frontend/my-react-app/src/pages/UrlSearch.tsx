import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api/config';
import '../styles/UrlSearch.css';
import topImage from '../assets/urlsearch_top.png';
import bottomImage from '../assets/urlsearch_bottom.png';
import { FaYoutube } from 'react-icons/fa';

export default function UrlSearchPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim().startsWith('http')) {
      setError('유효한 URL을 입력하세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/debug/getdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) throw new Error('서버 오류');
      const data = await res.json();
      const videoAddr = data.videoUrl;
      if (!videoAddr) throw new Error('영상 URL이 없습니다');
      const match = videoAddr.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      const videoId = match ? match[1] : '';
      if (!videoId) throw new Error('유효하지 않은 유튜브 URL입니다.');

      navigate(`/videos/${videoId}`, {
        state: {
          video: {
            videoId,
            title: data.title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoUrl: videoAddr,
            bias:
              data.biasScore < -0.3
                ? 'left'
                : data.biasScore > 0.3
                ? 'right'
                : 'center',
            score: data.biasScore,
            publishedAt: data.publishedAt,
          },
          videoUrl: videoAddr,
          analysisData: data,
        },
      });
    } catch (err) {
      console.error('분석 실패:', err);
      setError('분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="url-search-page">
      <img src={topImage} alt="상단 이미지" className="search-image top" />

      <div className="search-wrapper">
        <button
          type="button"
          className="youtube-icon-button"
          onClick={() => window.open('https://www.youtube.com', '_blank')}
          aria-label="유튜브 바로가기"
        >
          <FaYoutube size={50} />
        </button>

        <form className="search-bar-container" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="YouTube URL을 입력하세요"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={200}
          />
          <button type="submit" disabled={loading}>
            {loading ? '분석 중...' : '분석'}
          </button>
        </form>
      </div>

      {error && <p className="error-text">{error}</p>}

      <img src={bottomImage} alt="하단 이미지" className="search-image bottom" />
    </div>
  );
}
