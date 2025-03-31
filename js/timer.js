// js/timer.js

// --- Timer Logic ---

/**
 * Handles the click event for the Start/Pause button.
 * Prompts for task selection if starting a work session without an active task.
 */
function handleStartPauseClick() {
    // Ensure audio context is ready on user interaction
    initializeAudio();
    if (isRunning) {
        pauseTimer();
    } else {
        // Only prompt for task if starting a WORK session
        if (currentMode === 'work' && activeTaskIndex === null) {
            promptTaskSelection(); // Show modal to select a task or start without one
        } else {
            startTimerInternal();
        }
    }
}

/**
 * Starts the timer interval and updates the UI.
 * Assumes necessary checks (like task selection) have been done.
 * Adjusts activeTaskFocusStartTime if resuming from a pause *during work mode*.
 */
function startTimerInternal() {
    if (isRunning) return; // Prevent multiple intervals

    // --- Adjust focus start time if resuming from pause during WORK mode ---
    if (currentMode === 'work' && pauseStartTime && activeTaskFocusStartTime) {
        const pauseDuration = Date.now() - pauseStartTime;
        activeTaskFocusStartTime += pauseDuration; // Add pause duration to start time
        console.log(`Resumed work. Adjusted focus start time by ${Math.round(pauseDuration / 1000)}s.`);
    } else if (currentMode !== 'work') {
        // Ensure no focus time is tracked during breaks
        activeTaskFocusStartTime = null;
    }
    pauseStartTime = null; // Clear pause start time as timer is now running
    // --- End adjustment ---

    isRunning = true;
    pomodoroStopTime = null; // Timer is running, so clear stop time

    // Apply focus mode styles ONLY if in work mode
    if (currentMode === 'work') {
        bodyElement.classList.add('timer-running-focus');
    } else {
        bodyElement.classList.remove('timer-running-focus'); // Ensure it's off for breaks
    }


    clearInactivityTimer(); // Stop inactivity countdown
    updateInactivityDisplay(); // Update display to "Paused (Timer Active)"

    // Set total duration based on the current mode
    switch (currentMode) {
        case 'work':       totalDurationSeconds = settings.workDuration * 60; break;
        case 'shortBreak': totalDurationSeconds = settings.shortBreakDuration * 60; break;
        case 'longBreak':  totalDurationSeconds = settings.longBreakDuration * 60; break;
        default:           totalDurationSeconds = settings.workDuration * 60; // Fallback
    }

    // Ensure timeRemaining is correctly set, especially if starting from 0 or partial time
    if (timeRemaining <= 0) {
         timeRemaining = totalDurationSeconds;
    } else {
         // If resuming, keep the current timeRemaining, but ensure it's not more than the total duration
         timeRemaining = Math.min(timeRemaining, totalDurationSeconds);
    }

    // Update button appearance to 'Pause'
    if (startPauseIconWrapper) startPauseIconWrapper.innerHTML = SVG_STRINGS.pause;
    if (startPauseButtonText) startPauseButtonText.textContent = 'Pause';
    if (startPauseButton) {
        startPauseButton.classList.replace('bg-indigo-600', 'bg-yellow-500');
        startPauseButton.classList.replace('hover:bg-indigo-700', 'hover:bg-yellow-600');
    }

    clearInterval(timerInterval);
    updateTimerDisplayAndProgress(); // Initial display update

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplayAndProgress();

        // Check if timer reached zero
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            pomodoroStopTime = Date.now(); // Record stop time
            bodyElement.classList.remove('timer-running-focus'); // Exit focus mode
            playNotificationSound(); // Play sound notification

            startInactivityCountdown(); // Start inactivity countdown

            switchMode(); // Automatically switch to the next mode
        }
    }, 1000); // Update every second
}

/**
 * Pauses the timer interval and updates the UI.
 * Records the pause start time.
 */
function pauseTimer() {
    if (!isRunning) return; // Do nothing if already paused

    isRunning = false;
    pomodoroStopTime = Date.now(); // Record stop time
    // Record pause start time ONLY if a task is focused during work mode
    if (currentMode === 'work' && activeTaskFocusStartTime) {
        pauseStartTime = Date.now();
    } else {
        pauseStartTime = null; // No need to track pause time during breaks or unfocused work
    }
    bodyElement.classList.remove('timer-running-focus'); // Exit focus mode
    clearInterval(timerInterval); // Stop the interval

    startInactivityCountdown(); // Start the inactivity timer countdown

    // Update button appearance to 'Resume' or 'Start'
    if (startPauseIconWrapper) startPauseIconWrapper.innerHTML = SVG_STRINGS.play;
    if (startPauseButtonText) startPauseButtonText.textContent = (timeRemaining < totalDurationSeconds && timeRemaining > 0) ? 'Resume' : 'Start';
    if (startPauseButton) {
        startPauseButton.classList.replace('bg-yellow-500', 'bg-indigo-600');
        startPauseButton.classList.replace('hover:bg-yellow-600', 'hover:bg-indigo-700');
    }
}

