// components/DebateSummarySection.tsx
import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api/config';
import parse from 'html-react-parser';

type RelatedArticle = {
    link: string;
    title: string;
};

type SummarizeResponse = {
    summarizemessage: string;
    relatedArticles: RelatedArticle[];
    keywords: string[];
};

interface DebateMessage {
    speaker: string;
    text: string;
}

const DebateSummarySection: React.FC<{ roomId: number; message: DebateMessage | null }> = ({ roomId, message }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [articles, setArticles] = useState<RelatedArticle[]>([]);

    useEffect(() => {
        if (!message) return;

        fetch(`${API_BASE}/api/debate/summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ roomId, messages: message }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('요약 요청 실패');
                return res.json();
            })
            .then((data: SummarizeResponse) => {
                setSummary(data.summarizemessage);
                setArticles(data.relatedArticles);
            })
            .catch((err) => {
                console.error('요약 실패:', err);
            });
    }, [roomId, message]);

    if (!message) return null;

    return (
        <>
            <div className="info-section mb-4">
                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">발언 요지</h3>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                        {summary ? <li>{summary}</li> : <li>요약을 불러오는 중...</li>}
                    </ul>
                </div>
            </div>

            <div className="info-section">
                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">참고 자료</h3>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-700">
                        {articles.length > 0 ? (
                            articles.map((article, idx) => (
                                <div key={idx} className="mb-1">
                                    {parse(`<a href="${article.link}" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline whitespace-normal break-words">${article.title}</a>`)}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">관련 기사가 없습니다</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DebateSummarySection;