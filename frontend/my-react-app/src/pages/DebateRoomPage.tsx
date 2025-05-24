import React, { useState } from "react";
import '../styles/Discussion.css';

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
        <>
            {messages.map((msg, i) => (
                <div key={i} className="bg-[#3a3a3a] p-4 rounded-xl border border-gray-700">
                    <p className="text-lg font-bold text-pink-400">{msg.speaker}</p>
                    <p className="mt-1 whitespace-pre-wrap">{msg.text}</p>
                    {msg.summary && (
                        <p className="mt-2 text-sm italic text-gray-400">요약: {msg.summary}</p>
                    )}
                </div>
            ))}
        </>
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

    // 준비 버튼 핸들러
    const handleReady = () => {
        onReady();
        setIsReady(true);
    };

    // 인증 상태 표시
    const AuthStatus = () => (
        <div className="text-sm text-gray-400 mb-2">
            {userName ? `로그인: ${userName}` : '로그인되지 않음'} | 
            역할: {role === 'debater' ? '토론자' : '관전자'}
        </div>
    );
    
    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* 왼쪽: 토론자 영역 */}
            <div className="flex flex-col w-2/3 bg-[#121212] border-r border-gray-800 p-6">
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-pink-500 mb-1">{roomTitle || '제목 없음'}</h1>
                        <p className="text-gray-400 text-sm">{roomDescription || '설명 없음'}</p>
                        <AuthStatus />
                    </div>
                    
                    {role === 'debater' && (
                        <button
                            onClick={handleReady}
                            className={`${isReady ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} px-4 py-2 rounded-xl text-white font-bold`}
                            disabled={isReady}
                        >
                            {isReady ? '준비완료' : '준비'}
                        </button>
                    )}
                </div>
                <div className="flex flex-col flex-grow bg-[#1e1e1e] rounded-2xl shadow-lg">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#2b2b2b] rounded-t-2xl border-t border-pink-600">
                        <h2 className="text-lg font-semibold text-white mb-2 border-b border-pink-600 pb-2">토론자 메시지</h2>
                        <MessageList messages={messages} />
                    </div>
                    <div className="p-4 flex gap-2 bg-[#1e1e1e] rounded-b-2xl border-t border-gray-700">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`${role === 'debater' ? '당신의 주장을 입력하세요...' : '관전자는 메시지를 보낼 수 없습니다'}`}
                            className="flex-1 px-4 py-2 rounded-xl text-black focus:outline-none shadow-md"
                            disabled={role !== 'debater'}
                        />
                        <button
                            onClick={() => {
                                if (input.trim() && role === 'debater') {
                                    onSendMessage(input.trim());
                                    setInput("");
                                }
                            }}
                            className={`bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-xl text-white font-bold shadow-lg ${role !== 'debater' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={role !== 'debater'}
                        >
                            전송
                        </button>
                    </div>
                </div>
            </div>

            {/* 오른쪽: 관전자 채팅 */}
            <div className="flex flex-col w-1/3 bg-[#0e0e0e] p-6">
                <div className="flex flex-col flex-grow bg-[#1a1a1a] rounded-2xl shadow-lg">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#252525] rounded-t-2xl border-t border-green-600">
                        <h2 className="text-lg font-semibold text-green-400 mb-2 border-b border-green-600 pb-2">관전자 채팅</h2>
                        {chatMessages.length > 0 ? (
                            chatMessages.map((msg, idx) => (
                                <div key={idx} className="bg-[#3a3a3a] p-3 rounded text-gray-200 border border-gray-700">
                                    {msg}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center">채팅 메시지가 없습니다.</p>
                        )}
                    </div>
                    <div className="p-4 flex gap-2 bg-[#1a1a1a] rounded-b-2xl border-t border-gray-700">
                        <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 px-4 py-2 rounded-xl text-black focus:outline-none shadow-md"
                        />
                        <button
                            onClick={() => {
                                if (chatInput.trim()) {
                                    onSendChat(chatInput.trim());
                                    setChatInput("");
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-white font-bold shadow-lg"
                        >
                            채팅
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebateRoomPage;
