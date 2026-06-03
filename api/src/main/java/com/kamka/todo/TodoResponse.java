package com.kamka.todo;

import java.time.Instant;

public record TodoResponse(
        Long id,
        String title,
        boolean completed,
        Instant createdAt
) {
    static TodoResponse fromEntity(TodoItem entity) {
        return new TodoResponse(
                entity.getId(),
                entity.getTitle(),
                entity.isCompleted(),
                entity.getCreatedAt()
        );
    }
}

