// js/utils.js

// --- Utility Functions ---

/**
 * Formats seconds into MM:SS format.
 * @param {number} seconds - The total seconds.
 * @returns {string} - The formatted time string.
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

/**
 * Displays a temporary notification message.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'warning' | 'error'} type - The type of notification.
 * @param {number} duration - How long to display the notification in milliseconds.
 */
function showNotification(message, type = 'info', duration = 3000) {
    if (!notificationArea) {
        console.warn("Notification area not found!");
        return;
    }
    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    const notification = document.createElement('div');
    notification.innerHTML = `${icons[type] || ''} <span class="ml-2">${message}</span>`;

    let bgColorClass = 'bg-blue-500 dark:bg-blue-600'; // Default info
    if (type === 'success') bgColorClass = 'bg-green-500 dark:bg-green-600';
    if (type === 'error') bgColorClass = 'bg-red-500 dark:bg-red-600';
    if (type === 'warning') bgColorClass = 'bg-yellow-500 dark:bg-yellow-600';

    notification.className = `p-3 rounded-lg shadow-md text-white text-sm ${bgColorClass} animate-fade-in flex items-center`;
    notificationArea.appendChild(notification);

    // Remove notification after duration
    setTimeout(() => {
        notification.classList.remove('animate-fade-in');
        notification.classList.add('animate-fade-out');
        // Remove from DOM after fade out animation completes
        setTimeout(() => notification.remove(), 500);
    }, duration);
}

/**
 * Formats a Date object into 'YYYY-MM-DD' string.
 * @param {Date} date - The date object.
 * @returns {string} - The formatted date string.
 */
