// js/tasks.js

/**
 * Core function to create and add a task object to the state.
 * Handles saving, rendering, and notifications.
 * Trims detected project phrases from the task text before saving.
 * @param {string} rawTaskText - The raw text description entered by the user.
 * @param {string} projectId - The ID of the project this task belongs to.
 */
function createAndAddTask(rawTaskText, projectId) {
    const textTrimmed = rawTaskText.trim();
    const finalProjectId = projectId || DEFAULT_PROJECT_ID; // Ensure project ID is set

    if (!textTrimmed) {
        showNotification('Task description cannot be empty!', 'warning');
        return false; // Indicate failure
    }

    // Trim project phrase from the description before saving
    const finalTaskText = trimProjectPhrase(textTrimmed);

    const newTask = {
        id: generateUniqueId('task'),
        text: finalTaskText, // Use the trimmed text
        completed: false,
        pomodorosCompleted: 0,
        projectId: finalProjectId
    };

    tasks.push(newTask); // Add to the state array
    updateProjectLastUsed(finalProjectId); // Mark project as used
    animateItemId = newTask.id; // Flag for animation

    saveTasks(); // Save to local storage
    renderTasks(); // Update the UI
    populateTaskSuggestions(); // Update suggestions datalist

    showNotification('Task added!', 'success');
    return true; // Indicate success
}

/**
 * Handles adding a task from the main global input form.
 * Gathers data and calls the core createAndAddTask function.
 */
function addTask() {
    const text = newTaskInput.value; // Get raw text
    const projectId = newTaskProjectSelect.value || DEFAULT_PROJECT_ID;

    if (createAndAddTask(text, projectId)) {
        // Clear global input form on success
        newTaskInput.value = '';
        newTaskProjectSelect.value = DEFAULT_PROJECT_ID; // Reset dropdown
        updateQuickSelectActiveState('new-task-quick-projects', 'new-task-project'); // Update quick buttons
    }
}

/**
 * Handles adding a task from a project-specific input form.
 * Gathers data and calls the core createAndAddTask function.
 * @param {string} projectId - The ID of the project to add the task to.
 * @param {HTMLInputElement} inputElement - The specific input element for this project.
 */
function handleProjectAddTask(projectId, inputElement) {
    if (!inputElement) return;
    const text = inputElement.value; // Get raw text

    if (createAndAddTask(text, projectId)) {
        // Clear the specific project input field on success
        inputElement.value = '';
    }
}


/**
 * Toggles the completion status of a task.
 * Handles logging time if the active task is completed mid-session (running or paused).
 * @param {string} taskId - The ID of the task to toggle.
 */
function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return; // Task not found

    const task = tasks[taskIndex];
    task.completed = !task.completed; // Toggle status
    const isNowCompleted = task.completed;
    let shouldResetTimer = false;

    // If the *active* task is marked complete
    if (isNowCompleted && taskId === activeTaskIndex) {
        // Check if there's a focus start time recorded
        if (activeTaskFocusStartTime) {
            const endTime = Date.now();
            // If paused, adjust start time based on pause duration before calculating
            let startTime = activeTaskFocusStartTime;
            if (!isRunning && pauseStartTime) {
                 const pauseDuration = endTime - pauseStartTime;
                 // Avoid adjusting if pause just started (minimal duration)
                 if (pauseDuration > 100) { // Check if pause duration is significant
                    startTime += pauseDuration; // Adjust start time as if pause never happened
                 }
            }

            // Calculate actual focused duration
            const currentFocusDurationMs = endTime - startTime;
            // Only proceed if duration is positive (avoid logging 0 min)
            if (currentFocusDurationMs > 0) {
                const currentFocusDurationMinutes = Math.round(currentFocusDurationMs / (1000 * 60));

                 // Ensure duration is at least 1 minute for logging confirmation
                 if (currentFocusDurationMinutes > 0) {
                    // Get total time logged for this specific task today
                    const todayStr = getDateString(new Date());
                    const todaysLogs = logEntries[todayStr] || [];
                    const previousTimeForTask = todaysLogs
                        .filter(entry => entry.taskText === task.text) // Match by text
                        .reduce((sum, entry) => sum + entry.duration, 0);
                    const totalTimeToday = previousTimeForTask + currentFocusDurationMinutes;

                    // Prepare data for the confirmation modal
                    const logSummaryData = {
                        taskText: task.text,
                        currentDuration: currentFocusDurationMinutes,
                        totalDurationToday: totalTimeToday,
                        logData: { // Data to actually log if confirmed
                            timestamp: endTime,
                            // Use the original (pause-adjusted) startTime for logging
                            startTime: activeTaskFocusStartTime,
                            taskText: task.text,
                            duration: currentFocusDurationMinutes,
                            projectId: task.projectId
                        }
                    };
                    // Trigger confirmation modal regardless of whether timer is running or paused
                    confirmInterruptedFocusLog(logSummaryData);
                 } else {
                     // If duration rounds to 0, don't show confirmation, just reset timer
                     console.log("Focus duration too short to log, resetting timer.");
                 }
            }
            shouldResetTimer = true; // Reset timer after handling log confirmation

        } // End if (activeTaskFocusStartTime)

        // Clear active task state as it's now complete
        unfocusTask(false); // Call unfocusTask without showing notification again

    } // End if (isNowCompleted && taskId === activeTaskIndex)

    saveTasks(); // Save the updated task list
    renderTasks(); // Re-render the task list UI

    // Reset timer only after potential log confirmation is handled
    if (shouldResetTimer) {
        resetTimer(true); // Reset to work mode
    }

    // Show notification and confetti/GIF if completed
    const notificationText = isNowCompleted ? 'Task Complete! Woohoo! 🎉' : 'Task marked incomplete.';
    showNotification(notificationText, 'info');

    if (isNowCompleted) {
        // Trigger confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 },
                zIndex: 201 // Ensure confetti is above modals
            });
        }
        // Show celebration GIF
        if (celebrationGif) {
             let gifUrl = CELEBRATION_GIF_URL; // Default GIF
             // Use custom URLs if provided and valid
             if (settings.celebrationGifUrls && settings.celebrationGifUrls.length > 0) {
                 const urls = settings.celebrationGifUrls;
                 gifUrl = urls[Math.floor(Math.random() * urls.length)];
             }
             celebrationGif.src = gifUrl;
             celebrationGif.style.display = 'block';
             // Hide GIF after a duration
             setTimeout(() => {
                 celebrationGif.style.display = 'none';
                 celebrationGif.src = ''; // Clear src to stop animation/loading
             }, CELEBRATION_DURATION);
         }
    }
}

