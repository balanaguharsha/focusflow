// --- Reminder Constants ---
const REMINDER_CHECK_INTERVAL = 15000; // Check every 15 seconds

// --- Reminder DOM Element References (ensure these are defined in domElements.js) ---
// Assuming these IDs exist from the updated index.html
const reminderFormTitle = document.getElementById('reminder-form-title');
const editingReminderIdInput = document.getElementById('editing-reminder-id-input'); // Hidden input
const reminderCategoryInput = document.getElementById('reminder-category');
const reminderPersistentCheckbox = document.getElementById('reminder-persistent');
const cancelEditReminderButton = document.getElementById('cancel-edit-reminder-button');


// --- Reminder Functions ---


/**
 * Prepares the form for editing a specific reminder.
 * @param {string} reminderId - The ID of the reminder to edit.
 */
function handleEditReminderClick(reminderId) {
     // Ensure required elements exist
     if (!reminderTextInput || !reminderTimeInput || !reminderCategoryInput || !reminderPersistentCheckbox || !editingReminderIdInput || !addReminderButton || !cancelEditReminderButton || !reminderFormTitle) {
         console.error("Reminder input elements not found for editing.");
         return;
     }

     const reminder = reminders.find(r => r.id === reminderId);
     if (!reminder) {
         showNotification("Could not find reminder to edit.", "error");
         return;
     }

     // Populate form fields
     editingReminderIdInput.value = reminder.id; // Store ID in hidden input
     reminderTextInput.value = reminder.text;
     reminderCategoryInput.value = reminder.category || '';
     reminderPersistentCheckbox.checked = reminder.isPersistent || false;

     // Format timestamp for datetime-local input (YYYY-MM-DDTHH:mm)
     try {
          const dt = luxon.DateTime.fromMillis(reminder.time);
          if (dt.isValid) {
               // Format correctly for datetime-local value property
               reminderTimeInput.value = dt.toFormat("yyyy-LL-dd'T'HH:mm");
          } else {
               console.warn("Invalid time for reminder being edited:", reminder.time);
               reminderTimeInput.value = ''; // Clear if invalid
          }
     } catch (e) {
          console.error("Error formatting reminder time for edit:", e);
          reminderTimeInput.value = '';
     }


     // Update UI for editing state
     reminderFormTitle.textContent = "Edit Reminder";
     addReminderButton.textContent = "Save Changes";
     cancelEditReminderButton.style.display = 'inline-block'; // Show cancel button

     // Scroll to form and focus text input
     reminderTextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
     reminderTextInput.focus();
     // Clear NLP suggestions when starting edit
     currentNlpSuggestions = [];
     appliedNlpSuggestionIndex.reminder = -1;
     if(typeof renderTimeSuggestions === 'function') { renderTimeSuggestions([], 'reminder', -1); }
}

/**
 * Cancels the editing state, clearing the form and resetting buttons.
 */
function cancelEditReminder() {
    // Ensure required elements exist
     if (!reminderTextInput || !reminderTimeInput || !reminderCategoryInput || !reminderPersistentCheckbox || !editingReminderIdInput || !addReminderButton || !cancelEditReminderButton || !reminderFormTitle) {
         console.error("Reminder input elements not found for cancelling edit.");
         return;
     }

     // Clear form fields
     editingReminderIdInput.value = ''; // Clear hidden ID
     reminderTextInput.value = '';
     reminderTimeInput.value = '';
     reminderCategoryInput.value = '';
     reminderPersistentCheckbox.checked = false;

     // Reset UI state
     reminderFormTitle.textContent = "Set a Reminder";
     addReminderButton.textContent = "Add Reminder";
     cancelEditReminderButton.style.display = 'none'; // Hide cancel button

     // Clear NLP suggestions state
     currentNlpSuggestions = [];
     appliedNlpSuggestionIndex.reminder = -1;
     if(typeof renderTimeSuggestions === 'function') { renderTimeSuggestions([], 'reminder', -1); }
}


