// js/storage.js

// --- Local Storage Keys ---
const LS_TASKS_KEY = 'pomodoroTasks_v6';
const LS_PROJECTS_KEY = 'pomodoroProjects_v7';
const LS_SETTINGS_KEY = 'pomodoroSettings_v10';
const LS_LOG_KEY = 'pomodoroLogs_v4';
const LS_REMINDERS_KEY = 'pomodoroReminders_v1';
const LS_WIDGETS_KEY = 'pomodoroWidgets_v1'; // NEW: Key for widgets

// --- Constants (related to storage defaults) ---
const DEFAULT_PROJECT_ID = 'inbox';
const DEFAULT_PROJECT_COLOR = '#6b7280'; // Default gray for Inbox
const PROJECT_COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f97316', '#0ea5e9', '#eab308', '#8b5cf6']; // Default colors for new projects

// --- Task Storage ---
/**
 * Saves the current tasks array to local storage.
 */
function saveTasks() {
    try {
        localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error("Save tasks failed:", e);
        showNotification("Error saving tasks.", "error");
    }
}

/**
 * Loads tasks from local storage into the tasks array.
 * Performs basic validation and migration if needed.
 */
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem(LS_TASKS_KEY);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks).map(t => ({
                ...t,
                id: t.id || generateUniqueId('task'),
                projectId: t.projectId || DEFAULT_PROJECT_ID,
                pomodorosCompleted: t.pomodorosCompleted || 0
            }));
        } else {
            tasks = [];
        }
    } catch (e) {
        console.error("Load tasks failed:", e);
        tasks = [];
        showNotification("Error loading tasks.", "error");
    }
    if (activeTaskIndex !== null && !tasks.some(t => t.id === activeTaskIndex && !t.completed)) {
        activeTaskIndex = null;
        activeTaskFocusStartTime = null;
    }
}

// --- Project Storage ---
/**
 * Saves the current projects array to local storage.
 */
function saveProjects() {
    try {
        localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error("Save projects failed:", e);
        showNotification("Error saving projects.", "error");
    }
}

/**
 * Loads projects from local storage into the projects array.
 * Ensures the default 'Inbox' project exists and assigns default colors if needed.
 */
function loadProjects() {
    try {
        const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
        projects = storedProjects ? JSON.parse(storedProjects) : [];
        nextColorIndex = projects.length;
    } catch (e) {
        console.error("Load projects failed:", e);
        projects = [];
        showNotification("Error loading projects.", "error");
    }
    if (projects.length === 0 || !projects.some(p => p.id === DEFAULT_PROJECT_ID)) {
        projects.unshift({ id: DEFAULT_PROJECT_ID, name: 'Inbox', color: DEFAULT_PROJECT_COLOR, lastUsed: 0 });
    }
    let needsSave = false;
    projects = projects.map((p, idx) => {
        let updated = false;
        if (!p.color) {
            p.color = PROJECT_COLORS[idx % PROJECT_COLORS.length];
            updated = true;
        }
        if (p.lastUsed === undefined) {
            p.lastUsed = 0;
            updated = true;
        }
        if (updated) needsSave = true;
        return p;
    });
    if (needsSave) {
        saveProjects();
    }
}


// --- Settings Storage ---
/**
 * Saves the current settings object to local storage.
 * Also applies the dark mode setting immediately and shows notification.
 */
