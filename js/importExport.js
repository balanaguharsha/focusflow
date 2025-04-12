// js/importExport.js

/**
 * Exports all application data (tasks, projects, logs, settings, reminders, widgets) as a JSON file.
 */
function exportData() {
    try {
        // Consolidate all data into a single backup object
        const backupData = {
            tasks: tasks,
            projects: projects,
            logEntries: logEntries,
            settings: settings,
            reminders: reminders,
            widgets: widgets // *** ADDED widgets ***
        };

        // Convert the data to a formatted JSON string
        const jsonString = JSON.stringify(backupData, null, 2); // Pretty print JSON

        // Create a Blob object from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a temporary URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element for downloading
        const a = document.createElement('a');
        a.href = url;
        const dateSuffix = getDateString(new Date()); // Get current date for filename
        a.download = `focusflow_backup_${dateSuffix}.json`; // Set filename

        // Programmatically click the anchor to trigger download
        document.body.appendChild(a); // Append to body (required for Firefox)
        a.click();

        // Clean up the temporary elements
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Release the object URL

        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error("Export failed:", error);
        showNotification('Data export failed. See console for details.', 'error');
    }
}

/**
 * Triggers the hidden file input element for importing data.
 */
function triggerImport() {
    if (importFileInput) {
        importFileInput.click(); // Open file selection dialog
    } else {
        console.error("Import file input not found.");
        showNotification("Import feature unavailable.", "error");
    }
}

/**
 * Handles the file selection event for importing data.
 * Reads the file, parses JSON, validates format, and prompts for confirmation before importing.
 * @param {Event} event - The file input change event.
 */
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return; // No file selected

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showNotification('Invalid file type. Please select a .json backup file.', 'error');
        event.target.value = null; // Reset file input
        return;
    }

    const reader = new FileReader();

    // Define what happens when the file is successfully read
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Basic validation of the imported data structure
            // *** UPDATED validation to include widgets ***
            if (!importedData || typeof importedData !== 'object' ||
                !importedData.hasOwnProperty('tasks') ||
                !importedData.hasOwnProperty('projects') ||
                !importedData.hasOwnProperty('logEntries') ||
                !importedData.hasOwnProperty('settings') ||
                !importedData.hasOwnProperty('reminders') ||
                !importedData.hasOwnProperty('widgets')) { // Check for widgets key
                throw new Error("Invalid backup file format. Missing required data sections (tasks, projects, logEntries, settings, reminders, widgets).");
            }

            // ** ADDED: More detailed validation for widgets **
            if (!Array.isArray(importedData.widgets)) {
                 throw new Error("Invalid backup file format. 'widgets' section must be an array.");
            }
            // Optional: Validate individual widget structures within the array if needed


            // Show confirmation modal before overwriting data
            showConfirmationModal(
                `Import data from "${file.name}"?\n\n⚠️ WARNING: This will OVERWRITE all current tasks, projects, logs, settings, reminders, and widgets!`,
                () => {
                    // --- This code runs only if the user confirms ---
                    try {
                        // Overwrite current state with imported data
                        tasks = importedData.tasks || [];
                        projects = importedData.projects || [];
                        logEntries = importedData.logEntries || {};
                        reminders = importedData.reminders || [];
                        widgets = importedData.widgets || []; // *** ADDED widgets import ***
                        // Merge settings carefully, keeping existing defaults if new ones are missing
                        settings = { ...settings, ...(importedData.settings || {}) };

                        // Save all imported data to local storage
                        saveTasks();
                        saveProjects();
                        saveLogs();
                        saveReminders();
                        saveWidgets(); // *** ADDED saveWidgets call ***
                        saveSettings(); // This also applies theme etc.

                        showNotification('Import successful! Reloading application...', 'success', 4000);
                        // Reload the application to ensure all state is correctly initialized
                        setTimeout(() => {
                            location.reload();
                        }, 1500); // Short delay for notification visibility
                    } catch (saveError) {
                        console.error("Error saving imported data:", saveError);
                        showNotification('Error saving imported data. See console.', 'error');
                    }
                    // --- End of confirmation callback ---
                }
            );
        } catch (parseError) {
            console.error("Import failed - parsing error:", parseError);
            showNotification(`Import failed. ${parseError.message}`, 'error');
        } finally {
            // Reset file input value regardless of success/failure
            event.target.value = null;
        }
    };

    // Define what happens on file reading error
    reader.onerror = function() {
        console.error("Error reading file:", reader.error);
        showNotification('Error reading the selected file.', 'error');
        event.target.value = null; // Reset file input
    };

    // Read the file as text
    reader.readAsText(file);
}