/**
 * Sets the specified task as the active focus task.
 * Initializes the focus start time.
 * **Only allows setting focus during 'work' mode.**
 * @param {string} taskId - The ID of the task to activate.
 */
function setActiveTask(taskId) {
    // *** ADDED: Prevent focusing during breaks ***
    if (currentMode !== 'work') {
        showNotification("Cannot focus on tasks during a break.", "warning");
        return;
    }

    const task = tasks.find(t => t.id === taskId);
    // Only allow setting active if task exists, is not completed, and is not already active
    if (task && !task.completed && taskId !== activeTaskIndex) {
        // If switching from another active task, reset its start time
        if (activeTaskIndex !== null) {
            activeTaskFocusStartTime = null;
        }
        activeTaskIndex = taskId;
        activeTaskFocusStartTime = Date.now(); // Set start time when task becomes active
        pauseStartTime = null; // Ensure pause time is cleared when switching focus

        showNotification(`Focusing on: ${task.text.substring(0, 30)}...`, 'info');
        renderTasks(); // Re-render to update active indicator and buttons
        updateFocusedTaskDisplay(); // Update timer display
    } else if (taskId === activeTaskIndex) {
        // If clicking focus on the already active task, treat it as unfocus
        unfocusTask();
    } else {
        console.warn("Attempted to focus on invalid, completed, or already active task:", taskId);
    }
}

/**
 * Removes focus from the currently active task.
 * Clears the focus start time.
 * @param {boolean} [notify=true] - Whether to show a notification. Defaults to true.
 */
function unfocusTask(notify = true) {
    if (activeTaskIndex !== null) {
        if (notify) {
            const task = tasks.find(t => t.id === activeTaskIndex);
            const taskText = task ? task.text.substring(0, 30) + '...' : 'task';
            showNotification(`Focus removed from ${taskText}`, 'info');
        }
        activeTaskIndex = null;
        activeTaskFocusStartTime = null; // Also clear start time
        pauseStartTime = null; // Clear pause time when unfocusing
        renderTasks(); // Re-render task list to update icons/highlight
        updateFocusedTaskDisplay(); // Clear focus display next to timer
    }
}


/**
 * Allows inline editing of a task's text.
 * Replaces the task text span with an input field.
 * @param {string} taskId - The ID of the task to edit.
 * @param {HTMLElement} taskElement - The HTML element of the task.
 */
function editTask(taskId, taskElement) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    // Prevent editing if completed or already editing
    if (task.completed || taskElement.querySelector('input[type="text"].task-edit-input')) return;

    const leftSection = taskElement.querySelector('.flex.items-center.space-x-3');
    const taskTextSpan = leftSection.querySelector('.task-text-span');
    if (!taskTextSpan) return; // Should not happen

    const originalText = task.text;

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'task-edit-input flex-grow border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm p-1 text-sm mx-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400'; // Added specific class

    // Function to save changes and revert UI
    const saveChanges = () => {
        const newTextRaw = input.value.trim();
        // Save only if text changed and is not empty
        if (newTextRaw && newTextRaw !== originalText) {
            // Also trim project phrase on save, in case it was added during edit
            const newTextFinal = trimProjectPhrase(newTextRaw);
            tasks[taskIndex].text = newTextFinal;
            saveTasks();
            taskTextSpan.textContent = newTextFinal; // Update the span text
            showNotification('Task updated!', 'success');
            populateTaskSuggestions(); // Update suggestions if name changed
            // If this was the active task, update the timer display too
            if (taskId === activeTaskIndex) {
                updateFocusedTaskDisplay();
            }
        }
        // Replace input with span, even if no changes were made
        if (leftSection.contains(input)) {
            leftSection.replaceChild(taskTextSpan, input);
        }
        // Re-attach click listener to the span
        taskTextSpan.addEventListener('click', () => editTask(taskId, taskElement));
        taskTextSpan.title = "Click to edit"; // Restore tooltip
    };

    // Temporarily remove click listener from span
    taskTextSpan.removeEventListener('click', () => editTask(taskId, taskElement));
    taskTextSpan.title = ""; // Remove tooltip while editing

    // Replace span with input
    leftSection.replaceChild(input, taskTextSpan);
    input.focus();
    input.select(); // Select text for easy replacement

    // Event listeners for the input field
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if inside one
            saveChanges();
        } else if (e.key === 'Escape') {
            // Revert without saving
            if (leftSection.contains(input)) {
                leftSection.replaceChild(taskTextSpan, input);
            }
            taskTextSpan.addEventListener('click', () => editTask(taskId, taskElement));
            taskTextSpan.title = "Click to edit";
        }
    });
    // Save changes when input loses focus (blur)
    input.addEventListener('blur', saveChanges);
}


