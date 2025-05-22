// src/pages/UserPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams }          from 'react-router-dom';
import Header                 from '../components/Header';
import '../styles/MyPage.css';  // 동일한 스타일 재활용 가능

const URL = "http://localhost:8080";
const DEFAULT_AVATAR =
    "data:image/svg+xml;utf8," +
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>" +
    "<circle cx='40' cy='24' r='20' fill='%23ccc'/>" +
    "<path d='M10,78 C10,58 70,58 70,78 Z' fill='%23ccc'/>" +
    "</svg>";

interface TimelineItem {
    id: number;
    type: 'check' | 'comment' | 'like' | 'bookmark';
    title: string;
    date: string;
}

interface UserProfileDTO {
    nickname: string;
    email: string;
    bio: string;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function UserPage() {
    const { nickname } = useParams<{ nickname: string }>();
    const { email } = useParams<{ email: string }>();
    const { bio } = useParams<{ bio: string }>();
    const [profile, setProfile] = useState<UserProfileDTO | null>(null);
    const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
    
    
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const { userId } = useParams<{ userId: string }>();

    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
    const [timelineFilter, setTimelineFilter] = useState<'all'|'check'|'comment'|'like'|'bookmark'>('all');
    const [timelineSearch, setTimelineSearch] = useState('');
    const [timelinePage, setTimelinePage] = useState(1);

    useEffect(() => {
        if (!nickname) return;
        setLoading(true);
        fetch(`${URL}/session/Profile/${nickname}`, { credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error('사용자 조회 실패');
            return res.json();
        })
        .then((profileData: UserProfileDTO) => {
            setProfile(profileData);
        })
        .catch(() => setError('프로필을 불러올 수 없습니다.'))
        .finally(() => setLoading(false));
    }, [nickname]);

    if (loading) return <div className="spinner">로딩 중…</div>;
    if (error)   return <div className="error">{error}</div>;
    if (!profile) return null;

    const filteredTimeline = timelineItems
        .filter(item => timelineFilter === 'all' || item.type === timelineFilter)
        .filter(item => item.title.includes(timelineSearch))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="mypage">
        <Header />
            <div className="mypage__inner">
                <aside className="sidebar">
            <div className="profile-box">
                <div className="avatar"><img src={avatarPreview} alt="avatar" /></div>
                <h2 className="nickname">{nickname}</h2>
                <p className="bio">{bio || '소개 없음'}</p>
            </div>
            </aside>
            
            <section className="content">
            <article className="card timeline-card">
                <div className="notification-header">
                <h3>활동 히스토리</h3>
                </div>
                <div className="timeline-controls">
                <select
                    aria-label="활동 유형 필터"
                    value={timelineFilter}
                    onChange={e => { setTimelineFilter(e.target.value as any); setTimelinePage(1); }}
                >
                    <option value="all">전체</option>
                    <option value="check">팩트체크</option>
                    <option value="comment">댓글</option>
                    <option value="like">좋아요</option>
                    <option value="bookmark">북마크</option>
                </select>
                <input
                    type="text"
                    placeholder="검색어 입력"
                    aria-label="활동 검색"
                    value={timelineSearch}
                    onChange={e => { setTimelineSearch(e.target.value); setTimelinePage(1); }}
                />
                </div>

                {loading ? (
                <div className="spinner">로딩 중…</div>
                ) : error ? (
                <div className="error">{error}</div>
                ) : filteredTimeline.length === 0 ? (
                <p className="empty">활동 기록이 없습니다.</p>
                ) : (
                <ul className="timeline-list">
                    {filteredTimeline.slice(0, timelinePage * 5).map(item => (
                    <li key={item.id} className="timeline-item">
                        <span className="timeline-time">{formatDate(item.date)}</span>
                        <span className="timeline-desc">[{item.type}] {item.title}</span>
                    </li>
                    ))}
                </ul>
                )}

                {filteredTimeline.length > timelinePage * 5 && (
                <button
                    className="btn load-more"
                    onClick={() => setTimelinePage(p => p + 1)}
                    aria-label="더 많은 활동 보기"
                >
                    더 보기
                </button>
                )}
            </article>
            </section>
        </div>
        </div>
    );
}