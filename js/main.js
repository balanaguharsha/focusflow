// js/main.js

// --- Global Event Listeners Setup ---

/**
 * Attaches all necessary event listeners to the DOM elements.
 */
function setupEventListeners() {
    // Tab Switching
    if (tabTimer) tabTimer.addEventListener('click', () => showView('timer'));
    if (tabLog) tabLog.addEventListener('click', () => showView('log'));
    if (tabReminders) tabReminders.addEventListener('click', () => showView('reminders'));
    if (tabWidgets) tabWidgets.addEventListener('click', () => showView('widgets')); // Widget Tab

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
        newTaskInput.addEventListener('input', () => handleTaskInputForPrediction(newTaskInput, newTaskProjectSelect, 'new-task-quick-projects'));
    }
    if (newTaskProjectSelect) newTaskProjectSelect.addEventListener('change', (e) => {
        updateProjectLastUsed(e.target.value);
        updateQuickSelectActiveState('new-task-quick-projects', 'new-task-project');
    });

     // Reminder Listeners
     if (addReminderButton) addReminderButton.addEventListener('click', addReminder);
     if (reminderTextInput) {
          reminderTextInput.addEventListener('input', (event) => {
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
          reminderTextInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') { e.preventDefault(); if(typeof addReminder === 'function') { addReminder(); } else { console.error("addReminder function not found!"); } }
          });
     }
    if (reminderAckButton) reminderAckButton.addEventListener('click', closeReminderAlertModal);
    if (reminderSnoozeButton) reminderSnoozeButton.addEventListener('click', handleReminderSnooze);

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
             if (typeof handleNlpTaskInput === 'function') { handleNlpTaskInput(event, 'manual'); } else { console.error("handleNlpTaskInput function not found."); }
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
            if (typeof handleTaskInputForPrediction === 'function') { handleTaskInputForPrediction(editLogTaskInput, editLogProjectSelect, null); }
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
        shortcutTaskInput.addEventListener('input', handleShortcutInputTyping);
    }

    // Global Keyboard Shortcut Listener
    window.addEventListener('keydown', handleGlobalShortcut);

    // --- Widget Listeners ---
    // Add Widget Modal Controls
    if (addWidgetButton) addWidgetButton.addEventListener('click', openAddWidgetModal);
    if (closeAddWidgetModalButton) closeAddWidgetModalButton.addEventListener('click', closeAddWidgetModal);
    if (cancelAddWidgetButton) cancelAddWidgetButton.addEventListener('click', closeAddWidgetModal);
    if (saveWidgetButton) saveWidgetButton.addEventListener('click', handleSaveWidget);
    if (addWidgetModal) window.addEventListener('click', (event) => { if (event.target === addWidgetModal) closeAddWidgetModal(); });

    // Event Delegation for dynamic widget controls
    if (widgetContainer) {
        widgetContainer.addEventListener('click', handleWidgetAction);
    }
    // --- End Widget Listeners ---
}

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

    // Restart any countdowns that were running (optional, decided against for now)
    // restartRunningCountdowns();

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
function handleTaskInputForPrediction(taskInputElement, projectSelectElement, quickProjectContainerId) { /* ... (keep existing code) ... */ }
/** Handles the global keyboard shortcut (Cmd/Ctrl+Shift+H/S). */
function handleGlobalShortcut(event) { /* ... (keep existing code) ... */ }
/** Finds the best matching project ID for a given task description text. */
function findBestMatchingProject(inputText) { /* ... (keep existing code) ... */ }
/** Handles the submission of the shortcut add task modal (via Enter key). */
function handleShortcutAddTaskSubmit() { /* ... (keep existing code) ... */ }
/** Handles the input event in the shortcut modal to show predicted project. */
function handleShortcutInputTyping() { /* ... (keep existing code) ... */ }


// --- Widget Functions ---

