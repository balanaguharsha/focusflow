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

    // js/main.js



    // Add Snooze button listener
    if (reminderSnoozeButton) reminderSnoozeButton.addEventListener('click', handleReminderSnooze);

// ... (rest of setupEventListeners) ...
    // Timer Controls
    if (startPauseButton) startPauseButton.addEventListener('click', handleStartPauseClick);
    if (resetButton) resetButton.addEventListener('click', () => resetTimer(true));
    if (skipButton) skipButton.addEventListener('click', skipMode);
    if (markDoneButton) markDoneButton.addEventListener('click', handleMarkDoneClick);
    if (toggleElapsedButton) toggleElapsedButton.addEventListener('click', () => {
        settings.showElapsedTime = !settings.showElapsedTime;
        if (showElapsedEnabledInput) showElapsedEnabledInput.checked = settings.showElapsedTime;
        saveSettings();
        // No need to restart inactivity countdown here, saveSettings doesn't affect it
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
     // Add Input listener for NLP on Reminder Text Input
     if (reminderTextInput) {
          reminderTextInput.addEventListener('input', (event) => {
              // Clear previous debounce timer
              clearTimeout(nlpSuggestionDebounceTimer);
              // Reset applied suggestion state for reminder form immediately
              appliedNlpSuggestionIndex.reminder = -1;

               // Clear/update suggestions display immediately
               const currentText = event.target.value;
               if (currentText.length < 3) {
                    if (typeof renderTimeSuggestions === 'function') {
                       // Clear display if input is short
                       renderTimeSuggestions([], 'reminder', -1);
                    }
                    currentNlpSuggestions = []; // Clear suggestion state
                    return; // Don't parse short input
               } else {
                    // Re-render existing suggestions without highlight while typing
                    // This prevents the highlight from sticking while user types over it
                    if (typeof renderTimeSuggestions === 'function') {
                        renderTimeSuggestions(currentNlpSuggestions, 'reminder', -1);
                    }
               }

              // Set new debounce timer for parsing
              nlpSuggestionDebounceTimer = setTimeout(() => {
                  const textToParse = reminderTextInput.value; // Read value again inside timeout
                  if (textToParse.length >= 3 && typeof parseTimeInput === 'function' && typeof applyNlpSuggestionUI === 'function') {
                      const now = new Date();
                      // Generate new suggestions based on the latest text
                      currentNlpSuggestions = parseTimeInput(textToParse, now);

                      if (currentNlpSuggestions.length > 0) {
                          // Auto-apply the first suggestion (this also renders with highlight)
                          applyNlpSuggestionUI(0, 'reminder');
                          // We are NOT modifying the reminderTextInput.value here during input
                          // to avoid disrupting typing. The trimming happens in applyNlpSuggestionUI
                          // which modifies the value *after* a suggestion is chosen/auto-applied.
                      } else {
                          // No suggestions found, clear the list and applied state
                          appliedNlpSuggestionIndex.reminder = -1;
                          if (typeof renderTimeSuggestions === 'function') {
                               renderTimeSuggestions([], 'reminder', -1);
                          }
                      }
                  } else {
                      // Clear suggestion state and display if parsing fails or text becomes too short again
                      currentNlpSuggestions = [];
                      appliedNlpSuggestionIndex.reminder = -1;
                      if (typeof renderTimeSuggestions === 'function') {
                            renderTimeSuggestions([], 'reminder', -1);
                      }
                  }
              }, NLP_DEBOUNCE_DELAY); // Use debounce delay from state.js
          });

          // Add Keydown listener for Enter key
          reminderTextInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent default form submission behavior
                  // Check if the addReminder function exists before calling
                  if(typeof addReminder === 'function') {
                     addReminder(); // Call the existing addReminder function
                  } else {
                     console.error("addReminder function not found!");
                  }
              }
          });
     } // End if (reminderTextInput)


    // Project Management
    if (addProjectButton) addProjectButton.addEventListener('click', addProject);
    if (newProjectInput) newProjectInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addProject(); });

    // Settings Modal
    if (settingsButton) settingsButton.addEventListener('click', openModal);
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (saveSettingsButton) saveSettingsButton.addEventListener('click', () => {
        try {
            saveSettings(); // Save settings first
            // Restart inactivity countdown *after* saving, as timeout value might change
            startInactivityCountdown();
            closeModal(); // Close modal after saving and restarting countdown
        } catch (error) { console.error("Error during settings save process:", error); }
    });
    if (darkModeToggle) darkModeToggle.addEventListener('change', (e) => {
        settings.darkModeEnabled = e.target.checked;
        saveSettings(); // Save setting (applies dark mode internally)
        // No need to restart inactivity countdown for dark mode change
    });
    if (settingsModal) window.addEventListener('click', (event) => { if (event.target === settingsModal) closeModal(); });

    // Log View Navigation & Controls
    if (logPrevDayButton) logPrevDayButton.addEventListener('click', () => { const d = new Date(displayedLogDate); d.setDate(d.getDate() - 1); showLogDate(d); });
    if (logNextDayButton) logNextDayButton.addEventListener('click', () => { if (logNextDayButton.disabled) return; const d = new Date(displayedLogDate); d.setDate(d.getDate() + 1); showLogDate(d); });
    if (logTodayButton) logTodayButton.addEventListener('click', () => { showLogDate(new Date()); });
    if (logJumpDateInput) logJumpDateInput.addEventListener('change', (event) => {
        const dateValue = event.target.value;
        if (dateValue) {
            const selectedDate = parseDateStringUTC(dateValue); // Use UTC helper
             if (selectedDate) {
                 showLogDate(selectedDate);
             }
        }
    });

    // Original Manual Log Form (Separate)
    if (toggleManualLogFormButton) toggleManualLogFormButton.addEventListener('click', () => { const isVisible = manualLogForm && manualLogForm.style.display === 'block'; toggleManualLogForm(!isVisible); });
    if (cancelManualLogButton) cancelManualLogButton.addEventListener('click', () => toggleManualLogForm(false));
    if (manualLogForm) manualLogForm.addEventListener('submit', handleManualLogSubmit);
    if (manualLogTaskInput) {
        // Combined listener for NLP and project prediction
        manualLogTaskInput.addEventListener('input', (event) => {
             // NLP Parsing Call (debounced) - PASS 'manual' as formType
             if (typeof handleNlpTaskInput === 'function') {
                 handleNlpTaskInput(event, 'manual'); // *** Pass 'manual' ***
             } else { console.error("handleNlpTaskInput function not found."); }

             // Project Prediction Call (no change needed here)
             handleTaskInputForPrediction(manualLogTaskInput, manualLogProjectSelect, 'manual-log-quick-projects');
         });
    }
    if (manualLogProjectSelect) manualLogProjectSelect.addEventListener('change', (e) => {
        updateProjectLastUsed(e.target.value);
        updateQuickSelectActiveState('manual-log-quick-projects', 'manual-log-project');
    });
    // Time Suggestion Buttons (Original Manual Log - Duration buttons)
    if (manualLogForm) {
        manualLogForm.querySelectorAll('.time-suggestion-btn').forEach(button => {
            // Check if it's a duration button (has data-duration)
            if (button.dataset.duration) {
                button.addEventListener('click', () => {
                    const duration = parseInt(button.dataset.duration);
                    if (!isNaN(duration)) handleTimeSuggestionClick(duration, 'manual');
                });
            }
        });
        // Update duration button text based on start time input
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
    // No prediction listener added for edit log task input

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
        if (selectedRadio) {
            setActiveTask(selectedRadio.value); startTimerInternal(); closeSelectTaskModal();
        } else { showNotification("Please select a task first.", "warning"); }
    });

    // Import/Export
    if (exportDataButton) exportDataButton.addEventListener('click', exportData);
    if (importDataButton) importDataButton.addEventListener('click', triggerImport);
    if (importFileInput) importFileInput.addEventListener('change', handleImportFile);

    // Inactivity Modal Buttons & Prediction (Listeners set up in inactivity.js)

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
            if (e.key === 'Enter') {
                e.preventDefault();
                handleShortcutAddTaskSubmit();
            } else if (e.key === 'Escape') {
                closeShortcutAddTaskModal();
            }
        });
        shortcutTaskInput.addEventListener('input', handleShortcutInputTyping);
    }

    // Global Keyboard Shortcut Listener
    window.addEventListener('keydown', handleGlobalShortcut);

    // Reminder Listeners
    if (addReminderButton) addReminderButton.addEventListener('click', addReminder);
    if (reminderAckButton) reminderAckButton.addEventListener('click', closeReminderAlertModal);

}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("FocusFlow Initializing...");

    if (progressRing) {
        progressRing.style.strokeDasharray = PROGRESS_RING_CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = PROGRESS_RING_CIRCUMFERENCE;
    } else { console.error("Progress ring element not found!"); }

    loadSettings();
    loadProjects();
    loadTasks();
    loadLogs();
    loadReminders();

    renderProjectsUI();
    renderTasks();
    setTimerForMode(currentMode);
    updateTimerDisplayAndProgress();
    showLogDate(new Date());
    showView('timer');

    if (startPauseIconWrapper) {
        startPauseIconWrapper.innerHTML = SVG_STRINGS.play;
    } else {
        console.error("Start/Pause icon wrapper not found during init!");
    }
    if (startPauseButtonText) {
         startPauseButtonText.textContent = 'Start';
    }

    setupEventListeners(); // Setup all listeners, including NLP input listeners

    setTimeout(initializeAudio, 150); // Initialize audio after a short delay

    // Initialize features that rely on loaded data/settings
    if (typeof initializeInactivityFeature === 'function') {
        initializeInactivityFeature();
    } else { console.error("initializeInactivityFeature function not found!"); }

    if (typeof startReminderChecker === 'function') {
        startReminderChecker();
    } else {
        console.error("startReminderChecker function not found!");
    }

    console.log("FocusFlow Ready!");
});

