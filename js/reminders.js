// js/reminders.js

// --- Reminder Constants ---
const REMINDER_CHECK_INTERVAL = 15000; // Check every 15 seconds (adjust as needed)

// --- Reminder Functions ---

/**
 * Adds a new reminder. Reads current values from the input fields,
 * assuming NLP suggestions/trimming might have occurred via the input listener.
 * Triggered by clicking the "Add Reminder" button or pressing Enter in the text field.
 */
function addReminder() {
    // Check if required elements exist
    if (!reminderTextInput || !reminderTimeInput) {
        console.error("Reminder input elements not found for adding reminder.");
        return; // Exit if elements are missing
    }

    // 1. Read the CURRENT values from the input fields
    // The text might have been modified by applyNlpSuggestionUI if a suggestion was auto-applied
    const reminderText = reminderTextInput.value.trim();
    // The time value might have been set by applyNlpSuggestionUI
    const timeValue = reminderTimeInput.value;

    // --- 2. Final Validation ---
    if (!reminderText) {
        showNotification("Please enter reminder text.", "warning");
        reminderTextInput.focus();
        return;
    }
    if (!timeValue) {
        showNotification("Please select or enter a date and time for the reminder.", "warning");
        reminderTimeInput.focus();
        return;
    }

    const reminderTime = new Date(timeValue).getTime(); // Get timestamp from the final time value

    if (isNaN(reminderTime)) {
        showNotification("Invalid date/time selected.", "error");
        return;
    }

    const currentTime = Date.now();
    // Allow a small buffer (e.g., 1 second) for race conditions
    if (reminderTime <= currentTime + 1000) {
        showNotification("Reminder time must be in the future.", "warning");
        return;
    }
    // --- End Validation ---


    // --- 3. Create Reminder Object ---
    const newReminder = {
        id: generateUniqueId('reminder'),
        text: reminderText, // Use the final text from the input
        time: reminderTime, // Use the final time from the input
        triggered: false
    };

    // --- 4. Add, Save, Render, Clear ---
    reminders.push(newReminder);
    saveReminders();
    // Ensure renderReminders function exists (should be in ui.js or reminders.js)
    if(typeof renderReminders === 'function') {
        renderReminders(); // Update UI list
    } else {
        console.error("renderReminders function not found!");
    }


    // Clear inputs AFTER successful add
    reminderTextInput.value = '';
    reminderTimeInput.value = '';

    // Clear suggestions display and associated state
    currentNlpSuggestions = []; // Clear suggestions state
    appliedNlpSuggestionIndex.reminder = -1; // Reset applied index for reminder
    if(typeof renderTimeSuggestions === 'function') {
        // Clear the suggestions UI
        renderTimeSuggestions([], 'reminder', -1);
    }


    showNotification("Reminder added!", "success");

    // Ensure the reminder checker is running
    if(typeof startReminderChecker === 'function') {
        startReminderChecker();
    } else {
        console.error("startReminderChecker function not found!");
    }
}


/**
 * Deletes a reminder by its ID after confirmation.
 * @param {string} reminderId - The ID of the reminder to delete.
 */
function deleteReminder(reminderId) {
    const reminderIndex = reminders.findIndex(r => r.id === reminderId);
    if (reminderIndex === -1) {
        console.error("Reminder not found for deletion:", reminderId);
        return;
    }

    const reminderText = reminders[reminderIndex].text;

    showConfirmationModal(
        `Delete reminder "${reminderText.substring(0, 40)}"?`,
        () => {
            // --- Confirmation callback ---
            reminders.splice(reminderIndex, 1); // Remove from array
            saveReminders(); // Save changes
            renderReminders(); // Update UI
            showNotification("Reminder deleted.", "warning");
            // --- End confirmation ---
        }
    );
}


/**
 * Starts the interval timer to periodically check for due reminders.
 */
function startReminderChecker() {
    // Clear any existing interval first to avoid duplicates
    if (activeReminderInterval) {
        clearInterval(activeReminderInterval);
        console.log("Cleared existing reminder checker interval.");
    }

    console.log(`Starting reminder checker (interval: ${REMINDER_CHECK_INTERVAL / 1000}s)`);
    activeReminderInterval = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);

    // Initial check immediately (optional)
    // checkReminders();
}

/**
 * Checks the reminders array for any due reminders and triggers alerts.
 */
function checkReminders() {
    const now = Date.now();
    let reminderTriggeredThisCheck = false; // Flag to potentially only trigger one per check

    // Check if any modal is already open (except the reminder alert itself)
    const isOtherModalOpen = document.querySelector('.modal[style*="display: flex"]:not(#reminder-alert-modal)');
    if (isOtherModalOpen) {
        // console.log("Reminder check skipped: Another modal is open.");
        return; // Don't trigger reminder if user is busy with another modal
    }

    // Find the first untriggered reminder that is due
    const dueReminder = reminders.find(r => !r.triggered && r.time <= now);

    if (dueReminder) {
        console.log(`Reminder due: ${dueReminder.text}`);

        // Mark as triggered (prevent re-triggering FOR NOW, snooze will reset it)
        dueReminder.triggered = true;
        saveReminders(); // Save the triggered state

        // Show the alert modal, passing the reminder object
        // Ensure showReminderAlertModal exists (defined in modals.js)
        if (typeof showReminderAlertModal === 'function') {
             showReminderAlertModal(dueReminder); // Pass the whole object
        } else {
             console.error("showReminderAlertModal function not found!");
             // Fallback notification if modal function is missing
             showNotification(`Reminder: ${dueReminder.text}`, 'warning');
        }


        // Play the looping alarm sound
        playReminderAlarm(); // Defined in audio.js

        // Trigger confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 },
                zIndex: 205 // Ensure high z-index
            });
        }

        // Re-render the list to potentially remove/update the triggered reminder visually
        if (viewReminders && viewReminders.classList.contains('view-visible')) {
            renderReminders();
        }

        reminderTriggeredThisCheck = true;
        // If we only want one alert at a time, we could stop checking here.
    }

    // Optional: Clean up very old, triggered reminders (e.g., older than a day)
    // ... (keep existing cleanup logic if desired) ...
}


/**
 * Snoozes a reminder by a specified number of minutes.
 * @param {string} reminderId - The ID of the reminder to snooze.
 * @param {number} [snoozeMinutes=5] - How many minutes to snooze for.
 */
function snoozeReminder(reminderId, snoozeMinutes = 5) {
    const reminderIndex = reminders.findIndex(r => r.id === reminderId);
    if (reminderIndex === -1) {
        console.error("Reminder not found for snoozing:", reminderId);
        showNotification("Error snoozing reminder.", "error");
        return;
    }

    const reminder = reminders[reminderIndex];
    const now = Date.now();
    const snoozeMillis = snoozeMinutes * 60 * 1000;

    // Calculate new time based on the *original* scheduled time OR current time,
    // whichever is later, plus the snooze duration. This prevents snoozing into the past
    // if the alert was delayed significantly.
    const baseTime = Math.max(reminder.time, now);
    reminder.time = baseTime + snoozeMillis;
    reminder.triggered = false; // Reset triggered flag so it can trigger again

    saveReminders(); // Save the updated time and triggered status

    // Re-render the reminder list if it's currently visible
    if (viewReminders && viewReminders.classList.contains('view-visible')) {
        renderReminders();
    }

    showNotification(`Reminder snoozed for ${snoozeMinutes} minutes.`, 'info');

     // Ensure the checker keeps running
     startReminderChecker();
}