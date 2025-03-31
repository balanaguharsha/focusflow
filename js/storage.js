// js/storage.js

// --- Local Storage Keys ---
const LS_TASKS_KEY = 'pomodoroTasks_v6';
const LS_PROJECTS_KEY = 'pomodoroProjects_v7';
const LS_SETTINGS_KEY = 'pomodoroSettings_v10'; // Using latest key
const LS_LOG_KEY = 'pomodoroLogs_v4';
const LS_REMINDERS_KEY = 'pomodoroReminders_v1'; // *** NEW KEY ***

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
            // Parse and ensure tasks have necessary properties
            tasks = JSON.parse(storedTasks).map(t => ({
                ...t,
                id: t.id || generateUniqueId('task'), // Ensure ID exists
                projectId: t.projectId || DEFAULT_PROJECT_ID, // Ensure project ID exists
                pomodorosCompleted: t.pomodorosCompleted || 0 // Ensure pomodoro count exists
            }));
        } else {
            tasks = []; // Initialize if nothing is stored
        }
    } catch (e) {
        console.error("Load tasks failed:", e);
        tasks = []; // Reset on error
        showNotification("Error loading tasks.", "error");
    }

    // Validate activeTaskIndex
    if (activeTaskIndex !== null && !tasks.some(t => t.id === activeTaskIndex && !t.completed)) {
        activeTaskIndex = null; // Reset if active task doesn't exist or is completed
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
        nextColorIndex = projects.length; // Initialize color index based on loaded projects
    } catch (e) {
        console.error("Load projects failed:", e);
        projects = []; // Reset on error
        showNotification("Error loading projects.", "error");
    }

    // Ensure the default 'Inbox' project exists
    if (projects.length === 0 || !projects.some(p => p.id === DEFAULT_PROJECT_ID)) {
        projects.unshift({ id: DEFAULT_PROJECT_ID, name: 'Inbox', color: DEFAULT_PROJECT_COLOR, lastUsed: 0 });
    }

    // Ensure all projects have a color and lastUsed timestamp
    let needsSave = false;
    projects = projects.map((p, idx) => {
        let updated = false;
        if (!p.color) {
            const defaultColorIndex = idx % PROJECT_COLORS.length;
            p.color = PROJECT_COLORS[defaultColorIndex];
            updated = true;
        }
        if (p.lastUsed === undefined) {
            p.lastUsed = 0; // Initialize lastUsed
            updated = true;
        }
        if (updated) needsSave = true;
        return p;
    });

    if (needsSave) {
        saveProjects(); // Save if any projects were updated
    }
}


// --- Settings Storage ---
/**
 * Saves the current settings object to local storage.
 * Also applies the dark mode setting immediately and shows notification.
 */
