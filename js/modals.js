// js/modals.js

let currentAlertReminderId = null;

// --- Settings Modal ---
/** Opens the settings modal and populates it with current settings. */
function openModal() {
    if (!settingsModal) return;
    if (workDurationInput) workDurationInput.value = settings.workDuration;
    if (shortBreakDurationInput) shortBreakDurationInput.value = settings.shortBreakDuration;
    if (longBreakDurationInput) longBreakDurationInput.value = settings.longBreakDuration;
    if (longBreakIntervalInput) longBreakIntervalInput.value = settings.longBreakInterval;
    if (soundEnabledInput) soundEnabledInput.checked = settings.soundEnabled;
    if (showElapsedEnabledInput) showElapsedEnabledInput.checked = settings.showElapsedTime;
    if (darkModeToggle) darkModeToggle.checked = settings.darkModeEnabled;
    if (inactivityTimeoutInput) inactivityTimeoutInput.value = settings.inactivityTimeoutMinutes;
    if (celebrationGifUrlsTextarea) celebrationGifUrlsTextarea.value = settings.celebrationGifUrls.join('\n');
    settingsModal.style.display = 'flex';
}
/** Closes the settings modal. */
function closeModal() {
    if (settingsModal) settingsModal.style.display = 'none';
}

// --- Interrupted Log Confirmation Modal ---
/** Shows the modal to confirm logging time when a task is completed mid-session. */
function confirmInterruptedFocusLog(summaryData) {
    if (!interruptedLogConfirmationModal) return;
    pendingInterruptedLogData = summaryData.logData;
    if (interruptedLogTask) interruptedLogTask.textContent = summaryData.taskText;
    if (interruptedLogCurrentDuration) interruptedLogCurrentDuration.textContent = summaryData.currentDuration;
    if (interruptedLogTotalDuration) interruptedLogTotalDuration.textContent = summaryData.totalDurationToday;
    interruptedLogConfirmationModal.style.display = 'flex';
}
/** Closes the interrupted log confirmation modal. */
function closeInterruptedLogConfirmationModal() {
    pendingInterruptedLogData = null;
    if (interruptedLogConfirmationModal) interruptedLogConfirmationModal.style.display = 'none';
}

// --- Generic Confirmation Modal ---
/** Shows a generic confirmation modal for actions like deletion. */
function showConfirmationModal(message, onConfirm, title = 'Confirm Action') {
    if (!confirmationModal) return;
    if (confirmationTitle) confirmationTitle.textContent = title;
    if (confirmationMessage) confirmationMessage.textContent = message;
    confirmActionCallback = onConfirm;
    confirmationModal.style.display = 'flex';
}
/** Closes the generic confirmation modal. */
function closeConfirmationModal() {
    confirmActionCallback = null;
    if (confirmationModal) confirmationModal.style.display = 'none';
}

// --- Edit Log Modal ---
/** Opens the modal for editing a specific log entry. */
function openEditLogModal(logId) {
    if (!editLogModal) return;
    const entryData = findLogEntryById(logId);
    if (!entryData) { showNotification("Log entry not found.", "error"); return; }
    const { entry } = entryData;
    const startDate = new Date(entry.startTime);
    const endDate = new Date(entry.timestamp);
    if (editLogIdInput) editLogIdInput.value = entry.logId;
    if (editLogTaskInput) editLogTaskInput.value = entry.taskText;
    if (editLogProjectSelect) {
        populateProjectDropdown(editLogProjectSelect);
        editLogProjectSelect.value = entry.projectId || DEFAULT_PROJECT_ID;
    }
    if (editLogDateInput) editLogDateInput.value = getDateString(startDate);
    if (editLogStartInput) editLogStartInput.value = formatTimeHHMM(startDate.getHours(), startDate.getMinutes());
    if (editLogEndInput) editLogEndInput.value = formatTimeHHMM(endDate.getHours(), endDate.getMinutes());
    editLogModal.style.display = 'flex';
}
/** Closes the edit log modal and resets the form. */
function closeEditLogModal() {
    if (editLogModal) editLogModal.style.display = 'none';
    if (editLogForm) editLogForm.reset();
    if (editLogIdInput) editLogIdInput.value = '';
}

