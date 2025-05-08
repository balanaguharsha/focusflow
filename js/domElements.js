// js/domElements.js

// --- DOM Elements ---
const htmlElement = document.documentElement; // Target HTML for dark class
const bodyElement = document.body;

// Tabs & Views
const tabTimer = document.getElementById('tab-timer');
const tabLog = document.getElementById('tab-log');
const tabReminders = document.getElementById('tab-reminders');
const tabWidgets = document.getElementById('tab-widgets'); // Widgets Tab
const viewTimer = document.getElementById('view-timer');
const viewLog = document.getElementById('view-log');
const viewReminders = document.getElementById('view-reminders');
const viewWidgets = document.getElementById('view-widgets'); // Widgets View

// Timer View Elements
const timerDisplay = document.getElementById('timer-display');
const timerElapsedDisplay = document.getElementById('timer-elapsed-display');
const timerModeDisplay = document.getElementById('timer-mode');
const focusedTaskDisplay = document.getElementById('focused-task-display');
const startPauseButton = document.getElementById('start-pause-button');
const startPauseIconWrapper = document.getElementById('start-pause-icon-wrapper');
const startPauseButtonText = startPauseButton ? startPauseButton.querySelector('.button-text') : null;
const resetButton = document.getElementById('reset-button');
const skipButton = document.getElementById('skip-button');
const markDoneButton = document.getElementById('mark-done-button');
const settingsButton = document.getElementById('settings-button');
const toggleElapsedButton = document.getElementById('toggle-elapsed-button');
const progressRing = document.getElementById('progress-ring');

// Task & Project Elements (Timer View)
const newTaskInput = document.getElementById('new-task-input');
const newTaskProjectSelect = document.getElementById('new-task-project');
const addTaskButton = document.getElementById('add-task-button');
const taskListContainer = document.getElementById('task-list-container');
const taskListEmptyMsg = document.getElementById('task-list-empty');
const newProjectInput = document.getElementById('new-project-input');
const newProjectColorInput = document.getElementById('new-project-color');
const addProjectButton = document.getElementById('add-project-button');
const projectListDiv = document.getElementById('project-list');
const newTaskQuickProjectsContainer = document.getElementById('new-task-quick-projects');
const celebrationGif = document.getElementById('celebration-gif');

// Log View Elements
const logPrevDayButton = document.getElementById('log-prev-day');
const logNextDayButton = document.getElementById('log-next-day');
const logTodayButton = document.getElementById('log-today');
const logDateDisplay = document.getElementById('log-date-display');
const logJumpDateInput = document.getElementById('log-jump-date');
const logRecordList = document.getElementById('log-record-list');
const logEmptyMessage = document.getElementById('log-empty-message');
const toggleManualLogFormButton = document.getElementById('toggle-manual-log-form');
const manualLogForm = document.getElementById('manual-log-form');
const manualLogTaskInput = document.getElementById('manual-log-task');
const manualLogProjectSelect = document.getElementById('manual-log-project');
const manualLogDateInput = document.getElementById('manual-log-date');
const manualLogStartInput = document.getElementById('manual-log-start');
const manualLogEndInput = document.getElementById('manual-log-end');
const cancelManualLogButton = document.getElementById('cancel-manual-log');
const saveManualLogButton = document.getElementById('save-manual-log');
const taskSuggestionsDatalist = document.getElementById('task-suggestions');
const manualLogTimeSuggestionsContainer = document.getElementById('manual-log-time-suggestions');
const timeSuggestionContainer = document.getElementById('time-suggestion-container');
const timeSuggestionLabel = document.getElementById('time-suggestion-label');
const pieChartCanvas = document.getElementById('project-pie-chart-canvas');
const verbalSummaryDiv = document.getElementById('verbal-summary');
const manualLogQuickProjectsContainer = document.getElementById('manual-log-quick-projects');
const aggregatedSummaryButton = document.getElementById('aggregated-summary-button');

