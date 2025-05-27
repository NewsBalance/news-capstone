package newsbalance.demo.Repository.JPA;

import newsbalance.demo.Entity.DebateRoom;
import newsbalance.demo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DebateRoomRepository extends JpaRepository<DebateRoom, Long> {
    List<DebateRoom> findTop8ByOrderByCurrentParticipantsDesc();
    List<DebateRoom> findByDebaterAOrDebaterB(User debaterA, User debaterB);
    List<DebateRoom> findByScheduledForDeletionTrue();
}