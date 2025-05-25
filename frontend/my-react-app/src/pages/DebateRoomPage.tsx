import React, { useState, useRef, useEffect } from "react";
import '../styles/DebateRoom.css';

interface DebateMessage {
    speaker: string;
    text: string;
    summary?: string;
}

interface Props {
    role: string;
    userName: string;
    messages: DebateMessage[];
    onSendMessage: (text: string) => void;
    chatMessages: string[];
    onSendChat: (text: string) => void;
    roomTitle: string;
    roomDescription: string;
    onReady: () => void;
}

// 메시지 목록 컴포넌트 - 빈 메시지 처리 추가
const MessageList = ({ messages }: { messages: DebateMessage[] }) => {
    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 italic">아직 메시지가 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="message-list">
            {messages.map((msg, i) => (
                <div key={i} className="chat-bubble bg-white shadow-sm border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="message-header">
                        <p className="font-bold text-pink-600">{msg.speaker}</p>
                    </div>
                    <p className="message-content text-gray-700">{msg.text}</p>
                    {msg.summary && (
                        <p className="message-summary text-gray-600 text-sm italic mt-2 pt-2 border-t border-gray-100">요약: {msg.summary}</p>
                    )}
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
    roomDescription,
    onReady,
}) => {
    const [input, setInput] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [isReady, setIsReady] = useState(false);
    
    const debateMessagesRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    
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
        setIsReady(true);
    };

    // 인증 상태 표시
    const AuthStatus = () => (
        <div className="auth-status text-gray-700">
            {userName ? `로그인: ${userName}` : '로그인되지 않음'} | 
            역할: {role === 'debater' ? '토론자' : '관전자'}
        </div>
    );
    
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
    
    return (
        <div className="flex flex-col h-screen bg-neutral-50 text-gray-800 font-sans overflow-hidden">
            {/* 헤더 섹션 */}
            <div className="debate-header p-4 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="room-info">
                        <h1 className="room-title text-2xl font-bold text-purple-600">{roomTitle || '제목 없음'}</h1>
                        <p className="room-description text-sm text-gray-600">{roomDescription || '설명 없음'}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <AuthStatus />
                        {role === 'debater' && (
                            <button
                                onClick={handleReady}
                                className={`ready-button ${isReady ? 'bg-purple-100 text-purple-700' : 'bg-purple-600 text-white'} px-4 py-2 rounded shadow-sm`}
                                disabled={isReady}
                            >
                                {isReady ? '준비완료' : '준비'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 컨텐츠 섹션 - 전체를 가운데 정렬 */}
            <div className="flex flex-1 overflow-hidden justify-center items-center bg-neutral-50 p-4">
                <div className="flex h-full max-w-7xl w-full mx-auto bg-white rounded-lg shadow-md">
                    {/* 왼쪽: 토론자 영역 */}
                    <div className="flex-col w-2/4 border-r border-gray-200 h-full">
                        <div className="chat-container h-full flex flex-col">
                            {/* 고정된 채팅 헤더 */}
                            <div className="chat-header p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
                                <h2 className="text-lg font-semibold text-pink-600">토론자 메시지</h2>
                            </div>
                            
                            {/* 스크롤 가능한 메시지 영역 */}
                            <div 
                                ref={debateMessagesRef}
                                className="chat-messages flex-1 overflow-y-auto p-4 pb-20 bg-neutral-50"
                            >
                                <MessageList messages={messages} />
                            </div>
                            
                            {/* 하단에 고정된 입력 영역 */}
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
                    </div>

                    {/* 중앙: 정보 패널 */}
                    <div className="flex-col w-1/4 bg-neutral-50 border-r border-gray-200 h-full">
                        <div className="chat-container h-full flex flex-col">
                            {/* 고정된 정보 헤더 */}
                            <div className="chat-header p-4 bg-white border-b border-gray-200 sticky top-0 z-10 text-center">
                                <h2 className="text-lg font-semibold text-purple-600">토론 정보</h2>
                            </div>
                            
                            {/* 스크롤 가능한 정보 영역 */}
                            <div className="info-content flex-1 overflow-y-auto p-4">
                                <div className="info-section mb-4">
                                    <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">토론 규칙</h3>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                        <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                                            <li>서로 존중하는 태도로 의견을 나눕니다.</li>
                                            <li>주제에서 벗어나지 않도록 합니다.</li>
                                            <li>각 발언은 300자 이내로 제한됩니다.</li>
                                            <li>상대방의 발언이 끝날 때까지 기다립니다.</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="info-section mb-4">
                                    <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">참가자</h3>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-pink-600">토론자 A</span>
                                            <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">준비완료</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-600">토론자 B</span>
                                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">대기중</span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 text-center">관전자: 3명</div>
                                    </div>
                                </div>
                                
                                <div className="info-section">
                                    <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">토론 실시간 요약</h3>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                        <div className="text-sm text-gray-700">
                                            <p className="mb-2 text-center"><span className="text-purple-600 font-semibold">현재 쟁점:</span></p>
                                            <p className="mb-3 text-center">자율주행 자동차의 윤리적 결정에 관한 법적 책임 소재</p>
                                            <p className="mb-2"><span className="text-pink-600 font-semibold">토론자 A:</span> 자율주행 시스템 개발사가 알고리즘 결정에 대한 최종 책임을 져야 한다고 주장</p>
                                            <p className="mb-2"><span className="text-blue-600 font-semibold">토론자 B:</span> 사용자와 개발사의 공동 책임이 필요하며 새로운 법적 프레임워크 구축을 강조</p>
                                            <div className="mt-3 pt-2 border-t border-gray-200">
                                                <p className="text-xs text-gray-500 italic text-center">마지막 업데이트: 2분 전</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 관전자 채팅 */}
                    <div className="flex-col w-1/4 h-full bg-neutral-50">
                        <div className="chat-container h-full flex flex-col">
                            {/* 고정된 채팅 헤더 */}
                            <div className="chat-header p-4 bg-white border-b border-gray-200 sticky top-0 z-10 text-center">
                                <h2 className="text-lg font-semibold text-green-600">관전자 채팅</h2>
                            </div>
                            
                            {/* 스크롤 가능한 메시지 영역 */}
                            <div 
                                ref={chatMessagesRef}
                                className="chat-messages flex-1 overflow-y-auto p-4 pb-20 bg-neutral-50"
                            >
                                {chatMessages.length > 0 ? (
                                    chatMessages.map((msg, idx) => (
                                        <div key={idx} className="chat-bubble bg-white border border-gray-200 rounded-lg p-2 mb-2 shadow-sm">
                                            {msg}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic text-center">채팅 메시지가 없습니다.</p>
                                )}
                            </div>
                            
                            {/* 하단에 고정된 채팅 입력 영역 */}
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
        </div>
    );
};

export default DebateRoomPage;