function getDateString(date) {
    // Use Luxon for reliable formatting if available, otherwise fallback
    if (typeof luxon !== 'undefined' && luxon.DateTime.isDateTime(luxon.DateTime.fromJSDate(date))) {
        return luxon.DateTime.fromJSDate(date).toISODate();
    } else {
        // Fallback if Luxon is not loaded
        console.warn("Luxon not found, using basic date formatting.");
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

/**
 * Formats a timestamp or Date object into a locale-specific time string (e.g., "9:30 AM").
 * @param {number | Date} timestamp - The timestamp or Date object.
 * @returns {string} - The formatted time string.
 */
function formatTimeForDisplay(timestamp) {
    const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    // Use Luxon for potentially better locale support if available
    if (typeof luxon !== 'undefined' && luxon.DateTime.isDateTime(luxon.DateTime.fromJSDate(date))) {
        return luxon.DateTime.fromJSDate(date).toLocaleString(luxon.DateTime.TIME_SIMPLE); // e.g., 9:30 AM
    } else {
        // Fallback
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
}

/**
 * Formats hours and minutes into HH:MM format (for time inputs).
 * @param {number} hours - The hours (0-23).
 * @param {number} minutes - The minutes (0-59).
 * @returns {string} - The formatted HH:MM string.
 */
function formatTimeHHMM(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats a Date object into a long, readable format (e.g., "Wed, Mar 30, 2025").
 * @param {Date} date - The date object.
 * @returns {string} - The formatted date string.
 */
function formatDateForDisplay(date) {
    // Use Luxon for potentially better locale support if available
    if (typeof luxon !== 'undefined' && luxon.DateTime.isDateTime(luxon.DateTime.fromJSDate(date))) {
        return luxon.DateTime.fromJSDate(date).toLocaleString(luxon.DateTime.DATE_MED_WITH_WEEKDAY); // e.g., Wed, Mar 30, 2025
    } else {
        // Fallback
        return date.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }
}

/**
 * Generates a unique ID string.
 * @param {string} [prefix='id'] - An optional prefix for the ID.
 * @returns {string} - A unique ID.
 */
function generateUniqueId(prefix = 'id') {
    // Combine timestamp and random string for better uniqueness
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets the color associated with a project ID.
 * @param {string} projectId - The ID of the project.
 * @returns {string} - The hex color code.
 */
function getProjectColor(projectId) {
    if (projectId === DEFAULT_PROJECT_ID) return DEFAULT_PROJECT_COLOR;
    const project = projects.find(p => p.id === projectId);
    return project?.color || DEFAULT_PROJECT_COLOR;
}

/**
 * Darkens a hex color by a specified percentage.
 * @param {string} hex - The hex color code (e.g., '#RRGGBB').
 * @param {number} [percent=20] - The percentage to darken (0-100).
 * @returns {string} - The darkened hex color code.
 */
function darkenColor(hex, percent = 20) {
    try {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        r = Math.max(0, r - Math.round(r * (percent / 100)));
        g = Math.max(0, g - Math.round(g * (percent / 100)));
        b = Math.max(0, b - Math.round(b * (percent / 100)));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        console.error("Failed to darken color:", hex, e);
        return '#555555'; // Fallback dark gray
    }
}

/**
 * Determines if a hex color is light or dark based on luminance.
 * @param {string} hex - The hex color code (e.g., '#RRGGBB').
 * @returns {boolean} - True if the color is considered light, false otherwise.
 */
function isColorLight(hex) {
    try {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate luminance (standard formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Threshold can be adjusted (0.5 is common, using 0.6 for slightly more contrast)
        return luminance > 0.6;
    } catch (e) {
        console.error("Failed to determine color lightness:", hex, e);
        return true; // Default to light if calculation fails
    }
}


/**
 * Calculates the Levenshtein distance between two strings.
 * (Standard dynamic programming implementation)
 * @param {string} s1 The first string.
 * @param {string} s2 The second string.
 * @returns {number} The Levenshtein distance.
 */
function levenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}

/**
 * Parses a date string (YYYY-MM-DD) into a Date object (start of day, UTC).
 * Returns null if the string is invalid.
 * @param {string} dateStr - The date string in 'YYYY-MM-DD' format.
 * @returns {Date | null} - The Date object or null.
 */
function parseDateStringUTC(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return null;
    }
    // Use Luxon if available for robust parsing
    if (typeof luxon !== 'undefined') {
        const dt = luxon.DateTime.fromISO(dateStr, { zone: 'utc' });
        return dt.isValid ? dt.toJSDate() : null;
    } else {
        // Basic fallback
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return isNaN(date.getTime()) ? null : date;
    }
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str - The input string.
 * @returns {string} - The escaped string.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Attempts to remove project name phrases (like "for Project X" or just "Project X")
 * from the input text. Iterates through known project names.
 * @param {string} inputText - The original task description text.
 * @returns {string} - The text with the first matched project phrase removed, or the original text if no match.
 */
function trimProjectPhrase(inputText) {
    let trimmedText = inputText.trim();
    if (!trimmedText || !projects || projects.length <= 1) { // No text or only Inbox project
        return trimmedText;
    }

    // Sort projects by name length descending to match longer names first
    const sortedProjects = projects
        .filter(p => p.id !== DEFAULT_PROJECT_ID && p.name) // Exclude Inbox, ensure name exists
        .sort((a, b) => b.name.length - a.name.length);

    for (const project of sortedProjects) {
        const projectNameEscaped = escapeRegExp(project.name);
        // Create regex patterns:
        // 1. Optional "for", "on", "in" followed by the project name (whole words)
        // 2. Just the project name (whole words)
        const patterns = [
            new RegExp(`\\b(?:for|on|in)\\s+${projectNameEscaped}\\b`, 'gi'), // Using 'gi' for global, case-insensitive
            new RegExp(`\\b${projectNameEscaped}\\b`, 'gi')
        ];

        for (const pattern of patterns) {
            if (pattern.test(trimmedText)) {
                // Replace the first occurrence found and trim whitespace
                trimmedText = trimmedText.replace(pattern, '').trim();
                // Clean up potential double spaces resulting from removal
                trimmedText = trimmedText.replace(/\s\s+/g, ' ');
                // Return after the first successful removal
                return trimmedText;
            }
        }
    }

    // Return original text if no project phrase was found and removed
    return inputText.trim();
}
