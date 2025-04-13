// js/main.js

// --- Game Constants ---
const MEMORY_GAME_SYMBOLS = ['🍎', '🍌', '⭐', '💖', '🚀', '💡', '🍕', '🎉']; // 8 pairs for 4x4 grid
const REFLEX_GAME_TARGET_DURATION = 1500; // How long the target stays visible (ms)
const REFLEX_GAME_DELAY_MIN = 500; // Min delay before next target (ms)
const REFLEX_GAME_DELAY_MAX = 2000; // Max delay before next target (ms)
const REFLEX_GAME_ROUNDS = 10; // Number of targets per round

// --- Utility ---
/** Shuffles array in place. Fisher-Yates algorithm. */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}


// --- Global Event Listeners Setup ---

/**
 * Attaches all necessary event listeners to the DOM elements.
 * Includes event delegation for dynamic elements like reminder buttons.
 */
function setupEventListeners() {
    // Tab Switching
    if (tabTimer) tabTimer.addEventListener('click', () => showView('timer'));
    if (tabLog) tabLog.addEventListener('click', () => showView('log'));
    if (tabReminders) tabReminders.addEventListener('click', () => showView('reminders'));
    if (tabWidgets) tabWidgets.addEventListener('click', () => showView('widgets'));

    // Timer Controls (Main Pomodoro)
    if (startPauseButton) startPauseButton.addEventListener('click', handleStartPauseClick);
    if (resetButton) resetButton.addEventListener('click', () => resetTimer(true));
    if (skipButton) skipButton.addEventListener('click', skipMode);
    if (markDoneButton) markDoneButton.addEventListener('click', handleMarkDoneClick);
    if (toggleElapsedButton) toggleElapsedButton.addEventListener('click', () => {
        settings.showElapsedTime = !settings.showElapsedTime;
        if (showElapsedEnabledInput) showElapsedEnabledInput.checked = settings.showElapsedTime;
        saveSettings();
        updateTimerDisplayAndProgress();
    });

    // Task Management
    if (addTaskButton) addTaskButton.addEventListener('click', addTask);
    if (newTaskInput) {
        newTaskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
        // *** Connect prediction listener ***
        newTaskInput.addEventListener('input', () => handleTaskInputForPrediction(newTaskInput, newTaskProjectSelect, 'new-task-quick-projects'));
    }
    if (newTaskProjectSelect) newTaskProjectSelect.addEventListener('change', (e) => {
        updateProjectLastUsed(e.target.value);
        updateQuickSelectActiveState('new-task-quick-projects', 'new-task-project');
    });

    // --- START: Updated Reminder Listeners ---
    // Main Add/Save Button
    if (addReminderButton) {
        // Now calls saveReminder which handles both add and update
        addReminderButton.addEventListener('click', saveReminder);
    }
    // Cancel Edit Button
    if (cancelEditReminderButton && typeof cancelEditReminder === 'function') {
        cancelEditReminderButton.addEventListener('click', cancelEditReminder);
    } else if (cancelEditReminderButton) {
         console.error("cancelEditReminder function not found!");
    }

    // Input field listeners (NLP, Enter key)
    if (reminderTextInput) {
         reminderTextInput.addEventListener('input', (event) => {
             // NLP handling logic (as provided in original file)
             clearTimeout(nlpSuggestionDebounceTimer);
             appliedNlpSuggestionIndex.reminder = -1;
             const currentText = event.target.value;
             if (currentText.length < 3) {
                 if (typeof renderTimeSuggestions === 'function') { renderTimeSuggestions([], 'reminder', -1); }
                 currentNlpSuggestions = []; return;
             } else {
                 if (typeof renderTimeSuggestions === 'function') { renderTimeSuggestions(currentNlpSuggestions, 'reminder', -1); }
             }
             nlpSuggestionDebounceTimer = setTimeout(() => {
                 const textToParse = reminderTextInput.value;
                 if (textToParse.length >= 3 && typeof parseTimeInput === 'function' && typeof applyNlpSuggestionUI === 'function') {
                     const now = new Date();
                     currentNlpSuggestions = parseTimeInput(textToParse, now);
                     if (currentNlpSuggestions.length > 0) { applyNlpSuggestionUI(0, 'reminder'); }
                     else { appliedNlpSuggestionIndex.reminder = -1; if (typeof renderTimeSuggestions === 'function') { renderTimeSuggestions([], 'reminder', -1); } }
                 } else { currentNlpSuggestions = []; appliedNlpSuggestionIndex.reminder = -1; if (typeof renderTimeSuggestions === 'function') { renderTimeSuggestions([], 'reminder', -1); } }
             }, NLP_DEBOUNCE_DELAY);
         });
         // Add listener for Enter key to trigger save
         reminderTextInput.addEventListener('keydown', (e) => {
             if (e.key === 'Enter') {
                 e.preventDefault();
                 if(typeof saveReminder === 'function') {
                     saveReminder();
                 } else { console.error("saveReminder function not found!"); }
             }
         });
    }
    // Optional: Add listener for Enter key in datetime-local input as well?
    // if (reminderTimeInput) { ... }

    // --- Event Delegation for Edit/Delete buttons in the list ---
    if (reminderListContainer) {
         reminderListContainer.addEventListener('click', (event) => {
              const target = event.target;
              const editButton = target.closest('.reminder-edit-btn');
              const deleteButton = target.closest('.reminder-delete-btn');

              if (editButton) {
                   const reminderId = editButton.dataset.reminderId;
                   if (reminderId && typeof handleEditReminderClick === 'function') {
                        handleEditReminderClick(reminderId);
                   } else if (!reminderId) { console.error("Edit button clicked but no reminder ID found."); }
                   else { console.error("handleEditReminderClick function not found!"); }
              } else if (deleteButton) {
                   const reminderId = deleteButton.dataset.reminderId;
                   if (reminderId && typeof deleteReminder === 'function') {
                        deleteReminder(reminderId);
                   } else if (!reminderId) { console.error("Delete button clicked but no reminder ID found."); }
                    else { console.error("deleteReminder function not found!"); }
              }
         });
    }

    // --- Event Delegation for Snooze buttons in the Alert Modal ---
    if (reminderAlertModal) {
         reminderAlertModal.addEventListener('click', (event) => {
              const target = event.target;
              const snoozeButton = target.closest('.reminder-snooze-btn'); // Target by class

              if (snoozeButton && snoozeButton.dataset.snooze) {
                   const snoozeMinutes = parseInt(snoozeButton.dataset.snooze, 10);
                   if (!isNaN(snoozeMinutes) && typeof handleReminderSnooze === 'function') {
                        handleReminderSnooze(snoozeMinutes); // Call function from modals.js
                   } else if (isNaN(snoozeMinutes)) { console.error("Invalid snooze duration found:", snoozeButton.dataset.snooze); }
                    else { console.error("handleReminderSnooze function not found!"); }
              }
         });
    }
    // Ack button listener (already existed, ensure it's correct)
    if (reminderAckButton && typeof closeReminderAlertModal === 'function') {
        reminderAckButton.addEventListener('click', closeReminderAlertModal);
    } else if (reminderAckButton) {
         console.error("closeReminderAlertModal function not found!");
    }
    // --- END: Updated Reminder Listeners ---


    // Project Management
    if (addProjectButton) addProjectButton.addEventListener('click', addProject);
    if (newProjectInput) newProjectInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addProject(); });

    // Settings Modal
    if (settingsButton) settingsButton.addEventListener('click', openModal);
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (saveSettingsButton) saveSettingsButton.addEventListener('click', () => {
        try { saveSettings(); startInactivityCountdown(); closeModal(); }
        catch (error) { console.error("Error during settings save process:", error); }
    });
    if (darkModeToggle) darkModeToggle.addEventListener('change', (e) => { settings.darkModeEnabled = e.target.checked; saveSettings(); });
    if (settingsModal) window.addEventListener('click', (event) => { if (event.target === settingsModal) closeModal(); });

    // Log View Navigation & Controls
    if (logPrevDayButton) logPrevDayButton.addEventListener('click', () => { const d = new Date(displayedLogDate); d.setDate(d.getDate() - 1); showLogDate(d); });
    if (logNextDayButton) logNextDayButton.addEventListener('click', () => { if (logNextDayButton.disabled) return; const d = new Date(displayedLogDate); d.setDate(d.getDate() + 1); showLogDate(d); });
    if (logTodayButton) logTodayButton.addEventListener('click', () => { showLogDate(new Date()); });
    if (logJumpDateInput) logJumpDateInput.addEventListener('change', (event) => {
        const dateValue = event.target.value;
        if (dateValue) { const selectedDate = parseDateStringUTC(dateValue); if (selectedDate) { showLogDate(selectedDate); } }
    });

    // Original Manual Log Form (Separate)
    if (toggleManualLogFormButton) toggleManualLogFormButton.addEventListener('click', () => { const isVisible = manualLogForm && manualLogForm.style.display === 'block'; toggleManualLogForm(!isVisible); });
    if (cancelManualLogButton) cancelManualLogButton.addEventListener('click', () => toggleManualLogForm(false));
    if (manualLogForm) manualLogForm.addEventListener('submit', handleManualLogSubmit);
    if (manualLogTaskInput) {
        manualLogTaskInput.addEventListener('input', (event) => {
             // NLP Listener
             if (typeof handleNlpTaskInput === 'function') { handleNlpTaskInput(event, 'manual'); } else { console.error("handleNlpTaskInput function not found."); }
             // Project Prediction Listener
             handleTaskInputForPrediction(manualLogTaskInput, manualLogProjectSelect, 'manual-log-quick-projects');
         });
    }
    if (manualLogProjectSelect) manualLogProjectSelect.addEventListener('change', (e) => {
        updateProjectLastUsed(e.target.value);
        updateQuickSelectActiveState('manual-log-quick-projects', 'manual-log-project');
    });
    if (manualLogForm) {
        manualLogForm.querySelectorAll('.time-suggestion-btn').forEach(button => {
            if (button.dataset.duration) {
                button.addEventListener('click', () => { const duration = parseInt(button.dataset.duration); if (!isNaN(duration)) handleTimeSuggestionClick(duration, 'manual'); });
            }
        });
        if (manualLogStartInput) manualLogStartInput.addEventListener('input', () => updateTimeSuggestionButtons('manual'));
    }

    // Interrupted Log Confirmation Modal
    if (interruptedLogLogButton) interruptedLogLogButton.addEventListener('click', () => { if (pendingInterruptedLogData) { addLogEntry(pendingInterruptedLogData); showNotification("Interrupted focus session logged.", "success"); } closeInterruptedLogConfirmationModal(); });
    if (interruptedLogDiscardButton) interruptedLogDiscardButton.addEventListener('click', closeInterruptedLogConfirmationModal);
    if (closeInterruptedLogConfirmationButton) closeInterruptedLogConfirmationButton.addEventListener('click', closeInterruptedLogConfirmationModal);
    if (interruptedLogConfirmationModal) window.addEventListener('click', (event) => { if (event.target === interruptedLogConfirmationModal) closeInterruptedLogConfirmationModal(); });

    // Generic Confirmation Modal
    if (confirmationConfirmButton) confirmationConfirmButton.addEventListener('click', () => { if (typeof confirmActionCallback === 'function') confirmActionCallback(); closeConfirmationModal(); });
    if (confirmationCancelButton) confirmationCancelButton.addEventListener('click', closeConfirmationModal);
    if (closeConfirmationButton) closeConfirmationButton.addEventListener('click', closeConfirmationModal);
    if (confirmationModal) window.addEventListener('click', (event) => { if (event.target === confirmationModal) closeConfirmationModal(); });

    // Edit Log Modal
    if (editLogForm) editLogForm.addEventListener('submit', handleEditLogSubmit);
    if (closeEditLogButton) closeEditLogButton.addEventListener('click', closeEditLogModal);
    if (cancelEditLogButton) cancelEditLogButton.addEventListener('click', closeEditLogModal);
    if (editLogModal) window.addEventListener('click', (event) => { if (event.target === editLogModal) closeEditLogModal(); });
    if (editLogTaskInput && editLogProjectSelect) {
        editLogTaskInput.addEventListener('input', () => {
            // *** Connect prediction listener ***
            if (typeof handleTaskInputForPrediction === 'function') { handleTaskInputForPrediction(editLogTaskInput, editLogProjectSelect, null); } // No quick projects for edit log
            else { console.error("handleTaskInputForPrediction function not found!"); }
        });
    } else { console.warn("Edit log task input or project select not found for adding prediction listener."); }

    // Edit Project Modal
    if (editProjectForm) editProjectForm.addEventListener('submit', handleEditProjectSubmit);
    if (closeEditProjectButton) closeEditProjectButton.addEventListener('click', closeEditProjectModal);
    if (cancelEditProjectButton) cancelEditProjectButton.addEventListener('click', closeEditProjectModal);
    if (editProjectModal) window.addEventListener('click', (event) => { if (event.target === editProjectModal) closeEditProjectModal(); });
    if (editProjectColorInput) editProjectColorInput.addEventListener('input', (e) => { if(editProjectColorValue) editProjectColorValue.textContent = e.target.value; });

    // Select Task Modal
    if (closeSelectTaskButton) closeSelectTaskButton.addEventListener('click', closeSelectTaskModal);
    if (selectTaskModal) window.addEventListener('click', (event) => { if (event.target === selectTaskModal) closeSelectTaskModal(); });
    if (startWithoutTaskButton) startWithoutTaskButton.addEventListener('click', () => { startTimerInternal(); closeSelectTaskModal(); });
    if (startWithTaskButton) startWithTaskButton.addEventListener('click', () => {
        const selectedRadio = selectTaskListDiv ? selectTaskListDiv.querySelector('input[name="select-task-radio"]:checked') : null;
        if (selectedRadio) { setActiveTask(selectedRadio.value); startTimerInternal(); closeSelectTaskModal(); } else { showNotification("Please select a task first.", "warning"); }
    });

    // Import/Export
    if (exportDataButton) exportDataButton.addEventListener('click', exportData);
    if (importDataButton) importDataButton.addEventListener('click', triggerImport);
    if (importFileInput) importFileInput.addEventListener('change', handleImportFile);

    // Inactivity Modal (Listeners set up in inactivity.js)

    // Aggregated Summary Listeners
    if (aggregatedSummaryButton) aggregatedSummaryButton.addEventListener('click', openAggregatedSummaryModal);
    if (closeAggregatedSummaryButton) closeAggregatedSummaryButton.addEventListener('click', closeAggregatedSummaryModal);
    if (aggregatedSummaryModal) window.addEventListener('click', (event) => { if (event.target === aggregatedSummaryModal) closeAggregatedSummaryModal(); });
    if (generateSummaryButton) generateSummaryButton.addEventListener('click', generateAndRenderAggregatedSummary);
    if (summaryStartDateInput) summaryStartDateInput.addEventListener('change', generateAndRenderAggregatedSummary);
    if (summaryEndDateInput) summaryEndDateInput.addEventListener('change', generateAndRenderAggregatedSummary);

    // Shortcut Add Task Modal Listeners
    if (closeShortcutAddTaskButton) closeShortcutAddTaskButton.addEventListener('click', closeShortcutAddTaskModal);
    if (shortcutAddTaskModal) window.addEventListener('click', (event) => { if (event.target === shortcutAddTaskModal) closeShortcutAddTaskModal(); });
    if (shortcutTaskInput) {
        shortcutTaskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleShortcutAddTaskSubmit(); }
            else if (e.key === 'Escape') { closeShortcutAddTaskModal(); }
        });
        // *** Connect prediction listener ***
        shortcutTaskInput.addEventListener('input', handleShortcutInputTyping);
    }
     if (shortcutAddTaskButton) {
          shortcutAddTaskButton.addEventListener('click', handleShortcutAddTaskSubmit);
     }

    // Global Keyboard Shortcut Listener
    window.addEventListener('keydown', handleGlobalShortcut);

    // Widget Listeners (Add, Modal, Delegation)
    if (addWidgetButton) addWidgetButton.addEventListener('click', openAddWidgetModal);
    if (closeAddWidgetModalButton) closeAddWidgetModalButton.addEventListener('click', closeAddWidgetModal);
    if (cancelAddWidgetButton) cancelAddWidgetButton.addEventListener('click', closeAddWidgetModal);
    if (saveWidgetButton) saveWidgetButton.addEventListener('click', handleSaveWidget);
    if (addWidgetModal) window.addEventListener('click', (event) => { if (event.target === addWidgetModal) closeAddWidgetModal(); });
    if (widgetContainer) {
        widgetContainer.addEventListener('click', handleWidgetAction); // Delegation for all widget actions
    }
} // --- END setupEventListeners ---

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("FocusFlow Initializing...");

    // Initialize main timer display
    if (progressRing) {
        progressRing.style.strokeDasharray = PROGRESS_RING_CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = PROGRESS_RING_CIRCUMFERENCE;
    } else { console.error("Progress ring element not found!"); }

    // Load data from storage
    loadSettings();
    loadProjects();
    loadTasks();
    loadLogs();
    loadReminders();
    loadWidgets(); // Load widget data

    // Initial UI rendering
    renderProjectsUI();
    renderTasks();
    setTimerForMode(currentMode);
    updateTimerDisplayAndProgress();
    showLogDate(new Date());
    renderWidgets(); // Render loaded widgets
    showView('timer'); // Start on timer view

    // Initialize start/pause button state
    if (startPauseIconWrapper) { startPauseIconWrapper.innerHTML = SVG_STRINGS.play; }
    else { console.error("Start/Pause icon wrapper not found during init!"); }
    if (startPauseButtonText) { startPauseButtonText.textContent = 'Start'; }

    // Setup all event listeners
    setupEventListeners();

    // Initialize audio context after a short delay
    setTimeout(initializeAudio, 150);

    // Initialize features that rely on loaded data/settings
    if (typeof initializeInactivityFeature === 'function') { initializeInactivityFeature(); }
    else { console.error("initializeInactivityFeature function not found!"); }

    if (typeof startReminderChecker === 'function') { startReminderChecker(); }
    else { console.error("startReminderChecker function not found!"); }

    console.log("FocusFlow Ready!");
});