/**
 * Handles the click event for the delete task button. Shows confirmation modal.
 * @param {string} taskId - The ID of the task to delete.
 */
function handleTaskDeleteClick(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return; // Task not found

    const task = tasks[taskIndex];
    const confirmationMsg = `Delete task "${task.text.substring(0, 40)}"?`;

    showConfirmationModal(confirmationMsg, () => deleteTaskAction(taskId));
}

/**
 * Performs the actual deletion of a task after confirmation.
 * @param {string} taskId - The ID of the task to delete.
 */
function deleteTaskAction(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return; // Task not found

    const taskText = tasks[taskIndex].text; // Get text for notification
    tasks.splice(taskIndex, 1); // Remove task from array

    // If the deleted task was the active one, reset active state and timer
    if (taskId === activeTaskIndex) {
        unfocusTask(false); // Unfocus without notification
        // Check if timer needs reset based on mode (e.g., don't reset during break)
        // No need to reset timer here, unfocus is enough. Let user start new work session.
        // if (currentMode === 'work') {
        //      resetTimer(true); // Reset timer to work mode
        // }
    }

    saveTasks(); // Save the updated task list
    renderTasks(); // Re-render the UI
    populateTaskSuggestions(); // Update suggestions datalist

    showNotification(`Task "${taskText.substring(0, 20)}..." deleted!`, 'warning');
}

/**
 * Handles the click event for the "Mark Done" button in the timer section.
 * Simply triggers the toggleTaskComplete function for the currently active task.
 */
function handleMarkDoneClick() {
    if (activeTaskIndex !== null) {
        toggleTaskComplete(activeTaskIndex);
    } else {
        console.warn("Mark Done clicked but no active task found.");
        showNotification("No task is currently focused.", "warning");
    }
}


// --- Task Drag and Drop Handlers ---
/** Handles start of drag */
function handleTaskDragStart(event) {
    draggedTaskId = event.target.dataset.taskId;
    event.dataTransfer.setData('text/plain', draggedTaskId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => event.target.classList.add('opacity-50'), 0);
}
/** Handles end of drag */
function handleTaskDragEnd(event) {
    event.target.classList.remove('opacity-50');
    draggedTaskId = null;
    document.querySelectorAll('.drop-zone-active').forEach(el => el.classList.remove('drop-zone-active'));
}
/** Handles drag over */
function handleTaskDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}
/** Handles drag enter */
function handleTaskDragEnter(event) {
    const dropZone = event.target.closest('.project-group');
    if (dropZone && dropZone.dataset.projectId) {
        dropZone.classList.add('drop-zone-active');
    }
}
/** Handles drag leave */
function handleTaskDragLeave(event) {
    const dropZone = event.target.closest('.project-group');
    if (dropZone && dropZone.dataset.projectId) {
        if (!dropZone.contains(event.relatedTarget)) {
            dropZone.classList.remove('drop-zone-active');
        }
    } else if (!event.target.closest('.project-group') && event.target !== dropZone) {
         document.querySelectorAll('.drop-zone-active').forEach(el => el.classList.remove('drop-zone-active'));
    }
}
/** Handles drop */
function handleTaskDrop(event) {
    event.preventDefault();
    const dropZone = event.target.closest('.project-group');
    if (dropZone && draggedTaskId) {
        const targetProjectId = dropZone.dataset.projectId;
        const taskIndex = tasks.findIndex(t => t.id === draggedTaskId);
        if (taskIndex !== -1 && tasks[taskIndex].projectId !== targetProjectId) {
            tasks[taskIndex].projectId = targetProjectId;
            updateProjectLastUsed(targetProjectId);
            saveTasks();
            renderTasks();
            const targetProjectName = projects.find(p => p.id === targetProjectId)?.name || 'Inbox';
            showNotification(`Task moved to "${targetProjectName}"!`, 'success');
        }
        dropZone.classList.remove('drop-zone-active');
    }
    draggedTaskId = null;
}