// Reminder View Elements
const reminderTextInput = document.getElementById('reminder-text');
const reminderTimeInput = document.getElementById('reminder-time');
const addReminderButton = document.getElementById('add-reminder-button');
const reminderListContainer = document.getElementById('reminder-list-container');
const reminderListEmptyMsg = document.getElementById('reminder-list-empty');
const reminderTimeSuggestionsContainer = document.getElementById('reminder-time-suggestions');

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const closeModalButton = document.getElementById('close-modal-button');
const saveSettingsButton = document.getElementById('save-settings-button');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const workDurationInput = document.getElementById('work-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const longBreakIntervalInput = document.getElementById('long-break-interval');
const soundEnabledInput = document.getElementById('sound-enabled');
const showElapsedEnabledInput = document.getElementById('show-elapsed-enabled');
const celebrationGifUrlsTextarea = document.getElementById('celebration-gif-urls');
const inactivityTimeoutInput = document.getElementById('inactivity-timeout');
const exportDataButton = document.getElementById('export-data-button');
const importDataButton = document.getElementById('import-data-button');
const importFileInput = document.getElementById('import-file-input');

// Interrupted Log Confirmation Modal Elements
const interruptedLogConfirmationModal = document.getElementById('interrupted-log-confirmation-modal');
const closeInterruptedLogConfirmationButton = document.getElementById('close-interrupted-log-confirmation-button');
const interruptedLogTask = document.getElementById('interrupted-log-task');
const interruptedLogCurrentDuration = document.getElementById('interrupted-log-current-duration');
const interruptedLogTotalDuration = document.getElementById('interrupted-log-total-duration');
const interruptedLogDiscardButton = document.getElementById('interrupted-log-discard');
const interruptedLogLogButton = document.getElementById('interrupted-log-log');

// Generic Confirmation Modal Elements
const confirmationModal = document.getElementById('confirmation-modal');
const closeConfirmationButton = document.getElementById('close-confirmation-button');
const confirmationTitle = document.getElementById('confirmation-title');
const confirmationMessage = document.getElementById('confirmation-message');
const confirmationCancelButton = document.getElementById('confirmation-cancel-button');
const confirmationConfirmButton = document.getElementById('confirmation-confirm-button');

// Edit Log Modal Elements
const editLogModal = document.getElementById('edit-log-modal');
const closeEditLogButton = document.getElementById('close-edit-log-button');
const editLogForm = document.getElementById('edit-log-form');
const editLogIdInput = document.getElementById('edit-log-id');
const editLogTaskInput = document.getElementById('edit-log-task');
const editLogProjectSelect = document.getElementById('edit-log-project');
const editLogDateInput = document.getElementById('edit-log-date');
const editLogStartInput = document.getElementById('edit-log-start');
const editLogEndInput = document.getElementById('edit-log-end');
const cancelEditLogButton = document.getElementById('cancel-edit-log-button');
const saveEditLogButton = document.getElementById('save-edit-log-button');

// Edit Project Modal Elements
const editProjectModal = document.getElementById('edit-project-modal');
const closeEditProjectButton = document.getElementById('close-edit-project-button');
const editProjectForm = document.getElementById('edit-project-form');
const editProjectIdInput = document.getElementById('edit-project-id');
const editProjectNameInput = document.getElementById('edit-project-name');
const editProjectColorInput = document.getElementById('edit-project-color');
const editProjectColorValue = document.getElementById('edit-project-color-value');
const cancelEditProjectButton = document.getElementById('cancel-edit-project-button');
const saveEditProjectButton = document.getElementById('save-edit-project-button');

// Select Task Modal Elements
const selectTaskModal = document.getElementById('select-task-modal');
const closeSelectTaskButton = document.getElementById('close-select-task-button');
const selectTaskListDiv = document.getElementById('select-task-list');
const startWithoutTaskButton = document.getElementById('start-without-task-button');
const startWithTaskButton = document.getElementById('start-with-task-button');

// Inactivity Modal Elements
const inactivityTimerDisplay = document.getElementById('inactivity-timer-display');
const inactivityModal = document.getElementById('inactivity-modal');
const closeInactivityModalButton = document.getElementById('close-inactivity-modal-button');
const inactivityCheekyStatement = document.getElementById('inactivity-cheeky-statement');
const inactivityQuoteBlockquote = document.getElementById('inactivity-quote-blockquote');
const inactivityQuoteText = document.getElementById('inactivity-quote-text');
const inactivityQuoteAuthor = document.getElementById('inactivity-quote-author');
const inactivityManualLogForm = document.getElementById('inactivity-manual-log-form');
const inactivityManualLogTaskInput = document.getElementById('inactivity-manual-log-task');
const inactivityManualLogProjectSelect = document.getElementById('inactivity-manual-log-project');
const inactivityManualLogDateInput = document.getElementById('inactivity-manual-log-date');
const inactivityManualLogStartInput = document.getElementById('inactivity-manual-log-start');
const inactivityManualLogEndInput = document.getElementById('inactivity-manual-log-end');
const inactivityCancelManualLog = document.getElementById('inactivity-cancel-manual-log');
const inactivitySaveManualLog = document.getElementById('inactivity-save-manual-log');
const inactivityLogTimeSuggestionsContainer = document.getElementById('inactivity-log-time-suggestions');
const inactivityTimeSuggestionContainer = document.getElementById('inactivity-time-suggestion-container');
const inactivityTimeSuggestionLabel = document.getElementById('inactivity-time-suggestion-label');
const inactivityCustomTimeInputs = document.getElementById('inactivity-custom-time-inputs');
const inactivityQuickProjectsContainer = document.getElementById('inactivity-quick-projects');

// Aggregated Summary Modal Elements
const aggregatedSummaryModal = document.getElementById('aggregated-summary-modal');
const closeAggregatedSummaryButton = document.getElementById('close-aggregated-summary-button');
const summaryStartDateInput = document.getElementById('summary-start-date');
const summaryEndDateInput = document.getElementById('summary-end-date');
const generateSummaryButton = document.getElementById('generate-summary-button');
const aggregatedSummaryTextContainer = document.getElementById('aggregated-summary-text-container');
const aggregatedLineChartCanvas = document.getElementById('aggregated-line-chart-canvas');
const aggregatedLineChartContainer = document.getElementById('aggregated-line-chart-container');

// Shortcut Add Task Modal Elements
const shortcutAddTaskModal = document.getElementById('shortcut-add-task-modal');
const closeShortcutAddTaskButton = document.getElementById('close-shortcut-add-task-button');
const shortcutTaskInput = document.getElementById('shortcut-task-input');
const shortcutPredictedProject = document.getElementById('shortcut-predicted-project');
const shortcutAddTaskButton = document.getElementById('shortcut-add-task-button');

// Reminder Alert Modal Elements
const reminderAlertModal = document.getElementById('reminder-alert-modal');
const reminderAlertText = document.getElementById('reminder-alert-text');
const reminderAlertTime = document.getElementById('reminder-alert-time');
const reminderAckButton = document.getElementById('reminder-ack-button');

// Notification Area
const notificationArea = document.getElementById('notification-area');

// --- NEW: Widget View Elements ---
const addWidgetButton = document.getElementById('add-widget-button');
const widgetContainer = document.getElementById('widget-container');
const addWidgetModal = document.getElementById('add-widget-modal');
const closeAddWidgetModalButton = document.getElementById('close-add-widget-modal-button');
const addWidgetTypeSelect = document.getElementById('add-widget-type');
const addWidgetTitleInput = document.getElementById('add-widget-title');
const saveWidgetButton = document.getElementById('save-widget-button');
const cancelAddWidgetButton = document.getElementById('cancel-add-widget-button');

// ... other elements

// Features Overview Modal Elements
const featuresOverviewModal = document.getElementById('features-overview-modal');
const closeFeaturesOverviewModalButton = document.getElementById('close-features-overview-modal-button');
const featuresOverviewButton = document.getElementById('features-overview-button'); // The icon button in header
const gotItFeaturesButton = document.getElementById('got-it-features-button');

// ... other elements

// Note: Specific widget elements (like counter display, countdown buttons)
// are no longer static and will be created dynamically in ui.js.
// We only need the container and the "Add Widget" elements here.