// --- Helper for Aggregated Summary ---
/** Fetches data and renders the aggregated summary UI */
function generateAndRenderAggregatedSummary() {
    if (!summaryStartDateInput || !summaryEndDateInput) return;
    const startDateStr = summaryStartDateInput.value;
    const endDateStr = summaryEndDateInput.value;

    if (!startDateStr || !endDateStr) {
        showNotification("Please select both start and end dates.", "warning");
        return;
    }
    // Use Luxon for parsing
    const startDt = luxon.DateTime.fromISO(startDateStr);
    const endDt = luxon.DateTime.fromISO(endDateStr);

    if (!startDt.isValid || !endDt.isValid) {
        showNotification("Invalid date format selected.", "error");
        return;
    }

    if (startDt > endDt) {
         showNotification("Start date cannot be after end date.", "warning");
        return;
    }

    if (typeof generateAggregatedSummary === 'function' && typeof renderAggregatedSummaryUI === 'function') {
        const summaryData = generateAggregatedSummary(startDateStr, endDateStr);
        renderAggregatedSummaryUI(summaryData);
    } else {
        console.error("Summary generation/rendering functions not found!");
        showNotification("Error generating summary.", "error");
    }
}

// --- Project Prediction & Shortcut Logic ---

/**
 * Handles user input in task fields to predict and update the project selection.
 * @param {HTMLInputElement} taskInputElement - The task input element.
 * @param {HTMLSelectElement} projectSelectElement - The corresponding project select element.
 * @param {string | null} quickProjectContainerId - The ID of the quick project button container (or null if none).
 */