function saveSettings() {
    try {
        // Ensure settings input elements exist before reading values
        const workDurationVal = workDurationInput ? parseInt(workDurationInput.value) : settings.workDuration;
        const shortBreakDurationVal = shortBreakDurationInput ? parseInt(shortBreakDurationInput.value) : settings.shortBreakDuration;
        const longBreakDurationVal = longBreakDurationInput ? parseInt(longBreakDurationInput.value) : settings.longBreakDuration;
        const longBreakIntervalVal = longBreakIntervalInput ? parseInt(longBreakIntervalInput.value) : settings.longBreakInterval;
        const soundEnabledVal = soundEnabledInput ? soundEnabledInput.checked : settings.soundEnabled;
        const showElapsedVal = showElapsedEnabledInput ? showElapsedEnabledInput.checked : settings.showElapsedTime;
        const darkModeVal = darkModeToggle ? darkModeToggle.checked : settings.darkModeEnabled;
        const inactivityTimeoutVal = inactivityTimeoutInput ? parseInt(inactivityTimeoutInput.value) : settings.inactivityTimeoutMinutes;
        const gifUrlsVal = celebrationGifUrlsTextarea ? celebrationGifUrlsTextarea.value : settings.celebrationGifUrls.join('\n');

        // Update settings object from input fields (with validation/clamping)
        settings.workDuration = Math.max(1, workDurationVal || 25);
        settings.shortBreakDuration = Math.max(1, shortBreakDurationVal || 5);
        settings.longBreakDuration = Math.max(1, longBreakDurationVal || 15);
        settings.longBreakInterval = Math.max(1, longBreakIntervalVal || 4);
        settings.soundEnabled = soundEnabledVal;
        settings.showElapsedTime = showElapsedVal;
        settings.darkModeEnabled = darkModeVal;
        settings.inactivityTimeoutMinutes = Math.max(0, inactivityTimeoutVal || 10); // Clamp inactivity timeout (0 disables)

        // Process celebration GIF URLs
        const urls = gifUrlsVal
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0);
        settings.celebrationGifUrls = urls;

        // Save to Local Storage
        localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));

        // *** Show notification on successful save ***
        showNotification('Settings saved!', 'success');

        // Update input fields to reflect potentially clamped values (if elements exist)
        if (workDurationInput) workDurationInput.value = settings.workDuration;
        if (shortBreakDurationInput) shortBreakDurationInput.value = settings.shortBreakDuration;
        if (longBreakDurationInput) longBreakDurationInput.value = settings.longBreakDuration;
        if (longBreakIntervalInput) longBreakIntervalInput.value = settings.longBreakInterval;
        if (soundEnabledInput) soundEnabledInput.checked = settings.soundEnabled;
        if (showElapsedEnabledInput) showElapsedEnabledInput.checked = settings.showElapsedTime;
        if (darkModeToggle) darkModeToggle.checked = settings.darkModeEnabled;
        if (inactivityTimeoutInput) inactivityTimeoutInput.value = settings.inactivityTimeoutMinutes;
        if (celebrationGifUrlsTextarea) celebrationGifUrlsTextarea.value = settings.celebrationGifUrls.join('\n');

        // Apply changes immediately
        applyDarkMode(settings.darkModeEnabled); // Apply theme change
        updateTimerDisplayAndProgress(); // Update timer display if needed

        // NOTE: Inactivity timer reset is handled in main.js after saveSettings completes

    } catch (e) {
        // Log the specific error that occurred during saving
        console.error("Save settings failed:", e);
        // Show a user-friendly notification
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
                ...settings, // Start with defaults
                ...loaded,   // Overwrite with loaded
                // Ensure boolean/array/number types and defaults for potentially missing keys
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
        // Keep default settings on error
    }

    // Apply loaded theme immediately
    applyDarkMode(settings.darkModeEnabled);
    // Other UI updates based on settings happen in initialize or openModal
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

        let logsUpdated = false; // Flag to check if migration occurred

        Object.keys(logEntries).forEach(dateStr => {
            if (!Array.isArray(logEntries[dateStr])) {
                console.warn(`Invalid log entry for date ${dateStr}, removing.`);
                delete logEntries[dateStr];
                logsUpdated = true;
                return;
            }
            logEntries[dateStr].forEach((entry, index) => {
                // Basic validation of entry structure
                if (!entry || typeof entry !== 'object' || !entry.timestamp || !entry.duration) {
                     console.warn(`Invalid log entry found at ${dateStr}[${index}], removing.`, entry);
                     // Safe removal while iterating backwards or creating new array is better,
                     // but splice might be okay if careful or if this is rare.
                     // For simplicity here, we'll assume it's okay for now.
                     logEntries[dateStr].splice(index, 1);
                     logsUpdated = true;
                     return; // Skip further processing of this invalid entry
                }

                // Migration checks
                if (entry.startTime === undefined) {
                    entry.startTime = entry.timestamp - (entry.duration * 60 * 1000);
                    logsUpdated = true;
                }
                if (entry.logId === undefined) {
                    entry.logId = generateUniqueId('log');
                    logsUpdated = true;
                }
                if (entry.projectId === undefined) {
                    // Try to find matching task by text, otherwise default to Inbox
                     const matchingTask = tasks.find(t => t.text === entry.taskText);
                     entry.projectId = matchingTask ? matchingTask.projectId : DEFAULT_PROJECT_ID;
                    logsUpdated = true;
                }
            });
            // Sort entries after potential modifications
            logEntries[dateStr].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
        });

        if (logsUpdated) {
            console.log("Log entries migrated/updated. Saving changes.");
            saveLogs();
        }
    } catch (e) {
        console.error("Failed to load logs from local storage:", e);
        logEntries = {}; // Reset on error
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


// *** NEW: Reminder Storage ***

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
            // Validate each reminder object
            reminders = loaded.filter(r =>
                r && typeof r === 'object' && r.id && r.text && typeof r.time === 'number'
            ).map(r => ({
                ...r,
                triggered: r.triggered || false // Ensure triggered property exists
            }));
        } else {
            reminders = []; // Initialize if nothing is stored
        }
    } catch (e) {
        console.error("Load reminders failed:", e);
        reminders = []; // Reset on error
        showNotification("Error loading reminders.", "error");
    }
    // Remove past, triggered reminders on load (optional cleanup)
    const now = Date.now();
    const initialLength = reminders.length;
    reminders = reminders.filter(r => r.time >= now || !r.triggered);
    if (reminders.length < initialLength) {
        console.log("Cleaned up past/triggered reminders on load.");
        saveReminders(); // Save cleanup
    }
}
// *** END NEW ***