// --- Edit Project Modal ---
/** Opens the modal for editing a specific project. */
function openEditProjectModal(projectId) {
    if (!editProjectModal) return;
    const project = projects.find(p => p.id === projectId);
    if (!project || projectId === DEFAULT_PROJECT_ID) {
        showNotification("Cannot edit this project.", "error"); return;
    }
    if (editProjectIdInput) editProjectIdInput.value = project.id;
    if (editProjectNameInput) editProjectNameInput.value = project.name;
    if (editProjectColorInput) editProjectColorInput.value = project.color;
    if (editProjectColorValue) editProjectColorValue.textContent = project.color;
    editProjectModal.style.display = 'flex';
}
/** Closes the edit project modal and resets the form. */
function closeEditProjectModal() {
    if (editProjectModal) editProjectModal.style.display = 'none';
    if (editProjectForm) editProjectForm.reset();
    if (editProjectIdInput) editProjectIdInput.value = '';
}

// --- Select Task Modal ---
/** Opens the modal prompting the user to select a task before starting the timer. */
function promptTaskSelection() {
    if (!selectTaskModal || !selectTaskListDiv) return;
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) { startTimerInternal(); return; }
    selectTaskListDiv.innerHTML = '';
    incompleteTasks.forEach((task, index) => {
        const project = projects.find(p => p.id === task.projectId);
        const projectName = project ? project.name : 'Inbox';
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="radio" name="select-task-radio" value="${task.id}" ${index === 0 ? 'checked' : ''}>
            ${task.text}
            <span class="task-project-name">(${projectName})</span>
        `;
        selectTaskListDiv.appendChild(label);
    });
    selectTaskModal.style.display = 'flex';
}
/** Closes the select task modal. */
function closeSelectTaskModal() {
    if (selectTaskModal) selectTaskModal.style.display = 'none';
}

// --- Inactivity Modal ---
/** Opens the inactivity prompt modal and populates its content. */
function openInactivityModal(message) {
    if (!inactivityModal || !inactivityCheekyStatement || !inactivityQuoteText || !inactivityQuoteAuthor || !inactivityManualLogForm) {
        console.error("Inactivity modal elements not found!"); return;
    }
    inactivityCheekyStatement.textContent = message.cheeky;
    inactivityQuoteText.textContent = message.motivational;
    inactivityQuoteAuthor.textContent = ""; // Clear author
    // Form is visible by default via HTML/CSS
    inactivityModal.style.display = 'flex';
}
/** Closes the inactivity modal. Also resets the inactivity timer. */
function closeInactivityModalAndRestartCountdown() {
    if (inactivityModal) {
        inactivityModal.style.display = 'none';
    }
    if (typeof startInactivityCountdown === 'function') {
        // Restart countdown because user interacted by closing the modal
        if (!isRunning) { // Double-check timer isn't running
           pomodoroStopTime = Date.now(); // Reset stop time to now
           startInactivityCountdown();
        } else {
            clearInactivityTimer(); // If timer somehow started, just clear inactivity
        }
    }
}

// --- Aggregated Summary Modal ---
/** Opens the aggregated summary modal and sets default dates. */
function openAggregatedSummaryModal() {
    if (!aggregatedSummaryModal) return;

    // Set default date range (last 3 days including today)
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 2); // Today, yesterday, day before yesterday

    if (summaryStartDateInput) summaryStartDateInput.value = getDateString(startDate);
    if (summaryEndDateInput) summaryEndDateInput.value = getDateString(endDate);

    // Clear previous results and show placeholder/instruction
    if(aggregatedSummaryTextContainer) aggregatedSummaryTextContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Select dates and click "Generate Summary".</p>';
    // Destroy previous chart instance if it exists
    if (aggregatedChartInstance) {
        aggregatedChartInstance.destroy();
        aggregatedChartInstance = null;
    }
     if (aggregatedLineChartCanvas) {
        // Optionally hide canvas until data is generated
        aggregatedLineChartCanvas.style.display = 'none';
    }


    aggregatedSummaryModal.style.display = 'flex';
    // Optionally trigger generation immediately
    // generateAndRenderAggregatedSummary();
}

/** Closes the aggregated summary modal. */
function closeAggregatedSummaryModal() {
    if (aggregatedSummaryModal) aggregatedSummaryModal.style.display = 'none';
    // Destroy chart instance when closing to free resources
     if (aggregatedChartInstance) {
        aggregatedChartInstance.destroy();
        aggregatedChartInstance = null;
    }
}

// --- Shortcut Add Task Modal ---
/** Opens the shortcut modal for quickly adding tasks. */
function openShortcutAddTaskModal() {
    if (!shortcutAddTaskModal || !shortcutTaskInput || !shortcutPredictedProject) return;
    // Clear previous input and prediction
    shortcutTaskInput.value = '';
    shortcutPredictedProject.textContent = '';
    shortcutAddTaskModal.style.display = 'flex';
    // Focus the input field after a short delay to ensure modal is visible
    setTimeout(() => shortcutTaskInput.focus(), 50);
}

/** Closes the shortcut add task modal. */
function closeShortcutAddTaskModal() {
    if (shortcutAddTaskModal) shortcutAddTaskModal.style.display = 'none';
    if (shortcutTaskInput) shortcutTaskInput.value = ''; // Clear input on close
    if (shortcutPredictedProject) shortcutPredictedProject.textContent = ''; // Clear prediction
}


// *** NEW: Reminder Alert Modal ***

// Inside test/js/modals.js
function showReminderAlertModal(reminder) {
    console.log("showReminderAlertModal function started for reminder:", reminder); // Log: Function start

    // Check required elements
    if (!reminderAlertModal || !reminderAlertText || !reminderAlertTime || !reminderAckButton) {
        // Log which specific element might be missing
        console.error("Reminder alert modal base elements not found!", {
             modal: !!reminderAlertModal,
             text: !!reminderAlertText,
             time: !!reminderAlertTime,
             ack: !!reminderAckButton
        });
        return; // Stop if elements missing
    }
    if (!reminder || !reminder.id || !reminder.text || typeof reminder.time !== 'number') {
        console.error("Invalid reminder object passed to showReminderAlertModal:", reminder);
        return; // Stop if reminder object invalid
    }

    currentAlertReminderId = reminder.id;
    reminderAlertText.textContent = reminder.text;
    reminderAlertTime.textContent = `Set for: ${typeof formatTimeForDisplay === 'function' ? formatTimeForDisplay(reminder.time) : new Date(reminder.time).toLocaleTimeString()}`;

    // Log before changing display
    console.log("   About to set modal display to 'flex'. Current display:", reminderAlertModal.style.display);
    reminderAlertModal.style.display = 'flex';
    // Log after changing display
    console.log("   Modal display style after set:", reminderAlertModal.style.display); // Check if it stuck

    // Focus Ack button
    setTimeout(() => {
        console.log("   Attempting to focus Ack button."); // Log focus attempt
        reminderAckButton?.focus();
    }, 50);
}

/**
 * Closes the reminder alert modal, stops the reminder sound, and clears the stored reminder ID.
 */
function closeReminderAlertModal() {
    if (reminderAlertModal) {
        reminderAlertModal.style.display = 'none';
    }

    // Clear the stored reminder ID
    currentAlertReminderId = null;

    // Stop the looping sound (function defined in audio.js)
    if (typeof stopReminderAlarm === 'function') {
        stopReminderAlarm();
    } else {
        console.warn("stopReminderAlarm function not found!"); // Use warn, not error
    }
}

/**
 * Handles snoozing a reminder by a specific duration.
 * This function is intended to be called by an event listener (in main.js)
 * which determines the duration from the clicked button.
 * @param {number} snoozeMinutes - The number of minutes to snooze for.
 */
function handleReminderSnooze(snoozeMinutes) {
     // Validate snoozeMinutes
     if (typeof snoozeMinutes !== 'number' || isNaN(snoozeMinutes) || snoozeMinutes <= 0) {
          console.error("Invalid snooze duration provided:", snoozeMinutes);
          showNotification("Invalid snooze duration.", "error");
          // Still close modal and stop sound
          closeReminderAlertModal();
          return;
     }

    if (currentAlertReminderId) {
        // Ensure snoozeReminder function exists (defined in reminders.js)
        if (typeof snoozeReminder === 'function') {
            snoozeReminder(currentAlertReminderId, snoozeMinutes);
            // snoozeReminder function now shows its own notification
        } else {
             console.error("snoozeReminder function not found!");
             showNotification("Error: Snooze function unavailable.", "error");
        }
        // Close modal, which will stop sound and clear ID
        closeReminderAlertModal();
    } else {
        console.warn("Snooze clicked but no currentAlertReminderId was set.");
        // Still close the modal and stop sound just in case
        closeReminderAlertModal();
    }
}
// *** END NEW ***

/**
 * Shows the reminder alert modal with the specified text and time.
 * Stores the reminder ID for Ack/Snooze actions.
 * @param {object} reminder - The full reminder object { id, text, time, triggered }.
 */
function showReminderAlertModal(reminder) {
    // Check required elements first
    if (!reminderAlertModal || !reminderAlertText || !reminderAlertTime || !reminderAckButton) {
        console.error("Reminder alert modal elements not found!");
        return;
    }
    // Ensure reminder object is valid
    if (!reminder || !reminder.id || !reminder.text || typeof reminder.time !== 'number') {
        console.error("Invalid reminder object passed to showReminderAlertModal:", reminder);
        return;
    }

    // Store the ID of the reminder being displayed
    currentAlertReminderId = reminder.id;

    // Populate modal content
    reminderAlertText.textContent = reminder.text;
    reminderAlertTime.textContent = `Set for: ${formatTimeForDisplay(reminder.time)}`; // Use utility function

    // Display the modal
    reminderAlertModal.style.display = 'flex';

    // Focus the Ack button for accessibility
    setTimeout(() => reminderAckButton.focus(), 50);
}

/**
 * Closes the reminder alert modal, stops the reminder sound, and clears the stored reminder ID.
 */
function closeReminderAlertModal() {
    if (reminderAlertModal) {
        reminderAlertModal.style.display = 'none';
    }

    // Clear the stored reminder ID
    currentAlertReminderId = null;

    // Stop the looping sound (function defined in audio.js)
    if (typeof stopReminderAlarm === 'function') {
        stopReminderAlarm();
    } else {
        console.error("stopReminderAlarm function not found!");
    }
}

/**
 * Handles the click on the Snooze button in the reminder alert modal.
 */
function handleReminderSnooze() {
    if (currentAlertReminderId) {
        if (typeof snoozeReminder === 'function') {
            const SNOOZE_DURATION_MINUTES = 5; // Or make this configurable
            snoozeReminder(currentAlertReminderId, SNOOZE_DURATION_MINUTES);
        } else {
             console.error("snoozeReminder function not found!");
             showNotification("Error: Snooze function unavailable.", "error");
        }
        // Close modal will stop sound and clear ID
        closeReminderAlertModal();
    } else {
        console.warn("Snooze clicked but no currentAlertReminderId was set.");
        // Still close the modal and stop sound just in case
        closeReminderAlertModal();
    }
}
