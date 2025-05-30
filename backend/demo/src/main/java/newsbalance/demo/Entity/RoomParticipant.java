package newsbalance.demo.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_participants")
@Getter
@Setter
@NoArgsConstructor
public class RoomParticipant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private DebateRoom room;
    
    @Column(name = "entered_at")
    private LocalDateTime enteredAt;
    
    @Column(name = "exited_at")
    private LocalDateTime exitedAt;
    
    @Column(name = "is_active")
    private boolean isActive = true;
    
    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;
    
    @Column(name = "room_id", insertable = false, updatable = false)
    private Long roomId;
} 