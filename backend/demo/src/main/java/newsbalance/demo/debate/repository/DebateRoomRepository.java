package newsbalance.demo.debate.repository;

import newsbalance.demo.debate.entity.DebateRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DebateRoomRepository extends JpaRepository<DebateRoom, Long> {
}