// --- Helper for Aggregated Summary ---
/** Fetches data and renders the aggregated summary UI */
function generateAndRenderAggregatedSummary() {
    if (!summaryStartDateInput || !summaryEndDateInput) return;
    const startDateStr = summaryStartDateInput.value;
    const endDateStr = summaryEndDateInput.value;
    if (!startDateStr || !endDateStr) { showNotification("Please select both start and end dates.", "warning"); return; }
    const startDt = luxon.DateTime.fromISO(startDateStr);
    const endDt = luxon.DateTime.fromISO(endDateStr);
    if (!startDt.isValid || !endDt.isValid) { showNotification("Invalid date format selected.", "error"); return; }
    if (startDt > endDt) { showNotification("Start date cannot be after end date.", "warning"); return; }
    if (typeof generateAggregatedSummary === 'function' && typeof renderAggregatedSummaryUI === 'function') {
        const summaryData = generateAggregatedSummary(startDateStr, endDateStr);
        renderAggregatedSummaryUI(summaryData);
    } else { console.error("Summary generation/rendering functions not found!"); showNotification("Error generating summary.", "error"); }
}

// --- Project Prediction & Shortcut Logic ---
/** Handles user input in task fields to predict and update the project selection. */
function handleTaskInputForPrediction(taskInputElement, projectSelectElement, quickProjectContainerId) {
    const inputText = taskInputElement.value;
    if (!inputText.trim()) return;
    const predictedProjectId = findBestMatchingProject(inputText);
    if (predictedProjectId && projectSelectElement.value !== predictedProjectId) {
        projectSelectElement.value = predictedProjectId;
        if (quickProjectContainerId) {
            updateQuickSelectActiveState(quickProjectContainerId, projectSelectElement.id);
        }
         updateProjectLastUsed(predictedProjectId);
    }
}
/** Finds the best matching project ID for a given task description text. */
function findBestMatchingProject(inputText) {
    if (!inputText || !projects || projects.length <= 1) return DEFAULT_PROJECT_ID;
    const textLower = inputText.toLowerCase().trim();
    let bestMatch = { projectId: null, score: -1 };
    projects.forEach(project => {
        if (project.id === DEFAULT_PROJECT_ID) return;
        const projectNameLower = project.name.toLowerCase();
        let currentScore = 0;
        if (textLower.includes(projectNameLower)) { currentScore += 10 + projectNameLower.length; }
        if (currentScore < 10 && typeof levenshteinDistance === 'function') {
            const distance = levenshteinDistance(textLower.substring(0, 20), projectNameLower);
            const maxPossibleDistance = Math.max(textLower.substring(0, 20).length, projectNameLower.length);
            if (maxPossibleDistance > 0) { const similarity = 1 - (distance / maxPossibleDistance); currentScore += Math.max(0, similarity * 5); }
        } else if (currentScore < 10) { console.warn("levenshteinDistance function not found for project prediction."); }
        if (project.lastUsed && project.lastUsed > 0) { currentScore += 0.5; }
        if (currentScore > bestMatch.score) { bestMatch = { projectId: project.id, score: currentScore }; }
    });
    const MIN_SCORE_THRESHOLD = 3;
    return (bestMatch.score >= MIN_SCORE_THRESHOLD) ? bestMatch.projectId : DEFAULT_PROJECT_ID;
}
/** Handles the submission of the shortcut add task modal (via Enter key). */
function handleShortcutAddTaskSubmit() {
    const text = shortcutTaskInput ? shortcutTaskInput.value : '';
    if (!text.trim()) { showNotification("Task description cannot be empty.", "warning"); return; }
    const predictedProjectId = findBestMatchingProject(text) || DEFAULT_PROJECT_ID;
    if (typeof createAndAddTask === 'function') { if (createAndAddTask(text, predictedProjectId)) { closeShortcutAddTaskModal(); } }
    else { console.error("createAndAddTask function not found!"); showNotification("Error adding task.", "error"); }
}
/** Handles the input event in the shortcut modal to show predicted project. */
function handleShortcutInputTyping() {
    if (!shortcutTaskInput || !shortcutPredictedProject) return;
    const text = shortcutTaskInput.value;
    if (!text.trim()) { shortcutPredictedProject.textContent = ''; return; }
    const predictedProjectId = findBestMatchingProject(text);
    const predictedProject = projects.find(p => p.id === predictedProjectId);
    if (predictedProject && predictedProjectId !== DEFAULT_PROJECT_ID) {
        shortcutPredictedProject.textContent = `Project: ${predictedProject.name}`;
        shortcutPredictedProject.style.color = predictedProject.color || DEFAULT_PROJECT_COLOR;
    } else {
        shortcutPredictedProject.textContent = 'Project: Inbox';
        shortcutPredictedProject.style.color = DEFAULT_PROJECT_COLOR;
    }
}
/** Handles global keyboard shortcuts. */
function handleGlobalShortcut(event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;
    const isInputFocused = () => { const activeElement = document.activeElement; return activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable); };
    if (modifierKey && event.shiftKey && (event.key === 'h' || event.key === 'H' || event.key === 's' || event.key === 'S')) {
        event.preventDefault(); if (typeof openShortcutAddTaskModal === 'function') { openShortcutAddTaskModal(); } else { console.error("openShortcutAddTaskModal function not found!"); } return;
    }
    if (modifierKey && event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
         if (!isInputFocused()) { event.preventDefault(); console.log("Undo shortcut detected"); if (typeof undoLastTaskCompletion === 'function') { undoLastTaskCompletion(); } else { console.error("undoLastTaskCompletion function not found!"); showNotification("Undo function unavailable.", "error"); } } return;
    }
}

