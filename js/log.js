// js/log.js

// --- Logging Logic ---

/**
 * Adds or updates a log entry in the logEntries object and saves to storage.
 * Handles sorting and UI updates if the log view is active.
 * @param {object} entry - The log entry object { timestamp, startTime, taskText, duration, projectId, logId? }.
 */
function addLogEntry(entry) {
    // Ensure essential fields exist
    // Note: taskText should already be trimmed if coming from submit handlers
    if (!entry || !entry.timestamp || !entry.taskText || !entry.duration) {
        console.error("Attempted to add invalid log entry:", entry);
        return;
    }

    // Assign a unique ID if one isn't provided (for new entries)
    if (!entry.logId) {
        entry.logId = generateUniqueId('log');
    }

    // Assign project ID if missing (e.g., from older data or simple logging)
    if (!entry.projectId) {
        const task = tasks.find(t => t.text === entry.taskText); // Simple match by text
        entry.projectId = task ? task.projectId : DEFAULT_PROJECT_ID; // Default to Inbox if no match
    }

    // Calculate startTime if missing (for compatibility or simple duration logs)
    if (entry.startTime === undefined) {
        entry.startTime = entry.timestamp - (entry.duration * 60 * 1000);
    }

    // Determine the date string based on the start time
    const dateStr = getDateString(new Date(entry.startTime));

    // Initialize the array for the date if it doesn't exist
    if (!logEntries[dateStr]) {
        logEntries[dateStr] = [];
    }

    // Check if updating an existing entry or adding a new one
    const existingIndex = logEntries[dateStr].findIndex(e => e.logId === entry.logId);
    if (existingIndex > -1) {
        // Update existing entry
        logEntries[dateStr][existingIndex] = entry;
    } else {
        // Add new entry
        logEntries[dateStr].push(entry);
    }

    // Sort entries for the day by start time
    logEntries[dateStr].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

    saveLogs(); // Save the updated logs to local storage

    // Update the log view UI only if it's currently displayed for the correct date
    if (viewLog && !viewLog.classList.contains('view-hidden') && getDateString(displayedLogDate) === dateStr) {
        animateItemId = entry.logId; // Flag for animation on render
        renderLogRecords(displayedLogDate);
        renderLogSummary(displayedLogDate);
    }
}

/**
 * Initiates the deletion process for a log entry after confirmation.
 * @param {string} logId - The unique ID of the log entry to delete.
 */
function handleLogDeleteClick(logId) {
    const entryData = findLogEntryById(logId);
    if (!entryData) {
        showNotification("Log entry not found for deletion.", "error");
        console.error("Could not find log entry with ID:", logId);
        return;
    }

    const { entry, dateStr } = entryData;
    const confirmationMsg = `Delete log entry for "${entry.taskText.substring(0, 40)}"?`;

    showConfirmationModal(confirmationMsg, () => {
        // --- This code runs only if the user confirms ---
        if (!logEntries[dateStr]) {
            console.error("Log entry date string not found during deletion confirmation:", dateStr);
            return; // Should not happen
        }

        const initialLength = logEntries[dateStr].length;
        // Filter out the entry to be deleted
        logEntries[dateStr] = logEntries[dateStr].filter(e => e.logId !== logId);

        // Check if deletion was successful
        if (logEntries[dateStr].length < initialLength) {
            // If no entries remain for the day, remove the date key
            if (logEntries[dateStr].length === 0) {
                delete logEntries[dateStr];
            }
            saveLogs(); // Save the changes

            // Update the UI if the log view is visible for this date
            if (viewLog && !viewLog.classList.contains('view-hidden') && getDateString(displayedLogDate) === dateStr) {
                renderLogRecords(displayedLogDate);
                renderLogSummary(displayedLogDate);
            }
            showNotification("Log entry deleted.", "warning");
        } else {
            // This might happen if the ID didn't match somehow
            console.warn("Log entry not deleted, ID might not match:", logId);
            showNotification("Log entry deletion failed.", "error");
        }
        // --- End of confirmation callback ---
    });
}