/** Opens the modal to add a new widget. */
function openAddWidgetModal() {
    if (!addWidgetModal) return;
    // Reset form fields
    if (addWidgetTypeSelect) addWidgetTypeSelect.value = 'counter';
    if (addWidgetTitleInput) addWidgetTitleInput.value = '';
    addWidgetModal.style.display = 'flex';
    if (addWidgetTitleInput) addWidgetTitleInput.focus(); // Focus title input
}

/** Closes the modal to add a new widget. */
function closeAddWidgetModal() {
    if (addWidgetModal) addWidgetModal.style.display = 'none';
}

/** Handles saving a new widget from the modal. */
function handleSaveWidget() {
    const type = addWidgetTypeSelect?.value;
    const title = addWidgetTitleInput?.value.trim();

    if (!type || !title) {
        showNotification("Please select a widget type and enter a title.", "warning");
        return;
    }

    addWidget(type, title);
    closeAddWidgetModal();
}

/**
 * Adds a new widget to the state and UI.
 * @param {'counter' | 'countdown'} type - The type of widget to add.
 * @param {string} title - The user-defined title for the widget.
 */
function addWidget(type, title) {
    let initialState;
    if (type === 'counter') {
        initialState = { value: 0 };
    } else if (type === 'countdown') {
        initialState = { timeRemaining: 0, totalSeconds: 0, isRunning: false };
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
}

/**
 * Deletes a widget by its ID.
 * @param {string} widgetId - The ID of the widget to delete.
 */
function deleteWidget(widgetId) {
    const widgetIndex = widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
        console.error("Widget not found for deletion:", widgetId);
        return;
    }
    const widgetTitle = widgets[widgetIndex].title;

    // Stop countdown interval if deleting a running countdown
    if (widgets[widgetIndex].type === 'countdown' && activeCountdownIntervals[widgetId]) {
        clearInterval(activeCountdownIntervals[widgetId]);
        delete activeCountdownIntervals[widgetId];
    }

    // Show confirmation
    showConfirmationModal(`Delete widget "${widgetTitle}"?`, () => {
        widgets.splice(widgetIndex, 1); // Remove from array
        saveWidgets(); // Save changes
        renderWidgets(); // Update UI
        showNotification(`Widget "${widgetTitle}" deleted.`, 'warning');
    });
}

/**
 * Handles actions triggered by clicking buttons within widgets using event delegation.
 * @param {Event} event - The click event object.
 */
function handleWidgetAction(event) {
    const button = event.target.closest('button'); // Find the clicked button
    if (!button) return; // Exit if click wasn't on a button

    const action = button.dataset.action; // Get action from data-action attribute
    const widgetCard = button.closest('.widget-card');
    const widgetId = widgetCard?.dataset.widgetId; // Get widget ID from parent card

    if (!action || !widgetId) return; // Exit if no action or widget ID found

    // Find the widget in the state array
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) {
        console.error("Widget state not found for ID:", widgetId);
        return;
    }

    // Perform action based on widget type and action name
    if (widget.type === 'counter') {
        switch (action) {
            case 'increment':
                widget.state.value++;
                break;
            case 'decrement':
                widget.state.value--;
                break;
            case 'reset':
                widget.state.value = 0;
                break;
            case 'delete':
                deleteWidget(widgetId);
                return; // Deletion handles its own save/render
            default:
                console.warn("Unknown counter action:", action);
                return;
        }
        saveWidgets(); // Save after counter update
        // Update only the specific counter display for efficiency
        const displayElement = widgetCard.querySelector('[data-role="display"]');
        if (displayElement) displayElement.textContent = widget.state.value;

    } else if (widget.type === 'countdown') {
        switch (action) {
            case 'start':
                startCustomCountdown(widgetId, widgetCard);
                break;
            case 'pause':
                pauseCustomCountdown(widgetId, widgetCard);
                break;
            case 'reset':
                resetCustomCountdown(widgetId, widgetCard);
                break;
            case 'delete':
                deleteWidget(widgetId);
                return; // Deletion handles its own save/render
            default:
                console.warn("Unknown countdown action:", action);
                return;
        }
        // Countdown functions handle their own saving and UI updates
    }
    // Add handlers for other widget types here
}


