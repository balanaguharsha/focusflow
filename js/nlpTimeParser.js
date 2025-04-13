// js/nlpTimeParser.js

/**
 * Parses natural language input text to extract potential time information.
 * INCLUDES FUTURE TIME PARSING FOR REMINDERS and log parsing patterns.
 *
 * @param {string} inputText - The text entered by the user.
 * @param {Date} contextDate - The date/time to use as 'now' for relative parsing.
 * @returns {Array<object>} - An array of suggestion objects, each with { startTime: Date, endTime: Date | null, description: string }. endTime might be null for reminders. Returns empty array if no match.
 */
function parseTimeInput(inputText, contextDate) {
    const text = inputText.toLowerCase().trim();
    // Use provided context Date object or fallback to current time
    const now = contextDate instanceof Date && !isNaN(contextDate) ? contextDate : new Date();
    const suggestions = [];
    let match; // Declare match variable outside loops

    // --- Future Time Patterns (Prioritized for Reminders) ---

    // Pattern: "in X minutes/hours"
    match = text.match(/in\s+(\d+)\s+(minute|min|hr|hour)s?/);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].startsWith('min') ? 'minutes' : 'hours';
        const durationMillis = value * (unit === 'minutes' ? 60 * 1000 : 60 * 60 * 1000);
        const reminderTime = new Date(now.getTime() + durationMillis);
        // Only add if it results in a future time
        if (reminderTime > now) {
             suggestions.push({
                 startTime: reminderTime, // startTime is the target time for reminders
                 endTime: null,
                 description: `In ${value} ${unit}`
             });
        }
    }

    // Pattern: "tomorrow at X:XX am/pm" or "tomorrow" (added check to ensure not already matched)
    if (suggestions.length === 0) {
        match = text.match(/tomorrow(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/);
        if (match) {
            let hour = 9; // Default to 9 AM if no time specified
            let minute = 0;
            if (match[1]) { // If time was specified
                hour = parseInt(match[1]);
                minute = match[2] ? parseInt(match[2]) : 0;
                const ampm = match[3];
                hour = adjustHourForAmPm(hour, ampm); // Use helper
            }

            const reminderTime = new Date(now);
            reminderTime.setDate(reminderTime.getDate() + 1); // Set to tomorrow
            reminderTime.setHours(hour, minute, 0, 0);

            // Only add if it results in a future time (should always be true for tomorrow)
            if (reminderTime > now) {
                suggestions.push({
                    startTime: reminderTime,
                    endTime: null,
                    description: `Tomorrow at ${formatTimeForDisplay(reminderTime)}`
                });
            }
        }
    }

    // Pattern: "at X:XX am/pm" or "at X am/pm" (added check to ensure not already matched)
    // This pattern should ideally come after more specific ones like "tomorrow at..."
     if (suggestions.length === 0) {
        match = text.match(/(?<!tomorrow\s)at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/); // Use negative lookbehind
        if (match) {
            let hour = parseInt(match[1]);
            const minute = match[2] ? parseInt(match[2]) : 0;
            const ampm = match[3];

            hour = adjustHourForAmPm(hour, ampm); // Use existing helper
            const reminderTime = new Date(now); // Start with current date/time
            reminderTime.setHours(hour, minute, 0, 0);

            // If the calculated time is in the past *today*, assume it's for *tomorrow*
            if (reminderTime <= now) {
                reminderTime.setDate(reminderTime.getDate() + 1);
            }

            suggestions.push({
                startTime: reminderTime,
                endTime: null,
                description: `At ${formatTimeForDisplay(reminderTime)}`
            });
        }
    }

    // --- Add Log parsing patterns ONLY if no future patterns matched ---
    if (suggestions.length === 0) {
        // --- Pattern 1 (Log): "last X minutes/hours" or "X minutes/hours ago" ---
        match = text.match(/(?:last\s+|)(\d+)\s+(minute|min|hr|hour)s?(?:\s+ago)?/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2].startsWith('min') ? 'minutes' : 'hours';
            const durationMillis = value * (unit === 'minutes' ? 60 * 1000 : 60 * 60 * 1000);
            const endTime = now;
            const startTime = new Date(now.getTime() - durationMillis);
            suggestions.push({ startTime: startTime, endTime: endTime, description: `Log: Last ${value} ${unit}` });
        }

        // --- Pattern 2 (Log): "at X:XX am/pm for Y minutes/hours" ---
         if (suggestions.length === 0) { // Check again before next pattern
            match = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+(?:\.\d+)?)\s+(minute|min|hr|hour)s?/);
            if (match) {
                let hour = parseInt(match[1]);
                const minute = match[2] ? parseInt(match[2]) : 0;
                const ampm = match[3];
                const durationValue = parseFloat(match[4]);
                const durationUnit = match[5].startsWith('min') ? 'minutes' : 'hours';
                hour = adjustHourForAmPm(hour, ampm);
                const finalMinute = Math.max(0, Math.min(59, minute));
                const baseDate = new Date(now); baseDate.setHours(0,0,0,0); // Use start of context day for log entry times
                const startTime = new Date(baseDate); startTime.setHours(hour, finalMinute, 0, 0);
                const durationMillis = durationValue * (durationUnit === 'minutes' ? 60 * 1000 : 60 * 60 * 1000);
                const endTime = new Date(startTime.getTime() + durationMillis);
                suggestions.push({ startTime: startTime, endTime: endTime, description: `Log: At ${formatTimeForDisplay(startTime)} for ${durationValue} ${durationUnit}` });
            }
        }

        // --- Pattern 3 (Log): "from X:XX am/pm to Y:YY am/pm" ---
         if (suggestions.length === 0) {
            match = text.match(/from\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (match) {
                let startHour = parseInt(match[1]); const startMinute = match[2] ? parseInt(match[2]) : 0; const startAmpm = match[3];
                let endHour = parseInt(match[4]); const endMinute = match[5] ? parseInt(match[5]) : 0; const endAmpm = match[6] || startAmpm;
                startHour = adjustHourForAmPm(startHour, startAmpm); endHour = adjustHourForAmPm(endHour, endAmpm);
                const finalStartMinute = Math.max(0, Math.min(59, startMinute)); const finalEndMinute = Math.max(0, Math.min(59, endMinute));
                const baseDate = new Date(now); baseDate.setHours(0,0,0,0); // Use start of context day
                const startTime = new Date(baseDate); startTime.setHours(startHour, finalStartMinute, 0, 0);
                const endTime = new Date(baseDate); endTime.setHours(endHour, finalEndMinute, 0, 0);
                if (endTime <= startTime) { endTime.setDate(endTime.getDate() + 1); } // Handle next day
                suggestions.push({ startTime: startTime, endTime: endTime, description: `Log: From ${formatTimeForDisplay(startTime)} to ${formatTimeForDisplay(endTime)}` });
            }
        }

        // --- Pattern 4 (Log): "from X:XX am/pm for Y minutes/hours" ---
        if (suggestions.length === 0) {
            match = text.match(/from\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+(?:\.\d+)?)\s+(minute|min|hr|hour)s?/);
            if (match) {
                let hour = parseInt(match[1]); const minute = match[2] ? parseInt(match[2]) : 0; const ampm = match[3];
                const durationValue = parseFloat(match[4]); const durationUnit = match[5].startsWith('min') ? 'minutes' : 'hours';
                hour = adjustHourForAmPm(hour, ampm);
                const finalMinute = Math.max(0, Math.min(59, minute));
                const baseDate = new Date(now); baseDate.setHours(0,0,0,0); // Use start of context day
                const startTime = new Date(baseDate); startTime.setHours(hour, finalMinute, 0, 0);
                const durationMillis = durationValue * (durationUnit === 'minutes' ? 60 * 1000 : 60 * 60 * 1000);
                const endTime = new Date(startTime.getTime() + durationMillis);
                suggestions.push({ startTime: startTime, endTime: endTime, description: `Log: From ${formatTimeForDisplay(startTime)} for ${durationValue} ${durationUnit}` });
            }
        }

        // --- Pattern 5 (Log): Specific Time + Duration (e.g., "6:30pm for 40 minutes") ---
        if (suggestions.length === 0) {
             match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+(?:\.\d+)?)\s+(minute|min|hr|hour)s?/);
             if (match) {
                 let hour = parseInt(match[1]); const minute = match[2] ? parseInt(match[2]) : 0; const ampm = match[3];
                 const durationValue = parseFloat(match[4]); const durationUnit = match[5].startsWith('min') ? 'minutes' : 'hours';
                 hour = adjustHourForAmPm(hour, ampm);
                 const finalMinute = Math.max(0, Math.min(59, minute));
                 const baseDate = new Date(now); baseDate.setHours(0,0,0,0); // Use start of context day
                 const startTime = new Date(baseDate); startTime.setHours(hour, finalMinute, 0, 0);
                 const durationMillis = durationValue * (durationUnit === 'minutes' ? 60 * 1000 : 60 * 60 * 1000);
                 const endTime = new Date(startTime.getTime() + durationMillis);
                 suggestions.push({ startTime: startTime, endTime: endTime, description: `Log: ${formatTimeForDisplay(startTime)} for ${durationValue} ${durationUnit}` });
             }
        }

         // --- Pattern 6 (Log fallback): "15 min", "1 hour" ---
         if (suggestions.length === 0) {
             match = text.match(/(\d+)\s+(minute|min|hr|hour)s?/);
             if (match) {
                 const value = parseInt(match[1]);
                 const unit = match[2].startsWith('min') ? 'minutes' : 'hours';
                 const durationMillis = value * (unit === 'minutes' ? 60 * 1000 : 60 * 60 * 1000);
                 const endTime = now;
                 const startTime = new Date(now.getTime() - durationMillis);
                 suggestions.push({ startTime: startTime, endTime: endTime, description: `Log?: Last ${value} ${unit}` });
             }
         }

    } // End if(suggestions.length === 0) [wrapper for log patterns]


    // For Reminders, filter to ensure only future times are suggested
    // For Logs, keep past times.
    // The filtering logic might be better handled where this function is called.
    // Here, we return all suggestions found.
    // Limit number of suggestions (e.g., max 3)
    return suggestions.slice(0, 3);
}


