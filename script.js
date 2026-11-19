
// ==========================================
// SMART TODO - APPLICATION LOGIC
// ==========================================

// DOM Elements
const taskList = document.getElementById("taskList");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");

const closeModalBtn = document.getElementById("closeModalBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");

const taskForm = document.getElementById("taskForm");

const modalTitle = document.getElementById("modalTitle");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

const navItems = document.querySelectorAll(".nav-item");


// ==========================================
// APPLICATION STATE
// ==========================================

const STORAGE_KEY = "smart-todo-tasks";
const CATEGORIES = ["Personal", "Work", "Study"];
const PRIORITIES = ["Low", "Medium", "High"];

let tasks = [];

function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTask(task) {
    if (!task || typeof task !== "object" || typeof task.title !== "string") {
        return null;
    }

    return {
        id: typeof task.id === "string" && task.id
            ? task.id
            : createTaskId(),
        title: task.title.trim(),
        description: typeof task.description === "string" ? task.description : "",
        category: CATEGORIES.includes(task.category) ? task.category : "Personal",
        priority: PRIORITIES.includes(task.priority) ? task.priority : "Medium",
        dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
        completed: task.completed === true,
        createdAt: typeof task.createdAt === "string"
            ? task.createdAt
            : new Date().toISOString()
    };
}

try {
    const savedTasks = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    );

    tasks = Array.isArray(savedTasks)
        ? savedTasks.map(normalizeTask).filter(task => task && task.title)
        : [];
} catch (error) {
    console.error("Unable to load saved tasks:", error);
}

let currentFilter = "all";
let editingTaskId = null;
let previouslyFocusedElement = null;


// ==========================================
// SAVE TASKS TO LOCAL STORAGE
// ==========================================

function saveTasks() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Unable to save tasks in your browser.");
    }
}


// ==========================================
// ESCAPE HTML CONTENT
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );
}


// ==========================================
// OPEN TASK MODAL
// ==========================================

function openModal() {

    previouslyFocusedElement = document.activeElement;
    taskModal.classList.add("active");
    taskModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    taskTitle.focus();

}


// ==========================================
// CLOSE TASK MODAL
// ==========================================

function closeModal() {

    taskModal.classList.remove("active");
    taskModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    taskForm.reset();

    editingTaskId = null;

    modalTitle.textContent = "Add New Task";

    saveTaskBtn.textContent = "Save Task";

    if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
    }

}


// ==========================================
// ADD / EDIT TASK
// ==========================================

taskForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = taskTitle.value.trim();

    const description = taskDescription.value.trim();

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    if (editingTaskId !== null) {

        // Update existing task

        tasks = tasks.map(task => {

            if (task.id === editingTaskId) {

                return {
                    ...task,
                    title,
                    description,
                    category: taskCategory.value,
                    priority: taskPriority.value,
                    dueDate: taskDate.value
                };

            }

            return task;

        });

    } else {

        // Create new task

        const newTask = {

            id: createTaskId(),

            title: title,

            description: description,

            category: taskCategory.value,

            priority: taskPriority.value,

            dueDate: taskDate.value,

            completed: false,

            createdAt: new Date().toISOString()

        };

        tasks.unshift(newTask);

    }

    saveTasks();

    renderTasks();

    updateStatistics();

    closeModal();

});


// ==========================================
// DISPLAY TASKS
// ==========================================

