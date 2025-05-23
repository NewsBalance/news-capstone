package newsbalance.demo.Repository;

import newsbalance.demo.Entity.DebateRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DebateRoomRepository extends JpaRepository<DebateRoom, Long> {
}