// --- Widget Functions ---

// js/main.js

/** Opens the modal to add a new widget. */
function openAddWidgetModal() {
    // Ensure required elements exist
    if (!addWidgetModal || !addWidgetTypeSelect || !addWidgetTitleInput) {
         console.error("Add widget modal elements not found!");
         showNotification("Cannot open Add Widget dialog.", "error");
         return;
    }
    // Reset form fields
    addWidgetTypeSelect.value = 'counter'; // Default to counter type
    addWidgetTitleInput.value = '';
    addWidgetModal.style.display = 'flex';
    // Focus the title input after a short delay for modal transition
    setTimeout(() => addWidgetTitleInput.focus(), 50);
}

/** Closes the modal to add a new widget. */
function closeAddWidgetModal() {
    if (addWidgetModal) {
        addWidgetModal.style.display = 'none';
    }
    // Optionally reset fields again on close, although openAddWidgetModal does it
    // if (addWidgetTypeSelect) addWidgetTypeSelect.value = 'counter';
    // if (addWidgetTitleInput) addWidgetTitleInput.value = '';
}

/** Handles saving a new widget from the modal. */
function handleSaveWidget() {
    // Ensure required elements exist
     if (!addWidgetTypeSelect || !addWidgetTitleInput) {
         console.error("Add widget modal form elements not found!");
         showNotification("Cannot save widget.", "error");
         return;
     }

    const type = addWidgetTypeSelect.value;
    const title = addWidgetTitleInput.value.trim();

    if (!type || !title) {
        showNotification("Please select a widget type and enter a title.", "warning");
        return;
    }

    // Call the main addWidget function (which handles state, saving, rendering)
    // Ensure addWidget function exists (defined elsewhere in main.js)
    if (typeof addWidget === 'function') {
         addWidget(type, title);
    } else {
         console.error("addWidget function is not defined!");
         showNotification("Error adding widget.", "error");
         // Don't close modal if addWidget failed
         return;
    }

    // Close the modal after successfully initiating the add process
    closeAddWidgetModal();
}

