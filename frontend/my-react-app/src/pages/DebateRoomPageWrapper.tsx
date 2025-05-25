import { useParams, useNavigate } from 'react-router-dom';
import DebateRoomPage from './DebateRoomPage';
import { useEffect, useState, useRef } from 'react';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = 'http://localhost:8080/api';
const WS_URL = 'http://localhost:8080/ws';

interface DebateMessage {
    speaker: string;
    text: string;
    summary?: string;
}

interface Message {
    type: string;
    content: string;
    sender: string;
    roomId: number;
}

const DebateRoomPageWrapper: React.FC = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState({ title: "", description: "" });
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [userName, setUserName] = useState("");
    const [role, setRole] = useState("viewer"); // 'debater' 또는 'viewer'
    const [error, setError] = useState("");
    
    // WebSocket 클라이언트 참조
    const stompClient = useRef<StompJs.Client | null>(null);

    // 사용자 정보 가져오기
    useEffect(() => {
        // 인증 토큰 확인
        const token = localStorage.getItem('token');
        if (!token) {
            setError('로그인이 필요합니다.');
            return;
        }

        fetch(`${API_URL}/user/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
        })
        .then(res => {
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
                }
                throw new Error('사용자 정보를 가져올 수 없습니다');
            }
            return res.json();
        })
        .then(data => {
            console.log('사용자 정보:', data);
            setUserName(data.nickname || '익명 사용자');
        })
        .catch(err => {
            console.error('사용자 정보 에러:', err);
            setError(err.message || '사용자 정보를 가져오는데 실패했습니다. 다시 로그인해주세요.');
        });
    }, []);

    // 방 정보 및 메시지 가져오기
    useEffect(() => {
        if (!roomId) return;
        
        // 인증 토큰 확인
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // 토론방 정보와 메시지 가져오기
        fetch(`${API_URL}/debate-rooms/${roomId}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include',
        })
        .then(res => {
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    throw new Error('인증이 필요하거나 권한이 없습니다.');
                }
                throw new Error('토론방 정보를 가져올 수 없습니다');
            }
            return res.json();
        })
        .then(data => {
            console.log('토론방 데이터:', data);
            setRoomData({
                title: data.title || '제목 없음',
                description: data.description || data.topic || '설명 없음'
            });
            
            // 메시지 변환
            const convertedMessages = (data.messages || []).map((msg: any) => ({
                speaker: msg.sender || '알 수 없음',
                text: msg.content || '',
                summary: msg.summary
            }));
            
            setMessages(convertedMessages);
            
            // 역할 설정 (토론자인지 관전자인지)
            if (userName && (data.debaterA === userName || data.debaterB === userName)) {
                setRole('debater');
            } else {
                setRole('viewer');
            }
            
            setLoading(false);
        })
        .catch(err => {
            console.error('토론방 정보 에러:', err);
            setError(err.message || '토론방 정보를 가져오는데 실패했습니다.');
            setLoading(false);
        });
        
        // 채팅 메시지 가져오기 - 인증 헤더 추가
        fetch(`${API_URL}/debate-rooms/${roomId}/chat`, {
            method: 'GET',
            headers: headers,
            credentials: 'include',
        })
        .then(res => {
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    console.warn('채팅 메시지를 가져오는데 인증이 필요합니다.');
                    return { messages: [] };
                }
                throw new Error('채팅 메시지를 가져올 수 없습니다');
            }
            return res.json();
        })
        .then(data => {
            setChatMessages(data.messages || []);
        })
        .catch(err => {
            console.error('채팅 메시지 에러:', err);
        });
    }, [roomId, userName]);

    // WebSocket 연결
    useEffect(() => {
        if (!roomId || !userName) return;
        
        const connectWebSocket = () => {
            console.log('WebSocket 연결 시도...');
            
            const client = new StompJs.Client({
                webSocketFactory: () => new SockJS(WS_URL),
                connectHeaders: {
                    // WebSocket 연결에 토큰 헤더 추가
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                debug: (str: string) => {
                    console.log(str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            client.onConnect = () => {
                console.log('WebSocket 연결 성공!');
                
                // 토론 메시지 구독
                client.subscribe(`/topic/room/${roomId}`, (message: StompJs.IMessage) => {
                    const receivedMsg = JSON.parse(message.body) as Message;
                    
                    // 토론 메시지 처리
                    if (receivedMsg.type === "CHAT") {
                        setMessages(prev => [...prev, {
                            speaker: receivedMsg.sender,
                            text: receivedMsg.content
                        }]);
                    } 
                    // 시스템 메시지 처리 (START, END 등)
                    else if (["START", "END", "INFO"].includes(receivedMsg.type)) {
                        setMessages(prev => [...prev, {
                            speaker: "System",
                            text: receivedMsg.content
                        }]);
                    }
                });

                // 채팅 메시지 구독
                client.subscribe(`/topic/chat/${roomId}`, (message: StompJs.IMessage) => {
                    const receivedMsg = JSON.parse(message.body) as Message;
                    // 중복 체크를 위한 최신 메시지 확인
                    setChatMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        const newMessage = `${receivedMsg.sender}: ${receivedMsg.content}`;
                        
                        // 마지막 메시지와 동일한 경우 업데이트하지 않음
                        if (lastMessage === newMessage) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
                });
                
                // 에러 메시지 구독
                client.subscribe(`/topic/error/${roomId}`, (message: StompJs.IMessage) => {
                    const receivedMsg = JSON.parse(message.body) as Message;
                    alert(receivedMsg.content);
                });
            };

            client.onStompError = (frame: StompJs.IFrame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            };
            
            client.onWebSocketClose = () => {
                console.log('WebSocket 연결이 닫혔습니다. 재연결 시도 중...');
            };
            
            client.onWebSocketError = (error) => {
                console.error('WebSocket 오류:', error);
            };

            client.activate();
            stompClient.current = client;
        };
        
        connectWebSocket();

        return () => {
            if (stompClient.current?.connected) {
                console.log('WebSocket 연결 종료');
                stompClient.current.deactivate();
            }
        };
    }, [roomId, userName]);

    // 토론 메시지 전송
    const handleSendMessage = (text: string) => {
        if (!stompClient.current || !roomId) {
            console.error("WebSocket 연결 상태:", stompClient.current ? "객체 존재" : "객체 없음");
            console.error("연결 상태:", stompClient.current?.connected ? "연결됨" : "연결 안됨");
            console.error("roomId:", roomId);
            
            // 연결이 끊어진 경우 재연결 시도
            if (stompClient.current && !stompClient.current.connected) {
                console.log("WebSocket 재연결 시도...");
                stompClient.current.activate();
                setTimeout(() => {
                    if (stompClient.current?.connected) {
                        console.log("재연결 성공, 메시지 재전송 시도");
                        sendMessage(text);
                        return;
                    } else {
                        alert("서버에 연결할 수 없습니다. 페이지를 새로고침해주세요.");
                    }
                }, 1000);
                return;
            }
            
            alert("서버에 연결되어 있지 않습니다. 페이지를 새로고침해주세요.");
            return;
        }

        sendMessage(text);
    };

    // 채팅 메시지 전송
    const handleSendChat = (text: string) => {
        if (!stompClient.current || !roomId) {
            console.error("WebSocket 연결 상태:", stompClient.current ? "객체 존재" : "객체 없음");
            console.error("연결 상태:", stompClient.current?.connected ? "연결됨" : "연결 안됨");
            
            // 연결이 끊어진 경우 재연결 시도
            if (stompClient.current && !stompClient.current.connected) {
                console.log("WebSocket 재연결 시도...");
                stompClient.current.activate();
                setTimeout(() => {
                    if (stompClient.current?.connected) {
                        console.log("재연결 성공, 채팅 메시지 재전송 시도");
                        sendChatMessage(text);
                        return;
                    } else {
                        alert("서버에 연결할 수 없습니다. 페이지를 새로고침해주세요.");
                    }
                }, 1000);
                return;
            }
            
            alert("서버에 연결되어 있지 않습니다. 페이지를 새로고침해주세요.");
            return;
        }

        sendChatMessage(text);
    };

    // 토론 메시지 전송 로직 분리
    const sendMessage = (text: string) => {
        const message: Message = {
            type: "CHAT",
            content: text,
            sender: userName,
            roomId: Number(roomId)
        };

        try {
            stompClient.current!.publish({
                destination: '/app/debate',
                body: JSON.stringify(message)
            });
            
            // 클라이언트 측에서 바로 메시지 추가 (낙관적 UI 업데이트)
            setMessages(prev => [...prev, {
                speaker: userName,
                text: text
            }]);
        } catch (error) {
            console.error("메시지 전송 중 오류:", error);
            alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 채팅 메시지 전송 로직 수정
    const sendChatMessage = (text: string) => {
        const message: Message = {
            type: "CHAT",
            content: text,
            sender: userName,
            roomId: Number(roomId)
        };

        try {
            stompClient.current!.publish({
                destination: '/app/chat',
                body: JSON.stringify(message)
            });
            
            // 낙관적 UI 업데이트 제거
            // setChatMessages(prev => [...prev, `${userName}: ${text}`]);
        } catch (error) {
            console.error("채팅 메시지 전송 중 오류:", error);
            alert("채팅 메시지 전송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 준비 상태 변경
    const handleReady = () => {
        if (!stompClient.current?.connected || !roomId) {
            alert("서버에 연결되어 있지 않습니다. 페이지를 새로고침해주세요.");
            return;
        }
        
        // 서버에 준비 상태 전송
        const message: Message = {
            type: "READY",
            content: "준비 완료",
            sender: userName,
            roomId: Number(roomId)
        };
        
        stompClient.current.publish({
            destination: '/app/debate',
            body: JSON.stringify(message)
        });
    };

    if (error) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">
            <div className="text-center">
                <p className="text-xl mb-4">{error}</p>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-xl text-white font-bold"
                >
                    홈으로 돌아가기
                </button>
            </div>
        </div>;
    }

    return (
        <>
            {loading ? (
                <div className="flex items-center justify-center h-screen bg-black text-white">
                    <p className="text-xl">로딩 중...</p>
                </div>
            ) : (
                <DebateRoomPage
                    role={role}
                    userName={userName}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    chatMessages={chatMessages}
                    onSendChat={handleSendChat}
                    roomTitle={roomData.title}
                    roomDescription={roomData.description}
                    onReady={handleReady}
                />
            )}
        </>
    );
};

export default DebateRoomPageWrapper;