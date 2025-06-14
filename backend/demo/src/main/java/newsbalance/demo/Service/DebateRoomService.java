package newsbalance.demo.Service;

import jakarta.persistence.EntityNotFoundException;
import newsbalance.demo.DTO.*;
import newsbalance.demo.Entity.*;
import newsbalance.demo.Repository.JPA.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DebateRoomService {

    private static final Logger log = LoggerFactory.getLogger(DebateRoomService.class);

    @Autowired
    private DebateRoomRepository debateRoomRepository;

    @Autowired
    private DebateMessageRepository debateMessageRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private KeywordRepository keywordRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private DebateService debateService;

    @Transactional(readOnly = true)
    public List<DebateRoomDto> getAllDebateRooms() {
        // 모든 토론방을 가져와서 DTO로 변환
        return debateRoomRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DebateRoomDto> getHotDebateRooms() {
        // 실시간 참여자 수 기준으로 상위 8개 방 조회
        return debateRoomRepository.findTop8ByOrderByCurrentParticipantsDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DebateRoomDto> getMyDebateRooms(String nickname) {
        // 사용자가 생성하거나 참여한 토론방 조회
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));
        
        return debateRoomRepository.findByDebaterAOrDebaterB(user, user).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DebateRoomDto createDebateRoom(CreateRoomRequestDto request, String nickname) {
        // 토론방 생성
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        DebateRoom debateRoom = DebateRoom.builder()
                .title(request.getTitle())
                .topic(request.getTopic())
                .active(true)
                .debaterA(user)
                .debaterAReady(false)
                .debaterBReady(false)
                .started(false)
                .currentParticipants(1)  // 방장이 첫 참여자
                .totalVisits(1)          // 방장이 첫 방문자
                .build();

        DebateRoom savedRoom = debateRoomRepository.save(debateRoom);
        
        // 키워드 저장
        if (request.getKeywords() != null) {
            for (String keywordName : request.getKeywords()) {
                Keyword keyword = Keyword.builder()
                        .name(keywordName)
                        .debateRoom(savedRoom)
                        .build();
                keywordRepository.save(keyword);
            }
        }
        
        return convertToDto(savedRoom);
    }

    @Transactional
    public DebateRoomDto joinDebateRoom(Long roomId, String nickname) {
        // 토론방에 참여
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        DebateRoom room = debateRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));

        // 이미 참여 중인지 확인
        if (room.getDebaterA() != null && room.getDebaterA().getId().equals(user.getId())) {
            return convertToDto(room);
        }

        // 빈 자리가 있는지 확인
        if (room.getDebaterB() == null) {
            room.setDebaterB(user);
            debateRoomRepository.save(room);
        } else {
            throw new IllegalStateException("토론방이 이미 가득 찼습니다");
        }

        return convertToDto(room);
    }

    @Transactional(readOnly = true)
    public DebateRoomWithMessagesDto getDebateRoomWithMessages(Long roomId) {
        DebateRoom room = debateRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));

        // 토론 메시지 가져오기
        List<MessageDto> messages = room.getMessages().stream()
                .map(this::convertToMessageDto)
                .collect(Collectors.toList());
        
        // 채팅 메시지 가져오기
        List<ChatMessageDto> chatMessages = chatMessageRepository.findByDebateRoomId(roomId).stream()
                .map(this::convertToChatMessageDto)
                .collect(Collectors.toList());
        
        System.out.println("토론방 " + roomId + "의 토론 메시지 수: " + messages.size());
        System.out.println("토론방 " + roomId + "의 채팅 메시지 수: " + chatMessages.size());
        
        List<String> keywords = room.getKeywords().stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());
        
        String currentTurnUserNickname = null;
        if (room.getCurrentTurnUserId() != null) {
            currentTurnUserNickname = userRepository.findById(room.getCurrentTurnUserId())
                .map(User::getNickname)
                .orElse(null);
        }
        
        return new DebateRoomWithMessagesDto(
            room.getId(),
            room.getTitle(),
            room.getTopic(),
            room.isActive(),
            room.getCreatedAt(),
            room.getDebaterA() != null ? room.getDebaterA().getNickname() : null,
            room.getDebaterB() != null ? room.getDebaterB().getNickname() : null,
            room.isDebaterAReady(),
            room.isDebaterBReady(),
            room.isStarted(),
            messages,
            chatMessages,
            keywords,
            currentTurnUserNickname
        );
    }

    @Transactional
    public MessageDto saveMessage(Long roomId, MessageRequestDto messageRequest, String nickname) {
        // 메시지 저장
        DebateRoom room = debateRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));

        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        // 현재 사용자의 턴인지 확인 (DEBATE 타입인 경우만)
        if ("DEBATE".equals(messageRequest.getType()) && room.isStarted() && !user.getId().equals(room.getCurrentTurnUserId())) {
            throw new IllegalStateException("현재 턴의 사용자가 아닙니다");
        }

        DebateMessage message = DebateMessage.builder()
                .type(messageRequest.getType())
                .content(messageRequest.getContent())
                .sender(messageRequest.getSender())
                .debateRoom(room)
                .user(user)
                .build();

        DebateMessage savedMessage = debateMessageRepository.save(message);
        
        // 턴 변경 로직 (DEBATE 타입인 경우)
        if ("DEBATE".equals(messageRequest.getType()) && room.isStarted()) {
            if (user.getId().equals(room.getDebaterA().getId())) {
                room.setCurrentTurnUserId(room.getDebaterB().getId());
            } else {
                room.setCurrentTurnUserId(room.getDebaterA().getId());
            }
            debateRoomRepository.save(room);
        }
        
        return convertToMessageDto(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<String> getChatMessages(Long roomId) {
        // 이전 채팅 메시지 조회만 수행
        List<ChatMessage> chatMessages = chatMessageRepository.findByDebateRoomIdOrderByCreatedAtAsc(roomId);
        return chatMessages.stream()
                .map(ChatMessage::getMessage)
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveChatMessage(Long roomId, String messageText, String nickname) {
        // WebSocket을 통해서만 처리하도록 변경
        throw new UnsupportedOperationException("채팅 메시지는 WebSocket을 통해서만 처리됩니다.");
    }
    
    @Transactional
    public DebateRoomDto toggleReady(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
                
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));
        
        boolean wasReady = false;
        boolean isReady = false;
        
        // 사용자가 토론자인지 확인
        if (room.getDebaterA() != null && room.getDebaterA().getId().equals(user.getId())) {
            wasReady = room.isDebaterAReady();
            room.setDebaterAReady(!wasReady);
            isReady = !wasReady;
        } else if (room.getDebaterB() != null && room.getDebaterB().getId().equals(user.getId())) {
            wasReady = room.isDebaterBReady();
            room.setDebaterBReady(!wasReady);
            isReady = !wasReady;
        } else {
            throw new IllegalStateException("토론방의 토론자가 아닙니다");
        }
        
        // 토론이 이미 시작된 경우 준비 상태 변경 불가
        if (room.isStarted()) {
            throw new IllegalStateException("토론이 이미 시작되었습니다");
        }
        
        // 양쪽 모두 준비 완료되면 토론 시작
        if (room.isDebaterAReady() && room.isDebaterBReady()) {
            room.setStarted(true);
            
            // 토론 시작 시 첫 번째 턴은 항상 DebaterA(방장)에게 부여
            room.setCurrentTurnUserId(room.getDebaterA().getId());
        }
        
        room = debateRoomRepository.save(room);
        
        return convertToDto(room);
    }

    @Transactional(readOnly = true)
    public boolean isRoomHost(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
        
        return room.getDebaterA() != null && 
               room.getDebaterA().getNickname().equals(nickname);
    }
    
    @Transactional
    public DebateRoomDto leaveRoom(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
        
        User user = userRepository.findByNickname(nickname)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        // 토론자B가 나가는 경우
        if (room.getDebaterB() != null && room.getDebaterB().getId().equals(user.getId())) {
            room.setDebaterB(null);
            room.setDebaterBReady(false);
            room.decrementCurrentParticipants();
            
            // 토론이 진행 중이었다면 토론 종료 처리
            if (room.isStarted()) {
                room.setStarted(false);
                room.setDebaterAReady(false);
                room.setDebaterBReady(false);
                
                // 3분 후 방 삭제를 위한 플래그 설정
                room.setScheduledForDeletion(true);
                room.setDeletionTime(LocalDateTime.now().plusMinutes(3));
            }
            
            // 토론 종료 요청 상태 및 타이머 정리
            debateService.cleanupRoomTimers(roomId);
        }
        // 토론자A가 나가는 경우 (방장)
        else if (room.getDebaterA() != null && room.getDebaterA().getId().equals(user.getId())) {
            // 토론 종료 요청 상태 및 타이머 정리
            debateService.cleanupRoomTimers(roomId);
        }
        // 관전자가 나가는 경우
        else if (!isDebater(room, user)) {
            room.decrementCurrentParticipants();
        }
        
        room = debateRoomRepository.save(room);
        return convertToDto(room);
    }
    
    @Transactional
    public void deleteRoom(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
        
        if (!room.getDebaterA().getNickname().equals(nickname)) {
            throw new IllegalStateException("방장만 방을 삭제할 수 있습니다");
        }
        
        // 토론 종료 요청 상태 및 타이머 정리
        debateService.cleanupRoomTimers(roomId);
        
        debateRoomRepository.delete(room);
    }

    @Transactional
    public DebateRoomDto joinRoom(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
        
        User user = userRepository.findByNickname(nickname)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        // 이미 참여 중인지 확인
        boolean isDebaterA = room.getDebaterA() != null && 
                            room.getDebaterA().getNickname().equals(nickname);
        boolean isDebaterB = room.getDebaterB() != null && 
                            room.getDebaterB().getNickname().equals(nickname);

        if (!isDebaterA && !isDebaterB) {
            // 새로운 참여자인 경우 관전자로 참여
            room.incrementCurrentParticipants();
            room.incrementTotalVisits(); // 총 방문자 수도 증가
        }

        room = debateRoomRepository.save(room);
        
        // WebSocket을 통해 참여자 수 업데이트 알림
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/participants",
            new ParticipantUpdateDto(room.getCurrentParticipants())
        );

        // 방 상태 전체 업데이트도 전송
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/status",
            convertToDto(room)
        );

        return convertToDto(room);
    }

    @Transactional
    public DebateRoomDto joinAsDebaterB(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
        
        User user = userRepository.findByNickname(nickname)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        // 토론자 B 자리가 비어있는지 확인
        if (room.getDebaterB() != null) {
            throw new IllegalStateException("이미 토론자 B가 있습니다");
        }

        // 토론자 A가 아닌지 확인
        if (room.getDebaterA() != null && 
            room.getDebaterA().getNickname().equals(nickname)) {
            throw new IllegalStateException("토론자 A는 토론자 B가 될 수 없습니다");
        }

        room.setDebaterB(user);
        room = debateRoomRepository.save(room);

        // WebSocket을 통해 방 상태 업데이트 알림
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/status",
            convertToDto(room)
        );

        return convertToDto(room);
    }

    private boolean isDebater(DebateRoom room, User user) {
        return isDebaterA(room, user) || isDebaterB(room, user);
    }

    private boolean isDebaterA(DebateRoom room, User user) {
        return room.getDebaterA() != null && room.getDebaterA().getId().equals(user.getId());
    }

    private boolean isDebaterB(DebateRoom room, User user) {
        return room.getDebaterB() != null && room.getDebaterB().getId().equals(user.getId());
    }

    private DebateRoomDto convertToDto(DebateRoom debateRoom) {
        List<String> keywords = debateRoom.getKeywords().stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());
                
        // 날짜 포맷팅
        String formattedDate = debateRoom.getCreatedAt()
                .format(DateTimeFormatter.ofPattern("MM/dd HH:mm"));
                
        // 생성자는 debaterA(방장)와 동일
        String creator = debateRoom.getDebaterA() != null ? debateRoom.getDebaterA().getNickname() : "시스템";
                
        return new DebateRoomDto(
                debateRoom.getId(),
                debateRoom.getTitle(),
                debateRoom.getTopic(),
                debateRoom.isActive(),
                formattedDate,  // 포맷된 날짜 사용
                debateRoom.getDebaterA() != null ? debateRoom.getDebaterA().getNickname() : null,
                debateRoom.getDebaterB() != null ? debateRoom.getDebaterB().getNickname() : null,
                debateRoom.isDebaterAReady(),
                debateRoom.isDebaterBReady(),
                debateRoom.isStarted(),
                keywords,
                debateRoom.getCurrentParticipants(),  // 실시간 참여자 수 추가
                debateRoom.getTotalVisits(),          // 총 방문자 수 추가
                creator                               // 생성자(방장) 정보 추가
        );
    }

    private MessageDto convertToMessageDto(DebateMessage message) {
        return new MessageDto(
                message.getId(),
                message.getType(),
                message.getContent(),
                message.getSender(),
                message.getCreatedAt(),
                message.getSummary()
        );
    }

    // ChatMessage -> ChatMessageDto 변환 메서드 추가
    private ChatMessageDto convertToChatMessageDto(ChatMessage chatMessage) {
        return new ChatMessageDto(
            chatMessage.getId(),
            chatMessage.getMessage(),
            chatMessage.getUser() != null ? chatMessage.getUser().getNickname() : "익명",
            chatMessage.getCreatedAt()
        );
    }

    // 삭제 예정된 방 처리를 위한 스케줄러
    @Scheduled(fixedRate = 60000) // 1분마다 실행
    public void cleanupScheduledRooms() {
        List<DebateRoom> scheduledRooms = debateRoomRepository.findByScheduledForDeletionTrue();
        LocalDateTime now = LocalDateTime.now();
        
        for (DebateRoom room : scheduledRooms) {
            if (room.getDeletionTime().isBefore(now)) {
                debateRoomRepository.delete(room);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<DebateRoomDto> searchDebateRooms(String query) {
        // 검색어를 소문자로 변환하여 대소문자 구분 없이 검색
        String lowerCaseQuery = query.toLowerCase();
        
        // 모든 토론방을 가져와서 필터링 (JPA 커스텀 쿼리 메서드가 있으면 더 효율적임)
        return debateRoomRepository.findAll().stream()
            .filter(room -> 
                // 제목에 검색어가 포함된 경우
                room.getTitle().toLowerCase().contains(lowerCaseQuery) || 
                // 설명(토픽)에 검색어가 포함된 경우
                (room.getTopic() != null && room.getTopic().toLowerCase().contains(lowerCaseQuery)) ||
                // 키워드에 검색어가 포함된 경우
                room.getKeywords().stream().anyMatch(keyword -> 
                    keyword.getName().toLowerCase().contains(lowerCaseQuery))
            )
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
} 