function saveSettings() {
    try {
        const workDurationVal = workDurationInput ? parseInt(workDurationInput.value) : settings.workDuration;
        const shortBreakDurationVal = shortBreakDurationInput ? parseInt(shortBreakDurationInput.value) : settings.shortBreakDuration;
        const longBreakDurationVal = longBreakDurationInput ? parseInt(longBreakDurationInput.value) : settings.longBreakDuration;
        const longBreakIntervalVal = longBreakIntervalInput ? parseInt(longBreakIntervalInput.value) : settings.longBreakInterval;
        const soundEnabledVal = soundEnabledInput ? soundEnabledInput.checked : settings.soundEnabled;
        const showElapsedVal = showElapsedEnabledInput ? showElapsedEnabledInput.checked : settings.showElapsedTime;
        const darkModeVal = darkModeToggle ? darkModeToggle.checked : settings.darkModeEnabled;
        const inactivityTimeoutVal = inactivityTimeoutInput ? parseInt(inactivityTimeoutInput.value) : settings.inactivityTimeoutMinutes;
        const gifUrlsVal = celebrationGifUrlsTextarea ? celebrationGifUrlsTextarea.value : settings.celebrationGifUrls.join('\n');

        settings.workDuration = Math.max(1, workDurationVal || 25);
        settings.shortBreakDuration = Math.max(1, shortBreakDurationVal || 5);
        settings.longBreakDuration = Math.max(1, longBreakDurationVal || 15);
        settings.longBreakInterval = Math.max(1, longBreakIntervalVal || 4);
        settings.soundEnabled = soundEnabledVal;
        settings.showElapsedTime = showElapsedVal;
        settings.darkModeEnabled = darkModeVal;
        settings.inactivityTimeoutMinutes = Math.max(0, inactivityTimeoutVal || 10);
        settings.celebrationGifUrls = gifUrlsVal.split('\n').map(url => url.trim()).filter(url => url.length > 0);

        localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
        showNotification('Settings saved!', 'success');

        if (workDurationInput) workDurationInput.value = settings.workDuration;
        if (shortBreakDurationInput) shortBreakDurationInput.value = settings.shortBreakDuration;
        if (longBreakDurationInput) longBreakDurationInput.value = settings.longBreakDuration;
        if (longBreakIntervalInput) longBreakIntervalInput.value = settings.longBreakInterval;
        if (soundEnabledInput) soundEnabledInput.checked = settings.soundEnabled;
        if (showElapsedEnabledInput) showElapsedEnabledInput.checked = settings.showElapsedTime;
        if (darkModeToggle) darkModeToggle.checked = settings.darkModeEnabled;
        if (inactivityTimeoutInput) inactivityTimeoutInput.value = settings.inactivityTimeoutMinutes;
        if (celebrationGifUrlsTextarea) celebrationGifUrlsTextarea.value = settings.celebrationGifUrls.join('\n');

        applyDarkMode(settings.darkModeEnabled);
        updateTimerDisplayAndProgress();

    } catch (e) {
        console.error("Save settings failed:", e);
        showNotification("Error saving settings. See console for details.", "error");
    }
}

/**
 * Loads settings from local storage into the settings object.
 * Applies the loaded theme.
 */
function loadSettings() {
    try {
        const storedSettings = localStorage.getItem(LS_SETTINGS_KEY);
        if (storedSettings) {
            const loaded = JSON.parse(storedSettings);
            settings = {
                ...settings,
                ...loaded,
                soundEnabled: loaded.soundEnabled === undefined ? true : loaded.soundEnabled,
                showElapsedTime: loaded.showElapsedTime === undefined ? false : loaded.showElapsedTime,
                celebrationGifUrls: Array.isArray(loaded.celebrationGifUrls) ? loaded.celebrationGifUrls : [],
                darkModeEnabled: loaded.darkModeEnabled === undefined ? false : loaded.darkModeEnabled,
                inactivityTimeoutMinutes: loaded.inactivityTimeoutMinutes === undefined ? 10 : Math.max(0, loaded.inactivityTimeoutMinutes)
            };
        }
    } catch (e) {
        console.error("Load settings failed:", e);
        showNotification("Error loading settings.", "error");
    }
    applyDarkMode(settings.darkModeEnabled);
}

// --- Log Storage ---
/**
 * Loads log entries from local storage into the logEntries object.
 * Performs migration for older log formats (adding startTime, logId).
 */
function loadLogs() {
    try {
        const storedLogs = localStorage.getItem(LS_LOG_KEY);
        logEntries = storedLogs ? JSON.parse(storedLogs) : {};
        let logsUpdated = false;
        Object.keys(logEntries).forEach(dateStr => {
            if (!Array.isArray(logEntries[dateStr])) {
                delete logEntries[dateStr]; logsUpdated = true; return;
            }
            logEntries[dateStr].forEach((entry, index) => {
                if (!entry || typeof entry !== 'object' || !entry.timestamp || !entry.duration) {
                     logEntries[dateStr].splice(index, 1); logsUpdated = true; return;
                }
                if (entry.startTime === undefined) {
                    entry.startTime = entry.timestamp - (entry.duration * 60 * 1000); logsUpdated = true;
                }
                if (entry.logId === undefined) {
                    entry.logId = generateUniqueId('log'); logsUpdated = true;
                }
                if (entry.projectId === undefined) {
                     const matchingTask = tasks.find(t => t.text === entry.taskText);
                     entry.projectId = matchingTask ? matchingTask.projectId : DEFAULT_PROJECT_ID;
                    logsUpdated = true;
                }
            });
            logEntries[dateStr].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
        });
        if (logsUpdated) { saveLogs(); }
    } catch (e) {
        console.error("Failed to load logs from local storage:", e);
        logEntries = {};
        showNotification("Error loading log entries.", "error");
    }
}