/**
 * Resets the timer to the beginning of the current or specified mode.
 * **Unfocuses any active task.**
 * @param {boolean} [switchToWork=false] - If true, forces switch to 'work' mode and resets pomodoro count.
 */
function resetTimer(switchToWork = false) {
    const wasRunning = isRunning;
    // Check if timer is running *before* pausing
    if (isRunning) {
        pauseTimer(); // Stop the timer first (this sets pomodoroStopTime and calls startInactivityCountdown)
    } else {
        // If already stopped, still record a 'stop' time for inactivity and start countdown
        pomodoroStopTime = Date.now();
        pauseStartTime = null; // Ensure pause time is cleared on reset
        startInactivityCountdown();
    }

    // *** ADDED: Unfocus task on reset ***
    unfocusTask(false); // Unfocus without notification

    if (switchToWork) {
        currentMode = 'work';
        workSessionsCompleted = 0; // Reset pomodoro count on full reset
    }

    setTimerForMode(currentMode); // This updates display and timeRemaining
    showNotification("Timer reset.", "info");

    // Display is updated by startInactivityCountdown called within pauseTimer or just above
    // --- Explicitly reset button appearance ---
    if (startPauseIconWrapper) startPauseIconWrapper.innerHTML = SVG_STRINGS.play;
    if (startPauseButtonText) startPauseButtonText.textContent = 'Start';
    if (startPauseButton) {
        // Ensure classes are reset correctly, regardless of previous state
        startPauseButton.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
        startPauseButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    }
    // --- END Explicit reset ---

    updateInactivityDisplay(); // Explicitly call here too for safety
}

/**
 * Skips the current timer mode and switches to the next one.
 * Logs time for the active task if skipping a work session.
 * **Unfocuses any active task if skipping from work.**
 */
function skipMode() {
    const wasRunning = isRunning;
    const wasWorkMode = currentMode === 'work'; // Check if skipping from work

    // Log time if skipping a work session with an active task
    if (wasWorkMode && activeTaskIndex !== null && activeTaskFocusStartTime) {
         const task = tasks.find(t => t.id === activeTaskIndex);
         if (task) {
             const endTime = Date.now();
             const startTime = activeTaskFocusStartTime; // Already adjusted for pauses
             // Calculate actual focused duration
             const currentFocusDurationMs = endTime - startTime;
             const currentFocusDurationMinutes = Math.round(currentFocusDurationMs / (1000 * 60));

             if (currentFocusDurationMinutes > 0) {
                 addLogEntry({
                     timestamp: endTime, startTime: startTime, taskText: task.text,
                     duration: currentFocusDurationMinutes, projectId: task.projectId
                 });
                 showNotification(`Logged ${currentFocusDurationMinutes} min focus before skipping.`, 'info');
             }
         }
         // *** MOVED: Unfocus happens after logging, before switching mode ***
         // activeTaskFocusStartTime = null; // Clear start time after logging/skipping
    }

    // Stop the current timer if running, ensuring inactivity countdown starts
    if (isRunning) {
        pauseTimer(); // This will set pauseStartTime if applicable
    } else {
        // If already stopped, ensure countdown is (re)started and pause time cleared
        pomodoroStopTime = Date.now();
        pauseStartTime = null;
        startInactivityCountdown();
    }

    // *** ADDED: Unfocus task if skipping from work mode ***
    if (wasWorkMode) {
        unfocusTask(false); // Unfocus without notification
    }

    switchMode(true); // Pass true to indicate the mode was skipped
}

/**
 * Switches the timer to the next mode (Work -> Break -> Work...).
 * Handles pomodoro counting and logging if a work session finishes naturally.
 * **Unfocuses task when switching from Work to Break.**
 * @param {boolean} [skipped=false] - Indicates if the mode was skipped rather than completed.
 */
