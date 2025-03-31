// js/projects.js

/**
 * Updates the last used timestamp for a project.
 * @param {string} projectId - The ID of the project to update.
 * @param {boolean} [shouldSave=true] - Whether to save the projects array immediately.
 */
function updateProjectLastUsed(projectId, shouldSave = true) {
    // Don't track usage for the default Inbox
    if (!projectId || projectId === DEFAULT_PROJECT_ID) return;

    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
        projects[projectIndex].lastUsed = Date.now();
        if (shouldSave) {
            saveProjects(); // Save the updated projects array
        }
    }
}

/**
 * Adds a new project based on the input fields.
 */
function addProject() {
    const name = newProjectInput.value.trim();
    const color = newProjectColorInput.value; // Get color from color picker

    if (!name) {
        showNotification("Project name cannot be empty!", "warning");
        return;
    }

    // Check for duplicate project names (case-insensitive)
    if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showNotification(`Project "${name}" already exists.`, "warning");
        return;
    }

    // Create the new project object
    const newProject = {
        id: generateUniqueId('proj'),
        name: name,
        color: color,
        lastUsed: 0 // Initialize lastUsed timestamp
    };

    projects.push(newProject);
    updateProjectLastUsed(newProject.id, false); // Update last used but save below
    animateItemId = newProject.id; // Set flag to animate this item on render

    saveProjects(); // Save the updated projects array
    renderProjectsUI(); // Re-render the project list and related UI

    newProjectInput.value = ''; // Clear the input field
    // Optionally reset color picker or cycle to next default color
    // newProjectColorInput.value = PROJECT_COLORS[nextColorIndex++ % PROJECT_COLORS.length];

    showNotification(`Project "${name}" added! 🎉`, 'success');
}

/**
 * Initiates the deletion process for a project after confirmation.
 * @param {string} projectId - The ID of the project to delete.
 */
function deleteProject(projectId) {
    if (projectId === DEFAULT_PROJECT_ID) {
        showNotification("Cannot delete the default Inbox project.", "error");
        return;
    }

    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        console.error("Project to delete not found:", projectId);
        return; // Should not happen if UI is correct
    }

    const projectName = projects[projectIndex].name;

    // Show confirmation modal before deleting
    showConfirmationModal(
        `DELETE Project "${projectName}"?\n\nThis will also delete ALL associated tasks permanently!`,
        () => {
            // --- This code runs only if the user confirms ---
            // Remove the project
            projects.splice(projectIndex, 1);

            // Find tasks associated with the deleted project
            const tasksToDelete = tasks.filter(task => task.projectId === projectId);
            // Remove associated tasks
            tasks = tasks.filter(task => task.projectId !== projectId);

            // Check if the active task was deleted
            if (tasksToDelete.some(task => task.id === activeTaskIndex)) {
                activeTaskIndex = null;
                activeTaskFocusStartTime = null;
                updateFocusedTaskDisplay();
                resetTimer(true); // Reset timer to work mode if active task was deleted
            }

            // Save changes to storage
            saveProjects();
            saveTasks();

            // Update UI
            renderProjectsUI(); // Re-render project list and tasks
            showNotification(`Project "${projectName}" and its tasks deleted.`, 'warning');
            // --- End of confirmation callback ---
        }
    );
}


/**
 * Handles the submission of the edit project form.
 * @param {Event} event - The form submission event.
 */
function handleEditProjectSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    const projectId = editProjectIdInput.value;
    const newName = editProjectNameInput.value.trim();
    const newColor = editProjectColorInput.value;

    const projectIndex = projects.findIndex(p => p.id === projectId);

    // Basic validation
    if (projectIndex === -1 || projectId === DEFAULT_PROJECT_ID) {
        showNotification("Could not find project to update or cannot edit Inbox.", "error");
        closeEditProjectModal();
        return;
    }
    if (!newName) {
        showNotification("Project name cannot be empty.", "warning");
        return;
    }

    // Check for name conflicts (case-insensitive, excluding the current project)
    const nameConflict = projects.some(p => p.id !== projectId && p.name.toLowerCase() === newName.toLowerCase());
    if (nameConflict) {
        showNotification(`Another project named "${newName}" already exists.`, "warning");
        return;
    }

    // Update project data
    projects[projectIndex].name = newName;
    projects[projectIndex].color = newColor;
    animateItemId = projectId; // Flag for animation on re-render

    saveProjects(); // Save changes
    renderProjectsUI(); // Update the UI
    showNotification(`Project "${newName}" updated!`, "success");
    closeEditProjectModal(); // Close the modal
}
