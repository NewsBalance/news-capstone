package newsbalance.demo.debate.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebateRoom {
    @Id
    @GeneratedValue
    private Long id;

    private String title;
    private String topic;
    private boolean active;
    private LocalDateTime createdAt;

    @OneToOne
    private User debaterA;

    @OneToOne
    private User debaterB;

    private boolean debaterAReady;
    private boolean debaterBReady;

    private Long currentTurnUserId; // 현재 발언 권한이 있는 사용자 ID

    private boolean started;
}