// Make sure the rest of your main.js file (including the actual addWidget function,
// setupEventListeners, etc.) is present as provided in the previous full file content.
/**
 * Adds a new widget to the state and UI.
 * @param {'counter' | 'countdown' | 'memory-game' | 'reflex-game'} type - The type of widget to add.
 * @param {string} title - The user-defined title for the widget.
 */
function addWidget(type, title) {
    let initialState;
    if (type === 'counter') {
        initialState = { value: 0 };
    } else if (type === 'countdown') {
        initialState = { timeRemaining: 0, totalSeconds: 0, isRunning: false };
    // --- START ADDED CODE ---
    } else if (type === 'memory-game') {
        initialState = { cards: [], flippedIndices: [], matchedPairs: [], moves: 0, isGameActive: false, isComplete: false };
    } else if (type === 'reflex-game') {
        initialState = { score: 0, misses: 0, isActive: false, gameStatus: 'ready', targetTimeoutId: null, roundHits: 0, roundTargetsShown: 0 };
    // --- END ADDED CODE ---
    } else {
        console.error("Unknown widget type:", type);
        return; // Don't add unknown types
    }

    const newWidget = {
        id: generateUniqueId('widget'),
        type: type,
        title: title,
        state: initialState
    };

    widgets.push(newWidget);
    saveWidgets(); // Save the updated widgets array
    renderWidgets(); // Re-render the widgets UI
    showNotification(`Widget "${title}" added!`, 'success');

     // Automatically setup memory game board after adding
     if(type === 'memory-game') {
          // Find the newly added element (might need slight delay or better way)
          setTimeout(() => {
              const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${newWidget.id}"]`);
              if(widgetElement && typeof renderMemoryGameBoard === 'function') {
                  renderMemoryGameBoard(newWidget.id, widgetElement);
              }
          }, 50);
     }
}

