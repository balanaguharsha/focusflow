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
    plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`, // Plus icon
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-xs"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` // Small X for delete buttons
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
    const progress = (totalDurationSeconds > 0) ? Math.max(0, (totalDurationSeconds - timeRemaining) / totalDurationSeconds) : 0;
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
    document.title = `${formatTime(timeRemaining)} - ${timerModeDisplay?.textContent || 'Timer'} - FocusFlow`;
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
 * Switches the visible view (Timer, Log, Reminders, or Widgets).
 * @param {'timer' | 'log' | 'reminders' | 'widgets'} viewId - The ID of the view to show.
 */
function showView(viewId) {
    // *** MODIFIED: Added viewWidgets to the list ***
    const views = [viewTimer, viewLog, viewReminders, viewWidgets];
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
    if (tabReminders) tabReminders.classList.toggle('active', viewId === 'reminders');
    if (tabWidgets) tabWidgets.classList.toggle('active', viewId === 'widgets'); // *** ADDED ***

    // Actions specific to showing certain views
    if (viewId === 'log') {
        showLogDate(displayedLogDate);
        populateTaskSuggestions();
        populateProjectDropdown(manualLogProjectSelect);
        toggleManualLogForm(false);
        updateTimeSuggestionButtons('manual');
        renderQuickSelectButtons('manual-log-quick-projects', 'manual-log-project');
        renderTimeSuggestions([], 'manual', -1);
    } else if (viewId === 'reminders') {
        renderReminders();
    } else if (viewId === 'widgets') {
        // Render widgets when switching to the widgets view
        renderWidgets();
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
    if (inactivityManualLogProjectSelect) populateProjectDropdown(inactivityManualLogProjectSelect);
    if (editLogProjectSelect) populateProjectDropdown(editLogProjectSelect);

    projectListDiv.innerHTML = ''; // Clear current list

    if (projects.length > 1) { // Only render list if more than just Inbox exists
        projects.forEach(project => {
            if (project.id === DEFAULT_PROJECT_ID) return; // Skip default Inbox

            const item = document.createElement('div');
            item.className = 'project-list-item';
            if (project.id === animateItemId) item.classList.add('animate-project-entry');

            const projectColor = project.color || DEFAULT_PROJECT_COLOR;
            const actionsHtml = `
                <div class="project-actions">
                    <button class="project-edit-btn p-1" data-project-id="${project.id}" title="Edit Project">${SVG_STRINGS.pencil}</button>
                    <button class="project-delete-btn p-1" data-project-id="${project.id}" title="Delete Project">${SVG_STRINGS.trash2}</button>
                </div>`;

            item.innerHTML = `
                <span class="flex items-center flex-grow min-w-0 mr-2">
                    <span class="project-color-swatch" style="background-color: ${projectColor};"></span>
                    <span class="truncate" title="${project.name}">${project.name}</span>
                </span>
                ${actionsHtml}`;

            const editBtn = item.querySelector('.project-edit-btn');
            const deleteBtn = item.querySelector('.project-delete-btn');
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditProjectModal(project.id); });
            if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteProject(project.id); });

            projectListDiv.appendChild(item);
        });
    } else {
        projectListDiv.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400 italic">Add more projects here...</p>';
    }

    // Update related UI elements
    populateTaskSuggestions();
    renderTasks();
    renderQuickSelectButtons('new-task-quick-projects', 'new-task-project');
    renderQuickSelectButtons('manual-log-quick-projects', 'manual-log-project');
    renderQuickSelectButtons('inactivity-quick-projects', 'inactivity-manual-log-project');

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
    let projectGroupsRendered = false;
    const allCompletedTasks = [];

    // Render Project Groups (Incomplete Tasks + Add Form)
    projects.forEach(project => {
        projectGroupsRendered = true;
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        const incompleteTasks = projectTasks.filter(task => !task.completed);
        const completedTasksInProject = projectTasks.filter(task => task.completed);
        allCompletedTasks.push(...completedTasksInProject);

        const groupContainer = document.createElement('div');
        groupContainer.className = 'project-group';
        groupContainer.dataset.projectId = project.id;

        const header = document.createElement('h3');
        header.className = 'project-header';
        header.textContent = project.name;
        groupContainer.appendChild(header);

        const tasksInGroupContainer = document.createElement('div');
        tasksInGroupContainer.className = 'space-y-2';

        if (incompleteTasks.length > 0) {
            incompleteTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                if (task.id === animateItemId) taskElement.classList.add('animate-task-entry');
                tasksInGroupContainer.appendChild(taskElement);
            });
        } else {
             const noTasksMsg = document.createElement('p');
             noTasksMsg.className = 'text-sm text-gray-500 dark:text-gray-400 italic px-3 pb-2';
             noTasksMsg.textContent = 'No active tasks in this project yet!';
             tasksInGroupContainer.appendChild(noTasksMsg);
        }

        // Add Project-Specific Add Task Form
        const addForm = document.createElement('div');
        addForm.className = 'project-add-task-form';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Add task to this project...';
        input.className = 'project-add-task-input';
        input.id = `project-add-task-input-${project.id}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'project-add-task-button';
        button.innerHTML = SVG_STRINGS.plus;
        button.title = `Add task to ${project.name}`;
        addForm.appendChild(input);
        addForm.appendChild(button);
        tasksInGroupContainer.appendChild(addForm);
        button.addEventListener('click', () => handleProjectAddTask(project.id, input));
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleProjectAddTask(project.id, input); } });

        groupContainer.appendChild(tasksInGroupContainer);
        groupContainer.addEventListener('dragover', handleTaskDragOver);
        groupContainer.addEventListener('dragenter', handleTaskDragEnter);
        groupContainer.addEventListener('dragleave', handleTaskDragLeave);
        groupContainer.addEventListener('drop', handleTaskDrop);
        taskListContainer.appendChild(groupContainer);
    });

    // Render Global Completed Tasks Section
    if (allCompletedTasks.length > 0) {
        const detailsElement = document.createElement('details');
        detailsElement.className = 'global-completed-tasks-section';
        const summaryElement = document.createElement('summary');
        summaryElement.className = 'global-completed-tasks-summary';
        summaryElement.innerHTML = `<span class="summary-icon">${SVG_STRINGS.chevronRight}</span> Completed Tasks (${allCompletedTasks.length})`;
        detailsElement.appendChild(summaryElement);
        const completedListContainer = document.createElement('div');
        completedListContainer.className = 'global-completed-tasks-list space-y-4';

        const completedByProject = allCompletedTasks.reduce((acc, task) => {
            const projectId = task.projectId || DEFAULT_PROJECT_ID;
            if (!acc[projectId]) acc[projectId] = [];
            acc[projectId].push(task);
            return acc;
        }, {});

        const sortedProjectIds = Object.keys(completedByProject).sort((a, b) => {
            const projA = projects.find(p => p.id === a)?.name || 'zzz';
            const projB = projects.find(p => p.id === b)?.name || 'zzz';
            return projA.localeCompare(projB);
        });

        sortedProjectIds.forEach(projectId => {
            const projectCompletedTasks = completedByProject[projectId];
            if (projectCompletedTasks && projectCompletedTasks.length > 0) {
                const project = projects.find(p => p.id === projectId);
                const projectName = project ? project.name : 'Inbox';
                const projectHeader = document.createElement('h4');
                projectHeader.className = 'completed-project-header';
                projectHeader.textContent = projectName;
                completedListContainer.appendChild(projectHeader);
                const projectTasksDiv = document.createElement('div');
                projectTasksDiv.className = 'space-y-2 pl-2';
                projectCompletedTasks.sort((a, b) => (a.completedTimestamp || 0) - (b.completedTimestamp || 0) || a.text.localeCompare(b.text));
                projectCompletedTasks.forEach(task => { projectTasksDiv.appendChild(createTaskElement(task)); });
                completedListContainer.appendChild(projectTasksDiv);
            }
        });

        detailsElement.appendChild(completedListContainer);
        taskListContainer.appendChild(detailsElement);
        detailsElement.addEventListener('toggle', (event) => {
            const iconSpan = summaryElement.querySelector('.summary-icon');
            if (iconSpan) iconSpan.innerHTML = event.target.open ? SVG_STRINGS.chevronDown : SVG_STRINGS.chevronRight;
        });
    }

    taskListEmptyMsg.style.display = projectGroupsRendered ? 'none' : 'block';
    if (!projectGroupsRendered) {
        taskListEmptyMsg.textContent = 'No projects found. Add a project and tasks!';
        taskListContainer.appendChild(taskListEmptyMsg);
    }

    updateFocusedTaskDisplay();
    animateItemId = null;
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
    const activeClasses = isActive && currentMode === 'work' ? 'active-task' : '';

    taskElement.className = `${baseClasses} ${completedClasses} ${activeClasses}`;
    taskElement.dataset.taskId = task.id;
    taskElement.draggable = !task.completed;

    if (!task.completed) {
        taskElement.addEventListener('dragstart', handleTaskDragStart);
        taskElement.addEventListener('dragend', handleTaskDragEnd);
    }

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

    if (!task.completed && (task.pomodorosCompleted || 0) > 0) {
        const pomodoroDisplay = document.createElement('span');
        pomodoroDisplay.className = 'task-pomodoros flex-shrink-0';
        pomodoroDisplay.textContent = '🍅'.repeat(task.pomodorosCompleted || 0);
        pomodoroDisplay.title = `${task.pomodorosCompleted || 0} Pomodoros completed`;
        leftSection.appendChild(pomodoroDisplay);
    }

    const rightSection = document.createElement('div');
    rightSection.className = 'flex-shrink-0 flex items-center space-x-1';
    if (!task.completed) {
        const focusUnfocusButton = document.createElement('button');
        focusUnfocusButton.className = 'p-1 rounded focus:outline-none focus:ring-2';
        if (isActive && currentMode === 'work') {
            focusUnfocusButton.innerHTML = SVG_STRINGS.xCircle;
            focusUnfocusButton.classList.add('text-red-500', 'dark:text-red-400', 'hover:text-red-700', 'dark:hover:text-red-300', 'focus:ring-red-300', 'dark:focus:ring-red-500');
            focusUnfocusButton.title = "Remove focus from this task";
            focusUnfocusButton.addEventListener('click', () => unfocusTask());
            rightSection.appendChild(focusUnfocusButton);
        } else if (!isActive && currentMode === 'work') {
            focusUnfocusButton.innerHTML = SVG_STRINGS.crosshair;
            focusUnfocusButton.classList.add('text-green-600', 'dark:text-green-400', 'hover:text-green-800', 'dark:hover:text-green-300', 'focus:ring-green-300', 'dark:focus:ring-green-500');
            focusUnfocusButton.title = "Set as focus task";
            focusUnfocusButton.addEventListener('click', () => setActiveTask(task.id));
            rightSection.appendChild(focusUnfocusButton);
        } else {
             const placeholder = document.createElement('span'); placeholder.className = 'w-7 h-7'; rightSection.appendChild(placeholder);
        }
        const editButton = document.createElement('button');
        editButton.innerHTML = SVG_STRINGS.pencil;
        editButton.className = 'text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500';
        editButton.title = "Edit task";
        editButton.addEventListener('click', () => editTask(task.id, taskElement));
        rightSection.appendChild(editButton);
    } else {
         const placeholder = document.createElement('span'); placeholder.className = 'w-7 h-7'; rightSection.appendChild(placeholder);
         const placeholder2 = document.createElement('span'); placeholder2.className = 'w-7 h-7'; rightSection.appendChild(placeholder2);
    }

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = SVG_STRINGS.trash2;
    const deleteColor = task.completed ? 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400' : 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300';
    deleteButton.className = `${deleteColor} p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500`;
    deleteButton.title = "Delete task";
    deleteButton.addEventListener('click', () => handleTaskDeleteClick(task.id));
    rightSection.appendChild(deleteButton);

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
    const recentProjects = projects
        .filter(p => p.id !== DEFAULT_PROJECT_ID && p.lastUsed > 0)
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, MAX_QUICK_PROJECTS);

    if (recentProjects.length > 0) {
        const label = document.createElement('span');
        label.className = 'quick-projects-label';
        label.textContent = 'Recent:';
        container.appendChild(label);
        recentProjects.forEach(project => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-project-btn';
            button.dataset.projectId = project.id;
            const color = project.color || DEFAULT_PROJECT_COLOR;
            button.innerHTML = `<span class="project-color-swatch-xs" style="background-color: ${color};"></span> ${project.name}`;
            button.addEventListener('click', () => {
                selectElement.value = project.id;
                updateProjectLastUsed(project.id);
                updateQuickSelectActiveState(containerId, selectElementId);
                selectElement.dispatchEvent(new Event('change'));
            });
            container.appendChild(button);
        });
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
            button.classList.add('active');
            button.style.borderColor = projectColor;
            button.style.backgroundColor = projectColor;
            button.style.color = isColorLight(projectColor) ? '#1f2937' : 'white';
        } else {
            button.classList.remove('active');
            button.style.borderColor = '';
            button.style.backgroundColor = '';
            button.style.color = '';
        }
    });
}

/**
 * Populates the task suggestions datalist used in manual log and edit forms.
 */
function populateTaskSuggestions() {
    if (!taskSuggestionsDatalist) return;
    taskSuggestionsDatalist.innerHTML = ''; // Clear existing options
    const uniqueTasks = [...new Set(tasks.map(task => task.text))];
    uniqueTasks.forEach(taskText => {
        const option = document.createElement('option');
        option.value = taskText;
        taskSuggestionsDatalist.appendChild(option);
    });
}

// --- Drag and Drop Functions ---
// js/tasks.js

// --- Task Drag and Drop Handlers ---

/** Handles start of drag */
function handleTaskDragStart(event) {
    // Find the task item element being dragged
    const taskElement = event.target.closest('.task-item');
    if (!taskElement || !taskElement.dataset.taskId) return;

    draggedTaskId = taskElement.dataset.taskId; // Store the ID of the task being dragged
    event.dataTransfer.setData('text/plain', draggedTaskId); // Set data for transfer
    event.dataTransfer.effectAllowed = 'move'; // Indicate it's a move operation

    // Add visual feedback (slight delay to ensure effect is applied)
    setTimeout(() => {
        taskElement.classList.add('opacity-50'); // Make dragged item semi-transparent
    }, 0);
}

/** Handles end of drag */
function handleTaskDragEnd(event) {
    const taskElement = event.target.closest('.task-item');
    if (taskElement) {
        taskElement.classList.remove('opacity-50'); // Remove transparency on drag end
    }
    draggedTaskId = null; // Clear the dragged task ID state
    // Remove highlighting from all potential drop zones
    document.querySelectorAll('.drop-zone-active').forEach(el => el.classList.remove('drop-zone-active'));
}

/** Handles drag over a potential drop zone */
function handleTaskDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
    // Set drop effect (visual cue, often handled by browser/OS)
    event.dataTransfer.dropEffect = 'move';
}

/** Handles drag entering a potential drop zone */
function handleTaskDragEnter(event) {
    event.preventDefault(); // Prevent default behavior
    const dropZone = event.target.closest('.project-group');
    // Highlight the drop zone if it's a valid project group
    if (dropZone && dropZone.dataset.projectId) {
        dropZone.classList.add('drop-zone-active');
    }
}

/** Handles drag leaving a potential drop zone */
function handleTaskDragLeave(event) {
    event.preventDefault();
    const dropZone = event.target.closest('.project-group');
    if (dropZone && dropZone.dataset.projectId) {
        // Only remove highlight if leaving the zone entirely, not just moving between child elements
        // relatedTarget is the element being entered
        if (!dropZone.contains(event.relatedTarget)) {
            dropZone.classList.remove('drop-zone-active');
        }
    }
    // Special case: if leaving from an element that isn't inside a project group, remove active class from all
    else if (!event.target.closest('.project-group') && event.relatedTarget?.closest('.project-group') !== dropZone) {
         document.querySelectorAll('.drop-zone-active').forEach(el => el.classList.remove('drop-zone-active'));
    }
}

/** Handles the actual drop event */
function handleTaskDrop(event) {
    event.preventDefault(); // Prevent default drop behavior (like opening link)
    const dropZone = event.target.closest('.project-group');

    // Ensure we have a dragged task ID and a valid drop zone (project group)
    if (dropZone && draggedTaskId) {
        const targetProjectId = dropZone.dataset.projectId;
        const taskIndex = tasks.findIndex(t => t.id === draggedTaskId);

        // Check if the task exists and is being moved to a *different* project
        if (taskIndex !== -1 && tasks[taskIndex].projectId !== targetProjectId) {
            // Update the task's project ID in the state
            tasks[taskIndex].projectId = targetProjectId;
            updateProjectLastUsed(targetProjectId); // Mark the target project as used
            saveTasks(); // Save the updated task list
            renderTasks(); // Re-render the UI to reflect the move

            // Provide user feedback
            const targetProjectName = projects.find(p => p.id === targetProjectId)?.name || 'Inbox';
            showNotification(`Task moved to "${targetProjectName}"!`, 'success');
        }
        // Remove highlighting from the drop zone
        dropZone.classList.remove('drop-zone-active');
    }

    // Clean up regardless of success
    draggedTaskId = null;
    document.querySelectorAll('.drop-zone-active').forEach(el => el.classList.remove('drop-zone-active'));
}

/**
 * Renders the list of upcoming reminders in the Reminders view.
 */
/**
 * Renders the list of upcoming reminders, grouped by date (Overdue, Today, Tomorrow, Upcoming).
 * Includes relative time, category tags, and edit/delete actions.
 */
function renderReminders() {
    if (!reminderListContainer || !reminderListEmptyMsg) return;

    reminderListContainer.innerHTML = ''; // Clear previous content
    const now = luxon.DateTime.now();
    const todayStart = now.startOf('day');
    const tomorrowStart = todayStart.plus({ days: 1 });
    const dayAfterTomorrowStart = tomorrowStart.plus({ days: 1 });

    // Filter out triggered reminders (unless persistent logic needs them?)
    // For now, keep filtering triggered ones. Recurrence logic might change this.
    const activeReminders = reminders
        .filter(r => !r.triggered) // Filter out already triggered (non-persistent)
        .sort((a, b) => a.time - b.time); // Sort by time

    // Group reminders
    const groups = {
        overdue: activeReminders.filter(r => r.time < todayStart.ts),
        today: activeReminders.filter(r => r.time >= todayStart.ts && r.time < tomorrowStart.ts),
        tomorrow: activeReminders.filter(r => r.time >= tomorrowStart.ts && r.time < dayAfterTomorrowStart.ts),
        upcoming: activeReminders.filter(r => r.time >= dayAfterTomorrowStart.ts)
    };

    let hasReminders = false;

    // Function to render a group
    const renderGroup = (title, reminderList) => {
        if (reminderList.length === 0) return; // Don't render empty groups

        hasReminders = true; // Mark that we have reminders to show
        const groupContainer = document.createElement('div');
        groupContainer.className = 'reminder-group mb-4'; // Add margin between groups

        const header = document.createElement('h3');
        header.className = 'reminder-group-header';
        header.textContent = title;
        groupContainer.appendChild(header);

        const listElement = document.createElement('div');
        listElement.className = 'space-y-2'; // Spacing between items in the group

        reminderList.forEach(reminder => {
            const item = document.createElement('div');
            item.className = 'reminder-item'; // Use existing class + new styles
            item.dataset.reminderId = reminder.id;

            const relativeTimeStr = getRelativeTimeString(reminder.time);
            const absoluteTimeStr = formatTimeForDisplay(reminder.time); // Use existing util

            // Build meta string conditionally
            let metaItems = [];
            metaItems.push(`<span class="reminder-time-display" title="${absoluteTimeStr}">${relativeTimeStr}</span>`);
            if (reminder.category) {
                metaItems.push(`<span class="reminder-category-tag">${reminder.category}</span>`);
            }
            if (reminder.isPersistent) {
                metaItems.push(`<span class="reminder-persistent-icon" title="Persistent Reminder">🔁</span>`);
            }

            item.innerHTML = `
                <div class="reminder-details">
                    <div class="reminder-text">${reminder.text}</div>
                    <div class="reminder-meta">
                        ${metaItems.join(' ')}
                    </div>
                </div>
                <div class="reminder-actions">
                    <button class="reminder-edit-btn" data-reminder-id="${reminder.id}" title="Edit Reminder">
                        ${SVG_STRINGS.pencil}
                    </button>
                    <button class="reminder-delete-btn" data-reminder-id="${reminder.id}" title="Delete Reminder">
                        ${SVG_STRINGS.trash2}
                    </button>
                </div>`;

            // Attach listeners directly here (or rely solely on delegation in main.js)
            // Using delegation in main.js is generally better, so we just add buttons here.
            // Example if adding listeners here:
             const editBtn = item.querySelector('.reminder-edit-btn');
             const deleteBtn = item.querySelector('.reminder-delete-btn');
             if(editBtn && typeof handleEditReminderClick === 'function') { editBtn.onclick = () => handleEditReminderClick(reminder.id); }
             if(deleteBtn && typeof deleteReminder === 'function') { deleteBtn.onclick = () => deleteReminder(reminder.id); }

            listElement.appendChild(item);
        });
        groupContainer.appendChild(listElement);
        reminderListContainer.appendChild(groupContainer);
    };

    // Render each group
    renderGroup('Overdue', groups.overdue);
    renderGroup('Today', groups.today);
    renderGroup('Tomorrow', groups.tomorrow);
    renderGroup('Upcoming', groups.upcoming);

    // Show/hide the empty message
    if (hasReminders) {
        reminderListEmptyMsg.style.display = 'none';
    } else {
        reminderListEmptyMsg.style.display = 'block';
        reminderListEmptyMsg.textContent = 'No upcoming reminders set.';
    }
}

/**
 * Gets a relative time string (e.g., "in 5 minutes", "yesterday") using Luxon.
 * Falls back to absolute time if Luxon fails or timestamp is invalid.
 * @param {number} timestamp - The timestamp in milliseconds.
 * @returns {string} - The relative or absolute time string.
 */
function getRelativeTimeString(timestamp) {
    if (typeof luxon === 'undefined' || !timestamp) {
        return formatTimeForDisplay(timestamp || Date.now()); // Fallback
    }
    try {
        const dt = luxon.DateTime.fromMillis(timestamp);
        if (!dt.isValid) {
             return formatTimeForDisplay(timestamp); // Fallback if timestamp invalid
        }
        // Use Luxon's relative time formatting
        return dt.toRelative() || formatTimeForDisplay(timestamp); // Fallback if toRelative returns null
    } catch (e) {
        console.error("Error formatting relative time:", e);
        return formatTimeForDisplay(timestamp); // Fallback on any error
    }
}


// --- NLP Time Suggestion Rendering & Handling ---
/**
 * Renders the time suggestions generated by the NLP parser and applies highlight.
 * @param {Array<object>} suggestions - Array of suggestion objects { startTime, endTime, description }.
 * @param {'manual' | 'inactivity' | 'reminder'} formType - The type of form ('manual', 'inactivity', or 'reminder').
 * @param {number} appliedIndex - The index of the suggestion currently applied (-1 if none).
 */
function renderTimeSuggestions(suggestions, formType, appliedIndex) {
    let container;
    switch (formType) {
        case 'manual': container = manualLogTimeSuggestionsContainer; break;
        case 'inactivity': container = inactivityLogTimeSuggestionsContainer; break;
        case 'reminder': container = reminderTimeSuggestionsContainer; break;
        default: container = null;
    }
    if (!container) return;
    container.innerHTML = '';

    if (suggestions && suggestions.length > 0) {
        const list = document.createElement('div');
        list.className = (formType === 'reminder')
            ? 'absolute left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto p-1 space-y-1'
            : 'mt-2 space-y-1';

        suggestions.forEach((suggestion, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nlp-suggestion-btn';
            button.dataset.suggestionIndex = index;
            if (index === appliedIndex) button.classList.add('nlp-suggestion-applied');

            let buttonText = '';
            if (suggestion.endTime) { // Log suggestion
                const startTimeStr = formatTimeForDisplay(suggestion.startTime);
                const endTimeStr = formatTimeForDisplay(suggestion.endTime);
                const startDateStr = getDateString(suggestion.startTime);
                const todayStr = getDateString(new Date());
                const dateStrDisplay = startDateStr !== todayStr ? ` (${suggestion.startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })})` : '';
                buttonText = `<span class="font-medium">${suggestion.description}:</span><span class="ml-1">${startTimeStr} - ${endTimeStr}${dateStrDisplay}</span>`;
            } else { // Reminder suggestion
                 const timeStr = formatTimeForDisplay(suggestion.startTime);
                 const dateStr = formatDateForDisplay(suggestion.startTime);
                 buttonText = `<span class="font-medium">${suggestion.description}:</span><span class="ml-1">${dateStr}, ${timeStr}</span>`;
            }
            button.innerHTML = buttonText;
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
 * Only trims the text immediately for non-reminder forms.
 * @param {number} index - The index of the suggestion in currentNlpSuggestions.
 * @param {'manual' | 'inactivity' | 'reminder'} formType - The type of form.
 */
function applyNlpSuggestionUI(index, formType) {
    // Ensure index is valid and suggestions exist
    if (index < 0 || !currentNlpSuggestions || index >= currentNlpSuggestions.length) return;
    const suggestion = currentNlpSuggestions[index];
    // Ensure suggestion and its startTime are valid
    if (!suggestion || !(suggestion.startTime instanceof Date) || isNaN(suggestion.startTime)) {
        console.error("Invalid suggestion or startTime:", suggestion);
        return;
    }

    const { startTime, endTime } = suggestion;
    let taskInput, dateInput, startInput, endInput, projectSelect, timeInput, targetInputElement;

    // Assign DOM elements based on form type
    switch (formType) {
        case 'manual':
            [taskInput, dateInput, startInput, endInput, projectSelect, targetInputElement] =
                [manualLogTaskInput, manualLogDateInput, manualLogStartInput, manualLogEndInput, manualLogProjectSelect, manualLogProjectSelect];
            break;
        case 'inactivity':
             [taskInput, dateInput, startInput, endInput, projectSelect, targetInputElement] =
                 [inactivityManualLogTaskInput, inactivityManualLogDateInput, inactivityManualLogStartInput, inactivityManualLogEndInput, inactivityManualLogProjectSelect, inactivityManualLogProjectSelect];
             break;
        case 'reminder':
            [taskInput, timeInput, targetInputElement] =
                [reminderTextInput, reminderTimeInput, reminderTimeInput];
            break;
        default:
            console.error(`Unknown formType "${formType}" in applyNlpSuggestionUI`);
            return;
    }

    // Check if primary input element exists
    if (!taskInput) {
        console.error(`Task input not found for form type "${formType}"`);
        return;
    }

    // --- Apply time values based on form type ---
    if (formType === 'reminder') {
        // Ensure reminder time input exists
        if (timeInput) {
             try {
                 // Format for datetime-local input (YYYY-MM-DDTHH:mm)
                 const year = startTime.getFullYear();
                 const month = (startTime.getMonth() + 1).toString().padStart(2, '0');
                 const day = startTime.getDate().toString().padStart(2, '0');
                 const hours = startTime.getHours().toString().padStart(2, '0');
                 const minutes = startTime.getMinutes().toString().padStart(2, '0');
                 timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
             } catch(e) { console.error("Error formatting time for reminder input:", e); }
        } else { console.error("Reminder time input not found."); }
    } else { // For 'manual' or 'inactivity' log forms
        // Ensure log time inputs exist
        if (!dateInput || !startInput || !endInput) {
             console.error(`Log time inputs not found for form type "${formType}".`);
        } else {
             try {
                 // Ensure start and end times are valid Date objects before formatting
                 if (startTime instanceof Date && !isNaN(startTime)) {
                     dateInput.value = getDateString(startTime); // Use existing util
                     startInput.value = formatTimeHHMM(startTime.getHours(), startTime.getMinutes()); // Use existing util
                 } else { console.error("Invalid startTime for log suggestion."); }

                 if (endTime instanceof Date && !isNaN(endTime)) {
                     // Ensure end date matches start date if time range is within same day
                     if (getDateString(endTime) !== getDateString(startTime)) {
                          console.warn("Log suggestion spans across midnight, setting date based on start time.");
                          // Optionally adjust end time display or logic if needed
                     }
                     endInput.value = formatTimeHHMM(endTime.getHours(), endTime.getMinutes()); // Use existing util
                 } else { console.error("Invalid endTime for log suggestion."); }
             } catch(e) { console.error("Error formatting time for log inputs:", e); }
        }
    }

    // --- Conditionally trim the text input ---
    let originalText = taskInput.value;
    // <<<< START OF CHANGE >>>>
    // Only extract/trim text immediately if NOT dealing with a reminder
    if (formType !== 'reminder') {
         if (typeof extractCoreText === 'function') {
              let trimmedText = extractCoreText(originalText);
              // Only update if trimming actually changed something substantial
              // and didn't just result in an empty string from a non-empty original
              if(trimmedText.trim() !== originalText.trim() && trimmedText.trim().length > 0) {
                   taskInput.value = trimmedText.trim(); // Use trimmed result
              } else if (trimmedText.trim().length === 0 && originalText.trim().length > 0) {
                   // If trimming removed everything meaningful, keep the original text
                   // This might happen if the input was ONLY the time phrase
                   taskInput.value = originalText.trim();
                   console.warn("extractCoreText removed the entire input; keeping original.");
              }
              // If trimmedText is the same as originalText, do nothing to the input field
         } else { console.error("extractCoreText function not defined."); }
    }
    // For reminders, leave the text as is for now. Trimming happens on save.
    // <<<< END OF CHANGE >>>>

    // --- Update applied index and render suggestions ---
    if (appliedNlpSuggestionIndex.hasOwnProperty(formType)) {
         appliedNlpSuggestionIndex[formType] = index;
    } else { console.error(`Invalid formType "${formType}" for applied index state.`); }

    if (typeof renderTimeSuggestions === 'function') {
         renderTimeSuggestions(currentNlpSuggestions, formType, appliedNlpSuggestionIndex[formType]);
    } else { console.error("renderTimeSuggestions function not found!"); }

    // --- Focus the next logical element ---
    setTimeout(() => {
         targetInputElement?.focus(); // Focus the time/date/project input
         // Hide suggestions immediately after applying for reminders (cleaner UX)
         if (formType === 'reminder' && typeof renderTimeSuggestions === 'function') {
              renderTimeSuggestions([], formType, -1);
         }
    }, 50);
}

/**
 * Handles the click event on an NLP suggestion button.
 * @param {number} index - The index of the clicked suggestion.
 * @param {'manual' | 'inactivity' | 'reminder'} formType - The type of form.
 */
function handleSuggestionClickUI(index, formType) {
    applyNlpSuggestionUI(index, formType);
}


// --- Widget Rendering ---

/**
 * Renders all widgets stored in the `widgets` state array into the container.
 */
function renderWidgets() {
    if (!widgetContainer) {
        console.error("Widget container not found!");
        return;
    }

    widgetContainer.innerHTML = ''; // Clear previous widgets
    const emptyMsg = document.getElementById('widget-list-empty'); // Assuming this ID exists

    if (widgets.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block'; // Show empty message
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none'; // Hide empty message
        widgets.forEach(widget => {
            let widgetElement = null;
            if (widget.type === 'counter') {
                widgetElement = createCounterWidgetElement(widget);
            } else if (widget.type === 'countdown') {
                widgetElement = createCountdownWidgetElement(widget);
            // --- START ADDED CODE ---
            } else if (widget.type === 'memory-game') {
                widgetElement = createMemoryGameWidgetElement(widget);
            } else if (widget.type === 'reflex-game') {
                widgetElement = createReflexGameWidgetElement(widget);
            // --- END ADDED CODE ---
            }
            // Add more widget types here with 'else if'

            if (widgetElement) {
                widgetContainer.appendChild(widgetElement);
                // If it's a countdown, ensure its display is correct based on state
                if (widget.type === 'countdown') {
                    updateCustomCountdownDisplay(widget.id, widgetElement);
                }
                 // If it's a memory game, render the initial state if needed
                 if (widget.type === 'memory-game' && typeof renderMemoryGameBoard === 'function') {
                     renderMemoryGameBoard(widget.id, widgetElement); // We'll define this helper later if needed
                 }
                 // If it's a reflex game, update display based on state
                 if (widget.type === 'reflex-game' && typeof updateReflexGameDisplay === 'function') {
                     updateReflexGameDisplay(widget.id, widgetElement); // We'll define this helper later
                 }
            }
        });
    }
}

/**
 * Creates the HTML element for a counter widget.
 * Includes data attributes for event delegation.
 * @param {object} widget - The widget object from the state.
 * @returns {HTMLElement} The widget card element.
 */
function createCounterWidgetElement(widget) {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.widgetId = widget.id; // Store widget ID for event delegation

    card.innerHTML = `
        <button class="widget-delete-button" data-action="delete" title="Delete Widget">
            ${SVG_STRINGS.x}
        </button>
        <h3 class="widget-title">${widget.title}</h3>
        <div class="flex items-center justify-center space-x-4">
            <button data-action="decrement" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow">-</button>
            <span data-role="display" class="text-3xl font-bold text-gray-800 dark:text-gray-100 min-w-[50px] text-center">${widget.state.value}</span>
            <button data-action="increment" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow">+</button>
        </div>
        <div class="text-center mt-3">
            <button data-action="reset" class="text-xs text-gray-500 dark:text-gray-400 hover:underline">Reset</button>
        </div>
    `;
    return card;
}

/**
 * Creates the HTML element for a countdown widget.
 * Includes data attributes for event delegation.
 * @param {object} widget - The widget object from the state.
 * @returns {HTMLElement} The widget card element.
 */
function createCountdownWidgetElement(widget) {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.widgetId = widget.id; // Store widget ID

    const { timeRemaining = 0, totalSeconds = 0, isRunning = false } = widget.state;
    // Ensure initialDurationMinutes is calculated correctly, defaulting if needed
    const initialDurationMinutes = totalSeconds > 0 ? Math.round(totalSeconds / 60) : 5; // Default 5 min

    card.innerHTML = `
        <button class="widget-delete-button" data-action="delete" title="Delete Widget">
             ${SVG_STRINGS.x}
        </button>
        <h3 class="widget-title">${widget.title}</h3>
        <div class="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div class="flex-grow w-full sm:w-auto">
                <label for="widget-cd-duration-${widget.id}" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (minutes):</label>
                <input type="number" id="widget-cd-duration-${widget.id}" data-role="duration-input" min="1" value="${initialDurationMinutes}" class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" ${isRunning ? 'disabled' : ''}>
            </div>
        </div>
        <div data-role="display" class="text-4xl font-bold text-center text-blue-700 dark:text-blue-300 mb-4">
            ${formatTime(timeRemaining)}
        </div>
        <div class="flex justify-center space-x-3">
             <button data-action="start" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow flex items-center justify-center space-x-1" ${isRunning ? 'disabled' : ''}>
                ${SVG_STRINGS.play}
                <span>Start</span>
            </button>
             <button data-action="pause" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-5 rounded-lg shadow flex items-center justify-center space-x-1" ${!isRunning ? 'disabled' : ''}>
                ${SVG_STRINGS.pause}
                <span>Pause</span>
            </button>
             <button data-action="reset" class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg shadow flex items-center justify-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="icon icon-sm"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span>Reset</span>
            </button>
        </div>
    `;
    return card;
}

/**
 * Creates the HTML element for a Memory Game widget.
 * @param {object} widget - The widget object from the state.
 * @returns {HTMLElement} The widget card element.
 */
function createMemoryGameWidgetElement(widget) {
    const card = document.createElement('div');
    card.className = 'widget-card memory-game-widget'; // Add specific class
    card.dataset.widgetId = widget.id;

    // Basic structure: Title, Delete, Grid Area, Info, Controls
    card.innerHTML = `
        <button class="widget-delete-button" data-action="delete" title="Delete Widget">
            ${SVG_STRINGS.x}
        </button>
        <h3 class="widget-title">${widget.title}</h3>

        <div class="memory-game-grid" data-role="game-grid">
            </div>

        <div class="memory-game-info mt-2 text-center text-sm" data-role="game-info">
            Moves: <span data-role="moves">0</span>
        </div>

        <div class="mt-3 text-center">
            <button class="game-widget-button" data-action="memory-new-game">
                New Game
            </button>
        </div>
    `;
    // Note: We will populate the grid and update info dynamically in main.js
    return card;
}

/**
 * Creates the HTML element for a Reflex Game widget.
 * @param {object} widget - The widget object from the state.
 * @returns {HTMLElement} The widget card element.
 */
function createReflexGameWidgetElement(widget) {
    const card = document.createElement('div');
    card.className = 'widget-card reflex-game-widget'; // Add specific class
    card.dataset.widgetId = widget.id;

    // Basic structure: Title, Delete, Game Area, Info, Controls
    card.innerHTML = `
        <button class="widget-delete-button" data-action="delete" title="Delete Widget">
            ${SVG_STRINGS.x}
        </button>
        <h3 class="widget-title">${widget.title}</h3>

        <div class="reflex-game-area" data-role="game-area">
            <div class="reflex-target" data-role="target"></div>
        </div>

        <div class="reflex-game-info mt-2 text-center text-sm" data-role="game-info">
            Score: <strong data-role="score">0</strong> | Misses: <strong data-role="misses">0</strong>
        </div>

        <div class="mt-3 text-center">
            <button class="game-widget-button" data-action="reflex-start-round">
                Start Round
            </button>
             <button class="game-widget-button ml-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500" data-action="reflex-reset-score">
                 Reset Score
             </button>
        </div>
    `;
    // Note: Target visibility/position and score updates handled in main.js
    return card;
}


/**
 * Renders the memory game board based on the widget's current state.
 * @param {string} widgetId - The ID of the memory game widget.
 * @param {HTMLElement} widgetElement - The DOM element of the widget card.
 */
function renderMemoryGameBoard(widgetId, widgetElement) {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || widget.type !== 'memory-game' || !widgetElement) return;

    const gridContainer = widgetElement.querySelector('[data-role="game-grid"]');
    const infoContainer = widgetElement.querySelector('[data-role="game-info"]');
    const newGameButton = widgetElement.querySelector('[data-action="memory-new-game"]');
    if (!gridContainer || !infoContainer || !newGameButton) return;

    gridContainer.innerHTML = ''; // Clear previous cards

    if (!widget.state.isGameActive && !widget.state.isComplete) {
        gridContainer.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 text-center col-span-4">Click "New Game" to start!</p>';
        infoContainer.innerHTML = ''; // Clear moves display
        return; // Don't render cards if game hasn't started
    }

    // Render cards based on state
    widget.state.cards.forEach((cardValue, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.cardIndex = index; // Store index for click handling

        const isFlipped = widget.state.flippedIndices.includes(index);
        const isMatched = widget.state.matchedPairs.includes(cardValue); // Check if the *value* is matched

        // Add front (icon/value) and back faces
        cardElement.innerHTML = `
            <div class="memory-card-face memory-card-back"></div>
            <div class="memory-card-face memory-card-front">${cardValue}</div>
        `;

        // Apply classes based on state
        if (isFlipped || isMatched) {
            cardElement.classList.add('is-flipped');
        }
        if (isMatched) {
            cardElement.classList.add('is-matched');
        }

        // Add click listener only if the card is not matched and the game is active
        if (!isMatched && widget.state.isGameActive) {
            cardElement.addEventListener('click', handleMemoryCardClick); // Use shared handler
        }

        gridContainer.appendChild(cardElement);
    });

    // Update info display
    updateMemoryGameInfo(widgetId, widgetElement);

    // Update button text if game is complete
    if(widget.state.isComplete) {
         newGameButton.textContent = "Play Again?";
    } else {
         newGameButton.textContent = "New Game";
    }
}

/**
 * Updates the information display (moves, status) for a memory game widget.
 * @param {string} widgetId - The ID of the memory game widget.
 * @param {HTMLElement} widgetElement - The DOM element of the widget card.
 */
function updateMemoryGameInfo(widgetId, widgetElement) {
     const widget = widgets.find(w => w.id === widgetId);
     if (!widget || widget.type !== 'memory-game' || !widgetElement) return;

     const infoContainer = widgetElement.querySelector('[data-role="game-info"]');
     if (!infoContainer) return;

     let statusText = `Moves: <span data-role="moves">${widget.state.moves}</span>`;
     if (widget.state.isComplete) {
         statusText += ' - <span class="text-green-600 dark:text-green-400 font-semibold">Complete!</span>';
     } else if (!widget.state.isGameActive && widget.state.moves === 0) {
          statusText = '<span class="text-gray-500 dark:text-gray-400">Ready</span>'; // Show Ready state before first game
     }
     infoContainer.innerHTML = statusText;
}


/**
 * Updates the display (score, misses, button state) for a reflex game widget.
 * @param {string} widgetId - The ID of the reflex game widget.
 * @param {HTMLElement} widgetElement - The DOM element of the widget card.
 */
function updateReflexGameDisplay(widgetId, widgetElement) {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || widget.type !== 'reflex-game' || !widgetElement) return;

    const scoreElement = widgetElement.querySelector('[data-role="score"]');
    const missesElement = widgetElement.querySelector('[data-role="misses"]');
    const startButton = widgetElement.querySelector('[data-action="reflex-start-round"]');
    // const targetElement = widgetElement.querySelector('[data-role="target"]'); // Target visibility handled in main.js

    if (scoreElement) scoreElement.textContent = widget.state.score;
    if (missesElement) missesElement.textContent = widget.state.misses;

    // Update button text/state based on game status
    if (startButton) {
         if (widget.state.gameStatus === 'playing') {
              startButton.textContent = 'Round Active...';
              startButton.disabled = true;
         } else if (widget.state.gameStatus === 'finished') {
              startButton.textContent = 'Start New Round';
              startButton.disabled = false;
         } else { // ready
              startButton.textContent = 'Start Round';
              startButton.disabled = false;
         }
    }
}

// --- End Widget Rendering ---

