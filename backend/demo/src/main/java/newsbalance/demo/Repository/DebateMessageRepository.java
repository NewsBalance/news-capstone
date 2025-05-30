package newsbalance.demo.Repository;

import newsbalance.demo.Entity.DebateMessage;
import newsbalance.demo.Entity.DebateRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebateMessageRepository extends JpaRepository<DebateMessage, Long> {
    List<DebateMessage> findByDebateRoomIdOrderByCreatedAtAsc(Long roomId);
    List<DebateMessage> findByDebateRoomOrderByCreatedAtAsc(DebateRoom debateRoom);
} 