/**
 * Deletes a widget by its ID.
 * @param {string} widgetId - The ID of the widget to delete.
 */
function deleteWidget(widgetId) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) { console.error("Widget not found for deletion:", widgetId); return; }
    const widgetTitle = widgets[widgetIndex].title;

    // Stop countdown interval if deleting a running countdown
    if (widgets[widgetIndex].type === 'countdown' && activeCountdownIntervals[widgetId]) {
        clearInterval(activeCountdownIntervals[widgetId]); delete activeCountdownIntervals[widgetId];
    }
    // --- START ADDED CODE: Clear game timers on delete ---
    if (widgets[widgetIndex].type === 'reflex-game' && widgets[widgetIndex].state.targetTimeoutId) {
        clearTimeout(widgets[widgetIndex].state.targetTimeoutId);
    }
    // Add similar cleanup for memory game timeouts if any are added
    // --- END ADDED CODE ---

    showConfirmationModal(`Delete widget "${widgetTitle}"?`, () => {
        widgets.splice(widgetIndex, 1);
        saveWidgets();
        renderWidgets();
        showNotification(`Widget "${widgetTitle}" deleted.`, 'warning');
    });
}

/**
 * Handles actions triggered by clicking buttons OR game elements within widgets using event delegation.
 * @param {Event} event - The click event object.
 */
function handleWidgetAction(event) {
    const targetElement = event.target;
    const widgetCard = targetElement.closest('.widget-card');
    if (!widgetCard) return; // Click wasn't inside a widget card

    const widgetId = widgetCard.dataset.widgetId;
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) { console.error("Widget state not found for ID:", widgetId); return; }

    // --- Check for specific button actions FIRST ---
    const button = targetElement.closest('button');
    if (button && button.dataset.action) {
        const action = button.dataset.action;

        // Handle specific actions based on widget type and action name
        switch (widget.type) {
            case 'counter':
                switch (action) {
                    case 'increment': widget.state.value++; break;
                    case 'decrement': widget.state.value--; break;
                    case 'reset': widget.state.value = 0; break;
                    case 'delete': deleteWidget(widgetId); return; // Early return for delete
                    default: console.warn("Unknown counter action:", action); return;
                }
                saveWidgets();
                const displayElement = widgetCard.querySelector('[data-role="display"]');
                if (displayElement) displayElement.textContent = widget.state.value;
                return; // Action handled

            case 'countdown':
                switch (action) {
                    case 'start': startCustomCountdown(widgetId, widgetCard); break;
                    case 'pause': pauseCustomCountdown(widgetId, widgetCard); break;
                    case 'reset': resetCustomCountdown(widgetId, widgetCard); break;
                    case 'delete': deleteWidget(widgetId); return; // Early return for delete
                    default: console.warn("Unknown countdown action:", action); return;
                }
                // Countdown functions handle their own saves/updates
                return; // Action handled

            // --- START ADDED GAME ACTIONS ---
            case 'memory-game':
                 switch(action) {
                     case 'memory-new-game': setupMemoryGame(widgetId); break;
                     case 'delete': deleteWidget(widgetId); return;
                     default: console.warn("Unknown memory game action:", action); return;
                 }
                 return; // Action handled

             case 'reflex-game':
                 switch(action) {
                     case 'reflex-start-round': startReflexRound(widgetId); break;
                     case 'reflex-reset-score': resetReflexScore(widgetId); break;
                     case 'delete': deleteWidget(widgetId); return;
                     default: console.warn("Unknown reflex game action:", action); return;
                 }
                 return; // Action handled
            // --- END ADDED GAME ACTIONS ---
        }
    } // --- End check for button actions ---


    // --- Check for clicks on game elements if no button action was handled ---
    if (widget.type === 'memory-game') {
        const clickedCard = targetElement.closest('.memory-card');
        // Check if the click was on a card itself (and not matched, game active - handled inside handler)
        if (clickedCard && !clickedCard.classList.contains('is-matched')) {
             handleMemoryCardClick(event); // Pass the event object
             return; // Game element click handled
        }
    } else if (widget.type === 'reflex-game') {
         const gameArea = widgetCard.querySelector('[data-role="game-area"]');
         const target = widgetCard.querySelector('[data-role="target"]');

         // Check if click was on the target
         if (target && target.contains(targetElement)) {
             handleReflexTargetClick(widgetId, event); // Pass ID and event
             return; // Target click handled
         }
         // Check if click was within the game area (but not the target itself) - counts as miss
         else if (gameArea && gameArea.contains(targetElement)) {
              handleReflexAreaClick(widgetId, event); // Pass ID and event
              return; // Area click handled
         }
    }

    // Add handlers for other widget types here
}


