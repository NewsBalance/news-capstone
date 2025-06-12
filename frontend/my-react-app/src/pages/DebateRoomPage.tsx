import React, { useState, useRef, useEffect } from "react";
import '../styles/DebateRoom.css';
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE } from '../api/config';
import parse from 'html-react-parser';
import DebateSummarySection from "../components/DebateSummarySection";

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
    isDebateStarted?: boolean;
    onRequestDebateEnd: () => void;
    onAcceptDebateEnd: () => void;
    onRejectDebateEnd: () => void;
    debateEndRequest?: {
        requester: string;
        isPending: boolean;
    } | null;
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

// 동적 점 애니메이션 컴포넌트 추가
const DynamicDots: React.FC<{ text: string; color?: string }> = ({ text, color = "text-blue-600" }) => {
    const [dotCount, setDotCount] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount(prev => prev >= 3 ? 1 : prev + 1);
        }, 600);

        return () => clearInterval(interval);
    }, []);

    return (
        <span className={color}>
            {text}{'.'.repeat(dotCount)}
        </span>
    );
};

// 향상된 스피너 컴포넌트 추가
const EnhancedSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
    size = 'md', 
    color = 'border-blue-600' 
}) => {
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4', 
        lg: 'h-5 w-5'
    };

    return (
        <div className={`${sizeClasses[size]} relative`}>
            <div className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full animate-pulse`}></div>
            <div className={`${sizeClasses[size]} border-2 ${color} border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
        </div>
    );
};

