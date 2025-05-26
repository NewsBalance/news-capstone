import { useParams, useNavigate } from 'react-router-dom';
import DebateRoomPage from './DebateRoomPage';
import { useEffect, useState, useRef } from 'react';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.41.157:8080/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://192.168.41.157:8080/ws';

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

interface RoomData {
    id: number;
    title: string;
    description: string;
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
    
    // 상태 관리
    const [userName, setUserName] = useState<string>('');
    const [role, setRole] = useState<'debater' | 'viewer'>('viewer');
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<{
        id: number;
        title: string;
        description: string;
        started: boolean;
        debaterAReady: boolean;
        debaterBReady: boolean;
        currentParticipants: number;
        totalVisits: number;
        debaterA: string | null;
        debaterB: string | null;
    } | null>(null);

    // WebSocket 클라이언트 참조
    const stompClient = useRef<any>(null);
    
    // 디버깅 로그 추가
    useEffect(() => {
        console.log('현재 로딩 상태:', loading);
        console.log('현재 에러 상태:', error);
        console.log('현재 룸 데이터:', roomData);
        console.log('현재 사용자 이름:', userName);
    }, [loading, error, roomData, userName]);

    // 중요: 이 useEffect를 컴포넌트 최상단으로 이동
    // 사용자 정보가 로드되면 다른 작업을 진행하도록 순서 보장
    useEffect(() => {
        // 로컬 스토리지에서 사용자 정보 직접 확인
        const localUserName = localStorage.getItem('userName');
        if (localUserName) {
            console.log('로컬 스토리지에서 사용자 이름을 가져왔습니다:', localUserName);
            setUserName(localUserName);
            return;
        }
        
        // 토큰에서 사용자 정보 추출 시도
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log('토큰 페이로드:', payload);
                    
                    // 다양한 필드 이름 시도
                    const extractedName = payload.nickname || payload.name || payload.username || payload.sub;
                    
                    if (extractedName) {
                        console.log('토큰에서 사용자 이름을 찾았습니다:', extractedName);
                        setUserName(extractedName);
                        // 추후 사용을 위해 로컬 스토리지에 저장
                        localStorage.setItem('userName', extractedName);
                        return;
                    }
                }
            } catch (e) {
                console.error('토큰 디코딩 오류:', e);
            }
        }
        
        // API 호출을 통한 사용자 정보 가져오기는 생략 (필요시 추가)
        
        if (!token) {
            console.error('토큰이 없습니다');
            setError('로그인이 필요합니다.');
            setLoading(false);
        }
    }, []); // 컴포넌트 마운트 시 한 번만 실행

    // WebSocket 연결 설정
    useEffect(() => {
        if (!roomId || !userName) return;

        const client = new StompJs.Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
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
                    setRoomData(prevData => {
                        // 토론 시작 상태가 변경되었을 때 시스템 메시지 추가
                        if (roomStatus.started && !prevData?.started) {
                            setMessages(prev => [...prev, {
                                speaker: 'System',
                                text: '토론이 시작되었습니다.'
                            }]);
                        }

                        // 전체 방 상태를 한 번에 업데이트
                        return {
                            ...prevData!,
                            ...roomStatus,
                            description: roomStatus.description || roomStatus.topic || '설명 없음'
                        };
                    });
                } catch (err) {
                    console.error('상태 업데이트 처리 오류:', err);
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

    // 토론방 정보와 메시지 가져오기 - userName이 설정된 후에만 실행되도록 수정
    useEffect(() => {
        if (!roomId || !userName) {
            console.log('필수 데이터가 없어 API 호출을 건너뜁니다.');
            return;
        }
        
        console.log('토론방 정보 API 호출 시작, 사용자:', userName);
        setLoading(true);
        
        // 먼저 방 참여 처리
        joinRoom().then(() => {
            // 방 정보 조회
            fetch(`${API_URL}/debate-rooms/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            })
            .then(res => {
                if (!res.ok) throw new Error('토론방 정보를 가져올 수 없습니다');
                return res.json();
            })
            .then(data => {
                // 방 데이터 설정
                setRoomData({
                    ...data,
                    description: data.description || data.topic || '설명 없음'
                });
                
                setMessages(data.messages?.map((msg: any) => ({
                    speaker: msg.sender,
                    text: msg.content,
                    summary: msg.summary
                })) || []);
                
                // 역할 설정 - 오직 debaterA만 체크
                const isDebaterA = data.debaterA === userName;
                
                if (isDebaterA) {
                    console.log(`사용자 ${userName}이(가) 토론자A로 설정됨`);
                    setRole('debater');
                } else {
                    console.log(`사용자 ${userName}이(가) 관전자로 설정됨`);
                    setRole('viewer');
                }
                
                setLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setError(err.message);
                setLoading(false);
            });
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
            
            // 낙관적 UI 업데이트 제거
            // setChatMessages(prev => [...prev, `${userName}: ${text}`]);
        } catch (error) {
            console.error("채팅 메시지 전송 중 오류:", error);
            alert("채팅 메시지 전송에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 준비 상태 변경 함수 수정
    const handleReady = async () => {
        try {
            const response = await fetch(`${API_URL}/debate-rooms/${roomId}/ready`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('준비 상태 변경에 실패했습니다');
            }

            // 서버에서 상태 업데이트를 받을 때까지 기다리므로 여기서는 상태를 직접 업데이트하지 않음
        } catch (error) {
            console.error('Error toggling ready state:', error);
            alert(error instanceof Error ? error.message : '준비 상태 변경 중 오류가 발생했습니다');
        }
    };

    // 토론자 A로 등록하는 함수
    const registerAsDebaterA = () => {
        if (!roomId) return;
        
        console.log('토론자 A 등록 API 호출...');
        
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // 토론자 A로 등록 API 호출
        fetch(`${API_URL}/debate-rooms/${roomId}/register-as-debater-a`, {
            method: 'POST',
            headers: headers,
            credentials: 'include',
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
            const response = await fetch(`${API_URL}/debate-rooms/${roomId}/join-as-debater-b`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
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
        if (!roomId) return;

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
            const response = await fetch(`${API_URL}/debate-rooms/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('퇴장 처리 중 오류가 발생했습니다');
            }

            navigate('/discussion');
        } catch (error) {
            console.error('Error leaving room:', error);
            // 오류가 발생해도 페이지 이동
            navigate('/discussion');
        }
    };

    // joinRoom 함수 수정
    const joinRoom = async () => {
        if (!roomId || !userName) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/debate-rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('토론방 참여에 실패했습니다');
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

    // handleDebateMessage 함수 추가
    const handleDebateMessage = (responseMessage: any) => {
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
            const response = await fetch(`${API_URL}/debate-rooms/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
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
    
    // 관전자 수 계산 - 총 참가자 수에서 토론자 수 제외
    const spectatorCount = roomData.currentParticipants - 
                          (roomData.debaterA ? 1 : 0) - 
                          (roomData.debaterB ? 1 : 0);
    
    return (
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
            roomId={roomId}
            debaterA={roomData.debaterA}
            debaterB={roomData.debaterB}
            debaterAReady={roomData.debaterAReady}
            debaterBReady={roomData.debaterBReady}
            spectatorCount={spectatorCount >= 0 ? spectatorCount : 0}
            onJoinAsDebaterB={joinAsDebaterB}
            onLeave={handleLeave}
            isLoggedIn={!!userName}
        />
    );
};

export default DebateRoomPageWrapper;