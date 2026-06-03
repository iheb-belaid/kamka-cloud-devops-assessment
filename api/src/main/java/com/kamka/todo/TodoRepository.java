package com.kamka.todo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoRepository extends JpaRepository<TodoItem, Long> {

    List<TodoItem> findAllByOrderByCreatedAtDesc();
}