/**
 * Helper function to adjust hour (1-12) based on AM/PM string.
 * Makes guesses if am/pm is missing.
 * @param {number} hour - Hour (1-12 or 0-23).
 * @param {string|null} ampm - 'am', 'pm', or null/undefined.
 * @returns {number} - Hour in 24-hour format (0-23).
 */
function adjustHourForAmPm(hour, ampm) {
    // If already likely 24-hour format, return directly
    if (hour > 12) return Math.min(23, hour); // Clamp just in case
    if (hour === 0) return 0; // Midnight case (e.g., 00:30)

    // Ensure hour is within 1-12 range if we need to process am/pm
    if (hour < 1 || hour > 12) {
        // Handle potential invalid input like 13am (treat as 1pm?) - depends on desired strictness
        // For now, return potentially invalid hour, clamping happens later
        // console.warn(`adjustHourForAmPm received potentially invalid hour: ${hour}`);
    }

    ampm = ampm ? ampm.toLowerCase() : null;

    if (ampm === 'pm' && hour !== 12) {
        return hour + 12;
    }
    if (ampm === 'am' && hour === 12) {
        return 0; // 12 AM is 00:00
    }
    // Guessing logic if am/pm is missing
    if (!ampm && hour <= 12) { // Only guess if hour is in 1-12 range
        if (hour >= 1 && hour <= 7) return hour + 12; // Guess PM for 1pm-7pm
        if (hour === 12) return 12; // Guess 12 PM
        // 8, 9, 10, 11 assumed AM, return as is
    }
    // If 'am' or already handled, return as is
    // Clamp hour to 0-23 range before returning
    return Math.max(0, Math.min(23, hour));
}

