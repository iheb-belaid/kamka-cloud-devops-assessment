const form = document.getElementById("todo-form");
const titleInput = document.getElementById("title");
const feedback = document.getElementById("feedback");
const refreshButton = document.getElementById("refresh-button");
const todoList = document.getElementById("todo-list");
const template = document.getElementById("todo-item-template");

async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const payload = await response.json();
            message = payload.message || payload.detail || message;
        } catch (error) {
            console.debug("Failed to parse API error payload", error);
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function setFeedback(message, isError = false) {
    feedback.textContent = message;
    feedback.classList.toggle("error", isError);
}

function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}

function renderTodos(todos) {
    todoList.innerHTML = "";

    if (!todos.length) {
        const emptyState = document.createElement("li");
        emptyState.className = "todo-item";
        emptyState.innerHTML = "<p class=\"todo-title\">No tasks yet. Add the first one.</p>";
        todoList.appendChild(emptyState);
        return;
    }

    todos.forEach((todo) => {
        const node = template.content.firstElementChild.cloneNode(true);
        node.dataset.id = todo.id;
        node.classList.toggle("completed", todo.completed);
        node.querySelector(".todo-title").textContent = todo.title;
        node.querySelector(".todo-meta").textContent = `Created ${formatDate(todo.createdAt)}`;

        const toggleButton = node.querySelector(".toggle-button");
        toggleButton.textContent = todo.completed ? "Undo" : "Complete";
        toggleButton.addEventListener("click", async () => {
            try {
                setFeedback("Updating task...");
                await apiRequest(`/api/todos/${todo.id}/complete`, { method: "PATCH" });
                await loadTodos();
                setFeedback("Task updated.");
            } catch (error) {
                setFeedback(error.message, true);
            }
        });

        node.querySelector(".delete-button").addEventListener("click", async () => {
            try {
                setFeedback("Deleting task...");
                await apiRequest(`/api/todos/${todo.id}`, { method: "DELETE" });
                await loadTodos();
                setFeedback("Task deleted.");
            } catch (error) {
                setFeedback(error.message, true);
            }
        });

        todoList.appendChild(node);
    });
}

async function loadTodos() {
    try {
        setFeedback("Loading tasks...");
        const todos = await apiRequest("/api/todos");
        renderTodos(todos);
        setFeedback(`Loaded ${todos.length} task${todos.length > 1 ? "s" : ""}.`);
    } catch (error) {
        setFeedback(error.message, true);
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();

    if (!title) {
        setFeedback("Please enter a task title.", true);
        return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
        setFeedback("Creating task...");
        await apiRequest("/api/todos", {
            method: "POST",
            body: JSON.stringify({ title })
        });
        titleInput.value = "";
        await loadTodos();
        setFeedback("Task created.");
    } catch (error) {
        setFeedback(error.message, true);
    } finally {
        submitButton.disabled = false;
    }
});

refreshButton.addEventListener("click", loadTodos);
loadTodos();