function switchMode(skipped = false) {
    // Note: isRunning should be false here, pomodoroStopTime should be set
    let notificationMessage = "";
    const previousMode = currentMode;
    const activeTask = tasks.find(t => t.id === activeTaskIndex);

    // Log time if a work session finished naturally with an active task
    if (previousMode === 'work' && !skipped && activeTask && activeTaskFocusStartTime) {
        activeTask.pomodorosCompleted = (activeTask.pomodorosCompleted || 0) + 1;
        saveTasks(); renderTasks(); // Save and render before unfocusing

        const endTime = pomodoroStopTime || Date.now(); // Use stop time if available
        const startTime = activeTaskFocusStartTime; // Already adjusted for pauses
        // Calculate actual focused duration
        const focusedDurationMs = endTime - startTime;
        const loggedDurationMinutes = Math.round(focusedDurationMs / (1000 * 60));

        if (loggedDurationMinutes > 0) {
            addLogEntry({
                timestamp: endTime, startTime: startTime, taskText: activeTask.text,
                duration: loggedDurationMinutes, projectId: activeTask.projectId
            });
            showNotification(`Logged ${loggedDurationMinutes} min for "${activeTask.text.substring(0,20)}..."`, "success");
        }
        // *** MOVED: Unfocus happens after logging, before switching mode ***
        // activeTaskFocusStartTime = null; // Clear start time after logging
    } else if (previousMode === 'work' && !skipped) {
        // If work finished without active task or start time, still count session if not skipped
        workSessionsCompleted++;
    }

    // *** ADDED: Unfocus task when switching FROM work TO break ***
    if (previousMode === 'work') {
        unfocusTask(false); // Unfocus without notification
    }

    // Determine next mode
    if (currentMode === 'work') {
        // Increment work session count only if not skipped (already handled above)
        currentMode = (workSessionsCompleted > 0 && workSessionsCompleted % settings.longBreakInterval === 0)
                      ? 'longBreak' : 'shortBreak';
        notificationMessage = currentMode === 'longBreak'
                              ? "Work session complete! Time for a long break 😎"
                              : "Work session complete! Take a short break ✨";
        bodyElement.classList.remove('timer-running-focus');
    } else { // If current mode was a break
        currentMode = 'work';
        notificationMessage = "Break's over! Let's get back to work! 💪";
    }

    setTimerForMode(currentMode); // Set display and time for the new mode
    showNotification(notificationMessage, 'info');

    // Reset start/pause button appearance to 'Start'
    if (startPauseIconWrapper) startPauseIconWrapper.innerHTML = SVG_STRINGS.play;
    if (startPauseButtonText) startPauseButtonText.textContent = 'Start';
    if (startPauseButton) {
        startPauseButton.classList.replace('bg-yellow-500', 'bg-indigo-600');
        startPauseButton.classList.replace('hover:bg-yellow-600', 'hover:bg-indigo-700');
    }

    // Timer is stopped after switching modes, ensure inactivity countdown is running/display updated
    pauseStartTime = null; // Clear pause time when switching modes
    updateInactivityDisplay(); // Just update display
}

/**
 * Sets the timer duration, display text, and progress ring color based on the specified mode.
 * **Updates task rendering to hide/show focus buttons based on mode.**
 * @param {'work' | 'shortBreak' | 'longBreak'} mode - The timer mode to set.
 */
function setTimerForMode(mode) {
    currentMode = mode;
    let durationMinutes = 0;
    let modeText = '';
    let colorClass = 'text-indigo-600'; let darkColorClass = 'dark:text-indigo-400';

    switch (mode) {
        case 'work':
            durationMinutes = settings.workDuration; modeText = 'Work';
            colorClass = 'text-indigo-600'; darkColorClass = 'dark:text-indigo-400';
            break;
        case 'shortBreak':
            durationMinutes = settings.shortBreakDuration; modeText = 'Short Break';
            colorClass = 'text-green-600'; darkColorClass = 'dark:text-green-400';
            break;
        case 'longBreak':
            durationMinutes = settings.longBreakDuration; modeText = 'Long Break';
            colorClass = 'text-purple-600'; darkColorClass = 'dark:text-purple-400';
            break;
        default:
             durationMinutes = settings.workDuration; modeText = 'Work';
             colorClass = 'text-indigo-600'; darkColorClass = 'dark:text-indigo-400';
    }

    timeRemaining = durationMinutes * 60;
    totalDurationSeconds = timeRemaining;
    if (timerModeDisplay) timerModeDisplay.textContent = modeText;

    if (progressRing) {
        progressRing.classList.remove(
            'text-indigo-600', 'text-green-600', 'text-purple-600',
            'dark:text-indigo-400', 'dark:text-green-400', 'dark:text-purple-400'
        );
        progressRing.classList.add(colorClass, darkColorClass);
        progressRing.style.strokeDashoffset = PROGRESS_RING_CIRCUMFERENCE;
    }

    updateTimerDisplayAndProgress();
    updateFocusedTaskDisplay(); // Update focus display (should be empty if break starts)
    renderTasks(); // *** ADDED: Re-render tasks to show/hide focus buttons based on mode ***
}