/**
 * Saves the current logEntries object to local storage.
 */
function saveLogs() {
    try {
        localStorage.setItem(LS_LOG_KEY, JSON.stringify(logEntries));
    } catch (e) {
        console.error("Failed to save logs to local storage:", e);
        showNotification("Error saving log entries.", "error");
    }
}


// --- Reminder Storage ---
/**
 * Saves the current reminders array to local storage.
 */
function saveReminders() {
    try {
        localStorage.setItem(LS_REMINDERS_KEY, JSON.stringify(reminders));
    } catch (e) {
        console.error("Save reminders failed:", e);
        showNotification("Error saving reminders.", "error");
    }
}

/**
 * Loads reminders from local storage into the reminders array.
 * Performs basic validation.
 */
function loadReminders() {
    try {
        const storedReminders = localStorage.getItem(LS_REMINDERS_KEY);
        if (storedReminders) {
            const loaded = JSON.parse(storedReminders);
            reminders = loaded.filter(r =>
                r && typeof r === 'object' && r.id && r.text && typeof r.time === 'number'
            ).map(r => ({
                ...r,
                triggered: r.triggered || false
            }));
        } else {
            reminders = [];
        }
    } catch (e) {
        console.error("Load reminders failed:", e);
        reminders = [];
        showNotification("Error loading reminders.", "error");
    }
    const now = Date.now();
    const initialLength = reminders.length;
    reminders = reminders.filter(r => r.time >= now || !r.triggered);
    if (reminders.length < initialLength) {
        saveReminders();
    }
}

// --- NEW: Widget Storage ---
/**
 * Saves the current widgets array to local storage.
 */
function saveWidgets() {
    try {
        // Before saving, clear any running interval IDs from the state
        // to avoid saving non-serializable interval references.
        const widgetsToSave = widgets.map(widget => {
            if (widget.type === 'countdown') {
                // Return a copy without the intervalId if it exists
                const { intervalId, ...restOfState } = widget.state;
                return { ...widget, state: restOfState };
            }
            return widget; // Return other widget types as is
        });
        localStorage.setItem(LS_WIDGETS_KEY, JSON.stringify(widgetsToSave));
    } catch (e) {
        console.error("Save widgets failed:", e);
        showNotification("Error saving widgets.", "error");
    }
}

/**
 * Loads widgets from local storage into the widgets array.
 * Performs basic validation and ensures default state properties exist.
 */
function loadWidgets() {
    try {
        const storedWidgets = localStorage.getItem(LS_WIDGETS_KEY);
        if (storedWidgets) {
            const loaded = JSON.parse(storedWidgets);
            // Validate each widget object
            widgets = loaded.filter(w =>
                w && typeof w === 'object' && w.id && w.type && w.title && w.state
            ).map(w => {
                // Ensure default state properties based on type
                if (w.type === 'counter') {
                    return {
                        ...w,
                        state: {
                            value: w.state.value || 0 // Default counter value
                        }
                    };
                } else if (w.type === 'countdown') {
                    // Reset running state and interval on load
                    return {
                        ...w,
                        state: {
                            timeRemaining: w.state.timeRemaining || 0,
                            totalSeconds: w.state.totalSeconds || 0,
                            isRunning: false // Always start paused on load
                            // intervalId is not loaded/saved
                        }
                    };
                }
                // Filter out unknown types (or handle them if needed)
                return null;
            }).filter(w => w !== null); // Remove null entries from filtered map
        } else {
            widgets = []; // Initialize if nothing is stored
        }
    } catch (e) {
        console.error("Load widgets failed:", e);
        widgets = []; // Reset on error
        showNotification("Error loading widgets.", "error");
    }
    // Note: Countdown timers are not automatically restarted on load.
    // User needs to manually start them again.
}
// --- End Widget Storage ---

