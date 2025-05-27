document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const cancelUpdateBtn = document.getElementById('cancel-update');

    let isUpdating = false;

    function fetchTasks() {
        fetch('/api/tasks')
            .then(response => response.json())
            .then(tasks => {
                renderTasks(tasks);
            });
    }



function renderTasks(tasks) {
    taskList.innerHTML = '';

    const ul = document.createElement('ul');
    ul.className = 'task-list';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;

        // Priority badge class
        let priorityClass = '';
        if (task.priority === 'High') priorityClass = 'priority-high';
        else if (task.priority === 'Medium') priorityClass = 'priority-medium';
        else if (task.priority === 'Low') priorityClass = 'priority-low';

        li.innerHTML = `
            <div class="task-header">
                <strong>${task.title}</strong>
                <span class="priority-badge ${priorityClass}">${task.priority}</span>
            </div>
            <div class="task-desc">${task.description || ''}</div>
            <label class="completed-label">
                <input type="checkbox" class="complete-checkbox" ${task.completed ? 'checked' : ''} />
                Complete
            </label>
            <label class="not-complete-label">
                <input type="checkbox" class="not-complete-checkbox" ${!task.completed ? 'checked' : ''} />
                Not Complete
            </label>
            <div class="actions">
                <button class="edit" title="Edit Task"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="delete" title="Delete Task"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        if (task.completed) {
            li.classList.add('completed');
        }

        ul.appendChild(li);
    });

    taskList.appendChild(ul);

    // Add click event to toggle red highlight on not complete tasks
    ul.querySelectorAll('li.task-item').forEach(item => {
        const completeCheckbox = item.querySelector('input.complete-checkbox');
        const notCompleteCheckbox = item.querySelector('input.not-complete-checkbox');

        // Toggle red highlight on clicking task except on checkboxes or buttons
        item.addEventListener('click', (e) => {
            if (e.target === completeCheckbox || e.target === notCompleteCheckbox || e.target.closest('button')) return;

            if (!completeCheckbox.checked) {
                item.classList.toggle('highlight-red');
            }
        });

        // When complete checkbox changes
        completeCheckbox.addEventListener('change', () => {
            if (completeCheckbox.checked) {
                notCompleteCheckbox.checked = false;
                updateTaskCompletion(item.dataset.id, true);
                item.classList.remove('highlight-red');
            } else {
                notCompleteCheckbox.checked = true;
                updateTaskCompletion(item.dataset.id, false);
                item.classList.add('highlight-red');
            }
        });

        // When not complete checkbox changes
        notCompleteCheckbox.addEventListener('change', () => {
            if (notCompleteCheckbox.checked) {
                completeCheckbox.checked = false;
                updateTaskCompletion(item.dataset.id, false);
                item.classList.add('highlight-red');
            } else {
                completeCheckbox.checked = true;
                updateTaskCompletion(item.dataset.id, true);
                item.classList.remove('highlight-red');
            }
        });
    });
}

// Helper function to update task completion status in backend
function updateTaskCompletion(taskId, completed) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
    })
    .catch(err => alert(err.message));
}

    function clearForm() {
        taskForm.reset();
        document.getElementById('task-id').value = '';
        document.getElementById('completed').checked = false;
        cancelUpdateBtn.style.display = 'none';
        isUpdating = false;
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = document.getElementById('task-id').value;
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const priority = document.getElementById('priority').value;
        const completed = document.getElementById('completed').checked;

        if (!title) {
            alert('Task title is required.');
            return;
        }

        const taskData = { title, description, priority, completed };

        if (isUpdating && taskId) {
            // Update existing task
            fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update task');
                return response.json();
            })
            .then(() => {
                fetchTasks();
                clearForm();
            })
            .catch(err => alert(err.message));
        } else {
            // Create new task
            fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to create task');
                return response.json();
            })
            .then(() => {
                fetchTasks();
                clearForm();
            })
            .catch(err => alert(err.message));
        }
    });

taskList.addEventListener('click', (e) => {
    const li = e.target.closest('li.task-item');
    if (!li) return;
    const taskId = li.dataset.id;

    if (e.target.closest('button.edit')) {
        // Edit task
        fetch(`/api/tasks/${taskId}`)
            .then(response => {
                if (!response.ok) throw new Error('Task not found');
                return response.json();
            })
            .then(task => {
                document.getElementById('task-id').value = task.id;
                document.getElementById('title').value = task.title;
                document.getElementById('description').value = task.description;
                document.getElementById('priority').value = task.priority;
                document.getElementById('completed').checked = task.completed;
                cancelUpdateBtn.style.display = 'inline-block';
                isUpdating = true;
            })
            .catch(err => alert(err.message));
    } else if (e.target.closest('button.delete')) {
        // Delete task
        if (confirm('Are you sure you want to delete this task?')) {
            fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete task');
                return response.json();
            })
            .then(() => {
                fetchTasks();
            })
            .catch(err => alert(err.message));
        }
    } else if (e.target.classList.contains('complete-checkbox')) {
        // Toggle completed status
        const completed = e.target.checked;
        fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update task');
            return response.json();
        })
        .then(() => {
            fetchTasks();
        })
        .catch(err => alert(err.message));
    }
});

    cancelUpdateBtn.addEventListener('click', () => {
        clearForm();
    });

    // Initial load
    fetchTasks();
});