// Keep adjustHourForAmPm helper function as is

/**
 * Extracts the core text, removing matched time phrases (both future and past).
 * Prioritizes removing future/relative phrases first.
 * @param {string} inputText - The full input text.
 * @returns {string} - The extracted core text.
 */
function extractCoreText(inputText) {
    let description = inputText.trim();
    if (!description) return '';

    // Define regex patterns for time phrases to remove.
    // **REORDERED**: Place future/relative patterns commonly used for reminders FIRST.
    const timePatterns = [
        // --- Reminder/Future patterns ---
        // "in X minutes/hours" <<<< MOVED HIGHER
        /in\s+\d+\s+(?:minute|min|hr|hour)s?/i,
        // "tomorrow at X:XX am/pm" (must come before "at X:XX am/pm" and "tomorrow")
        /tomorrow\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i,
        // "tomorrow" (must come after "tomorrow at X")
        /tomorrow/i,
        // "at X:XX am/pm" or "at X am/pm" (ensure it doesn't follow "tomorrow")
        // Needs careful placement - place after specific log patterns? Or keep here? Let's keep here for now.
        /(?<!tomorrow\s)at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i,

        // --- Log patterns with specific start/end or duration ---
        // "from X:XX am/pm to Y:YY am/pm"
        /from\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+to\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i,
        // "at X:XX am/pm for Y minutes/hours" (more specific than just 'at X')
        /at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+for\s+\d+(?:\.\d+)?\s+(?:minute|min|hr|hour)s?/i,
        // "from X:XX am/pm for Y minutes/hours"
        /from\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+for\s+\d+(?:\.\d+)?\s+(?:minute|min|hr|hour)s?/i,
        // "X:XX am/pm for Y minutes/hours" (without 'at'/'from')
        /\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+for\s+\d+(?:\.\d+)?\s+(?:minute|min|hr|hour)s?/i,

         // --- Log relative patterns (less specific) ---
         // "last X minutes/hours" or "X minutes/hours ago" (with optional leading "for")
        /(?:for\s+)?(?:last\s+)?\d+\s+(?:minute|min|hr|hour)s?(?:\s+ago)?/i,
        // Fallback for just "X min/hr" - This might be too broad. Keep it last or remove if problematic.
         /\b\d+\s+(?:minute|min|hr|hour)s?\b/i

    ];

    // Iterate and remove the first matching time phrase found
    for (const pattern of timePatterns) {
        const matchResult = description.match(pattern);
        if (matchResult) {
            console.log(`extractCoreText matched: "${matchResult[0]}" with pattern: ${pattern}`); // Add logging
            // Replace the first matched phrase
            description = description.replace(matchResult[0], '').trim();
            // Clean up potential double spaces
            description = description.replace(/\s\s+/g, ' ');
            // Clean up potential trailing/leading prepositions more robustly after removal
            description = description.replace(/^(for|at|from|in|on|to)\s+/i, '').trim(); // Leading
            description = description.replace(/\s+(for|at|from|in|on|to)$/i, '').trim(); // Trailing
            console.log(`extractCoreText result after trim: "${description}"`); // Add logging
            // Stop after removing the first match
            return description;
        }
    }

    // Return the original (trimmed) text if no pattern was found and removed
    console.log(`extractCoreText: No time pattern matched for "${inputText.trim()}"`); // Add logging
    return inputText.trim();
}

