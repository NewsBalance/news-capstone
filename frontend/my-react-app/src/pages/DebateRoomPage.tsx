import React, { useState, useRef, useEffect } from "react";
import '../styles/DebateRoom.css';
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// API URL 상수 추가
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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
}

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
                            요약: {msg.summary}
                        </p>
                    )}
                    <div className="message-actions mt-2 text-right">
                        {!msg.isFactChecked && (
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
}) => {
    const [input, setInput] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [isFactChecking, setIsFactChecking] = useState(false);
    
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
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/leave`, {
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
    
    // 팩트체크 기능 수정 - 단순히 부모 함수만 호출
    const handleFactCheck = (messageIndex: number) => {
        // 부모 컴포넌트의 onFactCheck 함수만 호출
        onFactCheck(messageIndex);
    };

    return (
        <div className="flex flex-col h-screen bg-neutral-50 text-gray-800 font-sans overflow-hidden">
            {/* 헤더 섹션 */}
            <div className="debate-header p-4 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="room-info">
                        <h1 className="room-title text-2xl font-bold text-purple-600">{roomTitle || '제목 없음'}</h1>
                        <p className="room-topic text-sm text-gray-600">{roomTopic || '주제 없음'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <AuthStatus />
                        {role === 'debater' && (
                            <button
                                onClick={handleReady}
                                className={`ready-button ${isReady ? 'bg-red-500' : 'bg-purple-600'} text-white px-4 py-2 rounded shadow-sm`}
                            >
                                {isReady ? '준비 취소' : '준비'}
                            </button>
                        )}
                        <button
                            onClick={handleLeave}
                            className="leave-button bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow-sm"
                        >
                            나가기
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 컨텐츠 섹션 - 전체를 가운데 정렬 */}
            <div className="flex flex-1 overflow-hidden justify-center items-center bg-neutral-50 p-4">
                <div className="grid grid-cols-4 h-full max-w-7xl w-full mx-auto bg-white rounded-lg shadow-md" style={{ minHeight: '600px', tableLayout: 'fixed' }}>
                    {/* 왼쪽: 토론자 영역 (2/4) */}
                    <div className="col-span-2 border-r border-gray-200 h-full overflow-hidden flex flex-col" style={{ maxWidth: '100%' }}>
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
                                placeholder={`${role === 'debater' ? '당신의 주장을 입력하세요...' : '관전자는 메시지를 보낼 수 없습니다'}`}
                                className="input-field bg-neutral-50 border border-gray-300 rounded-lg p-2 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                disabled={role !== 'debater'}
                            />
                            <button
                                onClick={() => {
                                    if (input.trim() && role === 'debater') {
                                        onSendMessage(input.trim());
                                        setInput("");
                                    }
                                }}
                                className={`send-button ${role !== 'debater' ? 'opacity-50 cursor-not-allowed' : ''} bg-pink-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-pink-700 transition-colors`}
                                disabled={role !== 'debater'}
                            >
                                전송
                            </button>
                        </div>
                    </div>

                    {/* 중앙: 정보 패널 (1/4) */}
                    <div className="col-span-1 bg-neutral-50 border-r border-gray-200 h-full overflow-hidden flex flex-col" style={{ maxWidth: '100%' }}>
                        <div className="chat-header p-4 bg-white border-b border-gray-200 sticky top-0 z-10 text-center">
                            <h2 className="text-lg font-semibold text-purple-600">토론 정보</h2>
                        </div>
                        
                        <div className="info-content flex-1 overflow-y-auto overflow-x-hidden p-4" style={{ width: '100%', maxWidth: '100%', wordBreak: 'break-all' }}>
                            <div className="info-section mb-4">
                                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">토론 규칙</h3>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                                        <li>서로 존중하는 태도로 의견을 나눕니다.</li>
                                        <li>주제에서 벗어나지 않도록 합니다.</li>
                                        <li>각 발언은 300자 이내로 제한됩니다.</li>
                                        <li>상대방의 발언이 끝날 때까지 기다립니다.</li>
                                        <li>욕설, 비방은 제재당할 수 있습니다.</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {/* 참가자 정보 컴포넌트 사용 */}
                            <ParticipantInfo />
                            
                            <div className="info-section">
                                <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">토론 실시간 요약</h3>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                    <div className="text-sm text-gray-700">
                                        <p className="mb-2 whitespace-normal break-all overflow-hidden">
                                            <span className="text-pink-600 font-semibold">토론자 A:</span> 
                                            {messages.filter(m => 
                                                m.speaker === debaterA && 
                                                !(typeof m.text === 'string' && m.text.startsWith('{') && m.text.endsWith('}'))
                                            ).slice(-1)[0]?.text || '아직 발언이 없습니다'}
                                        </p>
                                        <p className="mb-2 whitespace-normal break-all overflow-hidden">
                                            <span className="text-blue-600 font-semibold">토론자 B:</span> 
                                            {messages.filter(m => 
                                                m.speaker === debaterB && 
                                                !(typeof m.text === 'string' && m.text.startsWith('{') && m.text.endsWith('}'))
                                            ).slice(-1)[0]?.text || '아직 발언이 없습니다'}
                                        </p>
                                        <div className="mt-3 pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 italic text-center">마지막 업데이트: {messages.length > 0 ? '방금 전' : '업데이트 없음'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 관전자 채팅 (1/4) */}
                    <div className="col-span-1 h-full bg-neutral-50 overflow-hidden flex flex-col" style={{ maxWidth: '100%' }}>
                        <div className="chat-header p-4 bg-white border-b border-gray-200 sticky top-0 z-10 text-center">
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
                                placeholder="메시지를 입력하세요..."
                                className="input-field bg-neutral-50 border border-gray-300 rounded-lg p-2 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSendChat}
                                className="send-button bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                            >
                                채팅
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebateRoomPage;
