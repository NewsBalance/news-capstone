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

    @Column(nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int currentParticipants = 0;
    
    @Column(nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int totalVisits = 0;

    @Builder.Default
    private boolean scheduledForDeletion = false;
    private LocalDateTime deletionTime;
    
    @Column(nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int viewCount = 0;
    
    public void incrementCurrentParticipants() {
        this.currentParticipants++;
    }
    
    public void decrementCurrentParticipants() {
        if (this.currentParticipants > 0) {
            this.currentParticipants--;
        }
    }
    
    public void incrementTotalVisits() {
        this.totalVisits++;
    }

    public void incrementViewCount() {
        this.viewCount = this.viewCount + 1;
    }

    public void decrementViewCount() {
        if (this.viewCount > 0) {
            this.viewCount = this.viewCount - 1;
        }
    }
}