/**
 * Finds a log entry and its date string by its unique ID.
 * @param {string} logId - The unique ID of the log entry.
 * @returns {{entry: object, dateStr: string} | null} - The entry and its date string, or null if not found.
 */
function findLogEntryById(logId) {
    for (const dateStr in logEntries) {
        const entry = logEntries[dateStr].find(e => e.logId === logId);
        if (entry) {
            return { entry, dateStr }; // Return both the entry and its date key
        }
    }
    return null; // Not found
}


// --- Log Record Rendering ---

/**
 * Creates the HTML element for a single log record item.
 * @param {object} entry - The log entry object.
 * @returns {HTMLElement | null} - The log record element, or null if entry is invalid.
 */
function createLogRecordElement(entry) {
    if (!entry || !entry.startTime || !entry.timestamp || !entry.taskText) {
        console.warn("Skipping invalid log entry:", entry);
        return null;
    }

    const item = document.createElement('div');
    item.className = 'log-record-item';
    item.dataset.logId = entry.logId; // Store ID for editing/deletion

    // Add animation class if this item was just added/edited
    if (entry.logId === animateItemId) {
        item.classList.add('animate-log-entry');
    }

    // Get project details
    const projectColor = getProjectColor(entry.projectId);
    const projectName = projects.find(p => p.id === entry.projectId)?.name || 'Inbox';
    const isLight = isColorLight(projectColor);
    const textColorClass = isLight ? 'text-gray-800' : 'text-white'; // For project tag text
    // Slightly darken border for better visibility, especially on light colors
    const borderColorClass = isLight ? darkenColor(projectColor, 15) : darkenColor(projectColor, 15);

    // Format times
    const startTime = new Date(entry.startTime);
    const endTime = new Date(entry.timestamp);

    item.innerHTML = `
        <div class="log-record-time">
            ${formatTimeForDisplay(startTime)}<br>
            - ${formatTimeForDisplay(endTime)}
        </div>
        <div class="log-record-line-and-details" style="border-left-color: ${projectColor};">
            <div class="log-record-details">
                <div class="log-record-task">${entry.taskText}</div>
                <div class="log-record-meta">
                    (${entry.duration} min)
                    <span class="log-record-project ${textColorClass}"
                          style="background-color: ${projectColor}; border: 1px solid ${borderColorClass};">
                        ${projectName}
                    </span>
                </div>
            </div>
            <div class="log-record-actions">
                <button class="log-record-edit p-1" title="Edit Log Entry">
                    ${SVG_STRINGS.pencil}
                </button>
                <button class="log-record-delete p-1" title="Delete Log Entry">
                    ${SVG_STRINGS.trash2}
                </button>
            </div>
        </div>`;

    // Add event listeners for edit/delete buttons
    const editBtn = item.querySelector('.log-record-edit');
    const deleteBtn = item.querySelector('.log-record-delete');
    if (editBtn) editBtn.onclick = () => { openEditLogModal(entry.logId); };
    if (deleteBtn) deleteBtn.onclick = () => { handleLogDeleteClick(entry.logId); };

    return item;
}

/**
 * Renders all log records for the currently displayed date.
 * @param {Date} date - The date for which to render logs.
 */
function renderLogRecords(date) {
    if (!logRecordList || !logEmptyMessage) return;

    const dateStr = getDateString(date);
    logDateDisplay.textContent = formatDateForDisplay(date); // Update date display header
    const entries = (logEntries[dateStr] || []).sort((a, b) => (a.startTime || 0) - (b.startTime || 0)); // Ensure sorted

    logRecordList.innerHTML = ''; // Clear previous entries

    if (entries.length > 0) {
        logEmptyMessage.style.display = 'none'; // Hide empty message
        entries.forEach(entry => {
            const item = createLogRecordElement(entry);
            if (item) logRecordList.appendChild(item); // Append valid elements
        });
    } else {
        logEmptyMessage.style.display = 'block'; // Show empty message
    }

    animateItemId = null; // Reset animation trigger after rendering
}