function handleTaskInputForPrediction(taskInputElement, projectSelectElement, quickProjectContainerId) {
    if (!taskInputElement || !projectSelectElement) return;

    const taskText = taskInputElement.value.trim();

    // Only predict if text is reasonably long (e.g., > 2 chars)
    if (taskText.length > 2) {
        const predictedProjectId = findBestMatchingProject(taskText);

        // Check if the predicted project exists in the dropdown
        const optionExists = Array.from(projectSelectElement.options).some(opt => opt.value === predictedProjectId);

        if (optionExists && projectSelectElement.value !== predictedProjectId) {
            projectSelectElement.value = predictedProjectId;
            // Update quick select buttons if applicable
            if (quickProjectContainerId) {
                // Ensure the function exists before calling
                if (typeof updateQuickSelectActiveState === 'function') {
                    updateQuickSelectActiveState(quickProjectContainerId, projectSelectElement.id);
                } else {
                    console.error("updateQuickSelectActiveState function not found!");
                }
            }
            // Optionally, trigger change event if other logic depends on it
            // projectSelectElement.dispatchEvent(new Event('change'));
        }
    }
}


/**
 * Handles the global keyboard shortcut (Cmd/Ctrl+Shift+H/S).
 * Opens the shortcut add task modal.
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleGlobalShortcut(event) {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'H' || event.key === 'h' || event.key === 'S' || event.key === 's')) {
        event.preventDefault();
        console.log("Shortcut detected: Cmd/Ctrl+Shift+H/S");
        const isModalOpen = document.querySelector('.modal[style*="display: flex"]');
        if (!isModalOpen) {
            // Ensure function exists before calling
            if (typeof openShortcutAddTaskModal === 'function') {
                openShortcutAddTaskModal();
            } else {
                console.error("openShortcutAddTaskModal function not found!");
            }
        } else {
            console.log("Shortcut ignored: Another modal is already open.");
        }
    }
}

/**
 * Finds the best matching project ID for a given task description text.
 * Incorporates historical task assignments, text matching, project recency, and keyword matching.
 * @param {string} inputText - The task description entered by the user.
 * @returns {string} - The ID of the best matching project (defaults to Inbox).
 */
