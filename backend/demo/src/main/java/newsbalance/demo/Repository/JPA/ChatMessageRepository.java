package newsbalance.demo.Repository.JPA;

import newsbalance.demo.Entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByDebateRoomIdOrderByCreatedAtAsc(Long debateRoomId);
    
    List<ChatMessage> findByDebateRoomId(Long roomId);
    
    // JPQL 쿼리를 사용한 중복 메시지 검사 메서드
    @Query("SELECT COUNT(c) > 0 FROM ChatMessage c WHERE c.message = :message " +
           "AND c.debateRoom.id = :roomId AND c.user.id = :userId " +
           "AND c.createdAt BETWEEN :startTime AND :endTime")
    boolean existsByMessageAndDebateRoomIdAndUserIdAndCreatedAtBetween(
            @Param("message") String message, 
            @Param("roomId") Long debateRoomId, 
            @Param("userId") Long userId, 
            @Param("startTime") LocalDateTime start, 
            @Param("endTime") LocalDateTime end);
} 