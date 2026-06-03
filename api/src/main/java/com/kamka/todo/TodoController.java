package com.kamka.todo;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository todoRepository;

    public TodoController(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @GetMapping
    public List<TodoResponse> listTodos() {
        return todoRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(TodoResponse::fromEntity)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TodoResponse createTodo(@Valid @RequestBody TodoRequest request) {
        TodoItem todoItem = new TodoItem(request.title().trim());
        return TodoResponse.fromEntity(todoRepository.save(todoItem));
    }

    @PatchMapping("/{id}/complete")
    public TodoResponse toggleCompleted(@PathVariable Long id) {
        TodoItem todoItem = todoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Todo " + id + " not found"));
        todoItem.setCompleted(!todoItem.isCompleted());
        return TodoResponse.fromEntity(todoRepository.save(todoItem));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTodo(@PathVariable Long id) {
        if (!todoRepository.existsById(id)) {
            throw new EntityNotFoundException("Todo " + id + " not found");
        }
        todoRepository.deleteById(id);
    }
}

