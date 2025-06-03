import { useParams, useNavigate } from 'react-router-dom';
import DebateRoomPage from './DebateRoomPage';
import { useEffect, useState, useRef } from 'react';
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
    const [currentSpeaker, setCurrentSpeaker] = useState<string>('');
    const [isMyTurn, setIsMyTurn] = useState<boolean>(false);

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
            webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
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
            console.error('roomId 또는 userName이 없습니다');
            setError('방 정보 또는 사용자 정보가 없습니다');
            return;
        }

        console.log('토론방 정보 요청:', roomId);
        
        fetch(`${API_BASE}/api/debate-rooms/${roomId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                console.error('토론방 정보 응답 오류:', res.status);
                return res.text().then(text => {
                    throw new Error(text || '토론방 정보를 가져오는데 실패했습니다');
                });
            }
            return res.json();
        })
        .then(data => {
            console.log('토론방 정보 응답:', data);
            
            // 토론방 데이터 설정
            setRoomData(data);
            
            // 토론 메시지 처리
            if (Array.isArray(data.messages)) {
                console.log('받아온 토론 메시지 수:', data.messages.length);
                setMessages(data.messages.map((msg: any) => ({
                    speaker: msg.sender,
                    text: msg.content,
                    summary: msg.summary
                })));
            } else {
                console.warn('응답에 messages 필드가 없거나 배열이 아닙니다:', data);
                setMessages([]);
            }
            
            // 채팅 메시지 처리 (추가)
            if (Array.isArray(data.chatMessages)) {
                console.log('받아온 채팅 메시지 수:', data.chatMessages.length);
                setChatMessages(data.chatMessages.map((msg: any) => 
                    `${msg.message}`
                ));
            } else {
                console.warn('응답에 chatMessages 필드가 없거나 배열이 아닙니다:', data);
                setChatMessages([]);
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
            console.error("채팅 메시지 전송 중 오류:", error);
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
            const response = await fetch(`${API_BASE}/api/debate-rooms/${roomId}/leave`, {
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

        // API를 통해 팩트체크 요청
        fetch(`${API_BASE}/api/fact-check`, {
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
            // 팩트체크 결과 알림 표시
            alert(`${messageToCheck.speaker}의 주장 팩트체크 결과: ${data.factCheckResult || '팩트체크 결과가 없습니다'}`);
            
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

    // WebSocket 메시지 구독 설정
    const setupSubscriptions = () => {
        // 토론방 메시지 구독
        stompClient.current?.subscribe(`/topic/room/${roomId}`, (message: { body: string }) => {
            const data = JSON.parse(message.body);
            console.log('토론방 메시지 수신:', data);
            
            // 메시지 타입에 따라 처리
            switch (data.type) {
                case 'DEBATE':
                    // 토론 메시지 처리
                    setMessages(prev => [...prev, {
                        speaker: data.sender,
                        text: data.content
                    }]);
                    break;
                    
                case 'SYSTEM':
                    // 시스템 메시지 처리 (턴 타임아웃 포함)
                    setMessages(prev => [...prev, {
                        speaker: '시스템',
                        text: data.content,
                        isSystem: true
                    }]);
                    break;
                    
                case 'TURN':
                    // 턴 변경 메시지 처리
                    setCurrentSpeaker(data.content);
                    // 현재 턴이 자신인지 표시
                    setIsMyTurn(data.content === userName);
                    break;
                    
                // 기타 메시지 타입 처리...
            }
        });
        
        // 턴 알림 구독 추가
        stompClient.current?.subscribe(`/topic/turn/${roomId}`, (message: { body: string }) => {
            const data = JSON.parse(message.body);
            
            // 현재 발언자 업데이트
            setCurrentSpeaker(data.content);
            
            // 내 턴인지 확인
            setIsMyTurn(data.content === userName);
            
            // 턴 변경 메시지 표시
            setMessages(prev => [...prev, {
                speaker: '시스템',
                text: `${data.content}님의 발언 차례입니다.`,
                isSystem: true
            }]);
        });
        
        // 오류 메시지 구독
        stompClient.current?.subscribe(`/topic/error/${roomId}`, (message: { body: string }) => {
            const data = JSON.parse(message.body);
            console.log('오류 메시지:', data);
            
            // 오류 알림 표시
            alert(data.content);
        });
        
        // 기타 구독...
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
        />
    );
};

export default DebateRoomPageWrapper;