// js/main.js (within the file)

/**
 * Updates the display of a specific countdown widget.
 * @param {string} widgetId - The ID of the widget to update.
 * @param {HTMLElement} widgetCardElement - The DOM element of the widget card.
 */
function updateCustomCountdownDisplay(widgetId, widgetCardElement) {
    const widget = widgets.find(w => w.id === widgetId);
    // Ensure widget exists, is a countdown, and the element is valid
    if (!widget || widget.type !== 'countdown' || !widgetCardElement) return;

    const displayElement = widgetCardElement.querySelector('[data-role="display"]');
    const startButton = widgetCardElement.querySelector('[data-action="start"]');
    const pauseButton = widgetCardElement.querySelector('[data-action="pause"]');
    const durationInput = widgetCardElement.querySelector('[data-role="duration-input"]');

    // Update timer display text
    if (displayElement) {
        // Use formatTime utility, default to 0 if timeRemaining is somehow undefined
        displayElement.textContent = formatTime(widget.state.timeRemaining || 0);
    }
    // Update button enabled/disabled states based on whether the timer is running
    if (startButton) startButton.disabled = widget.state.isRunning;
    if (pauseButton) pauseButton.disabled = !widget.state.isRunning;
    // Disable duration input while timer is running
    if (durationInput) durationInput.disabled = widget.state.isRunning;
}

/**
 * Starts a specific custom countdown timer.
 * @param {string} widgetId - The ID of the widget to start.
 * @param {HTMLElement} widgetCardElement - The DOM element of the widget card.
 */
function startCustomCountdown(widgetId, widgetCardElement) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1 || widgets[widgetIndex].type !== 'countdown') return;

    const widget = widgets[widgetIndex];
    if (widget.state.isRunning) return; // Already running, do nothing

    const durationInput = widgetCardElement?.querySelector('[data-role="duration-input"]'); // Use optional chaining
    // Parse duration, default to 0 if input doesn't exist or is invalid
    const durationMinutes = parseInt(durationInput?.value || '0');

    // Only start if duration is valid OR if resuming a previously paused timer
    if (durationMinutes <= 0 && widget.state.timeRemaining <= 0) {
        showNotification("Please enter a valid duration (minutes).", "warning");
        return;
    }

    // If starting from 0 or reset state, set the total duration and remaining time
    if (widget.state.timeRemaining <= 0) {
        widget.state.totalSeconds = durationMinutes * 60;
        widget.state.timeRemaining = widget.state.totalSeconds;
    }
    // If resuming, timeRemaining is already set, just ensure totalSeconds is valid
    else if (widget.state.totalSeconds <= 0) {
         // If resuming but totalSeconds wasn't set, estimate from duration input or remaining time
         widget.state.totalSeconds = durationMinutes > 0 ? durationMinutes * 60 : widget.state.timeRemaining;
    }


    widget.state.isRunning = true;
    clearInterval(activeCountdownIntervals[widgetId]); // Clear previous interval for this widget just in case
    updateCustomCountdownDisplay(widgetId, widgetCardElement); // Update UI immediately (disable input/buttons)
    saveWidgets(); // Save the running state

    // --- Start the interval ---
    activeCountdownIntervals[widgetId] = setInterval(() => {
        // It's safer to find the widget again inside interval in case the array was modified elsewhere
        const currentWidget = widgets.find(w => w.id === widgetId);

        // Stop interval if widget removed or paused externally
        if (!currentWidget || !currentWidget.state.isRunning) {
            clearInterval(activeCountdownIntervals[widgetId]);
            delete activeCountdownIntervals[widgetId];
            return;
        }

        currentWidget.state.timeRemaining--;

        // Update display within the interval
        // Find the element again as well, though less critical usually
        const currentCard = document.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
        if (currentCard) {
            updateCustomCountdownDisplay(widgetId, currentCard);
        }

        // Check if timer reached zero
        if (currentWidget.state.timeRemaining <= 0) {
            // Find the card element again inside the interval callback just in case
            const finalCard = document.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
            // Stop the timer visually and clear interval (pauseCustomCountdown handles this)
            pauseCustomCountdown(widgetId, finalCard);
            showNotification(`Countdown "${currentWidget.title}" finished!`, "success");
            if(typeof playNotificationSound === 'function') { playNotificationSound(); } // Play sound
            // Save the final state (timeRemaining=0, isRunning=false) - pause handles save
        }
        // No need to saveWidgets() on every tick, only on state changes (start/pause/reset/finish)
    }, 1000); // Update every second
}

/**
 * Pauses a specific custom countdown timer.
 * @param {string} widgetId - The ID of the widget to pause.
 * @param {HTMLElement} widgetCardElement - The DOM element of the widget card.
 */
function pauseCustomCountdown(widgetId, widgetCardElement) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1 || widgets[widgetIndex].type !== 'countdown') return;

    const widget = widgets[widgetIndex];
    if (!widget.state.isRunning) return; // Not running, do nothing

    widget.state.isRunning = false;
    // Clear the interval associated with this widget
    clearInterval(activeCountdownIntervals[widgetId]);
    delete activeCountdownIntervals[widgetId]; // Remove interval ID reference

    // Update UI if element provided (enable input/buttons)
    if(widgetCardElement) {
        updateCustomCountdownDisplay(widgetId, widgetCardElement);
    }
    saveWidgets(); // Save the paused state
}