/**
 * Helper function to adjust hour (1-12) based on AM/PM string.
 * Makes guesses if am/pm is missing.
 * @param {number} hour - Hour (1-12 or 0-23).
 * @param {string|null} ampm - 'am', 'pm', or null/undefined.
 * @returns {number} - Hour in 24-hour format (0-23).
 */
function adjustHourForAmPm(hour, ampm) {
    // If already likely 24-hour format, return directly
    if (hour > 12) return Math.min(23, hour);
    if (hour === 0) return 0; // Midnight case

    ampm = ampm ? ampm.toLowerCase() : null;

    if (ampm === 'pm' && hour !== 12) {
        return hour + 12;
    }
    if (ampm === 'am' && hour === 12) {
        return 0; // 12 AM is 00:00
    }
    // Guessing logic if am/pm is missing
    if (!ampm) {
        if (hour >= 1 && hour <= 7) return hour + 12; // Guess PM for 1-7
        if (hour === 12) return 12; // Guess 12 PM
        // 8, 9, 10, 11 assumed AM, return as is
    }
    // If 'am' or already handled, return as is (clamped later)
    return hour;
}

/**
 * Extracts the task description part from the input, removing the time phrase.
 * Prioritizes removing longer, more specific time phrases first.
 * @param {string} inputText - The full input text.
 * @returns {string} - The extracted task description.
 */
function extractTaskDescription(inputText) {
    let description = inputText;
    // Define regex patterns for time phrases to remove.
    // **ORDER MATTERS**: Place more specific/longer patterns first.
    const timePatterns = [
        // Specific start/end: from X to Y
        /from\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
        // Specific start + duration: at X for Y
        /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+(?:\.\d+)?)\s+(minute|min|hr|hour)s?/i,
        // Specific start + duration: from X for Y (Added)
        /from\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+(?:\.\d+)?)\s+(minute|min|hr|hour)s?/i,
         // Specific start + duration: X for Y (without 'at'/'from')
        /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+(?:\.\d+)?)\s+(minute|min|hr|hour)s?/i,
        // Relative duration: last X / X ago (including optional 'for')
        /(?:for\s+)?(?:last\s+|)(\d+)\s+(minute|min|hr|hour)s?(?:\s+ago)?/i
    ];

    // Iterate and remove the first matching time phrase found
    for (const pattern of timePatterns) {
        const match = description.match(pattern);
        if (match) {
            // Replace the matched phrase (match[0]) with an empty string
            description = description.replace(match[0], '').trim();
            // Clean up potential double spaces resulting from removal
            description = description.replace(/\s\s+/g, ' ');
            // Clean up potential trailing prepositions if the time phrase was at the end
            description = description.replace(/\s+(?:for|at|from)$/i, '').trim();
             // Clean up potential leading prepositions if the time phrase was at the beginning
             description = description.replace(/^(?:for|at|from)\s+/i, '').trim();
            // Stop after removing the first (most specific) match
            break;
        }
    }

    return description;
}