// --- Log Summary Rendering ---

/**
 * Renders the daily summary, including the pie chart and verbal summary.
 * @param {Date} date - The date for which to render the summary.
 */
function renderLogSummary(date) {
    if (!verbalSummaryDiv || !pieChartCanvas) return;

    const dateStr = getDateString(date);
    const entries = logEntries[dateStr] || [];
    const isDark = htmlElement.classList.contains('dark');
    const chartTextColor = isDark ? '#d1d5db' : '#374151'; // Gray-300 for dark, Gray-700 for light

    // Clear previous summary and destroy old chart instance
    verbalSummaryDiv.innerHTML = '';
    if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }

    // Handle case with no entries for the day
    if (entries.length === 0) {
        verbalSummaryDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Nothing logged yet for this day.</p>';
        pieChartCanvas.style.display = 'none'; // Hide the chart canvas
        return;
    }

    pieChartCanvas.style.display = 'block'; // Ensure canvas is visible

    // Calculate time spent per project
    const timeByProject = {};
    entries.forEach(entry => {
        const projectId = entry.projectId || DEFAULT_PROJECT_ID;
        timeByProject[projectId] = (timeByProject[projectId] || 0) + entry.duration;
    });

    // Prepare data for Chart.js
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    // Add data for known projects that have time logged
    projects.forEach(project => {
        if (timeByProject[project.id] > 0) {
            chartLabels.push(project.name);
            chartData.push(timeByProject[project.id]);
            chartColors.push(project.color || DEFAULT_PROJECT_COLOR);
        }
    });

    // Add data for time logged under deleted or unknown projects (or Inbox if not in projects array somehow)
    Object.keys(timeByProject).forEach(projId => {
        if (!projects.some(p => p.id === projId)) {
            const projName = projId === DEFAULT_PROJECT_ID ? "Inbox" : "Other/Deleted";
            const projColor = projId === DEFAULT_PROJECT_ID ? DEFAULT_PROJECT_COLOR : "#cccccc"; // Gray for unknown
            chartLabels.push(projName);
            chartData.push(timeByProject[projId]);
            chartColors.push(projColor);
        }
    });

    // Create Pie Chart if data exists
    if (chartData.length > 0) {
        const ctx = pieChartCanvas.getContext('2d');
        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Time Spent (min)',
                    data: chartData,
                    backgroundColor: chartColors,
                    hoverOffset: 4 // Slightly enlarge slice on hover
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow chart to fill container height
                plugins: {
                    legend: {
                        position: 'bottom', // Position legend below chart
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                            color: chartTextColor // Set legend text color based on theme
                        }
                    },
                    tooltip: {
                        bodyColor: chartTextColor, // Set tooltip text color
                        titleColor: chartTextColor, // Set tooltip title color
                        callbacks: {
                            // Format tooltip label
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) { label += context.parsed + ' min'; }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Hide canvas if no data to display (shouldn't happen if entries exist, but safety check)
        pieChartCanvas.style.display = 'none';
    }

    // --- Generate Verbal Summary ---
    const entriesByProject = {}; // Group unique task names by project
    entries.forEach(entry => {
        const projectId = entry.projectId || DEFAULT_PROJECT_ID;
        if (!entriesByProject[projectId]) {
            entriesByProject[projectId] = new Set(); // Use Set for unique task names
        }
        entriesByProject[projectId].add(entry.taskText);
    });

    let summaryHtml = '';
    // Add summaries for known projects
    projects.forEach(project => {
        if (timeByProject[project.id] > 0) {
            const projectColor = project.color || DEFAULT_PROJECT_COLOR;
            const taskListHtml = [...entriesByProject[project.id]].map(taskText => `<li>${taskText}</li>`).join('');
            summaryHtml += `
                <div class="mb-2">
                    <h5 class="text-gray-700 dark:text-gray-300">
                        <span class="project-color-swatch inline-block" style="background-color: ${projectColor};"></span>
                        ${project.name} (${timeByProject[project.id]} min)
                    </h5>
                    <ul class="list-disc pl-5 text-gray-600 dark:text-gray-400">${taskListHtml}</ul>
                </div>`;
        }
    });
    // Add summaries for unknown/deleted projects
     Object.keys(entriesByProject).forEach(projId => {
         if (!projects.some(p => p.id === projId)) {
             const projName = projId === DEFAULT_PROJECT_ID ? "Inbox" : "Other/Deleted";
             const projColor = projId === DEFAULT_PROJECT_ID ? DEFAULT_PROJECT_COLOR : "#cccccc";
             const totalTime = timeByProject[projId] || 0;
             if (totalTime > 0) {
                 const taskListHtml = [...entriesByProject[projId]].map(taskText => `<li>${taskText}</li>`).join('');
                 summaryHtml += `
                     <div class="mb-2">
                         <h5 class="text-gray-700 dark:text-gray-300">
                             <span class="project-color-swatch inline-block" style="background-color: ${projColor};"></span>
                             ${projName} (${totalTime} min)
                         </h5>
                         <ul class="list-disc pl-5 text-gray-600 dark:text-gray-400">${taskListHtml}</ul>
                     </div>`;
             }
         }
     });


    // Update the verbal summary div
    if (summaryHtml) {
        verbalSummaryDiv.innerHTML = summaryHtml;
    } else {
        // Fallback if something went wrong generating the summary string
        verbalSummaryDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Nothing logged yet for this day.</p>';
    }
}


/**
 * Updates the displayed log date and triggers rendering of records and summary.
 * Disables the 'next day' button if the date is today or later.
 * @param {Date} date - The new date to display.
 */
function showLogDate(date) {
    displayedLogDate = date;
    if (logJumpDateInput) logJumpDateInput.value = getDateString(date); // Update jump input

    // Render the log records and summary for the new date
    renderLogRecords(displayedLogDate);
    renderLogSummary(displayedLogDate);

    // Disable 'next day' button if showing today or a future date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for comparison
    if (logNextDayButton) logNextDayButton.disabled = displayedLogDate >= today;
}


// --- Manual Log Form Logic ---

/**
 * Shows or hides the manual log entry form.
 * Populates form fields when showing.
 * @param {boolean} [show=true] - Whether to show or hide the form.
 * @param {object} [prefill={}] - Optional data to prefill the form fields { date?, taskText?, startTime?, endTime?, projectId? }.
 */
function toggleManualLogForm(show = true, prefill = {}) {
    if (!manualLogForm || !toggleManualLogFormButton) return;

    if (show) {
        // Populate dropdowns and set defaults
        populateProjectDropdown(manualLogProjectSelect);
        // Use prefill date or currently displayed log date
        const localDate = prefill.date ? parseDateStringUTC(prefill.date) : displayedLogDate;
        manualLogDateInput.value = getDateString(localDate || new Date()); // Ensure valid date
        manualLogTaskInput.value = prefill.taskText || '';
        manualLogStartInput.value = prefill.startTime || '';
        manualLogEndInput.value = prefill.endTime || '';
        manualLogProjectSelect.value = prefill.projectId || DEFAULT_PROJECT_ID; // Default to Inbox

        manualLogForm.style.display = 'block';
        toggleManualLogFormButton.textContent = 'Cancel'; // Change button text
        updateTimeSuggestionButtons('manual'); // Update quick add buttons based on start time
        renderQuickSelectButtons('manual-log-quick-projects', 'manual-log-project'); // Show recent projects

        // Clear any previous NLP suggestions and applied state
        appliedNlpSuggestionIndex.manual = -1;
        if (typeof renderTimeSuggestions === 'function') {
             renderTimeSuggestions([], 'manual', -1);
        }

        manualLogTaskInput.focus(); // Focus the task input field
    } else {
        manualLogForm.style.display = 'none';
        toggleManualLogFormButton.textContent = 'Add Manual Entry'; // Reset button text
         // Clear NLP suggestions and applied state when hiding
         appliedNlpSuggestionIndex.manual = -1;
         if (typeof renderTimeSuggestions === 'function') {
            renderTimeSuggestions([], 'manual', -1);
        }
    }
}

/**
 * Handles the submission of the manual log entry form.
 * Validates input and adds the log entry.
 * Trims project phrase from task text before saving.
 * @param {Event} event - The form submission event.
 */
function handleManualLogSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    // Get values from form fields
    const rawTaskText = manualLogTaskInput.value.trim();
    const projectId = manualLogProjectSelect.value;
    const dateStr = manualLogDateInput.value;
    const startTimeStr = manualLogStartInput.value;
    const endTimeStr = manualLogEndInput.value;

    // Basic validation
    if (!rawTaskText || !projectId || !dateStr || !startTimeStr || !endTimeStr) {
        showNotification("Please fill all fields.", "warning");
        return;
    }

    // Validate date and time strings
    const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
    const endDateTime = new Date(`${dateStr}T${endTimeStr}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        showNotification("Invalid date or time format.", "error");
        return;
    }

    // Ensure end time is after start time
    if (endDateTime <= startDateTime) {
        showNotification("End time must be after start time.", "warning");
        return;
    }

    // Calculate duration and timestamps
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (60 * 1000));
    const endTimestamp = endDateTime.getTime();
    const startTimestamp = startDateTime.getTime();

    // Trim project phrase from the task text before saving
    // Only trim if a suggestion wasn't the *sole source* of the text
    // (i.e., if the user typed something beyond just the time phrase)
    // This check might be complex; for now, trim unconditionally if the function exists.
    let finalTaskText = rawTaskText;
    if (typeof trimProjectPhrase === 'function') {
         finalTaskText = trimProjectPhrase(rawTaskText);
    }


    // Update project usage and add the log entry
    updateProjectLastUsed(projectId);
    addLogEntry({
        timestamp: endTimestamp,
        startTime: startTimestamp,
        taskText: finalTaskText, // Use the potentially trimmed text
        duration: durationMinutes,
        projectId: projectId
        // logId will be generated by addLogEntry
    });

    showNotification("Manual log entry saved! 👍", "success");
    toggleManualLogForm(false); // Hide the form after successful submission
}


/**
 * Updates the text and behavior of the original time suggestion buttons
 * based on whether the start time field is filled.
 * @param {'manual' | 'inactivity'} formType - Specifies which form's buttons to update.
 */
function updateTimeSuggestionButtons(formType = 'manual') {
    const container = (formType === 'manual') ? timeSuggestionContainer : inactivityTimeSuggestionContainer;
    const label = (formType === 'manual') ? timeSuggestionLabel : inactivityTimeSuggestionLabel;
    const startInput = (formType === 'manual') ? manualLogStartInput : inactivityManualLogStartInput;

    if (!container || !label || !startInput) return;

    // For inactivity form, the mode buttons handle the logic, not this function
    if (formType === 'inactivity') return;

    // Logic only for the original manual log form's duration buttons
    const isStartTimeFilled = startInput.value !== '';
    label.textContent = isStartTimeFilled ? "Add Duration:" : "Quick Add:";

    container.querySelectorAll('.time-suggestion-btn').forEach(button => {
        // Only target buttons with a 'duration' dataset attribute
        if (button.dataset.duration) {
            const duration = parseInt(button.dataset.duration);
            let labelText = (duration >= 60) ? `${duration / 60}h` : `${duration}m`;
            button.textContent = isStartTimeFilled ? `+${labelText}` : `Last ${labelText}`;
        }
    });
}

/**
 * Handles clicks on the original duration suggestion buttons in the manual log form.
 * Sets start/end times based on the button's duration and current form state.
 * @param {number} durationMinutes - The duration in minutes from the clicked button.
 * @param {'manual' | 'inactivity'} formType - Specifies which form's times to set.
 */
function handleTimeSuggestionClick(durationMinutes, formType = 'manual') {
    const dateInput = (formType === 'manual') ? manualLogDateInput : inactivityManualLogDateInput;
    const startInput = (formType === 'manual') ? manualLogStartInput : inactivityManualLogStartInput;
    const endInput = (formType === 'manual') ? manualLogEndInput : inactivityManualLogEndInput;

    if (!dateInput || !startInput || !endInput) return;

    const dateStr = dateInput.value;
    const startTimeStr = startInput.value;

    // If start time is NOT filled, set start/end relative to 'now'
    if (!startTimeStr) {
        const now = new Date();
        const endTime = now;
        const startTime = new Date(now.getTime() - durationMinutes * 60 * 1000);

        startInput.value = formatTimeHHMM(startTime.getHours(), startTime.getMinutes());
        endInput.value = formatTimeHHMM(endTime.getHours(), endTime.getMinutes());
        // Also set the date to today if using 'Last X min'
        dateInput.value = getDateString(now);
    }
    // If start time IS filled, calculate end time based on start time + duration
    else {
        if (!dateStr) {
            showNotification("Please select a Date first!", "warning"); return;
        }
        const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
        if (isNaN(startDateTime.getTime())) {
            showNotification("Invalid Start Time or Date.", "error"); return;
        }
        const endTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
        endInput.value = formatTimeHHMM(endTime.getHours(), endTime.getMinutes());
    }

    // Update button labels after setting times (only for manual form)
    if (formType === 'manual') {
        updateTimeSuggestionButtons('manual');
    }
}

// --- NLP Time Parsing Integration ---


/**
 * Handles input events on task fields designated for NLP time parsing.
 * Debounces the parsing call, generates suggestions, and auto-applies the top one.
 * ACCEPTS formType parameter now.
 * @param {Event} event - The input event.
 * @param {'manual' | 'inactivity'} formType - The type of form triggering the event.
 */
function handleNlpTaskInput(event, formType) { // Added formType parameter
    const inputElement = event.target;
    const text = inputElement.value;
    // Determine context date input based on formType
    const dateInput = (formType === 'manual') ? manualLogDateInput : inactivityManualLogDateInput;

    // Clear previous debounce timer
    clearTimeout(nlpSuggestionDebounceTimer);

    // Reset applied suggestion state for the specific formType immediately on new input
    if (appliedNlpSuggestionIndex.hasOwnProperty(formType)) {
       appliedNlpSuggestionIndex[formType] = -1;
    }

    // Clear/update suggestions display immediately
    if (text.length < 3) {
        if (typeof renderTimeSuggestions === 'function') {
            // Pass formType and the specific applied index
            renderTimeSuggestions([], formType, -1);
        }
        currentNlpSuggestions = []; // Clear state
        return;
    } else {
         // Re-render existing suggestions without highlight while typing
         if (typeof renderTimeSuggestions === 'function') {
            // Pass formType and the specific applied index
            renderTimeSuggestions(currentNlpSuggestions, formType, appliedNlpSuggestionIndex[formType] ?? -1);
         }
    }


    // Set a new timer to parse after a delay
    nlpSuggestionDebounceTimer = setTimeout(() => {
        const contextDate = new Date(); // Use UTC date or fallback

        if (typeof parseTimeInput === 'function') {
            // Generate new suggestions
            currentNlpSuggestions = parseTimeInput(text, contextDate);

            // Check if the specific form type exists in applied index state
             if (!appliedNlpSuggestionIndex.hasOwnProperty(formType)) {
                 console.error(`Invalid formType "${formType}" for applied index state.`);
                 return; // Avoid proceeding with invalid form type
             }

            // Auto-apply the first suggestion if available
            if (currentNlpSuggestions.length > 0) {
                if (typeof applyNlpSuggestionUI === 'function') {
                    // Call applyNlpSuggestionUI with the correct formType
                    applyNlpSuggestionUI(0, formType);
                } else {
                    console.error("applyNlpSuggestionUI function not defined.");
                    // Fallback rendering if apply function is missing
                    if (typeof renderTimeSuggestions === 'function') {
                       // Pass formType and the specific applied index
                       renderTimeSuggestions(currentNlpSuggestions, formType, appliedNlpSuggestionIndex[formType]);
                    }
                }
            } else {
                // No suggestions found, clear the list and applied state for this formType
                appliedNlpSuggestionIndex[formType] = -1;
                if (typeof renderTimeSuggestions === 'function') {
                    renderTimeSuggestions([], formType, -1);
                }
            }
        } else {
            console.error("parseTimeInput function is not defined.");
             // Clear state and display if parsing function missing
             currentNlpSuggestions = [];
             appliedNlpSuggestionIndex[formType] = -1;
             if (typeof renderTimeSuggestions === 'function') {
                 renderTimeSuggestions([], formType, -1);
             }
        }
    }, NLP_DEBOUNCE_DELAY); // Use debounce delay
}
// NOTE: handleNlpSuggestionClick is now removed as its logic is in ui.js (applyNlpSuggestionUI, handleSuggestionClickUI)


// --- Edit Log Form (No NLP integration added here currently) ---

/**
 * Handles the submission of the edit log form.
 * @param {Event} event - The form submission event.
 */
function handleEditLogSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    const logId = editLogIdInput.value;
    const originalEntryData = findLogEntryById(logId);

    if (!originalEntryData) {
        showNotification("Original log entry not found for update.", "error");
        closeEditLogModal();
        return;
    }
    const originalDateStr = originalEntryData.dateStr; // Date the entry was originally on

    // Get updated values from the form
    const taskText = editLogTaskInput.value.trim(); // Trim project phrase here too? Maybe not for edit.
    const projectId = editLogProjectSelect.value;
    const dateStr = editLogDateInput.value; // Potentially new date
    const startTimeStr = editLogStartInput.value;
    const endTimeStr = editLogEndInput.value;

    // --- Validation ---
    if (!taskText || !projectId || !dateStr || !startTimeStr || !endTimeStr) {
        showNotification("Please fill all fields.", "warning");
        return;
    }
    const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
    const endDateTime = new Date(`${dateStr}T${endTimeStr}`);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        showNotification("Invalid date or time format.", "error");
        return;
    }
    if (endDateTime <= startDateTime) {
        showNotification("End time must be after start time.", "warning");
        return;
    }
    // --- End Validation ---

    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (60 * 1000));
    const newEndTimestamp = endDateTime.getTime();
    const newStartTime = startDateTime.getTime();
    const newDateStr = getDateString(startDateTime); // Date string based on potentially new start time

    // Remove the original entry from its original date
    if (logEntries[originalDateStr]) {
        logEntries[originalDateStr] = logEntries[originalDateStr].filter(e => e.logId !== logId);
        // Clean up the date key if it becomes empty
        if (logEntries[originalDateStr].length === 0) {
            delete logEntries[originalDateStr];
        }
    }

    // Add the updated entry (potentially to a new date)
    animateItemId = logId; // Flag for animation
    addLogEntry({
        logId: logId, // Keep the original ID
        timestamp: newEndTimestamp,
        startTime: newStartTime,
        taskText: taskText, // Use original trimmed text for edit
        duration: durationMinutes,
        projectId: projectId
    });

    showNotification("Log entry updated!", "success");
    closeEditLogModal(); // Close the modal

    // Refresh the log view for the date that was being displayed
    // This ensures the view updates correctly even if the entry moved dates
    renderLogRecords(displayedLogDate);
    renderLogSummary(displayedLogDate);
}