/**
 * Resets a specific custom countdown timer.
 * @param {string} widgetId - The ID of the widget to reset.
 * @param {HTMLElement} widgetCardElement - The DOM element of the widget card.
 */
function resetCustomCountdown(widgetId, widgetCardElement) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1 || widgets[widgetIndex].type !== 'countdown') return;

    const widget = widgets[widgetIndex];

    // Stop interval if running
    if (widget.state.isRunning) {
        clearInterval(activeCountdownIntervals[widgetId]);
        delete activeCountdownIntervals[widgetId];
    }

    // Reset state properties
    widget.state.isRunning = false;
    widget.state.timeRemaining = 0;
    widget.state.totalSeconds = 0; // Reset total duration as well

    // Reset input field value (optional - keeps last duration if commented out)
    const durationInput = widgetCardElement?.querySelector('[data-role="duration-input"]');
    if (durationInput) durationInput.value = ''; // Clear input on reset


    // Update display (should show 0:00) and enable buttons/input
    if(widgetCardElement) {
        updateCustomCountdownDisplay(widgetId, widgetCardElement);
    }
    saveWidgets(); // Save the reset state
}

// --- START: Memory Game Logic ---

/** Sets up a new memory game: creates pairs, shuffles, resets state */
function setupMemoryGame(widgetId) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1 || widgets[widgetIndex].type !== 'memory-game') return;

    const gameSymbols = [...MEMORY_GAME_SYMBOLS]; // Copy symbols
    const cards = [...gameSymbols, ...gameSymbols]; // Create pairs
    shuffleArray(cards); // Shuffle them

    // Reset widget state
    widgets[widgetIndex].state = {
        cards: cards,
        flippedIndices: [],
        matchedPairs: [],
        moves: 0,
        isGameActive: true, // Start the game immediately
        isComplete: false
    };

    saveWidgets(); // Save the new game state

    // Find the widget element and re-render the board
    const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
    if (widgetElement && typeof renderMemoryGameBoard === 'function') {
        renderMemoryGameBoard(widgetId, widgetElement);
    }
}

/** Handles clicks on memory game cards */
function handleMemoryCardClick(event) {
    const cardElement = event.target.closest('.memory-card');
    if (!cardElement) return;

    const widgetCard = cardElement.closest('.widget-card');
    const widgetId = widgetCard?.dataset.widgetId;
    const cardIndex = parseInt(cardElement.dataset.cardIndex);

    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return;
    const widget = widgets[widgetIndex];

    // Prevent action if game not active, card already matched, or already flipped, or 2 cards already flipped
    if (!widget.state.isGameActive || widget.state.flippedIndices.includes(cardIndex) || widget.state.flippedIndices.length >= 2) {
        return;
    }

    // --- Flip the card ---
    widget.state.flippedIndices.push(cardIndex);
    cardElement.classList.add('is-flipped'); // Immediate visual feedback

    // --- Check for match if two cards are flipped ---
    if (widget.state.flippedIndices.length === 2) {
        widget.state.moves++; // Increment move count
        const [index1, index2] = widget.state.flippedIndices;
        const cardValue1 = widget.state.cards[index1];
        const cardValue2 = widget.state.cards[index2];

        if (cardValue1 === cardValue2) {
            // Match found!
            widget.state.matchedPairs.push(cardValue1);
            // Mark cards visually as matched immediately
            const card1 = widgetCard.querySelector(`[data-card-index="${index1}"]`);
            const card2 = widgetCard.querySelector(`[data-card-index="${index2}"]`);
            if (card1) card1.classList.add('is-matched');
            if (card2) card2.classList.add('is-matched');
            // Clear flipped indices for next turn
            widget.state.flippedIndices = [];

             // Check for game completion
             if (widget.state.matchedPairs.length === MEMORY_GAME_SYMBOLS.length) {
                 widget.state.isComplete = true;
                 widget.state.isGameActive = false; // Game ends
                 showNotification(`Memory Game Complete in ${widget.state.moves} moves! 🎉`, "success");
                  if(typeof updateMemoryGameInfo === 'function') { updateMemoryGameInfo(widgetId, widgetCard);} // Update info display
                  // Update button text
                  const newGameButton = widgetCard.querySelector('[data-action="memory-new-game"]');
                  if(newGameButton) newGameButton.textContent = "Play Again?";
             }

        } else {
            // No match - flip back after a delay
            // Prevent further clicks during the delay
            widget.state.isGameActive = false;
            setTimeout(() => {
                widget.state.flippedIndices.forEach(idx => {
                    const cardToFlip = widgetCard.querySelector(`[data-card-index="${idx}"]`);
                    if (cardToFlip) cardToFlip.classList.remove('is-flipped');
                });
                widget.state.flippedIndices = [];
                widget.state.isGameActive = true; // Allow clicks again
                if(typeof updateMemoryGameInfo === 'function') { updateMemoryGameInfo(widgetId, widgetCard); } // Update moves display
            }, 1000); // 1 second delay
        }
    }

    // Save state and update info display (moves count)
    saveWidgets();
    if(typeof updateMemoryGameInfo === 'function') { updateMemoryGameInfo(widgetId, widgetCard); }
}

// --- END: Memory Game Logic ---


// --- START: Reflex Game Logic ---

/** Starts a round of the reflex game */
function startReflexRound(widgetId) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1 || widgets[widgetIndex].type !== 'reflex-game') return;
    const widget = widgets[widgetIndex];

    // Don't start if already playing
    if (widget.state.gameStatus === 'playing') return;

    // Reset round state
    widget.state.gameStatus = 'playing';
    widget.state.roundHits = 0;
    widget.state.roundTargetsShown = 0;
    widget.state.isActive = false; // Target not initially active

    // Clear any existing target timeout
    if (widget.state.targetTimeoutId) {
         clearTimeout(widget.state.targetTimeoutId);
         widget.state.targetTimeoutId = null;
    }

    saveWidgets();

    // Update display (e.g., disable start button)
    const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
    if (widgetElement && typeof updateReflexGameDisplay === 'function') {
        updateReflexGameDisplay(widgetId, widgetElement);
    }

    showNotification(`Reflex Round Started! (${REFLEX_GAME_ROUNDS} targets)`, "info", 1500);

    // Start the first target showing process
    showReflexTarget(widgetId);
}

