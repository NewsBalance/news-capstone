package newsbalance.demo.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DebateRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String topic;
    private boolean active;
    
    @CreatedDate
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "debater_a_id")
    private User debaterA;

    @ManyToOne
    @JoinColumn(name = "debater_b_id")
    private User debaterB;

    private boolean debaterAReady;
    private boolean debaterBReady;

    private Long currentTurnUserId;
    private boolean started;
    
    @Builder.Default
    @OneToMany(mappedBy = "debateRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DebateMessage> messages = new ArrayList<>();
    
    @Builder.Default
    @OneToMany(mappedBy = "debateRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> chatMessages = new ArrayList<>();
    
    @Builder.Default
    @OneToMany(mappedBy = "debateRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Keyword> keywords = new ArrayList<>();
}