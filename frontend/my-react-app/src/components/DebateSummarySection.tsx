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

// 로딩 상태 타입 정의
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 동적 점 애니메이션 컴포넌트
const DynamicDots: React.FC<{ text: string }> = ({ text }) => {
    const [dotCount, setDotCount] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount(prev => prev >= 3 ? 1 : prev + 1);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <span>
            {text}{'.'.repeat(dotCount)}
        </span>
    );
};

// 향상된 스피너 컴포넌트
const EnhancedSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4', 
        lg: 'h-6 w-6'
    };

    return (
        <div className={`${sizeClasses[size]} relative`}>
            <div className={`${sizeClasses[size]} border-2 border-blue-200 rounded-full animate-pulse`}></div>
            <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
        </div>
    );
};

const DebateSummarySection: React.FC<{ 
    roomId: number; 
    message: DebateMessage | null;
    onFactCheckComplete?: () => void;
}> = ({ roomId, message, onFactCheckComplete }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [articles, setArticles] = useState<RelatedArticle[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!message) {
            setLoadingState('idle');
            setSummary(null);
            setArticles([]);
            setError(null);
            return;
        }

        setLoadingState('loading');
        setError(null);

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
                setLoadingState('success');
                onFactCheckComplete?.();
            })
            .catch((err) => {
                console.error('요약 실패:', err);
                setError(err.message || '요약 중 오류가 발생했습니다');
                setLoadingState('error');
                setSummary(null);
                setArticles([]);
                onFactCheckComplete?.();
            });
    }, [roomId, message]);

    // 상태별 렌더링 함수
    const renderSummaryContent = () => {
        switch (loadingState) {
            case 'idle':
                return <li className="text-gray-500">팩트체크할 메시지를 선택해주세요</li>;
            case 'loading':
                return (
                    <li className="text-blue-600">
                        <div className="flex items-center">
                            <EnhancedSpinner size="sm" />
                            <span className="ml-2">
                                <DynamicDots text="팩트체크 분석 중" />
                            </span>
                        </div>
                    </li>
                );
            case 'error':
                return (
                    <li className="text-red-600">
                        <div className="flex items-center">
                            <span className="mr-2 text-lg animate-pulse">⚠️</span>
                            {error || '팩트체크 요청에 실패했습니다'}
                        </div>
                    </li>
                );
            case 'success':
                return summary ? <li>{summary}</li> : <li className="text-gray-500">분석 결과가 없습니다</li>;
            default:
                return <li className="text-gray-500">팩트체크할 메시지를 선택해주세요</li>;
        }
    };

    const renderArticlesContent = () => {
        switch (loadingState) {
            case 'idle':
                return <p className="text-gray-500">팩트체크할 메시지를 선택해주세요</p>;
            case 'loading':
                return (
                    <div className="flex items-center text-blue-600">
                        <EnhancedSpinner size="sm" />
                        <span className="ml-2">
                            <DynamicDots text="관련 자료 검색 중" />
                        </span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center text-red-600">
                        <span className="mr-2 text-lg animate-pulse">⚠️</span>
                        관련 자료를 가져올 수 없습니다
                    </div>
                );
            case 'success':
                return articles.length > 0 ? (
                    <div className="space-y-2">
                        {articles.map((article, idx) => (
                            <div key={idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                                {parse(`<a href="${article.link}" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline whitespace-normal break-words hover:text-blue-900 transition-colors">${article.title}</a>`)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">관련 기사가 없습니다</p>
                );
            default:
                return <p className="text-gray-500">팩트체크할 메시지를 선택해주세요</p>;
        }
    };

    return (
        <>
            <div className="info-section mb-4">
                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">발언 요지</h3>
                <div className={`bg-white p-3 rounded-lg shadow-sm border transition-all duration-300 ${
                    loadingState === 'loading' ? 'border-blue-300 shadow-blue-100' : 
                    loadingState === 'error' ? 'border-red-300 shadow-red-100' : 
                    'border-gray-200'
                }`}>
                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                        {renderSummaryContent()}
                    </ul>
                </div>
            </div>

            <div className="info-section">
                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">참고 자료</h3>
                <div className={`bg-white p-3 rounded-lg shadow-sm border transition-all duration-300 ${
                    loadingState === 'loading' ? 'border-blue-300 shadow-blue-100' : 
                    loadingState === 'error' ? 'border-red-300 shadow-red-100' : 
                    'border-gray-200'
                }`}>
                    <div className="text-sm text-gray-700">
                        {renderArticlesContent()}
                    </div>
                </div>
            </div>


        </>
    );
};

export default DebateSummarySection;