// 메시지 목록 컴포넌트 개선 -  말풍선
const MessageList = ({ messages, onFactCheck, currentFactCheckingIndex, debaterA, debaterB }: {
    messages: DebateMessage[], 
    onFactCheck: (messageIndex: number) => void,
    currentFactCheckingIndex: number | null,
    debaterA: string | null,
    debaterB: string | null
}) => {
    const [checkedMessages, setCheckedMessages] = useState<Set<number>>(new Set());
    
    const handleFactCheckClick = (index: number) => {
        onFactCheck(index);
        // 팩트체크 버튼을 누른 메시지 기록
        setCheckedMessages(prev => new Set(prev).add(index));
    };

    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 italic">아직 메시지가 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="message-list w-full space-y-3">
            {messages.map((msg, i) => {
                const isDebaterA = msg.speaker === debaterA;
                const isDebaterB = msg.speaker === debaterB;
                const isSystem = msg.speaker === 'System';
                
                // 시스템 메시지는 중앙 정렬
                if (isSystem) {
                    return (
                        <div key={i} className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-sm max-w-xs">
                                {msg.text}
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div key={i} className={`flex ${isDebaterA ? 'justify-start' : 'justify-end'} transition-all duration-300`}>
                        <div className={`max-w-[75%] ${
                            currentFactCheckingIndex === i ? 'fact-check-loading' : ''
                        }`}>
                            {/* 사용자 이름 */}
                            <div className={`text-xs mb-1 ${isDebaterA ? 'text-left text-pink-600' : 'text-right text-blue-600'}`}>
                                {msg.speaker}
                            </div>
                            
                            {/* 말풍선 메시지 */}
                            <div className={`relative p-3 rounded-2xl shadow-sm transition-all duration-300 ${
                                isDebaterA 
                                    ? 'bg-white border border-pink-200 rounded-bl-sm' 
                                    : 'bg-blue-500 text-white rounded-br-sm'
                            } ${
                                currentFactCheckingIndex === i 
                                    ? (isDebaterA ? 'border-blue-300 bg-blue-50 shadow-blue-100 scale-[1.02]' : 'bg-blue-600 shadow-blue-200 scale-[1.02]')
                                    : ''
                            }`}>
                                {/* 말풍선 꼬리 */}
                                <div className={`absolute top-3 w-0 h-0 ${
                                    isDebaterA 
                                        ? '-left-2 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent'
                                        : '-right-2 border-t-[6px] border-t-transparent border-l-[8px] border-l-blue-500 border-b-[6px] border-b-transparent'
                                } ${
                                    currentFactCheckingIndex === i && isDebaterA ? 'border-r-blue-50' : ''
                                } ${
                                    currentFactCheckingIndex === i && !isDebaterA ? 'border-l-blue-600' : ''
                                }`}></div>
                                
                                <p className={`whitespace-normal break-words ${
                                    isDebaterA ? 'text-gray-800' : 'text-white'
                                }`}>
                                    {msg.text}
                                </p>
                                
                                {msg.summary && (
                                    <p className={`text-sm italic mt-2 pt-2 border-t whitespace-normal break-words ${
                                        isDebaterA 
                                            ? 'text-gray-600 border-gray-200' 
                                            : 'text-blue-100 border-blue-400'
                                    }`}>
                                        {msg.summary}
                                    </p>
                                )}
                            </div>
                            
                            {/* 팩트체크 버튼 */}
                            <div className={`mt-2 ${isDebaterA ? 'text-left' : 'text-right'}`}>
                                {currentFactCheckingIndex === i ? (
                                    <div className="inline-flex items-center text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-full">
                                        <EnhancedSpinner size="sm" color="border-blue-600" />
                                        <span className="ml-2 font-medium">
                                            <DynamicDots text="팩트체크 중" color="text-blue-600" />
                                        </span>
                                    </div>
                                ) : checkedMessages.has(i) ? (
                                    <span className="inline-block text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-200 font-medium animate-pulse">
                                        ✓ 분석 완료
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => handleFactCheckClick(i)}
                                        className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-105 px-3 py-1 rounded-full border border-orange-200 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                    >
                                        🔍 팩트체크
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};



// 옵션: 입력 텍스트 검증 및 소독 함수
const sanitizeInput = (input: string): string => {
  // HTML 태그 제거
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  
  // 스크립트 실행 방지를 위한 문자열 치환
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '');
  
  // 길이 제한 (예: 300자)
  sanitized = sanitized.substring(0, 300);
  
  return sanitized;
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
    isDebateStarted,
    onRequestDebateEnd,
    onAcceptDebateEnd,
    onRejectDebateEnd,
    debateEndRequest,
}) => {
    const [input, setInput] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [isFactChecking, setIsFactChecking] = useState(false);
    const [currentFactCheckingIndex, setCurrentFactCheckingIndex] = useState<number | null>(null);
    const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
    const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
    const [showSpectatorChat, setShowSpectatorChat] = useState<boolean>(true);
    const [summaryTargetMessage, setSummaryTargetMessage] = useState<DebateMessage | null>(null);
    // 요약 요청 함수를 위한 참조 추가
    const summaryRequestRef = useRef<((message: DebateMessage) => void) | null>(null);

    
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
    
    // 메시지 전송 로직 수정
    const handleSendMessage = () => {
      if (input.trim() && role === 'debater' && isMyTurn) {
        // 입력 검증 및 소독
        const sanitizedInput = sanitizeInput(input.trim());
        
        // 빈 문자열이거나 공격 코드만 있었던 경우 전송하지 않음
        if (sanitizedInput) {
          onSendMessage(sanitizedInput);
          setInput("");
        } else {
          toast.error("유효하지 않은 입력입니다.");
        }
      }
    };
    
    // 채팅 메시지 전송 핸들러 수정
    const handleSendChat = () => {
      if (chatInput.trim()) {
        // 입력 검증 및 소독
        const sanitizedChatInput = sanitizeInput(chatInput.trim());
        
        // 빈 문자열이거나 공격 코드만 있었던 경우 전송하지 않음
        if (sanitizedChatInput) {
          // WebSocket을 통해서만 메시지 전송
          onSendChat(sanitizedChatInput);
          setChatInput("");
        } else {
          toast.error("유효하지 않은 입력입니다.");
        }
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
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .animate-fadeIn {
                animation: fadeIn 0.5s ease-out;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
                50% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
            }
            
            .fact-check-loading {
                animation: glow 2s ease-in-out infinite;
            }
            
            @keyframes bounce {
                0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
                40%, 43% { transform: translateY(-8px); }
                70% { transform: translateY(-4px); }
                90% { transform: translateY(-2px); }
            }
            
            .animate-bounce-subtle {
                animation: bounce 2s ease-in-out;
            }
        `;
        document.head.appendChild(style);
        
        // 컴포넌트 언마운트 시 스타일 제거
        return () => {
            document.head.removeChild(style);
        };
    }, []);

        // 팩트체크 핸들러: 메시지 하나를 선택
    const handleFactCheck = (messageIndex: number) => {
        const target = messages[messageIndex];
        setSummaryTargetMessage(target);
        setCurrentFactCheckingIndex(messageIndex);
        setIsFactChecking(true);
    };
    
    // // 팩트체크 기능 수정 - 요약 기능 호출만 진행하고 기존 팩트체크 함수는 제거
    // const handleFactCheck = (messageIndex: number) => {
    //     // 요약 요청 함수 호출
    //     summaryRequestRef.current();
    // };

    // useEffect 수정 - 서버에서 받은 currentTurnUserNickname 사용
    useEffect(() => {
        // 서버에서 제공하는 currentTurnUserNickname이 있으면 사용
        if (currentTurnUserNickname) {
            setCurrentSpeaker(currentTurnUserNickname);
            const myTurn = currentTurnUserNickname === userName;
            setIsMyTurn(myTurn);
        } else {
            // 기존 로직은 fallback으로 유지
            const lastMessage = messages[messages.length - 1];
            const nextSpeaker = lastMessage ? 
                (lastMessage.speaker === debaterA ? debaterB : debaterA) : 
                (debaterAReady && debaterBReady ? debaterA : null);
            
            setCurrentSpeaker(nextSpeaker);
            const myTurn = nextSpeaker === userName;
            setIsMyTurn(myTurn);
        }
    }, [messages, debaterA, debaterB, debaterAReady, debaterBReady, userName, currentTurnUserNickname]);

    // 요약 정보와 관련 기사를 가져오기 위해 컴포넌트 사용 (수정)
    // const { summary: summaryFromComponent, articles: articlesFromComponent, requestSummary } = DebateSummarySection({ 
    //     roomId: parseInt(roomId || '0'), 
    //     messages
    // });

    // requestSummary 함수를 참조에 저장
    // useEffect(() => {
    //     summaryRequestRef.current = requestSummary;
    // }, [requestSummary]);

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
                        {/* 토론 시작 전/후에 따른 버튼 변경 */}
                        {role === 'debater' && !isDebateStarted && (
                            <button
                                onClick={handleReady}
                                className={`ready-button ${isReady ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'} text-white px-2 py-0.5 rounded text-xs transition-colors`}
                            >
                                {isReady ? '준비 취소' : '준비'}
                            </button>
                        )}
                        
                        {/* 토론 시작 후 토론 종료 버튼 표시 */}
                        {role === 'debater' && isDebateStarted && !debateEndRequest?.isPending && (
                            <button
                                onClick={onRequestDebateEnd}
                                className="end-debate-button bg-orange-600 hover:bg-orange-700 text-white px-2 py-0.5 rounded text-xs transition-colors"
                            >
                                토론 종료
                            </button>
                        )}
                        
                        {/* 토론 종료 요청이 있을 때 수락/거절 버튼 */}
                        {role === 'debater' && debateEndRequest?.isPending && debateEndRequest.requester !== userName && (
                            <div className="flex gap-1">
                                <button
                                    onClick={onAcceptDebateEnd}
                                    className="accept-end-button bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-xs transition-colors"
                                >
                                    종료 수락
                                </button>
                                <button
                                    onClick={onRejectDebateEnd}
                                    className="reject-end-button bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs transition-colors"
                                >
                                    종료 거절
                                </button>
                            </div>
                        )}
                        
                        {/* 토론 종료를 요청한 토론자에게는 대기 상태 표시 */}
                        {role === 'debater' && debateEndRequest?.isPending && debateEndRequest.requester === userName && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                종료 승인 대기중...
                            </span>
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
                            <MessageList 
                                messages={messages} 
                                onFactCheck={handleFactCheck} 
                                currentFactCheckingIndex={currentFactCheckingIndex}
                                debaterA={debaterA}
                                debaterB={debaterB}
                            />
                        </div>
                        
                        <div className="chat-input-container p-4 bg-white border-t border-gray-200 sticky bottom-0">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`${role === 'debater' ? (isMyTurn ? '당신의 주장을 입력하세요...' : '지금은 발언할 수 없습니다.') : '관전자는 메시지를 보낼 수 없습니다'}`}
                                className="input-field bg-neutral-50 border border-gray-300 rounded-lg p-2 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                disabled={!(role === 'debater' && isMyTurn)}
                                maxLength={300}  // 최대 글자 수 제한
                            />
                            <button
                                onClick={handleSendMessage}  // 수정된 핸들러 사용
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

                            {/* 토론 종료 요청 알림 */}
                            {debateEndRequest?.isPending && (
                                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-orange-800 mb-1">토론 종료 요청</h4>
                                    <p className="text-xs text-orange-700">
                                        {debateEndRequest.requester}님이 토론 종료를 요청했습니다.
                                        {debateEndRequest.requester !== userName && role === 'debater' && 
                                            " 상단의 버튼을 통해 수락 또는 거절해주세요."
                                        }
                                    </p>
                                </div>
                            )}

                            {/* 중앙 패널 내부: 토론 정보 → 요약 섹션 */}
                            <DebateSummarySection 
                                roomId={parseInt(roomId || '0')} 
                                message={summaryTargetMessage}
                                onFactCheckComplete={() => {
                                    setCurrentFactCheckingIndex(null);
                                    setIsFactChecking(false);
                                }}
                            />
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
                                    maxLength={150}  // 최대 글자 수 제한
                                />
                                <button
                                    onClick={handleSendChat}  // 수정된 핸들러 사용
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

        </div>
    );
};

export default DebateRoomPage;