function findBestMatchingProject(inputText) {
    // --- Configuration ---
    const DEFAULT_SCORE_THRESHOLD = 0.5; // Increase threshold slightly? Adjust as needed.
    const WEIGHT_KEYWORD_MATCH = 10; // High weight if project name is directly in text
    const WEIGHT_HISTORY = 6;     // Weight for matching past similar tasks (kept from previous step)
    const WEIGHT_EXACT = 2;     // Weight for exact word match with project name
    const WEIGHT_PROJECT_RECENCY = 1.5; // Weight for how recently a project was used
    const WEIGHT_LEVENSHTEIN = 0.5;   // Lowered weight for general text similarity

    if (!inputText) return DEFAULT_PROJECT_ID;

    const textLower = inputText.toLowerCase();
    const textWords = textLower.split(/\s+/).filter(w => w.length > 0);

    // --- Calculate Scores for Each Project ---
    const projectScores = {}; // Store scores { projectId: score }
    const projectRecencyScores = {}; // Store raw recency scores { projectId: timestamp }

    // Initialize scores and gather recency data
    let minLastUsed = Infinity;
    let maxLastUsed = 0;
    projects.filter(p => p.id !== DEFAULT_PROJECT_ID).forEach(p => {
        projectScores[p.id] = 0;
        const lastUsed = p.lastUsed || 0; // Default to 0 if undefined
        projectRecencyScores[p.id] = lastUsed;
        if (lastUsed > 0) { // Only consider projects that have been used
            minLastUsed = Math.min(minLastUsed, lastUsed);
            maxLastUsed = Math.max(maxLastUsed, lastUsed);
        }
    });
    const recencyRange = maxLastUsed - minLastUsed;

    // --- Iterate through projects to calculate scores ---
    projects.filter(p => p.id !== DEFAULT_PROJECT_ID).forEach(project => {
        const projectId = project.id;
        const projectNameLower = project.name.toLowerCase();
        const projectWords = projectNameLower.split(/\s+/).filter(w => w.length > 0);

        // 1. Direct Keyword Match Score (New)
        // Check if the whole project name exists as a distinct word/phrase in the input
        const keywordRegex = new RegExp(`\\b${escapeRegExp(projectNameLower)}\\b`, 'i'); // Use utility function
        if (keywordRegex.test(textLower)) {
            projectScores[projectId] += WEIGHT_KEYWORD_MATCH;
            console.log(`Keyword Boost: Input "${inputText}" contains "${project.name}". Score+${WEIGHT_KEYWORD_MATCH}`);
        }

        // 2. Text-to-Project Name Matching Scores (Exact Words + Levenshtein)
        // Exact word matching score
        let exactMatches = 0;
        projectWords.forEach(pWord => {
            if (textWords.includes(pWord)) {
                exactMatches++;
            }
        });
        const exactMatchScore = projectWords.length > 0 ? (exactMatches / projectWords.length) : 0;
        projectScores[projectId] += exactMatchScore * WEIGHT_EXACT;

        // Levenshtein distance score
        let levenshteinScore = 0;
        if (typeof levenshteinDistance === 'function') { // Ensure function exists
            const distance = levenshteinDistance(textLower, projectNameLower);
            const maxLength = Math.max(textLower.length, projectNameLower.length);
            levenshteinScore = maxLength > 0 ? (1 - (distance / maxLength)) : (distance === 0 ? 1 : 0);
        } else {
             console.error("levenshteinDistance function not found!");
        }
        projectScores[projectId] += levenshteinScore * WEIGHT_LEVENSHTEIN;

        // 3. Project Recency Score (New)
        const lastUsed = projectRecencyScores[projectId];
        if (lastUsed > 0 && recencyRange > 0) {
            // Normalize score: 1 for most recent, 0 for least recent (within used range)
            const normalizedRecency = (lastUsed - minLastUsed) / recencyRange;
            projectScores[projectId] += normalizedRecency * WEIGHT_PROJECT_RECENCY;
        } else if (lastUsed > 0 && recencyRange === 0) {
            // If only one project was ever used, give it a medium boost
             projectScores[projectId] += 0.5 * WEIGHT_PROJECT_RECENCY;
        }

        // 4. Historical Task Similarity Score (Add this *after* calculating base scores)
        // Moved this calculation outside the project loop for efficiency

    }); // --- End project loop ---


    // 4. Historical Task Similarity Score (Calculate once, apply to relevant projects)
    if (typeof levenshteinDistance === 'function') { // Ensure function exists
        tasks.forEach(task => {
            // Optionally skip Inbox history or weight it less
             // if (task.projectId === DEFAULT_PROJECT_ID) return;

            const taskTextLower = task.text.toLowerCase();
            const distance = levenshteinDistance(textLower, taskTextLower);
            const maxLength = Math.max(textLower.length, taskTextLower.length);
            const similarity = maxLength > 0 ? (1 - (distance / maxLength)) : (distance === 0 ? 1 : 0);

            const SIMILARITY_THRESHOLD = 0.7; // Adjust as needed
            if (similarity >= SIMILARITY_THRESHOLD) {
                // Check if the project ID exists in scores (might be Inbox or deleted)
                if (projectScores[task.projectId] !== undefined) {
                    projectScores[task.projectId] += similarity * WEIGHT_HISTORY;
                     console.log(`History Boost: Input "${inputText}" ~ "${task.text}" (Proj: ${task.projectId}), Sim: ${similarity.toFixed(2)}, Score+${(similarity * WEIGHT_HISTORY).toFixed(2)}`);
                }
            }
            // --- Potential Future Improvement: Task Recency ---
            // if (task.completedTimestamp) {
            //     // Calculate task recency score and add weighted boost
            // }
            // --- End Potential ---
        });
    }

    // --- Find the Best Project ---
    let bestScore = -Infinity; // Use -Infinity to handle potential negative scores if weights change
    let bestProjectId = DEFAULT_PROJECT_ID;

    for (const projectId in projectScores) {
        if (projectId !== DEFAULT_PROJECT_ID && projectScores[projectId] > bestScore) {
            bestScore = projectScores[projectId];
            bestProjectId = projectId;
        }
    }

     // Apply threshold: If the best score is below threshold, revert to Inbox
     if (bestScore < DEFAULT_SCORE_THRESHOLD) {
         console.log(`Prediction score ${bestScore.toFixed(2)} below threshold ${DEFAULT_SCORE_THRESHOLD}. Defaulting to Inbox.`);
         bestProjectId = DEFAULT_PROJECT_ID;
     }


    const bestProject = projects.find(p => p.id === bestProjectId);
    // Log detailed scores for debugging
    console.log(`Prediction for "${inputText}" -> "${bestProject?.name || 'Inbox'}" (Best Score: ${bestScore.toFixed(2)})`, projectScores);

    return bestProjectId;
}



