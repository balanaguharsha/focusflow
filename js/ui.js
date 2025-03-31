// js/ui.js

// --- UI Constants ---
const SVG_STRINGS = {
    play: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    pencil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="m15 5 4 4"/></svg>`,
    trash2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    crosshair: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    xCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M20 6 9 17l-5-5"/></svg>`, // Checkmark icon
    plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` // Plus icon
};
const PROGRESS_RING_RADIUS = 42;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;
const MAX_QUICK_PROJECTS = 4;
const CELEBRATION_GIF_URL = 'https://media1.tenor.com/m/RdYowW9KtNMAAAAd/dancing-happy-dance.gif';
const CELEBRATION_DURATION = 4000; // milliseconds

// --- UI Update Functions ---

/**
 * Updates the timer display text, progress ring, and elapsed time display.
 * Also updates the document title.
 */
function updateTimerDisplayAndProgress() {
    if (!timerDisplay || !progressRing || !timerElapsedDisplay) return;

    timerDisplay.textContent = formatTime(timeRemaining);
    const progress = Math.max(0, (totalDurationSeconds - timeRemaining) / totalDurationSeconds);
    const offset = PROGRESS_RING_CIRCUMFERENCE * (1 - progress);
    progressRing.style.strokeDashoffset = offset;

    // Update elapsed time display visibility and content based on settings
    if (settings.showElapsedTime) {
        const elapsedSeconds = totalDurationSeconds - timeRemaining;
        timerElapsedDisplay.textContent = `${formatTime(elapsedSeconds)} elapsed`;
        timerElapsedDisplay.classList.remove('hidden');
    } else {
        timerElapsedDisplay.classList.add('hidden');
    }

    // Update document title
    document.title = `${formatTime(timeRemaining)} - ${timerModeDisplay.textContent} - FocusFlow`;
}

/**
 * Updates the display showing the currently focused task next to the timer.
 * Also controls the visibility of the "Mark Done" button.
 */
function updateFocusedTaskDisplay() {
    const isActiveTask = activeTaskIndex !== null;
    const activeTask = isActiveTask ? tasks.find(t => t.id === activeTaskIndex) : null;

    // Update text display
    if (focusedTaskDisplay) {
        // Only show focus text during work mode
        if (activeTask && currentMode === 'work') {
            const taskText = activeTask.text;
            // Truncate long task names for display
            const truncatedText = taskText.length > 30 ? taskText.substring(0, 27) + '...' : taskText;
            focusedTaskDisplay.textContent = `| Focusing on: ${truncatedText}`;
            focusedTaskDisplay.title = `Focusing on: ${taskText}`; // Full text on hover
        } else {
            focusedTaskDisplay.textContent = '';
            focusedTaskDisplay.title = '';
        }
    }

    // Update "Mark Done" button visibility
    if (markDoneButton) {
        // Show only if a task is actively focused AND it's work mode
        if (isActiveTask && activeTask && currentMode === 'work') {
            markDoneButton.classList.remove('hidden');
        } else {
            markDoneButton.classList.add('hidden');
        }
    }
}


/**
 * Applies or removes the 'dark' class to the HTML element based on the setting.
 * Also triggers a re-render of the log summary chart if it's visible.
 * @param {boolean} isDark - Whether dark mode should be enabled.
 */
function applyDarkMode(isDark) {
    if (isDark) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
    // Update chart colors if the chart exists and the log view is visible
    if (pieChartInstance && viewLog && !viewLog.classList.contains('view-hidden')) {
        renderLogSummary(displayedLogDate); // Re-render summary to update chart colors
    }
    // Update aggregated chart colors if visible
    if (aggregatedChartInstance && aggregatedSummaryModal && aggregatedSummaryModal.style.display === 'flex') {
         // Regenerate summary to update chart with new theme colors
         generateAndRenderAggregatedSummary();
    }
}

/**
 * Switches the visible view (Timer, Log, or Reminders).
 * @param {'timer' | 'log' | 'reminders'} viewId - The ID of the view to show.
 */
function showView(viewId) {
    // *** MODIFIED: Added viewReminders to the list ***
    const views = [viewTimer, viewLog, viewReminders];
    views.forEach(view => {
        if (!view) return; // Skip if element not found
        const targetViewId = `view-${viewId}`;
        if (view.id === targetViewId) {
            // Show the target view
            view.classList.remove('view-hidden', 'animate-fade-out');
            view.classList.add('view-visible', 'animate-fade-in');
        } else if (view.classList.contains('view-visible')) {
            // Hide other visible views
            view.classList.add('animate-fade-out');
            view.classList.remove('animate-fade-in');
            // Set to hidden after animation
            setTimeout(() => {
                view.classList.add('view-hidden');
                view.classList.remove('view-visible');
            }, 300); // Match animation duration
        }
    });

    // Update tab button active state
    if (tabTimer) tabTimer.classList.toggle('active', viewId === 'timer');
    if (tabLog) tabLog.classList.toggle('active', viewId === 'log');
    if (tabReminders) tabReminders.classList.toggle('active', viewId === 'reminders'); // *** ADDED ***

    // Actions specific to showing certain views
    if (viewId === 'log') {
        showLogDate(displayedLogDate); // Refresh log display for the current date
        populateTaskSuggestions(); // Update task suggestions for manual entry
        populateProjectDropdown(manualLogProjectSelect); // Update project dropdown
        toggleManualLogForm(false); // Ensure manual form is hidden initially
        updateTimeSuggestionButtons('manual'); // Update quick time add buttons for original form
        renderQuickSelectButtons('manual-log-quick-projects', 'manual-log-project'); // Update quick project buttons
        // Clear NLP suggestions when switching to log view
        renderTimeSuggestions([], 'manual', -1); // Pass -1 to ensure no highlight
    } else if (viewId === 'reminders') { // *** ADDED ***
        renderReminders(); // Render the list of reminders
    }
}


// --- Rendering Functions ---

/**
 * Populates a select dropdown with project options.
 * @param {HTMLSelectElement} selectElement - The select element to populate.
 */
function populateProjectDropdown(selectElement) {
    if (!selectElement) return;
    const currentValue = selectElement.value; // Preserve current selection if possible
    selectElement.innerHTML = ''; // Clear existing options

    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        selectElement.appendChild(option);
    });

    // Try to restore previous selection or default to Inbox
    if (projects.some(p => p.id === currentValue)) {
        selectElement.value = currentValue;
    } else {
        selectElement.value = DEFAULT_PROJECT_ID;
    }
}

/**
 * Renders the list of projects in the 'Manage Projects' section.
 */
function renderProjectsUI() {
    if (!projectListDiv || !newTaskProjectSelect || !manualLogProjectSelect) return;

    // Populate dropdowns first
    populateProjectDropdown(newTaskProjectSelect);
    populateProjectDropdown(manualLogProjectSelect);
    // Also populate the dropdown in the inactivity modal if it exists
    if (inactivityManualLogProjectSelect) {
        populateProjectDropdown(inactivityManualLogProjectSelect);
    }
    // Populate dropdown in edit log modal
    if (editLogProjectSelect) {
        populateProjectDropdown(editLogProjectSelect);
    }

    projectListDiv.innerHTML = ''; // Clear current list

    if (projects.length > 1) { // Only render list if more than just Inbox exists
        projects.forEach(project => {
            // Skip rendering the default Inbox project in the editable list
            if (project.id === DEFAULT_PROJECT_ID) return;

            const item = document.createElement('div');
            item.className = 'project-list-item';
            // Add animation class if this item was just added/edited
            if (project.id === animateItemId) {
                item.classList.add('animate-project-entry');
            }

            const projectColor = project.color || DEFAULT_PROJECT_COLOR;

            // Actions buttons (Edit/Delete) - only for non-default projects
            const actionsHtml = `
                <div class="project-actions">
                    <button class="project-edit-btn p-1" data-project-id="${project.id}" title="Edit Project">${SVG_STRINGS.pencil}</button>
                    <button class="project-delete-btn p-1" data-project-id="${project.id}" title="Delete Project">${SVG_STRINGS.trash2}</button>
                </div>
            `;

            item.innerHTML = `
                <span class="flex items-center flex-grow min-w-0 mr-2">
                    <span class="project-color-swatch" style="background-color: ${projectColor};"></span>
                    <span class="truncate" title="${project.name}">${project.name}</span>
                </span>
                ${actionsHtml}
            `;

            // Add event listeners for actions
            const editBtn = item.querySelector('.project-edit-btn');
            const deleteBtn = item.querySelector('.project-delete-btn');
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditProjectModal(project.id); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteProject(project.id); }); // Uses confirmation function

            projectListDiv.appendChild(item);
        });
    } else {
        projectListDiv.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400 italic">Add more projects here...</p>';
    }

    // Update related UI elements
    populateTaskSuggestions(); // Update datalist based on current tasks/projects
    renderTasks(); // Re-render tasks as project names/colors might have changed
    renderQuickSelectButtons('new-task-quick-projects', 'new-task-project');
    renderQuickSelectButtons('manual-log-quick-projects', 'manual-log-project');
    renderQuickSelectButtons('inactivity-quick-projects', 'inactivity-manual-log-project'); // Added for inactivity modal

    // Re-render log view if it's currently visible
    if (viewLog && !viewLog.classList.contains('view-hidden')) {
        renderLogRecords(displayedLogDate);
        renderLogSummary(displayedLogDate);
    }

    animateItemId = null; // Reset animation trigger
}

/**
 * Renders the task list, ensuring all projects are shown, with a global completed tasks section.
 */
function renderTasks() {
    if (!taskListContainer || !taskListEmptyMsg) return;

    taskListContainer.innerHTML = ''; // Clear existing tasks
    let projectGroupsRendered = false; // Track if any project group div is added
    const allCompletedTasks = []; // Array to collect all completed tasks

    // --- Render Project Groups (Incomplete Tasks + Add Form) ---
    projects.forEach(project => {
        projectGroupsRendered = true; // Mark that we are rendering at least one project group

        const projectTasks = tasks.filter(task => task.projectId === project.id);
        const incompleteTasks = projectTasks.filter(task => !task.completed);
        const completedTasksInProject = projectTasks.filter(task => task.completed);

        // Collect completed tasks for later rendering
        allCompletedTasks.push(...completedTasksInProject);

        // Create the main container for the project group
        const groupContainer = document.createElement('div');
        groupContainer.className = 'project-group';
        groupContainer.dataset.projectId = project.id; // For drag & drop

        // Project Header
        const header = document.createElement('h3');
        header.className = 'project-header';
        header.textContent = project.name;
        groupContainer.appendChild(header);

        // Container for tasks and the add form within this group
        const tasksInGroupContainer = document.createElement('div');
        tasksInGroupContainer.className = 'space-y-2'; // Spacing between tasks/sections

        // Render Incomplete Tasks for this project
        if (incompleteTasks.length > 0) {
            incompleteTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                if (task.id === animateItemId) { // Apply animation if needed
                    taskElement.classList.add('animate-task-entry');
                }
                tasksInGroupContainer.appendChild(taskElement);
            });
        } else {
             // Message if no incomplete tasks in this project
             const noTasksMsg = document.createElement('p');
             noTasksMsg.className = 'text-sm text-gray-500 dark:text-gray-400 italic px-3 pb-2';
             noTasksMsg.textContent = 'No active tasks in this project yet!';
             tasksInGroupContainer.appendChild(noTasksMsg);
        }

        // --- Add Project-Specific Add Task Form ---
        const addForm = document.createElement('div');
        addForm.className = 'project-add-task-form';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Add task to this project...';
        input.className = 'project-add-task-input';
        input.id = `project-add-task-input-${project.id}`; // Unique ID

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'project-add-task-button';
        button.innerHTML = SVG_STRINGS.plus;
        button.title = `Add task to ${project.name}`;

        addForm.appendChild(input);
        addForm.appendChild(button);
        tasksInGroupContainer.appendChild(addForm); // Add form after incomplete tasks

        // Add event listeners for the project-specific form
        button.addEventListener('click', () => handleProjectAddTask(project.id, input));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent potential form submission
                handleProjectAddTask(project.id, input);
            }
        });
        // --- End Project-Specific Add Task Form ---

        // Append the tasks and form container to the main group container
        groupContainer.appendChild(tasksInGroupContainer);

        // Add drag & drop listeners to the group container
        groupContainer.addEventListener('dragover', handleTaskDragOver);
        groupContainer.addEventListener('dragenter', handleTaskDragEnter);
        groupContainer.addEventListener('dragleave', handleTaskDragLeave);
        groupContainer.addEventListener('drop', handleTaskDrop);

        // Append the fully formed project group to the main task list container
        taskListContainer.appendChild(groupContainer);
    });

    // --- Render Global Completed Tasks Section ---
    if (allCompletedTasks.length > 0) {
        const detailsElement = document.createElement('details');
        detailsElement.className = 'global-completed-tasks-section'; // Use new class for styling

        const summaryElement = document.createElement('summary');
        summaryElement.className = 'global-completed-tasks-summary'; // Use new class
        summaryElement.innerHTML = `
            <span class="summary-icon">${SVG_STRINGS.chevronRight}</span>
            Completed Tasks (${allCompletedTasks.length})
        `;
        detailsElement.appendChild(summaryElement);

        const completedListContainer = document.createElement('div');
        completedListContainer.className = 'global-completed-tasks-list space-y-4'; // Use new class + spacing

        // Group completed tasks by project ID
        const completedByProject = allCompletedTasks.reduce((acc, task) => {
            const projectId = task.projectId || DEFAULT_PROJECT_ID;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(task);
            return acc;
        }, {});

        // Render completed tasks grouped by project
        // Sort projects within completed list (optional, e.g., alphabetically)
        const sortedProjectIds = Object.keys(completedByProject).sort((a, b) => {
            const projA = projects.find(p => p.id === a)?.name || 'zzz'; // Put Inbox/Other last
            const projB = projects.find(p => p.id === b)?.name || 'zzz';
            return projA.localeCompare(projB);
        });

        sortedProjectIds.forEach(projectId => {
            const projectCompletedTasks = completedByProject[projectId];
            if (projectCompletedTasks && projectCompletedTasks.length > 0) {
                const project = projects.find(p => p.id === projectId);
                const projectName = project ? project.name : 'Inbox'; // Default to Inbox if project deleted

                // Add project sub-header
                const projectHeader = document.createElement('h4');
                projectHeader.className = 'completed-project-header';
                projectHeader.textContent = projectName;
                completedListContainer.appendChild(projectHeader);

                // Add container for tasks within this project
                const projectTasksDiv = document.createElement('div');
                projectTasksDiv.className = 'space-y-2 pl-2'; // Indent tasks slightly

                // Sort completed tasks within project (e.g., by completion time if available, or text)
                projectCompletedTasks.sort((a, b) => (a.completedTimestamp || 0) - (b.completedTimestamp || 0) || a.text.localeCompare(b.text));

                projectCompletedTasks.forEach(task => {
                    const taskElement = createTaskElement(task);
                    projectTasksDiv.appendChild(taskElement);
                });
                completedListContainer.appendChild(projectTasksDiv);
            }
        });


        detailsElement.appendChild(completedListContainer);
        taskListContainer.appendChild(detailsElement); // Append global section at the end

        // Add event listener to toggle chevron icon for the global section
        detailsElement.addEventListener('toggle', (event) => {
            const iconSpan = summaryElement.querySelector('.summary-icon');
            if (iconSpan) {
                iconSpan.innerHTML = event.target.open ? SVG_STRINGS.chevronDown : SVG_STRINGS.chevronRight;
            }
        });
    }

    // Show or hide the main empty message only if NO project groups were rendered at all
    taskListEmptyMsg.style.display = projectGroupsRendered ? 'none' : 'block';
    if (!projectGroupsRendered) {
        taskListEmptyMsg.textContent = 'No projects found. Add a project and tasks!';
        taskListContainer.appendChild(taskListEmptyMsg); // Ensure it's appended
    }

    updateFocusedTaskDisplay(); // Update the timer's focused task display
    animateItemId = null; // Reset animation trigger
}


/**
 * Creates the HTML element for a single task. Includes project chip for completed tasks.
 * Handles showing/hiding focus buttons based on current timer mode.
 * @param {object} task - The task object.
 * @returns {HTMLElement} - The task element.
 */
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    const isActive = task.id === activeTaskIndex;

    const baseClasses = `task-item flex items-center justify-between p-3 rounded-lg shadow-sm border transition-all duration-200`;
    const completedClasses = task.completed ? 'completed-task-item opacity-70 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    const activeClasses = isActive && currentMode === 'work' ? 'active-task' : ''; // Only highlight active task during work mode

    taskElement.className = `${baseClasses} ${completedClasses} ${activeClasses}`;
    taskElement.dataset.taskId = task.id;
    taskElement.draggable = !task.completed; // Only allow dragging incomplete tasks

    if (!task.completed) {
        taskElement.addEventListener('dragstart', handleTaskDragStart);
        taskElement.addEventListener('dragend', handleTaskDragEnd);
    }

    // --- Left Section (Checkbox, Text, Pomodoros, Project Chip) ---
    const leftSection = document.createElement('div');
    leftSection.className = 'flex items-center space-x-3 flex-grow mr-2 min-w-0';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = `h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-600 dark:border-gray-500 dark:checked:bg-indigo-500 dark:checked:border-indigo-500 cursor-pointer flex-shrink-0`;
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

    const taskText = document.createElement('span');
    taskText.textContent = task.text;
    const textBaseClasses = `task-text-span flex-grow break-words`;
    const textCompletedClass = task.completed ? 'completed text-gray-600 dark:text-gray-400 mr-2' : 'text-gray-800 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400';
    taskText.className = `${textBaseClasses} ${textCompletedClass}`;
    if (!task.completed) {
        taskText.addEventListener('click', () => editTask(task.id, taskElement));
        taskText.title = "Click to edit";
    }

    leftSection.appendChild(checkbox);
    leftSection.appendChild(taskText);

    // Always show project chip for completed tasks in the global list
    if (task.completed) {
        const project = projects.find(p => p.id === task.projectId);
        const projectName = project ? project.name : 'Inbox';
        const projectColor = project ? project.color : DEFAULT_PROJECT_COLOR;
        const chip = document.createElement('span');
        chip.className = 'task-project-chip flex-shrink-0';
        chip.textContent = projectName;
        chip.style.backgroundColor = projectColor;
        chip.style.color = isColorLight(projectColor) ? '#1f2937' : '#ffffff';
        chip.style.borderColor = isColorLight(projectColor) ? '#d1d5db' : '#4b5563';
        leftSection.appendChild(chip);
    }

    // Show pomodoros only for incomplete tasks
    if (!task.completed && (task.pomodorosCompleted || 0) > 0) {
        const pomodoroDisplay = document.createElement('span');
        pomodoroDisplay.className = 'task-pomodoros flex-shrink-0';
        pomodoroDisplay.textContent = '🍅'.repeat(task.pomodorosCompleted || 0);
        pomodoroDisplay.title = `${task.pomodorosCompleted || 0} Pomodoros completed`;
        leftSection.appendChild(pomodoroDisplay);
    }

    // --- Right Section (Actions: Focus/Unfocus, Edit, Delete) ---
    const rightSection = document.createElement('div');
    rightSection.className = 'flex-shrink-0 flex items-center space-x-1';

    // Focus/Unfocus Button (Show only if task is not complete)
    if (!task.completed) {
        const focusUnfocusButton = document.createElement('button');
        focusUnfocusButton.className = 'p-1 rounded focus:outline-none focus:ring-2'; // Base classes

        if (isActive && currentMode === 'work') { // Task is currently active AND it's work mode (show unfocus)
            focusUnfocusButton.innerHTML = SVG_STRINGS.xCircle;
            focusUnfocusButton.classList.add('text-red-500', 'dark:text-red-400', 'hover:text-red-700', 'dark:hover:text-red-300', 'focus:ring-red-300', 'dark:focus:ring-red-500');
            focusUnfocusButton.title = "Remove focus from this task";
            focusUnfocusButton.addEventListener('click', () => unfocusTask());
            rightSection.appendChild(focusUnfocusButton);
        } else if (!isActive && currentMode === 'work') { // Task is not active AND it's work mode (show focus)
            focusUnfocusButton.innerHTML = SVG_STRINGS.crosshair;
            focusUnfocusButton.classList.add('text-green-600', 'dark:text-green-400', 'hover:text-green-800', 'dark:hover:text-green-300', 'focus:ring-green-300', 'dark:focus:ring-green-500');
            focusUnfocusButton.title = "Set as focus task";
            focusUnfocusButton.addEventListener('click', () => setActiveTask(task.id));
            rightSection.appendChild(focusUnfocusButton);
        } else {
             // Placeholder during breaks or if task is active but it's break time
             const placeholder = document.createElement('span');
             placeholder.className = 'w-7 h-7'; // Match button size (adjust if icon size changes)
             rightSection.appendChild(placeholder);
        }
    } else {
         // Placeholder for completed tasks
         const placeholder = document.createElement('span');
         placeholder.className = 'w-7 h-7'; // Match button size
         rightSection.appendChild(placeholder);
    }


    // Edit Button (Show only if task is not complete)
    if (!task.completed) {
        const editButton = document.createElement('button');
        editButton.innerHTML = SVG_STRINGS.pencil;
        editButton.className = 'text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500';
        editButton.title = "Edit task";
        editButton.addEventListener('click', () => editTask(task.id, taskElement));
        rightSection.appendChild(editButton);
    } else {
         // Placeholder to maintain alignment when completed
         const placeholder = document.createElement('span');
         placeholder.className = 'w-7 h-7'; // Match button size
         rightSection.appendChild(placeholder);
    }

    // Delete Button (Always show)
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = SVG_STRINGS.trash2;
    const deleteColor = task.completed ? 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400' : 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300';
    deleteButton.className = `${deleteColor} p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500`;
    deleteButton.title = "Delete task";
    deleteButton.addEventListener('click', () => handleTaskDeleteClick(task.id)); // Use confirmation wrapper
    rightSection.appendChild(deleteButton);

    // Assemble Task Element
    taskElement.appendChild(leftSection);
    taskElement.appendChild(rightSection);

    return taskElement;
}


/**
 * Renders quick project selection buttons in the specified container.
 * @param {string} containerId - The ID of the container element.
 * @param {string} selectElementId - The ID of the associated select dropdown.
 */
function renderQuickSelectButtons(containerId, selectElementId) {
    const container = document.getElementById(containerId);
    const selectElement = document.getElementById(selectElementId);
    if (!container || !selectElement) return;

    container.innerHTML = ''; // Clear previous buttons

    // Get recently used projects (excluding Inbox)
    const recentProjects = projects
        .filter(p => p.id !== DEFAULT_PROJECT_ID && p.lastUsed > 0)
        .sort((a, b) => b.lastUsed - a.lastUsed) // Sort by most recent
        .slice(0, MAX_QUICK_PROJECTS); // Limit number shown

    if (recentProjects.length > 0) {
        // Add "Recent:" label
        const label = document.createElement('span');
        label.className = 'quick-projects-label';
        label.textContent = 'Recent:';
        container.appendChild(label);

        // Create buttons for recent projects
        recentProjects.forEach(project => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-project-btn';
            button.dataset.projectId = project.id;
            const color = project.color || DEFAULT_PROJECT_COLOR;
            button.innerHTML = `<span class="project-color-swatch-xs" style="background-color: ${color};"></span> ${project.name}`;

            // Add click listener to update the select dropdown
            button.addEventListener('click', () => {
                selectElement.value = project.id;
                updateProjectLastUsed(project.id); // Update last used time
                updateQuickSelectActiveState(containerId, selectElementId); // Update button styles
                selectElement.dispatchEvent(new Event('change'));
            });
            container.appendChild(button);
        });

        // Set initial active state
        updateQuickSelectActiveState(containerId, selectElementId);
    }
}

/**
 * Updates the visual state (styling) of quick select buttons based on the associated dropdown's value.
 * Handles text color contrast for dark mode.
 * @param {string} containerId - The ID of the button container.
 * @param {string} selectElementId - The ID of the associated select dropdown.
 */
function updateQuickSelectActiveState(containerId, selectElementId) {
    const container = document.getElementById(containerId);
    const selectElement = document.getElementById(selectElementId);
    if (!container || !selectElement) return;

    const selectedProjectId = selectElement.value;
    const buttons = container.querySelectorAll('.quick-project-btn');
    const isDark = htmlElement.classList.contains('dark');

    buttons.forEach(button => {
        const projectId = button.dataset.projectId;
        const projectColor = getProjectColor(projectId);

        if (projectId === selectedProjectId) {
            // Style for active button
            button.classList.add('active');
            button.style.borderColor = projectColor;
            button.style.backgroundColor = projectColor;
            button.style.color = isColorLight(projectColor) ? '#1f2937' : 'white';
        } else {
            // Style for inactive button (reset overrides)
            button.classList.remove('active');
            button.style.borderColor = ''; // Reset to CSS default
            button.style.backgroundColor = ''; // Reset to CSS default
            button.style.color = ''; // Reset to CSS default
        }
    });
}

/**
 * Populates the task suggestions datalist used in manual log and edit forms.
 */
function populateTaskSuggestions() {
    if (!taskSuggestionsDatalist) return;
    taskSuggestionsDatalist.innerHTML = ''; // Clear existing options
    // Get unique task names from the current task list
    const uniqueTasks = [...new Set(tasks.map(task => task.text))];
    uniqueTasks.forEach(taskText => {
        const option = document.createElement('option');
        option.value = taskText;
        taskSuggestionsDatalist.appendChild(option);
    });
}

// --- Drag and Drop Functions ---
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


/**
 * Renders the list of upcoming reminders in the Reminders view.
 */
function renderReminders() {
    if (!reminderListContainer || !reminderListEmptyMsg) return;

    reminderListContainer.innerHTML = ''; // Clear previous list

    // Filter out past reminders (optional, or show them differently)
    const upcomingReminders = reminders
        .filter(r => !r.triggered) // Only show non-triggered
        .sort((a, b) => a.time - b.time); // Sort by time ascending

    if (upcomingReminders.length > 0) {
        reminderListEmptyMsg.style.display = 'none'; // Hide empty message

        upcomingReminders.forEach(reminder => {
            const item = document.createElement('div');
            item.className = 'reminder-item';
            item.dataset.reminderId = reminder.id;

            const reminderDate = new Date(reminder.time);
            // Format time more nicely (e.g., "Apr 1, 10:30 AM")
            const timeString = formatTimeForDisplay(reminderDate); // Using updated formatTimeForDisplay

            item.innerHTML = `
                <div class="reminder-details">
                    <div class="reminder-text">${reminder.text}</div>
                    <div class="reminder-time-display">${timeString}</div>
                </div>
                <button class="reminder-delete-btn" title="Delete Reminder">
                    ${SVG_STRINGS.trash2}
                </button>
            `;

            // Add event listener for delete button
            const deleteBtn = item.querySelector('.reminder-delete-btn');
            if (deleteBtn) {
                // Use a function reference defined in reminders.js or main.js
                deleteBtn.onclick = () => deleteReminder(reminder.id);
            }

            reminderListContainer.appendChild(item);
        });
    } else {
        reminderListEmptyMsg.style.display = 'block'; // Show empty message
        reminderListEmptyMsg.textContent = 'No upcoming reminders set.';
    }
}

// --- NLP Time Suggestion Rendering & Handling ---

/**
 * Renders the time suggestions generated by the NLP parser and applies highlight.
 * @param {Array<object>} suggestions - Array of suggestion objects { startTime, endTime, description }.
 * @param {'manual' | 'inactivity'} formType - The type of form ('manual' or 'inactivity').
 * @param {number} appliedIndex - The index of the suggestion currently applied (-1 if none).
 */
function renderTimeSuggestions(suggestions, formType, appliedIndex) {
    const container = (formType === 'manual')
        ? manualLogTimeSuggestionsContainer
        : inactivityLogTimeSuggestionsContainer;

    if (!container) {
        // console.warn(`Suggestion container for form type "${formType}" not found.`);
        return;
    }

    container.innerHTML = ''; // Clear previous suggestions

    if (suggestions && suggestions.length > 0) {
        const list = document.createElement('div');
        list.className = 'mt-2 space-y-1'; // Add spacing

        suggestions.forEach((suggestion, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nlp-suggestion-btn'; // Base class from style.css
            button.dataset.suggestionIndex = index;

            // Add highlight class if this suggestion is applied
            if (index === appliedIndex) {
                button.classList.add('nlp-suggestion-applied');
            }

            // Format times and date for display
            const startTimeStr = formatTimeForDisplay(suggestion.startTime);
            const endTimeStr = formatTimeForDisplay(suggestion.endTime);
            const startDateStr = getDateString(suggestion.startTime);
            const todayStr = getDateString(new Date());
            const dateStrDisplay = startDateStr !== todayStr
                            ? ` (${suggestion.startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })})`
                            : '';

            button.innerHTML = `
                <span class="font-medium">${suggestion.description}:</span>
                <span class="ml-1">${startTimeStr} - ${endTimeStr}${dateStrDisplay}</span>
            `;

            // Add click listener to handle selection
            button.addEventListener('click', () => handleSuggestionClickUI(index, formType));
            list.appendChild(button);
        });
        container.appendChild(list);
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

/**
 * Applies the selected NLP suggestion to the appropriate form fields and updates the UI.
 * @param {number} index - The index of the suggestion in currentNlpSuggestions.
 * @param {'manual' | 'inactivity' | 'reminder'} formType - The type of form.
 */
function applyNlpSuggestionUI(index, formType) {
    // Validate suggestion index
    if (index < 0 || !currentNlpSuggestions || index >= currentNlpSuggestions.length) {
        console.warn("Invalid suggestion index for applying:", index);
        return; // Invalid index or suggestions array empty/missing
    }

    const suggestion = currentNlpSuggestions[index];
    // Ensure suggestion object and startTime are valid
    if (!suggestion || !(suggestion.startTime instanceof Date) || isNaN(suggestion.startTime)) {
        console.error("Invalid suggestion object or startTime at index:", index, suggestion);
        return;
    }

    const { startTime, endTime } = suggestion; // endTime might be null for reminders

    // --- Get the correct form elements based on formType ---
    let taskInput, dateInput, startInput, endInput, projectSelect, timeInput;
    let targetInputElement; // Element to focus after applying

    // Use constants from domElements.js
    switch (formType) {
        case 'manual':
            taskInput = manualLogTaskInput;
            dateInput = manualLogDateInput;
            startInput = manualLogStartInput;
            endInput = manualLogEndInput;
            projectSelect = manualLogProjectSelect;
            targetInputElement = projectSelect; // Focus project after applying log time
            break;
        case 'inactivity':
            taskInput = inactivityManualLogTaskInput;
            dateInput = inactivityManualLogDateInput;
            startInput = inactivityManualLogStartInput;
            endInput = inactivityManualLogEndInput;
            projectSelect = inactivityManualLogProjectSelect;
            targetInputElement = projectSelect; // Focus project after applying log time
            break;
        case 'reminder':
            taskInput = reminderTextInput;
            timeInput = reminderTimeInput; // Reminder uses datetime-local
            targetInputElement = timeInput; // Focus time input after applying text suggestion
            break;
        default:
            console.error(`Unknown formType "${formType}" in applyNlpSuggestionUI.`);
            return; // Exit if formType is not recognized
    }

    // Ensure the primary text input exists for the given form type
    if (!taskInput) {
        console.error(`Task input not found for form type "${formType}". Cannot apply suggestion.`);
        return;
    }

    // --- Apply the suggested times/datetime ---
    if (formType === 'reminder') {
        // Apply to datetime-local input for reminders
        if (timeInput) {
            const year = startTime.getFullYear();
            // Ensure month, day, hours, minutes are zero-padded
            const month = (startTime.getMonth() + 1).toString().padStart(2, '0');
            const day = startTime.getDate().toString().padStart(2, '0');
            const hours = startTime.getHours().toString().padStart(2, '0');
            const minutes = startTime.getMinutes().toString().padStart(2, '0');
            const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            timeInput.value = formattedDateTime;
        } else {
            console.error("Reminder time input not found.");
        }
    } else { // Manual log or Inactivity log
        // Apply to separate date, start time, end time inputs
        if (!dateInput || !startInput || !endInput) {
            console.error(`Log time input elements (date, start, or end) not found for form type "${formType}".`);
        } else {
            // Ensure startTime is valid before formatting
            if (startTime instanceof Date && !isNaN(startTime)) {
                dateInput.value = getDateString(startTime); // Use utility function
                startInput.value = formatTimeHHMM(startTime.getHours(), startTime.getMinutes()); // Use utility function
            } else {
                 console.error("Invalid startTime provided for log suggestion.");
            }
            // Ensure endTime is valid before formatting (required for logs)
            if (endTime instanceof Date && !isNaN(endTime)) {
                endInput.value = formatTimeHHMM(endTime.getHours(), endTime.getMinutes()); // Use utility function
            } else {
                console.error("Invalid endTime provided for log suggestion.");
            }
        }
    }


    // --- Update the task description input by removing the time phrase ---
    let originalText = taskInput.value; // Get current value before trimming
    if (typeof extractCoreText === 'function') { // Check if function exists
        // Get the trimmed text
        let trimmedText = extractCoreText(originalText);
        // Update the input field's value only if trimming actually changed it
        // This avoids unnecessary input updates if no time phrase was found/removed
        if(trimmedText !== originalText.trim()) {
             taskInput.value = trimmedText;
        }
    } else {
        console.error("extractCoreText function not defined. Cannot trim text.");
    }

    // --- Update the applied index state for the specific form ---
    if (appliedNlpSuggestionIndex.hasOwnProperty(formType)) {
        appliedNlpSuggestionIndex[formType] = index;
    } else {
         console.error(`Invalid formType "${formType}" for appliedNlpSuggestionIndex state.`);
    }


    // --- Re-render suggestions to show the highlight ---
    // Ensure renderTimeSuggestions function exists
    if (typeof renderTimeSuggestions === 'function') {
        // Pass the specific formType and the updated applied index for that type
        renderTimeSuggestions(currentNlpSuggestions, formType, appliedNlpSuggestionIndex[formType]);
    } else {
         console.error("renderTimeSuggestions function not found!");
    }


    // --- Optional: Focus the next logical field ---
    // Add a short delay to ensure browser processes value change before focus
    setTimeout(() => {
         targetInputElement?.focus();
    }, 50);
}

/**
 * Handles the click event on an NLP suggestion button.
 * @param {number} index - The index of the clicked suggestion.
 * @param {'manual' | 'inactivity'} formType - The type of form.
 */
function handleSuggestionClickUI(index, formType) {
    applyNlpSuggestionUI(index, formType);
}
