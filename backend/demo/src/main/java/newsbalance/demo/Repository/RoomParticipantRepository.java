package newsbalance.demo.Repository;

import newsbalance.demo.Entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {
    // 토론방 참여자 존재 여부 확인
    boolean existsByUserIdAndRoomId(Long userId, Long roomId);
    
    // 토론방 참여자 조회
    Optional<RoomParticipant> findByUserIdAndRoomId(Long userId, Long roomId);

    // 활성화된 토론방 참여자 조회
    List<RoomParticipant> findByRoomIdAndIsActiveTrue(Long roomId);

    // 활성화된 토론방 참여자 조회 (사용자 ID로)
    List<RoomParticipant> findByUserIdAndIsActiveTrue(Long userId);

    // 특정 토론방의 활성화된 참여자 수 조회
    long countByRoomIdAndIsActiveTrue(Long roomId);
} 