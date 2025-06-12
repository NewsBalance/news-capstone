import { useParams, useNavigate } from 'react-router-dom';
import DebateRoomPage from './DebateRoomPage';
import React, { useEffect, useState, useRef } from 'react';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE, API_URL, WS_URL } from '../api/config';


interface DebateMessage {
    speaker: string;
    text: string;
    summary?: string;
    factCheck?: string;
    factCheckBy?: string;
    isFactChecked?: boolean;
}

interface Message {
    type: string;
    content: string;
    sender: string;
    roomId: number;
}

interface RoomData {
    id: number;
    title: string;
    topic: string;
    started: boolean;
    debaterAReady: boolean;
    debaterBReady: boolean;
    currentParticipants: number;
    totalVisits: number;
    debaterA: string | null;
    debaterB: string | null;
    currentTurnUserNickname?: string;
    ended?: boolean;
}

const DebateRoomPageWrapper: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // 디버깅용 로그 함수 (개발 환경에서만 출력)
    const debugLog = (message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DebateRoom ${roomId}] ${message}`, data || '');
        }
    };
    
    // 상태 관리
    const [userName, setUserName] = useState<string>('');
    const [role, setRole] = useState<'debater' | 'viewer'>('viewer');
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [participantCount, setParticipantCount] = useState<number>(0);
    const [currentSpeaker, setCurrentSpeaker] = useState<string>('');
    const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
    const [debateEndRequest, setDebateEndRequest] = useState<{
        requester: string;
        isPending: boolean;
    } | null>(null);

    // WebSocket 클라이언트 참조
    const stompClient = useRef<any>(null);

    // 개발자 도구용 디버깅 함수들 (개발 환경에서만)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            (window as any).debugDebateRoom = {
                getMessages: () => messages,
                getChatMessages: () => chatMessages,
                getRoomData: () => roomData,
                getConnectionStatus: () => stompClient.current?.connected || false
            };
        }
        
        return () => {
            if (process.env.NODE_ENV === 'development') {
                delete (window as any).debugDebateRoom;
            }
        };
    }, [messages, chatMessages, roomData]);

    // 사용자 정보 설정
    useEffect(() => {
        if (user && user.nickname) {
            setUserName(user.nickname);
            return;
        }
        
        // 인증 정보가 없는 경우
        if (!user) {
            setError('로그인이 필요합니다.');
            setLoading(false);
            return;
        }
    }, [user]);

    // WebSocket 연결 설정
    useEffect(() => {
        if (!roomId || !userName) return;

        const client = new StompJs.Client({
            webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
            connectHeaders: {
                userName: userName // 사용자 이름을 헤더에 추가
            },
            debug: function() {}, // 디버그 로그 비활성화
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        client.onConnect = () => {
            stompClient.current = client;

            // 방 상태 구독
            client.subscribe(`/topic/room/${roomId}/status`, message => {
                try {
                    const roomStatus = JSON.parse(message.body);
                    
                    setRoomData(prevData => {
                        // 토론 시작 상태가 변경되었을 때 시스템 메시지 추가
                        if (roomStatus.started && !prevData?.started) {
                            setMessages(prev => [...prev, {
                                speaker: 'System',
                                text: '토론이 시작되었습니다.'
                            }]);
                        }

                        // topic 값 처리 수정
                        return {
                            ...prevData!,
                            ...roomStatus,
                            topic: roomStatus.topic || prevData?.topic || '설명 없음' // topic 우선 사용
                        };
                    });
                } catch (err) {
                    // 오류 처리만 하고 로그 출력하지 않음
                }
            });

            // 참여자 변경 구독
            client.subscribe(`/topic/room/${roomId}/participants`, function (message) {
                try {
                    const participantUpdate = JSON.parse(message.body);
                    setRoomData(prev => ({
                        ...prev!,
                        currentParticipants: participantUpdate.currentParticipants
                    }));
                } catch (err) {
                    // 오류 처리만 하고 로그 출력하지 않음
                }
            });

            // 토론 메시지 구독
            client.subscribe('/topic/room/' + roomId, function (message) {
                try {
                    const responseMessage = JSON.parse(message.body);
                    handleDebateMessage(responseMessage);
                } catch (err) {
                    // 오류 처리만 하고 로그 출력하지 않음
                }
            });

            // 관전자 채팅 구독
            client.subscribe('/topic/chat/' + roomId, function (message) {
                try {
                    const responseMessage = JSON.parse(message.body);
                    const newChatMessage = `${responseMessage.sender}: ${responseMessage.content}`;
                    
                    setChatMessages(prev => {
                        // 중복 메세지 방지
                        if (prev.includes(newChatMessage)) {
                            debugLog('중복 채팅 메세지 감지되어 무시됨:', newChatMessage);
                            return prev;
                        }
                        
                        debugLog('새 채팅 메세지 추가:', newChatMessage);
                        return [...prev, newChatMessage];
                    });
                } catch (err) {
                    // 오류 처리만 하고 로그 출력하지 않음
                }
            });

            // 오류 메시지 구독
            client.subscribe('/topic/error/' + roomId, function (message) {
                try {
                    const errorMessage = JSON.parse(message.body);
                    alert(`오류: ${errorMessage.content}`);
                } catch (err) {
                    // 오류 처리만 하고 로그 출력하지 않음
                }
            });
        };

        client.activate();

        return () => {
            if (client.connected) client.deactivate();
        };
    }, [roomId, userName]);

    // 토론방 정보와 메시지 가져오기
    useEffect(() => {
        if (!roomId || !userName) {
            setError('방 정보 또는 사용자 정보가 없습니다');
            return;
        }
        
        fetch(`${API_BASE}/api/debate-rooms/${roomId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                return res.text().then(text => {
                    throw new Error(text || '토론방 정보를 가져오는데 실패했습니다');
                });
            }
            return res.json();
        })
        .then(data => {
            // 토론방 데이터 설정
            setRoomData(data);
            
            // 토론 메시지 처리 (기존 메세지 로드)
            if (Array.isArray(data.messages)) {
                const previousMessages = data.messages.map((msg: any) => ({
                    speaker: msg.sender,
                    text: msg.content,
                    summary: msg.summary
                }));
                setMessages(previousMessages);
                debugLog(`이전 토론 메세지 ${previousMessages.length}개 로드됨`);
            } else {
                setMessages([]);
                debugLog('이전 토론 메세지 없음');
            }
            
            // 채팅 메시지 처리 (기존 채팅 메세지 로드)
            if (Array.isArray(data.chatMessages)) {
                const previousChatMessages = data.chatMessages.map((msg: any) => 
                    `${msg.message}`
                );
                setChatMessages(previousChatMessages);
                debugLog(`이전 채팅 메세지 ${previousChatMessages.length}개 로드됨`);
            } else {
                setChatMessages([]);
                debugLog('이전 채팅 메세지 없음');
            }
            
            // 역할 설정
            const isDebaterA = data.debaterA === userName;
            const isDebaterB = data.debaterB === userName;
            
            if (isDebaterA || isDebaterB) {
                setRole('debater');
            } else {
                setRole('viewer');
            }
            
            setLoading(false);
            setError(null); // 성공적으로 데이터를 가져왔으므로 에러 상태 초기화
        })
        .catch(err => {
            // 에러 상태 설정
            setError(err.message);
            setLoading(false);
        });
    }, [roomId, userName]);

    // 관전자 수 계산 로직 개선
    useEffect(() => {
        if (roomData) {
            const totalParticipants = Number(roomData.currentParticipants);
            // 그냥 참여자 수 그대로 사용
            setParticipantCount(totalParticipants);
        }
    }, [roomData]);

    // 토론방 입장 처리 로직 추가
    useEffect(() => {
        if (!roomId || !userName) {
            return;
        }
        
        // 토론방 입장 시 알림 표시
        alert('토론 규칙 안내:\n- 서로 존중하는 태도로 의견을 나눕니다.\n- 주제에서 벗어나지 않도록 합니다.\n- 각 발언은 300자 이내로 제한됩니다.\n- 상대방의 발언이 끝날 때까지 기다립니다.\n- 욕설, 비방은 제재당할 수 있습니다.');
        
        // 관전자든 토론자든 입장 처리
        fetch(`${API_BASE}/api/debate-rooms/${roomId}/join`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                return res.text().then(text => {
                    throw new Error(text || '입장 처리에 실패했습니다');
                });
            }
            return res.json();
        })
        .then(data => {
            // 룸 데이터 업데이트
            setRoomData(prevData => ({
                ...prevData,
                ...data,
                // 기존 데이터 유지를 위한 병합
                topic: data.topic || prevData?.topic
            }));
        })
        .catch(err => {
            // 오류 처리만 하고 로그 출력하지 않음
        });
    }, [roomId, userName]);

    // 토론 메시지 전송
    const handleSendMessage = (text: string) => {
        if (!stompClient.current || !roomId) {
            // 연결이 끊어진 경우 재연결 시도
            if (stompClient.current && !stompClient.current.connected) {
                stompClient.current.activate();
                setTimeout(() => {
                    if (stompClient.current?.connected) {
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
            // 연결이 끊어진 경우 재연결 시도
            if (stompClient.current && !stompClient.current.connected) {
                stompClient.current.activate();
                setTimeout(() => {
                    if (stompClient.current?.connected) {
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
            type: "DEBATE",
            content: text,
            sender: userName,
            roomId: Number(roomId)
        };

        try {
            stompClient.current!.publish({
                destination: '/app/debate',
                body: JSON.stringify(message)
            });
            
            // 클라이언트 측 낙관적 UI 업데이트 제거 - 서버에서 오는 메세지만 사용
            // setMessages(prev => [...prev, {
            //     speaker: userName,
            //     text: text
            // }]);
        } catch (error) {
            alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 채팅 메시지 전송 로직 수정
    const sendChatMessage = (text: string) => {
        const message: Message = {
            type: "VIEWER_CHAT",
            content: text,
            sender: userName,
            roomId: Number(roomId)
        };

        try {
            stompClient.current!.publish({
                destination: '/app/chat',
                body: JSON.stringify(message)
            });
        } catch (error) {
            alert("채팅 메시지 전송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 준비 상태 변경 함수 수정
    const handleReady = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}/ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('준비 상태 변경에 실패했습니다');
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : '준비 상태 변경 중 오류가 발생했습니다');
        }
    };

    // 토론자 A로 등록하는 함수
    const registerAsDebaterA = () => {
        if (!roomId) return;
        
        // 토론자 A로 등록 API 호출
        fetch(`${API_BASE}/api/debate-rooms/${roomId}/register-as-debater-a`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                return;
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;
            
            // 성공적으로 등록되면 상태 업데이트
            setRoomData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    debaterA: userName
                };
            });
        })
        .catch(err => {
            // 오류 처리만 하고 로그 출력하지 않음
        });
    };

    // 토론자 B로 참여하는 함수 추가
    const joinAsDebaterB = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}/join-as-debater-b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('토론자 B 참여에 실패했습니다');
            }

            const updatedRoom = await response.json();
            setRole('debater');
            setRoomData(updatedRoom);
        } catch (error) {
            alert(error instanceof Error ? error.message : '토론자 B 참여 중 오류가 발생했습니다');
        }
    };

    // 토론방 나가기 처리
    const handleLeave = async () => {
        if (!roomId) {
            return;
        }

        try {
            // WebSocket 연결 종료
            if (stompClient.current?.connected) {
                // 나가기 메시지 전송
                const message = {
                    type: role === 'debater' ? 'DEBATER_LEAVE' : 'VIEWER_LEAVE',
                    content: `${userName}님이 퇴장하셨습니다.`,
                    sender: 'System',
                    roomId: Number(roomId)
                };
                
                stompClient.current.publish({
                    destination: '/app/debate',
                    body: JSON.stringify(message)
                });
                
                stompClient.current.deactivate();
            }

            // API 호출
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                navigate('/');
                throw new Error('퇴장 처리 중 오류가 발생했습니다');
            }

            navigate('/discussion');
        } catch (error) {
            alert(error instanceof Error ? error.message : '오류가 발생했습니다');
        }
    };

    // joinRoom 함수 수정
    const joinRoom = async () => {
        if (!roomId || !userName) return;
        
        try {
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                // 응답이 JSON이 아닌 경우를 처리하기 위한 코드
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '토론방 참여에 실패했습니다');
                } else {
                    const errorText = await response.text();
                    throw new Error('서버 응답이 유효한 JSON 형식이 아닙니다');
                }
            }

            const updatedRoom = await response.json();
            
            // 역할 설정
            if (updatedRoom.debaterA === userName) {
                setRole('debater');
            } else if (updatedRoom.debaterB === userName) {
                setRole('debater');
            } else {
                setRole('viewer');
            }

            // 방 데이터 업데이트
            setRoomData(updatedRoom);

        } catch (error) {
            alert(error instanceof Error ? error.message : '참여 중 오류가 발생했습니다');
        }
    };

    // 팩트체크 핸들러 함수 변경 - 단순히 이벤트를 DebateRoomPage로 전달
    const handleFactCheck = (messageIndex: number) => {
        // 이 함수는 이제 단순히 이벤트를 전달하는 역할만 함
        // 실제 요약 요청은 DebateRoomPage.tsx에서 수행됨
    };

    // 토론 종료 요청 함수
    const handleRequestDebateEnd = async () => {
        if (!stompClient.current || !roomId) {
            alert("서버에 연결되어 있지 않습니다.");
            return;
        }

        try {
            const message = {
                type: "DEBATE_END_REQUEST",
                content: `${userName}님이 토론 종료를 요청했습니다.`,
                sender: userName,
                roomId: Number(roomId)
            };

            stompClient.current.publish({
                destination: '/app/debate',
                body: JSON.stringify(message)
            });

            // 요청 상태 설정
            setDebateEndRequest({
                requester: userName,
                isPending: true
            });

        } catch (error) {
            alert("토론 종료 요청에 실패했습니다.");
        }
    };

    // 토론 종료 수락 함수
    const handleAcceptDebateEnd = async () => {
        if (!stompClient.current || !roomId) {
            alert("서버에 연결되어 있지 않습니다.");
            return;
        }

        try {
            const message = {
                type: "DEBATE_END_ACCEPT",
                content: `${userName}님이 토론 종료를 수락했습니다. 토론이 종료됩니다.`,
                sender: userName,
                roomId: Number(roomId)
            };

            stompClient.current.publish({
                destination: '/app/debate',
                body: JSON.stringify(message)
            });

            // 요청 상태 초기화
            setDebateEndRequest(null);

        } catch (error) {
            alert("토론 종료 수락에 실패했습니다.");
        }
    };

    // 토론 종료 거절 함수
    const handleRejectDebateEnd = async () => {
        if (!stompClient.current || !roomId) {
            alert("서버에 연결되어 있지 않습니다.");
            return;
        }

        try {
            const message = {
                type: "DEBATE_END_REJECT",
                content: `${userName}님이 토론 종료를 거절했습니다.`,
                sender: userName,
                roomId: Number(roomId)
            };

            stompClient.current.publish({
                destination: '/app/debate',
                body: JSON.stringify(message)
            });

            // 요청 상태 초기화
            setDebateEndRequest(null);

        } catch (error) {
            alert("토론 종료 거절에 실패했습니다.");
        }
    };

    // 웹소켓 메시지 처리 함수
    const handleDebateMessage = (responseMessage: any) => {
        switch (responseMessage.type) {
            case 'CHAT':
            case 'DEBATE':
                // 토론 메시지 처리 - 중복 방지
                setMessages(prev => {
                    // 동일한 내용의 메세지가 이미 있는지 확인
                    const isDuplicate = prev.some(msg => 
                        msg.speaker === responseMessage.sender && 
                        msg.text === responseMessage.content
                    );
                    
                    if (isDuplicate) {
                        debugLog('중복 메세지 감지되어 무시됨:', responseMessage.content);
                        return prev;
                    }
                    
                    debugLog('새 토론 메세지 추가:', responseMessage.content);
                    return [...prev, {
                        speaker: responseMessage.sender,
                        text: responseMessage.content,
                        summary: responseMessage.summary
                    }];
                });
                break;
                
            case 'SYSTEM':
                // 시스템 메시지 처리
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                break;
                
            case 'START':
                // 토론 시작 메시지
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: '토론이 시작되었습니다.',
                }]);
                break;
                
            case 'READY':
                // 준비 완료 메시지
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                break;
                
            case 'TURN':
                // 턴 변경 처리
                setCurrentSpeaker(responseMessage.content);
                setIsMyTurn(responseMessage.content === userName);
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: `${responseMessage.content}님의 발언 차례입니다.`,
                }]);
                break;
                
            case 'DEBATE_END_REQUEST':
                // 토론 종료 요청 처리
                setDebateEndRequest({
                    requester: responseMessage.sender,
                    isPending: true
                });
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                break;
                
            case 'DEBATE_END_ACCEPT':
                // 토론 종료 수락 처리
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                setDebateEndRequest(null);
                // 토론 종료 상태 업데이트
                setRoomData(prev => prev ? { ...prev, ended: true, started: false } : prev);
                break;
                
            case 'DEBATE_END_REJECT':
                // 토론 종료 거절 처리
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                setDebateEndRequest(null);
                break;
                
            case 'CREATOR_LEAVE':
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                alert('토론 생성자가 나가서 토론방이 제거됩니다.');
                setTimeout(() => navigate('/discussion'), 3000);
                break;
                
            case 'DEBATER_LEAVE':
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
                // 토론자가 나가면 방 상태 업데이트
                fetchRoomData();
                break;
                
            default:
                // 기타 메시지 타입은 시스템 메시지로 처리
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content || '알 수 없는 메시지',
                }]);
                break;
        }
    };

    // fetchRoomData 함수 추가
    const fetchRoomData = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch room data');
            
            const data = await response.json();
            setRoomData(data);
        } catch (error) {
            // 오류 처리만 하고 로그 출력하지 않음
        }
    };



    // 로딩 상태나 오류 처리
    if (loading) {
        return <div className="loading">토론방 로딩 중...</div>;
    }
    
    if (error) {
        return <div className="error">{error}</div>;
    }
    
    if (!roomData) {
        return <div className="error">토론방 정보를 불러올 수 없습니다</div>;
    }
    
    return (
        <DebateRoomPage
            role={role}
            userName={userName}
            messages={messages}
            onSendMessage={handleSendMessage}
            chatMessages={chatMessages}
            onSendChat={handleSendChat}
            roomTitle={roomData.title}
            roomTopic={roomData.topic}
            onReady={handleReady}
            roomId={roomId}
            debaterA={roomData.debaterA}
            debaterB={roomData.debaterB}
            debaterAReady={roomData.debaterAReady}
            debaterBReady={roomData.debaterBReady}
            spectatorCount={participantCount}
            onJoinAsDebaterB={joinAsDebaterB}
            onLeave={handleLeave}
            isLoggedIn={!!userName}
            onFactCheck={handleFactCheck}
            currentTurnUserNickname={roomData.currentTurnUserNickname}
            isDebateStarted={roomData.started && !roomData.ended}
            onRequestDebateEnd={handleRequestDebateEnd}
            onAcceptDebateEnd={handleAcceptDebateEnd}
            onRejectDebateEnd={handleRejectDebateEnd}
            debateEndRequest={debateEndRequest}
        />
    );
};

export default DebateRoomPageWrapper;