/**
 * Deletes a reminder by its ID after confirmation.
 * Also cancels editing if the deleted reminder was being edited.
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

            // If the deleted reminder was being edited, cancel the edit state
            if (editingReminderIdInput?.value === reminderId) {
                 cancelEditReminder();
            }

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
        // console.log("Cleared existing reminder checker interval."); // Less verbose
    }

    // console.log(`Starting reminder checker (interval: ${REMINDER_CHECK_INTERVAL / 1000}s)`); // Less verbose
    activeReminderInterval = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);
}

// Inside test/js/reminders.js
function checkReminders() {
    const now = Date.now();
    let reminderTriggeredThisCheck = false;
    console.log(`Checking reminders at ${now}`); // Log: Check start

    const isOtherModalOpen = document.querySelector('.modal[style*="display: flex"]:not(#reminder-alert-modal)');
    if (isOtherModalOpen) {
        console.log("Reminder check skipped: Another modal is open."); // Log: Modal skip
        return;
    }

    reminders.forEach(reminder => {
        if (reminder.triggered && !reminder.isPersistent) return;

        // Log before the check
        // console.log(`Evaluating reminder: ${reminder.id}, Due: ${reminder.time}, Now: ${now}`);

        if (reminder.time <= now) {
             // Log inside the 'if due' block
             console.log(`Reminder IS DUE: <span class="math-inline">\{reminder\.id\} \- "</span>{reminder.text}"`);

             if (reminder.isPersistent && reminder.triggered) {
                  console.log(`Persistent reminder ${reminder.id} due again (re-alert logic TBD).`);
                  return;
             }

             console.log(`   Marking reminder ${reminder.id} as triggered.`);
             reminder.triggered = true;
             reminderTriggeredThisCheck = true;

             // --- Log right before calling the modal function ---
             console.log(`   Attempting to call showReminderAlertModal for reminder ${reminder.id}...`);
             if (typeof showReminderAlertModal === 'function') {
                  showReminderAlertModal(reminder);
                  console.log(`   Called showReminderAlertModal for reminder ${reminder.id}.`); // Log after call
             } else {
                  console.error("   showReminderAlertModal function not found!");
                  showNotification(`Reminder: ${reminder.text}`, 'warning');
             }

             // Play alarm sound
             console.log(`   Attempting to play reminder alarm...`); // Log before sound
             if(typeof playReminderAlarm === 'function') { playReminderAlarm(); }

             // Trigger confetti
             console.log(`   Attempting to show confetti...`); // Log before confetti
             if (typeof confetti === 'function') {
                  confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, zIndex: 205 });
             }

        } // End if due
    }); // End forEach

    if (reminderTriggeredThisCheck) {
        console.log("Saving reminders after triggering."); // Log: Saving
        saveReminders();
        if (viewReminders && viewReminders.classList.contains('view-visible')) {
            console.log("Rendering reminders view after triggering."); // Log: Rendering
            renderReminders();
        }
    }
}


/**
 * Snoozes a reminder by a specified number of minutes.
 * Now uses the provided snoozeMinutes argument.
 * @param {string} reminderId - The ID of the reminder to snooze.
 * @param {number} snoozeMinutes - How many minutes to snooze for.
 */
function snoozeReminder(reminderId, snoozeMinutes) {
    const reminderIndex = reminders.findIndex(r => r.id === reminderId);
    if (reminderIndex === -1) {
        console.error("Reminder not found for snoozing:", reminderId);
        showNotification("Error snoozing reminder.", "error");
        return;
    }

    const reminder = reminders[reminderIndex];
    const now = Date.now();
    const snoozeMillis = snoozeMinutes * 60 * 1000;

    // Calculate new time based on the *current time* plus the snooze duration.
    // This ensures snooze always moves forward from now.
    reminder.time = now + snoozeMillis;
    reminder.triggered = false; // Reset triggered flag so it can trigger again

    saveReminders(); // Save the updated time and triggered status

    // Re-render the reminder list if it's currently visible
    if (viewReminders && viewReminders.classList.contains('view-visible')) {
        renderReminders();
    }

    showNotification(`Reminder snoozed for ${snoozeMinutes} minutes.`, 'info');

     // Ensure the checker keeps running
     startReminderChecker(); // Restarting ensures check timing is reasonable
}