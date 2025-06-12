package newsbalance.demo.Service;

import newsbalance.demo.Entity.DebateMessage;
import newsbalance.demo.Entity.DebateRoom;
import newsbalance.demo.Repository.JPA.DebateMessageRepository;
import newsbalance.demo.Repository.JPA.DebateRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DebateMessageService {

    private final DebateMessageRepository debateMessageRepository;
    private final DebateRoomRepository debateRoomRepository;

    @Autowired
    public DebateMessageService(DebateMessageRepository debateMessageRepository, 
                                DebateRoomRepository debateRoomRepository) {
        this.debateMessageRepository = debateMessageRepository;
        this.debateRoomRepository = debateRoomRepository;
    }

    // 팩트체크 결과 업데이트 메서드
    @Transactional
    public void updateFactCheck(Long roomId, int messageIndex, String factCheckResult, String factCheckBy) {
        Optional<DebateRoom> roomOpt = debateRoomRepository.findById(roomId);
        if (roomOpt.isPresent()) {
            DebateRoom room = roomOpt.get();
            List<DebateMessage> messages = debateMessageRepository.findByDebateRoomOrderByCreatedAtAsc(room);
            
            if (messageIndex >= 0 && messageIndex < messages.size()) {
                DebateMessage message = messages.get(messageIndex);
                message.setFactCheck(factCheckResult);
                message.setFactCheckBy(factCheckBy);
                debateMessageRepository.save(message);
            }
        }
    }
    
    // 기존 메서드들...
} 