import { useParams, useNavigate } from 'react-router-dom';
import DebateRoomPage from './DebateRoomPage';
import { useEffect, useState, useRef } from 'react';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

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
}

const DebateRoomPageWrapper: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // 상태 관리
    const [userName, setUserName] = useState<string>('');
    const [role, setRole] = useState<'debater' | 'viewer'>('viewer');
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [participantCount, setParticipantCount] = useState<number>(0);

    // WebSocket 클라이언트 참조
    const stompClient = useRef<any>(null);
    
    // 디버깅 로그 추가
    useEffect(() => {
        console.log('현재 로딩 상태:', loading);
        console.log('현재 에러 상태:', error);
        console.log('현재 룸 데이터:', roomData);
        console.log('현재 사용자 이름:', userName);
    }, [loading, error, roomData, userName]);

    // 사용자 정보 설정
    useEffect(() => {
        if (user && user.nickname) {
            console.log('Auth 컨텍스트에서 사용자 이름 설정:', user.nickname);
            setUserName(user.nickname);
            return;
        }
        
        // 인증 정보가 없는 경우
        if (!user) {
            console.error('사용자 인증 정보가 없습니다');
            setError('로그인이 필요합니다.');
            setLoading(false);
            return;
        }
    }, [user]);

    // WebSocket 연결 설정
    useEffect(() => {
        if (!roomId || !userName) return;

        const client = new StompJs.Client({
            webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/ws`),
            connectHeaders: {
                userName: userName // 사용자 이름을 헤더에 추가
            },
            debug: str => console.log('STOMP:', str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        client.onConnect = () => {
            console.log('WebSocket 연결 성공!');
            stompClient.current = client;

            // 방 상태 구독
            client.subscribe(`/topic/room/${roomId}/status`, message => {
                try {
                    const roomStatus = JSON.parse(message.body);
                    console.log('받은 룸 상태 데이터:', roomStatus); // 디버깅 로그 추가
                    
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
                    console.error('상태 업데이트 처리 오류:', err);
                }
            });

            // 참여자 변경 구독
            client.subscribe(`/topic/room/${roomId}/participants`, function (message) {
                console.log('참여자 업데이트 메시지 수신:', message.body);
                try {
                    const participantUpdate = JSON.parse(message.body);
                    setRoomData(prev => ({
                        ...prev!,
                        currentParticipants: participantUpdate.currentParticipants
                    }));
                } catch (err) {
                    console.error('참여자 업데이트 처리 오류:', err);
                }
            });

            // 토론 메시지 구독
            client.subscribe('/topic/debate/' + roomId, function (message) {
                try {
                    const responseMessage = JSON.parse(message.body);
                    handleDebateMessage(responseMessage);
                } catch (err) {
                    console.error('메시지 파싱 오류:', err);
                }
            });

            // 관전자 채팅 구독
            client.subscribe('/topic/chat/' + roomId, function (message) {
                console.log('채팅 메시지 수신:', message.body);
                try {
                    const responseMessage = JSON.parse(message.body);
                    setChatMessages(prev => [...prev, `${responseMessage.sender}: ${responseMessage.content}`]);
                } catch (err) {
                    console.error('채팅 메시지 파싱 오류:', err);
                }
            });

            // 오류 메시지 구독
            client.subscribe('/topic/error/' + roomId, function (message) {
                console.error('오류 메시지 수신:', message.body);
                try {
                    const errorMessage = JSON.parse(message.body);
                    alert(`오류: ${errorMessage.content}`);
                } catch (err) {
                    console.error('오류 메시지 파싱 오류:', err);
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
            console.log('필수 데이터가 없어 API 호출을 건너뜁니다.');
            return;
        }
        
        console.log('토론방 정보 API 호출 시작, 사용자:', userName);
        setLoading(true);
        
        // 방 정보 조회
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => {
            // 상태 코드 확인
            if (!res.ok) {
                console.error('토론방 정보 API 응답 오류:', res.status, res.statusText);
                throw new Error(`토론방 정보를 가져올 수 없습니다 (${res.status})`);
            }
            return res.json();
        })
        .then(data => {
            // 원본 API 응답 데이터 전체 로그
            console.log('API 응답 원본 데이터:', data);
            console.log('API 응답 데이터 키:', Object.keys(data));
            
            // 참가자 수 필드 확인
            console.log('API 응답의 참가자 수 관련 필드:');
            console.log('- currentParticipants:', data.currentParticipants);
            
            // 방 데이터 설정
            const roomData = {
                ...data,
                topic: data.topic || '설명 없음'
            };
            
            setRoomData(roomData);
            
            // messages 필드가 있는지 확인 후 처리
            if (Array.isArray(data.messages)) {
                setMessages(data.messages.map((msg: any) => ({
                    speaker: msg.sender,
                    text: msg.content,
                    summary: msg.summary
                })));
            } else {
                setMessages([]);
            }
            
            // 역할 설정
            const isDebaterA = data.debaterA === userName;
            const isDebaterB = data.debaterB === userName;
            
            if (isDebaterA || isDebaterB) {
                console.log(`사용자 ${userName}이(가) 토론자로 설정됨`);
                setRole('debater');
            } else {
                console.log(`사용자 ${userName}이(가) 관전자로 설정됨`);
                setRole('viewer');
            }
            
            setLoading(false);
            setError(null); // 성공적으로 데이터를 가져왔으므로 에러 상태 초기화
        })
        .catch(err => {
            console.error('토론방 정보 가져오기 오류:', err);
            
            // 에러 상태 설정
            setError(err.message);
            setLoading(false);
        
        });
    }, [roomId, userName]);

    // 관전자 수 계산 로직 개선
    useEffect(() => {
        if (roomData) {
            const totalParticipants = Number(roomData.currentParticipants);
            console.log('총 참여자 수:', totalParticipants);
        
            // 그냥 참여자 수 그대로 사용
            setParticipantCount(totalParticipants);
        }
    }, [roomData]);

    // 토론방 입장 처리 로직 추가
    useEffect(() => {
        if (!roomId || !userName) {
            console.log('사용자 정보가 없어 입장 처리를 건너뜁니다.');
            return;
        }
        
        console.log('토론방 입장 처리 시작:', userName);
        
        // 관전자든 토론자든 입장 처리
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/join`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                console.error('토론방 입장 처리 실패:', res.status);
                return res.text().then(text => {
                    throw new Error(text || '입장 처리에 실패했습니다');
                });
            }
            return res.json();
        })
        .then(data => {
            console.log('토론방 입장 처리 완료:', data);
            
            // 룸 데이터 업데이트
            setRoomData(prevData => ({
                ...prevData,
                ...data,
                // 기존 데이터 유지를 위한 병합
                topic: data.topic || prevData?.topic
            }));
            
            // 참가자 수가 업데이트되었는지 확인
            if (data.currentParticipants !== undefined) {
                console.log('업데이트된 참가자 수:', data.currentParticipants);
            }
        })
        .catch(err => {
            console.error('토론방 입장 처리 중 오류:', err);
        });
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
        } catch (error) {
            console.error("채팅 메시지 전송 중 오류:", error);
            alert("채팅 메시지 전송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 준비 상태 변경 함수 수정
    const handleReady = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('준비 상태 변경 응답 오류:', response.status, response.statusText);
                throw new Error('준비 상태 변경에 실패했습니다');
            }

            // 서버에서 상태 업데이트를 받을 때까지 기다리므로 여기서는 상태를 직접 업데이트하지 않음
            console.log('준비 상태 변경 요청 성공');
        } catch (error) {
            console.error('Error toggling ready state:', error);
            alert(error instanceof Error ? error.message : '준비 상태 변경 중 오류가 발생했습니다');
        }
    };

    // 토론자 A로 등록하는 함수
    const registerAsDebaterA = () => {
        if (!roomId) return;
        
        console.log('토론자 A 등록 API 호출...');
        
        // 토론자 A로 등록 API 호출
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/register-as-debater-a`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                console.error('토론자 A 등록 실패:', res.status);
                return;
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;
            
            console.log('토론자 A 등록 성공:', data);
            
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
            console.error('토론자 A 등록 API 오류:', err);
        });
    };

    // 토론자 B로 참여하는 함수 추가
    const joinAsDebaterB = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/join-as-debater-b`, {
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
            console.error('Error joining as debater B:', error);
            alert(error instanceof Error ? error.message : '토론자 B 참여 중 오류가 발생했습니다');
        }
    };

    // 토론방 나가기 처리
    const handleLeave = async () => {
        if (!roomId) {
            console.error('Room ID is undefined');
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
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
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

    // joinRoom 함수 수정
    const joinRoom = async () => {
        if (!roomId || !userName) return;
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/debate-rooms/${roomId}/join`, {
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
                    console.error('토론방 참여 오류:', errorData);
                    throw new Error(errorData.message || '토론방 참여에 실패했습니다');
                } else {
                    const errorText = await response.text();
                    console.error('JSON이 아닌 응답:', errorText.substring(0, 500)); // 응답 앞부분만 로깅
                    throw new Error('서버 응답이 유효한 JSON 형식이 아닙니다');
                }
            }

            const updatedRoom = await response.json();
            
            // 역할 설정
            if (updatedRoom.debaterA === userName) {
                setRole('debater');
                console.log('토론자 A로 설정됨');
            } else if (updatedRoom.debaterB === userName) {
                setRole('debater');
                console.log('토론자 B로 설정됨');
            } else {
                setRole('viewer');
                console.log('관전자로 설정됨');
            }

            // 방 데이터 업데이트
            setRoomData(updatedRoom);

        } catch (error) {
            console.error('Error joining room:', error);
            alert(error instanceof Error ? error.message : '참여 중 오류가 발생했습니다');
        }
    };

    // 팩트체크 핸들러 함수 간소화
    const handleFactCheck = (messageIndex: number) => {
        const messageToCheck = messages[messageIndex];
        if (!messageToCheck) return;

        // API를 통해 팩트체크 요청 - 에러 처리 없이
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/fact-check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: messageToCheck.text,
                roomId: Number(roomId),
                messageIndex: messageIndex
            })
        })
        .then(response => response.json())
        .then(data => {
            // 팩트체크 결과 알림만 표시
            alert(data.factCheckResult || '팩트체크 결과가 없습니다');
            
            // 버튼 비활성화 (선택적)
            const updatedMessages = [...messages];
            updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                isFactChecked: true
            };
            setMessages(updatedMessages);
        });
    };

    // 웹소켓 메시지 처리에서 팩트체크 관련 메시지 필터링 제거
    const handleDebateMessage = (responseMessage: any) => {
        console.log('받은 메시지:', responseMessage);
        
        // 기존 메시지 처리 로직
        switch (responseMessage.type) {
            case 'CHAT':
                setMessages(prev => [...prev, {
                    speaker: responseMessage.sender,
                    text: responseMessage.content,
                    summary: responseMessage.summary
                }]);
                break;
            case 'SYSTEM':
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: responseMessage.content,
                }]);
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
            case 'START':
                setMessages(prev => [...prev, {
                    speaker: 'System',
                    text: '토론이 시작되었습니다.',
                }]);
                break;
        }
    };

    // fetchRoomData 함수 추가
    const fetchRoomData = async () => {
        try {
            const response = await fetch(`/api/debate-rooms/${roomId}`, {
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
            console.error('Error fetching room data:', error);
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
        />
    );
};

export default DebateRoomPageWrapper;