function renderTasks() {

    const searchText = searchInput.value
        .trim()
        .toLowerCase();

    const selectedCategory = categoryFilter.value;

    let filteredTasks = tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            task.description.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            task.category === selectedCategory;

        const matchesStatus =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesCategory && matchesStatus;

    });


    if (filteredTasks.length === 0) {
        const emptyTitle = tasks.length === 0 ? "No tasks yet!" : "No tasks found!";
        const emptyMessage = tasks.length === 0
            ? "Click the Add Task button to create your first task."
            : "Try adding a new task or changing your filters.";

        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>${emptyTitle}</h3>
                <p>${emptyMessage}</p>
            </div>
        `;

        return;

    }


    taskList.innerHTML = filteredTasks.map(task => {

        const safeTitle = escapeHTML(task.title);
        const safeDescription = escapeHTML(task.description);
        const safeCategory = escapeHTML(task.category);
        const safePriority = escapeHTML(task.priority);
        const safeDate = escapeHTML(task.dueDate);

        return `

            <article class="task-card ${task.completed ? "completed" : ""}">

                <div class="task-main">

                    <button
                        class="complete-btn ${task.completed ? "checked" : ""}"
                        data-action="toggle"
                        data-id="${escapeHTML(task.id)}"
                        aria-label="${task.completed ? "Mark pending" : "Mark completed"}"
                        title="${task.completed ? "Mark pending" : "Mark completed"}"
                    >
                        ${task.completed ? "✓" : ""}
                    </button>

                    <div class="task-details">

                        <h3>${safeTitle}</h3>

                        ${safeDescription
                            ? `<p>${safeDescription}</p>`
                            : ""
                        }

                        <div class="task-meta">

                            <span class="category-tag">
                                ${safeCategory}
                            </span>

                            <span class="priority-tag ${safePriority.toLowerCase()}">
                                ${safePriority} Priority
                            </span>

                            ${safeDate
                                ? `<span class="due-date">📅 ${safeDate}</span>`
                                : ""
                            }

                        </div>

                    </div>

                </div>

                <div class="task-actions">

                    <button
                        data-action="edit"
                        data-id="${escapeHTML(task.id)}"
                        title="Edit task"
                        aria-label="Edit task"
                    >
                        ✏️
                    </button>

                    <button
                        data-action="delete"
                        data-id="${escapeHTML(task.id)}"
                        title="Delete task"
                        aria-label="Delete task"
                    >
                        🗑️
                    </button>

                </div>

            </article>

        `;

    }).join("");

}


// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    editingTaskId = id;

    taskTitle.value = task.title;

    taskDescription.value = task.description || "";

    taskCategory.value = task.category;

    taskPriority.value = task.priority;

    taskDate.value = task.dueDate || "";

    modalTitle.textContent = "Edit Task";

    saveTaskBtn.textContent = "Update Task";

    openModal();

}


// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();

    renderTasks();

    updateStatistics();

}


// ==========================================
// TOGGLE TASK COMPLETION
// ==========================================

function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });

    saveTasks();

    renderTasks();

    updateStatistics();

}


// ==========================================
// TASK BUTTON EVENT DELEGATION
// ==========================================

taskList.addEventListener("click", function (event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const action = button.dataset.action;

    if (action === "edit") {
        editTask(id);
    }

    if (action === "delete") {
        deleteTask(id);
    }

    if (action === "toggle") {
        toggleTask(id);
    }

});


// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    totalTasks.textContent = total;

    pendingTasks.textContent = pending;

    completedTasks.textContent = completed;

}


// ==========================================
// NAVIGATION FILTERS
// ==========================================

navItems.forEach(button => {

    button.addEventListener("click", function () {

        navItems.forEach(item => {
            item.classList.remove("active");
            item.setAttribute("aria-pressed", "false");
        });

        this.classList.add("active");
        this.setAttribute("aria-pressed", "true");

        currentFilter = this.dataset.filter;

        renderTasks();

    });

});


// ==========================================
// SEARCH TASKS
// ==========================================

searchInput.addEventListener("input", renderTasks);


// ==========================================
// CATEGORY FILTER
// ==========================================

categoryFilter.addEventListener("change", renderTasks);


// ==========================================
// MODAL EVENTS
// ==========================================

addTaskBtn.addEventListener("click", function () {

    editingTaskId = null;

    taskForm.reset();

    modalTitle.textContent = "Add New Task";

    saveTaskBtn.textContent = "Save Task";

    openModal();

});


closeModalBtn.addEventListener("click", closeModal);

cancelTaskBtn.addEventListener("click", closeModal);


taskModal.addEventListener("click", function (event) {

    if (event.target === taskModal) {
        closeModal();
    }

});


document.addEventListener("keydown", function (event) {

    if (!taskModal.classList.contains("active")) return;

    if (event.key === "Escape") {
        closeModal();
        return;
    }

    if (event.key === "Tab") {
        const focusableElements = [...taskModal.querySelectorAll(
            "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
        )];
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }

    }

});


// ==========================================
// INITIALIZE APPLICATION
// ==========================================

renderTasks();

updateStatistics();
