import React, { useState, useRef, useEffect } from "react";
import '../styles/DebateRoom.css';
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE } from '../api/config';

interface DebateMessage {
    speaker: string;
    text: string;
    summary?: string;
    factCheck?: string;
    factCheckBy?: string;
    isFactChecked?: boolean;
}

interface Props {
    role: 'debater' | 'viewer';
    userName: string;
    messages: DebateMessage[];
    onSendMessage: (text: string) => void;
    chatMessages: string[];
    onSendChat: (text: string) => void;
    roomTitle: string;
    roomTopic: string;
    onReady: () => void;
    roomId?: string;
    debaterA: string | null;
    debaterB: string | null;
    debaterAReady: boolean;
    debaterBReady: boolean;
    spectatorCount: number;
    onJoinAsDebaterB: () => void;
    onLeave: () => void;
    isLoggedIn: boolean;
    onFactCheck: (messageIndex: number) => void;
    currentTurnUserNickname?: string;
    roomData?: any;
}

type RelatedArticle = {
    link: string;
    title: string;
};

type SummarizeResponse = {
    summarizemessage: string;
    relatedArticles: RelatedArticle[];
    keywords: string[];
};

// DebateSummarySection 컴포넌트 수정
const DebateSummarySection = ({ roomId, messages }: { 
  roomId: number; 
  messages: any[];
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [articles, setArticles] = useState<RelatedArticle[]>([]);

  const requestSummary = () => {
    // 메시지가 없으면 요청하지 않음
    if (!messages || messages.length === 0) return;
    
    const requestBody = { roomId };

    fetch(`${API_BASE}/api/debate/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then((res) => {
        if (!res.ok) throw new Error('요약 응답 오류');
        return res.json();
      })
      .then((data: SummarizeResponse) => {
        setSummary(data.summarizemessage);
        setArticles(data.relatedArticles);
      })
      .catch((err) => {
        console.error('요약 또는 기사 로딩 실패:', err);
      });
  };

  return { summary, articles, requestSummary };
};

// 메시지 목록 컴포넌트 개선
const MessageList = ({ messages, onFactCheck }: {
    messages: DebateMessage[], 
    onFactCheck: (messageIndex: number) => void 
}) => {
    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 italic">아직 메시지가 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="message-list w-full">
            {messages.map((msg, i) => (
                <div key={i} className="chat-bubble bg-white shadow-sm border border-gray-200 rounded-lg p-3 mb-3 w-full">
                    <div className="message-header">
                        <p className="font-bold text-pink-600">{msg.speaker}</p>
                    </div>
                    <p className="message-content text-gray-700 whitespace-normal break-all overflow-hidden">{msg.text}</p>
                    {msg.summary && (
                        <p className="message-summary text-gray-600 text-sm italic mt-2 pt-2 border-t border-gray-100 whitespace-normal break-all overflow-hidden">
                       
                        </p>
                    )}
                    <div className="message-actions mt-2 text-right">
                        {!msg.isFactChecked && msg.speaker !== 'System' && (
                            <button 
                                onClick={() => onFactCheck(i)}
                                className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded border border-orange-200 transition-colors"
                            >
                                팩트체크
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const DebateRoomPage: React.FC<Props> = ({
    role,
    userName,
    messages,
    onSendMessage,
    chatMessages,
    onSendChat,
    roomTitle,
    roomTopic,
    onReady,
    roomId,
    debaterA,
    debaterB,
    debaterAReady,
    debaterBReady,
    spectatorCount,
    isLoggedIn,
    onJoinAsDebaterB,
    onLeave,
    onFactCheck,
    currentTurnUserNickname,
    roomData,
}) => {
    const [input, setInput] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [isFactChecking, setIsFactChecking] = useState(false);
    const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
    const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
    const [showSpectatorChat, setShowSpectatorChat] = useState<boolean>(true);
    // 요약 요청 함수를 위한 참조 추가
    const summaryRequestRef = useRef<() => void>(() => {});
    
    const debateMessagesRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    
    const navigate = useNavigate();
    
    // 새 메시지가 추가될 때마다 스크롤을 아래로 이동
    useEffect(() => {
        if (debateMessagesRef.current) {
            debateMessagesRef.current.scrollTop = debateMessagesRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // 준비 버튼 핸들러
    const handleReady = () => {
        onReady();
        setIsReady(!isReady);
    };

    // 인증 상태 표시
    const AuthStatus = () => {
        if (!isLoggedIn) {
            return (
                <div className="auth-status text-sm text-red-500">
                    <span>로그인 필요</span>
                </div>
            );
        }
        
        const roleText = role === 'debater' ? '토론자' : '관전자';
        
        return (
            <div className="auth-status text-sm">
                <span className="text-purple-600 font-medium">{userName}</span>
                <span className="text-gray-500 ml-1">({roleText})</span>
            </div>
        );
    };
    
    // 채팅 메시지 전송 핸들러 수정
    const handleSendChat = () => {
        if (chatInput.trim()) {
            // WebSocket을 통해서만 메시지 전송
            onSendChat(chatInput.trim());
            setChatInput("");
        }
    };
    
    // 키보드 이벤트 핸들러
    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendChat();
        }
    };
    
    const handleLeave = async () => {
        if (!roomId) {
            console.error('Room ID is undefined');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // 세션 쿠키 포함
            });

            if (!response.ok) {
                throw new Error('퇴장 처리 중 오류가 발생했습니다');
            }

            navigate('/discussion');
        } catch (error) {
            console.error('Error leaving room:', error);
            alert(error instanceof Error ? error.message : '오류가 발생했습니다');
        }
    };
    
    // 참가자 정보 컴포넌트 추출
    const ParticipantInfo = () => (
        <div className="info-section mb-4">
            <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">참가자</h3>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-pink-600">토론자 A: {debaterA || ''}</span>
                    <span className={`${debaterAReady ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'} text-xs px-2 py-1 rounded`}>
                        {debaterAReady ? '준비완료' : '대기중'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-blue-600">토론자 B: {debaterB || ''}</span>
                    <span className={`${debaterBReady ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} text-xs px-2 py-1 rounded`}>
                        {debaterBReady ? '준비완료' : '대기중'}
                    </span>
                </div>
                
                {/* 토론자 B로 참여하기 버튼 추가 */}
                {!debaterB && role === 'viewer' && (
                    <button 
                        onClick={onJoinAsDebaterB}
                        className="w-full mt-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                    >
                        토론자 B로 참여하기
                    </button>
                )}
                
                <div className="mt-2 text-xs text-gray-500 text-center">
                    참여자: {spectatorCount}명
                </div>
            </div>
        </div>
    );
    
    // 커스텀 CSS 스타일 추가
    useEffect(() => {
        // 애니메이션 CSS 추가
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .animate-fadeIn {
                animation: fadeIn 0.5s ease-in-out;
            }
            
            @keyframes blink {
                0% { opacity: 0.2; }
                20% { opacity: 1; }
                100% { opacity: 0.2; }
            }
            
            .loading-dots .dot {
                animation: blink 1.4s infinite both;
                display: inline-block;
            }
            
            .loading-dots .dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .loading-dots .dot:nth-child(3) {
                animation-delay: 0.4s;
            }
        `;
        document.head.appendChild(style);
        
        // 컴포넌트 언마운트 시 스타일 제거
        return () => {
            document.head.removeChild(style);
        };
    }, []);
    
    // 팩트체크 기능 수정 - 요약 기능 호출만 진행하고 기존 팩트체크 함수는 제거
    const handleFactCheck = (messageIndex: number) => {
        // 요약 요청 함수 호출
        summaryRequestRef.current();
    };

    // 디버깅 로그 추가
    useEffect(() => {
        console.log('현재 턴 정보:', {
            currentTurnUserNickname,
            userName,
            isMyTurn,
            roomStarted: roomData?.started
        });
    }, [currentTurnUserNickname, userName, isMyTurn, roomData?.started]);

    // useEffect 수정 - 서버에서 받은 currentTurnUserNickname 사용
    useEffect(() => {
        // 서버에서 제공하는 currentTurnUserNickname이 있으면 사용
        if (currentTurnUserNickname) {
            setCurrentSpeaker(currentTurnUserNickname);
            const myTurn = currentTurnUserNickname === userName;
            setIsMyTurn(myTurn);
            console.log(`턴 업데이트: ${currentTurnUserNickname}, 내 턴: ${myTurn}`);
        } else {
            // 기존 로직은 fallback으로 유지
            const lastMessage = messages[messages.length - 1];
            const nextSpeaker = lastMessage ? 
                (lastMessage.speaker === debaterA ? debaterB : debaterA) : 
                (debaterAReady && debaterBReady ? debaterA : null);
            
            setCurrentSpeaker(nextSpeaker);
            const myTurn = nextSpeaker === userName;
            setIsMyTurn(myTurn);
            console.log(`턴 업데이트(fallback): ${nextSpeaker}, 내 턴: ${myTurn}`);
        }
    }, [messages, debaterA, debaterB, debaterAReady, debaterBReady, userName, currentTurnUserNickname]);

    // 요약 정보와 관련 기사를 가져오기 위해 컴포넌트 사용 (수정)
    const { summary: summaryFromComponent, articles: articlesFromComponent, requestSummary } = DebateSummarySection({ 
        roomId: parseInt(roomId || '0'), 
        messages
    });

    // requestSummary 함수를 참조에 저장
    useEffect(() => {
        summaryRequestRef.current = requestSummary;
    }, [requestSummary]);

    return (
        <div className="flex flex-col h-screen bg-neutral-50 text-gray-800 font-sans overflow-hidden">
            {/* 헤더 섹션 - 크기 조정 */}
            <div className="debate-header py-2 px-4 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto flex justify-between items-center px-4">
                    <div className="room-info">
                        <h1 className="room-title text-xl font-bold text-purple-600">{roomTitle || '제목 없음'}</h1>
                        <p className="room-topic text-xs text-gray-600">{roomTopic || '주제 없음'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <AuthStatus />
                        {/* 모든 버튼의 디자인 일관성 유지 */}
                        {role === 'debater' && (
                            <button
                                onClick={handleReady}
                                className={`ready-button ${isReady ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'} text-white px-2 py-0.5 rounded text-xs transition-colors`}
                            >
                                {isReady ? '준비 취소' : '준비'}
                            </button>
                        )}
                        <button
                            onClick={handleLeave}
                            className="leave-button bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs transition-colors"
                        >
                            나가기
                        </button>
                        <button 
                            onClick={() => setShowSpectatorChat(!showSpectatorChat)}
                            className="ml-1 bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs transition-colors"
                        >
                            {showSpectatorChat ? "관전자 채팅 숨기기" : "관전자 채팅 보기"}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 컨텐츠 섹션 - 전체 너비를 사용하도록 수정 */}
            <div className="flex-1 overflow-hidden bg-neutral-50">
                <div className="h-full w-full grid" 
                     style={{ 
                         minHeight: '600px', 
                         maxHeight: '100%',
                         gridTemplateColumns: showSpectatorChat ? 
                             '2fr 1fr 1fr' : 
                             '3fr 1fr', // 관전자 채팅 숨김 시 컬럼 비율 변경 (토론자 영역 확장)
                         transition: 'grid-template-columns 0.3s ease-in-out'
                     }}>
                    {/* 왼쪽: 토론자 영역 */}
                    <div className="border-r border-gray-200 h-full overflow-hidden flex flex-col" style={{ maxWidth: '100%' }}>
                        <div className="chat-header p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
                            <h2 className="text-lg font-semibold text-pink-600">토론자 메시지</h2>
                        </div>
                        
                        <div 
                            ref={debateMessagesRef}
                            className="chat-messages flex-1 overflow-y-auto overflow-x-hidden p-4 bg-neutral-50"
                            style={{ width: '100%', maxWidth: '100%', wordBreak: 'break-all' }}
                        >
                            <MessageList messages={messages} onFactCheck={handleFactCheck} />
                        </div>
                        
                        <div className="chat-input-container p-4 bg-white border-t border-gray-200 sticky bottom-0">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`${role === 'debater' ? (isMyTurn ? '당신의 주장을 입력하세요...' : '지금은 발언할 수 없습니다.') : '관전자는 메시지를 보낼 수 없습니다'}`}
                                className="input-field bg-neutral-50 border border-gray-300 rounded-lg p-2 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                disabled={!(role === 'debater' && isMyTurn)}
                            />
                            <button
                                onClick={() => {
                                    if (input.trim() && role === 'debater' && isMyTurn) {
                                        onSendMessage(input.trim());
                                        setInput("");
                                    }
                                }}
                                className={`send-button ${!(role === 'debater' && isMyTurn) ? 'opacity-50 cursor-not-allowed' : ''} bg-pink-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-pink-700 transition-colors`}
                                disabled={!(role === 'debater' && isMyTurn)}
                            >
                                전송
                            </button>
                        </div>
                    </div>

                    {/* 중앙: 정보 패널 */}
                    <div className="bg-neutral-50 border-r border-gray-200 h-full overflow-hidden flex flex-col" style={{ 
                        maxWidth: '100%',
                        borderRight: showSpectatorChat ? '1px solid #e5e7eb' : 'none' // 관전자 채팅 숨김 시 오른쪽 테두리 제거
                    }}>
                        <div className="chat-header py-2 px-4 bg-white border-b border-gray-200 sticky top-0 z-10 text-center">
                            <h2 className="text-lg font-semibold text-purple-600">토론 정보</h2>
                        </div>
                        
                        <div className="info-content flex-1 overflow-y-auto overflow-x-hidden p-3" style={{ width: '100%', wordBreak: 'break-all' }}>
                           
                            
                            {/* 참가자 정보 컴포넌트 사용 */}
                            <ParticipantInfo />


                            <div className="info-section mb-4">
                                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">발언 요지</h3>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                                    {summaryFromComponent ? (
                                        <li>{summaryFromComponent}</li>
                                         ) : (
                                        <li>요약을 불러오는 중...</li>
                                    )}
                                    </ul>
                                </div>
                            </div>


                            
                            <div className="info-section">
                                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">참고 자료</h3>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                    <div className="text-sm text-gray-700">
                                    {articlesFromComponent.length > 0 ? (
                                        articlesFromComponent.map((article, idx) => (
                                            <a
                                            key={idx}
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-blue-700 underline whitespace-normal break-words mb-1"
                                            dangerouslySetInnerHTML={{ __html: `• ${article.title}` }}
                                            />
                                        ))
                                        ) : (
                                        <p className="text-gray-500">관련 기사가 없습니다</p>
                                        )}
                                        <div className="mt-3 pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 italic text-center">마지막 업데이트: {messages.length > 0 ? '방금 전' : '업데이트 없음'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 관전자 채팅 - 숨기기 가능 */}
                    {showSpectatorChat && (
                        <div className="h-full bg-neutral-50 overflow-hidden flex flex-col">
                            <div className="chat-header py-2 px-4 bg-white border-b border-gray-200 sticky top-0 z-10 text-center">
                                <h2 className="text-lg font-semibold text-green-600">관전자 채팅</h2>
                            </div>
                            
                            <div 
                                ref={chatMessagesRef}
                                className="chat-messages flex-1 overflow-y-auto overflow-x-hidden p-4 bg-neutral-50"
                                style={{ width: '100%', maxWidth: '100%', wordBreak: 'break-all' }}
                            >
                                {chatMessages.length > 0 ? (
                                    chatMessages.map((msg, idx) => (
                                        <div key={idx} className="chat-bubble bg-white border border-gray-200 rounded-lg p-2 mb-2 shadow-sm" style={{ wordBreak: 'break-all', width: '100%', maxWidth: '100%' }}>
                                            {msg}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic text-center">채팅 메시지가 없습니다.</p>
                                )}
                            </div>
                            
                            <div className="chat-input-container p-4 bg-white border-t border-gray-200 sticky bottom-0">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={handleChatKeyDown}
                                    placeholder={`${role === 'viewer' ? '메시지를 입력하세요...' : '토론자는 메시지를 보낼 수 없습니다'}`}
                                    className="input-field bg-neutral-50 border border-gray-300 rounded-lg p-2 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    disabled={role !== 'viewer'}
                                />
                                <button
                                    onClick={handleSendChat}
                                    className={`send-button ${role !== 'viewer' ? 'opacity-50 cursor-not-allowed' : ''} bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors`}
                                    disabled={role !== 'viewer'}
                                >
                                    전송
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 현재 발언자 표시 */}
            <div className="current-speaker-info fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-md border border-gray-200 flex flex-col items-center animate-fadeIn">
                <h3 className="text-lg font-medium mb-1">
                    <span className="text-gray-700">현재 발언자:</span> 
                    <span className={`ml-2 font-bold ${currentSpeaker === debaterA ? 'text-pink-600' : 'text-blue-600'}`}>
                        {currentSpeaker || '대기 중'}
                    </span>
                </h3>
                {isMyTurn && (
                    <div className="my-turn-indicator mt-2 text-center">
                        <span className="turn-badge bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">내 차례</span>
                        <p className="turn-notice text-sm text-gray-600 mt-1">5분 이내에 발언하지 않으면 턴이 넘어갑니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebateRoomPage;