/**
 * Handles the submission of the shortcut add task modal (via Enter key).
 */
function handleShortcutAddTaskSubmit() {
    if (!shortcutTaskInput) return;
    const taskText = shortcutTaskInput.value.trim();

    if (!taskText) {
        showNotification("Task description cannot be empty.", "warning");
        return;
    }

    const bestProjectId = findBestMatchingProject(taskText);
    const bestProject = projects.find(p => p.id === bestProjectId);
    const bestProjectName = bestProject ? bestProject.name : 'Inbox';

    // Ensure function exists before calling
    if (typeof createAndAddTask === 'function') {
        if (createAndAddTask(taskText, bestProjectId)) {
            showNotification(`Task added to project: "${bestProjectName}"!`, 'success');
            // Ensure function exists before calling
            if (typeof closeShortcutAddTaskModal === 'function') {
                closeShortcutAddTaskModal();
            } else {
                 console.error("closeShortcutAddTaskModal function not found!");
            }
        } else {
            console.error("Failed to add task via shortcut modal.");
        }
    } else {
         console.error("createAndAddTask function not found!");
    }
}

/**
 * Handles the input event in the shortcut modal to show predicted project.
 */
function handleShortcutInputTyping() {
    if (!shortcutTaskInput || !shortcutPredictedProject) return;
    const taskText = shortcutTaskInput.value.trim();

    if (taskText.length < 2) {
        shortcutPredictedProject.textContent = '';
        return;
    }

    const bestProjectId = findBestMatchingProject(taskText);
    const bestProject = projects.find(p => p.id === bestProjectId);

    if (bestProject && bestProjectId !== DEFAULT_PROJECT_ID) {
        shortcutPredictedProject.textContent = `Predicted project: ${bestProject.name}`;
    } else {
        shortcutPredictedProject.textContent = `Predicted project: Inbox`;
    }
}