/** Shows a target at a random position after a random delay */
function showReflexTarget(widgetId) {
     const widgetIndex = widgets.findIndex(w => w.id === widgetId);
     if (widgetIndex === -1) return;
     const widget = widgets[widgetIndex];

     // Stop if game status changed
     if (widget.state.gameStatus !== 'playing') return;

     // Clear previous timeout just in case
     if (widget.state.targetTimeoutId) clearTimeout(widget.state.targetTimeoutId);

     // Calculate random delay
     const delay = Math.random() * (REFLEX_GAME_DELAY_MAX - REFLEX_GAME_DELAY_MIN) + REFLEX_GAME_DELAY_MIN;

     widget.state.targetTimeoutId = setTimeout(() => {
          const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
          const gameArea = widgetElement?.querySelector('[data-role="game-area"]');
          const targetElement = widgetElement?.querySelector('[data-role="target"]');

          if (gameArea && targetElement) {
               // Calculate random position within the game area
               const areaRect = gameArea.getBoundingClientRect();
               const targetSize = 40; // Must match CSS
               const maxX = areaRect.width - targetSize;
               const maxY = areaRect.height - targetSize;
               const randomX = Math.max(0, Math.floor(Math.random() * maxX));
               const randomY = Math.max(0, Math.floor(Math.random() * maxY));

               // Position and show the target
               targetElement.style.left = `${randomX}px`;
               targetElement.style.top = `${randomY}px`;
               targetElement.style.display = 'block';
               targetElement.classList.remove('hit'); // Ensure 'hit' class is removed

               widget.state.isActive = true; // Target is now active
               widget.state.roundTargetsShown++; // Increment shown count

               // Set timeout to hide the target if not clicked (counts as miss)
               widget.state.targetTimeoutId = setTimeout(() => {
                   if (widget.state.isActive) { // Check if it wasn't already clicked
                        handleReflexTargetClick(widgetId, null, true); // Pass 'missed=true'
                   }
               }, REFLEX_GAME_TARGET_DURATION);

               saveWidgets(); // Save state with active target
          }

     }, delay);
     saveWidgets(); // Save state with new timeout ID
}

/** Handles click on the reflex game target */
function handleReflexTargetClick(widgetId, event, missed = false) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return;
    const widget = widgets[widgetIndex];

    // Only process if target was active
    if (!widget.state.isActive) return;

     // Clear the timeout that would hide the target
     if (widget.state.targetTimeoutId) clearTimeout(widget.state.targetTimeoutId);
     widget.state.targetTimeoutId = null;
     widget.state.isActive = false; // Target is no longer active

    const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
    const targetElement = widgetElement?.querySelector('[data-role="target"]');

    if (missed) {
        widget.state.misses++;
         if (targetElement) targetElement.style.display = 'none'; // Hide target immediately on miss
    } else {
        widget.state.score++;
        widget.state.roundHits++;
        if (targetElement) {
            // Optional: Visual feedback for hit
            targetElement.classList.add('hit');
            // Hide after a very short delay
            setTimeout(() => { targetElement.style.display = 'none'; }, 150);
        }
    }

    // Check if round is over
    if (widget.state.roundTargetsShown >= REFLEX_GAME_ROUNDS) {
        widget.state.gameStatus = 'finished';
        showNotification(`Reflex Round Over! Score: ${widget.state.roundHits}/${REFLEX_GAME_ROUNDS}`, "success");
    } else {
        // Schedule the next target
        showReflexTarget(widgetId);
    }

    saveWidgets();
    // Update display
    if (widgetElement && typeof updateReflexGameDisplay === 'function') {
        updateReflexGameDisplay(widgetId, widgetElement);
    }
}

/** Handles click on the reflex game area (a miss) */
function handleReflexAreaClick(widgetId, event) {
     const widgetIndex = widgets.findIndex(w => w.id === widgetId);
     if (widgetIndex === -1) return;
     const widget = widgets[widgetIndex];

     // Only count as miss if game is playing and target is NOT active (otherwise target click handles it)
     if (widget.state.gameStatus === 'playing' && !widget.state.isActive) {
         // Could increment a general miss counter, or just ignore clicks in the area when target not active
         // Let's just ignore it for simplicity for now, misses are handled by target timeout.
         console.log("Reflex area clicked while target not active.");
     } else if (widget.state.gameStatus === 'playing' && widget.state.isActive) {
         // Clicked area while target WAS active - counts as a miss for the current target
          // Clear the timeout that would hide the target
          if (widget.state.targetTimeoutId) clearTimeout(widget.state.targetTimeoutId);
          widget.state.targetTimeoutId = null;
          widget.state.isActive = false; // Target is no longer active

          widget.state.misses++;

           const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
           const targetElement = widgetElement?.querySelector('[data-role="target"]');
           if (targetElement) targetElement.style.display = 'none'; // Hide target

           // Check if round is over
           if (widget.state.roundTargetsShown >= REFLEX_GAME_ROUNDS) {
               widget.state.gameStatus = 'finished';
               showNotification(`Reflex Round Over! Score: ${widget.state.roundHits}/${REFLEX_GAME_ROUNDS}`, "success");
           } else {
               // Schedule the next target
               showReflexTarget(widgetId);
           }
            saveWidgets();
            if (widgetElement && typeof updateReflexGameDisplay === 'function') {
                updateReflexGameDisplay(widgetId, widgetElement);
            }
     }
}

/** Resets the overall score/misses for the reflex game */
function resetReflexScore(widgetId) {
     const widgetIndex = widgets.findIndex(w => w.id === widgetId);
     if (widgetIndex === -1 || widgets[widgetIndex].type !== 'reflex-game') return;
     const widget = widgets[widgetIndex];

     widget.state.score = 0;
     widget.state.misses = 0;
     widget.state.roundHits = 0; // Also reset round hits if desired
     // Optionally reset gameStatus to 'ready' if not playing
     // if(widget.state.gameStatus !== 'playing') widget.state.gameStatus = 'ready';

     saveWidgets();
     const widgetElement = widgetContainer?.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
     if (widgetElement && typeof updateReflexGameDisplay === 'function') {
         updateReflexGameDisplay(widgetId, widgetElement);
     }
      showNotification(`Reflex game score reset.`, "info");
}

// --- END: Reflex Game Logic ---


// --- End Widget Functions ---

// Add this to your main.js or near the end of index.html script block

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js') // Ensure path is correct
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}