/**
 * Updates the display of a specific countdown widget.
 * @param {string} widgetId - The ID of the widget to update.
 * @param {HTMLElement} widgetCardElement - The DOM element of the widget card.
 */
function updateCustomCountdownDisplay(widgetId, widgetCardElement) {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || widget.type !== 'countdown' || !widgetCardElement) return;

    const displayElement = widgetCardElement.querySelector('[data-role="display"]');
    const startButton = widgetCardElement.querySelector('[data-action="start"]');
    const pauseButton = widgetCardElement.querySelector('[data-action="pause"]');
    const durationInput = widgetCardElement.querySelector('[data-role="duration-input"]');

    if (displayElement) {
        displayElement.textContent = formatTime(widget.state.timeRemaining || 0);
    }
    // Update button states
    if (startButton) startButton.disabled = widget.state.isRunning;
    if (pauseButton) pauseButton.disabled = !widget.state.isRunning;
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
    if (widget.state.isRunning) return; // Already running

    const durationInput = widgetCardElement.querySelector('[data-role="duration-input"]');
    const durationMinutes = parseInt(durationInput?.value || '0');

    if (durationMinutes <= 0 && widget.state.timeRemaining <= 0) {
        showNotification("Please enter a valid duration (minutes).", "warning");
        return;
    }

    // If starting from 0 or reset state, set the total duration
    if (widget.state.timeRemaining <= 0) {
        widget.state.totalSeconds = durationMinutes * 60;
        widget.state.timeRemaining = widget.state.totalSeconds;
    }
    // If resuming, use the existing remaining time

    widget.state.isRunning = true;
    clearInterval(activeCountdownIntervals[widgetId]); // Clear previous interval for this widget
    updateCustomCountdownDisplay(widgetId, widgetCardElement); // Update UI immediately
    saveWidgets(); // Save running state

    activeCountdownIntervals[widgetId] = setInterval(() => {
        // Re-find widget in case state array reference changes (though unlikely here)
        const currentWidget = widgets.find(w => w.id === widgetId);
        if (!currentWidget || !currentWidget.state.isRunning) {
            // Stop interval if widget removed or paused externally
            clearInterval(activeCountdownIntervals[widgetId]);
            delete activeCountdownIntervals[widgetId];
            return;
        }

        currentWidget.state.timeRemaining--;

        // Update display within the interval
        const currentCard = document.querySelector(`.widget-card[data-widget-id="${widgetId}"]`);
        if (currentCard) {
            updateCustomCountdownDisplay(widgetId, currentCard);
        }

        if (currentWidget.state.timeRemaining <= 0) {
            pauseCustomCountdown(widgetId, currentCard); // Stop timer visually
            showNotification(`Countdown "${currentWidget.title}" finished!`, "success");
            playNotificationSound(); // Play sound
            // Optionally trigger reminder here if that feature is re-added
            saveWidgets(); // Save the final state (timeRemaining=0, isRunning=false)
        }
        // No need to saveWidgets() on every tick, only on state changes (start/pause/reset/finish)
    }, 1000);
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
    if (!widget.state.isRunning) return; // Not running

    widget.state.isRunning = false;
    clearInterval(activeCountdownIntervals[widgetId]);
    delete activeCountdownIntervals[widgetId]; // Remove interval ID reference

    updateCustomCountdownDisplay(widgetId, widgetCardElement); // Update UI
    saveWidgets(); // Save paused state
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

    // Reset state
    widget.state.isRunning = false;
    widget.state.timeRemaining = 0;
    widget.state.totalSeconds = 0; // Or reset based on input? Let's clear total too.

    // Reset input field value
    const durationInput = widgetCardElement?.querySelector('[data-role="duration-input"]');
    // if (durationInput) durationInput.value = '5'; // Optionally reset to default

    updateCustomCountdownDisplay(widgetId, widgetCardElement); // Update display
    saveWidgets(); // Save reset state
}


// --- End Widget Functions ---
