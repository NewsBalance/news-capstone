package newsbalance.demo.Service;

import jakarta.persistence.EntityNotFoundException;
import newsbalance.demo.DTO.*;
import newsbalance.demo.Entity.*;
import newsbalance.demo.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DebateRoomService {

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

    @Transactional(readOnly = true)
    public List<DebateRoomDto> getAllDebateRooms() {
        return debateRoomRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DebateRoomDto createDebateRoom(CreateRoomRequestDto request, String nickname) {
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

        List<MessageDto> messages = room.getMessages().stream()
                .map(this::convertToMessageDto)
                .collect(Collectors.toList());

        List<String> keywords = room.getKeywords().stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());

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
                keywords
        );
    }

    @Transactional
    public MessageDto saveMessage(Long roomId, MessageRequestDto messageRequest, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));

        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        // 현재 사용자의 턴인지 확인
        if (room.isStarted() && !user.getId().equals(room.getCurrentTurnUserId())) {
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
        
        // 턴 변경 로직 (CHAT 타입인 경우)
        if ("CHAT".equals(messageRequest.getType()) && room.isStarted()) {
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
    public DebateRoomDto setReady(Long roomId, String nickname) {
        DebateRoom room = debateRoomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다"));
                
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));
        
        // 사용자가 토론자인지 확인
        if (room.getDebaterA() != null && room.getDebaterA().getId().equals(user.getId())) {
            room.setDebaterAReady(true);
        } else if (room.getDebaterB() != null && room.getDebaterB().getId().equals(user.getId())) {
            room.setDebaterBReady(true);
        } else {
            throw new IllegalStateException("토론방의 토론자가 아닙니다");
        }
        
        // 양쪽 모두 준비 완료되면 토론 시작
        if (room.isDebaterAReady() && room.isDebaterBReady()) {
            room.setStarted(true);
            room.setCurrentTurnUserId(room.getDebaterA().getId()); // A가 선턴
            
            // 시스템 메시지 추가
            DebateMessage startMessage = DebateMessage.builder()
                    .type("INFO")
                    .content("토론이 시작되었습니다")
                    .sender("System")
                    .debateRoom(room)
                    .build();
            debateMessageRepository.save(startMessage);
        }
        
        debateRoomRepository.save(room);
        return convertToDto(room);
    }

    private DebateRoomDto convertToDto(DebateRoom debateRoom) {
        List<String> keywords = debateRoom.getKeywords().stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());
                
        return new DebateRoomDto(
                debateRoom.getId(),
                debateRoom.getTitle(),
                debateRoom.getTopic(),
                debateRoom.isActive(),
                debateRoom.getCreatedAt(),
                debateRoom.getDebaterA() != null ? debateRoom.getDebaterA().getNickname() : null,
                debateRoom.getDebaterB() != null ? debateRoom.getDebaterB().getNickname() : null,
                debateRoom.isDebaterAReady(),
                debateRoom.isDebaterBReady(),
                debateRoom.isStarted(),
                keywords
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
} 