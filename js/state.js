// js/state.js

// --- State Variables ---
let timerInterval = null;
let currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
let timeRemaining = 0; // In seconds
let isRunning = false;
let workSessionsCompleted = 0;
let activeTaskIndex = null; // Stores the ID of the focused task
let activeTaskFocusStartTime = null; // Timestamp when focus started (adjusted for pauses)
let pauseStartTime = null; // Timestamp when the timer was paused
let tasks = []; // Array of task objects { id, text, completed, pomodorosCompleted, projectId }
let projects = []; // Array of project objects { id, name, color, lastUsed }
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    soundEnabled: true,
    showElapsedTime: false,
    celebrationGifUrls: [],
    darkModeEnabled: false,
    inactivityTimeoutMinutes: 10
};
let logEntries = {}; // Object where keys are 'YYYY-MM-DD' strings and values are arrays of log entry objects
let displayedLogDate = new Date(); // The date currently shown in the log view
let totalDurationSeconds = 0; // Total duration for the current timer mode (used for progress ring)
let draggedTaskId = null; // ID of the task being dragged
let nextColorIndex = 0; // Used for assigning default project colors
let pendingInterruptedLogData = null; // Holds data for logging when a task is completed mid-session
let pieChartInstance = null; // Holds the Chart.js instance for the DAILY log summary
let aggregatedChartInstance = null; // Holds the Chart.js instance for the AGGREGATED summary
let confirmActionCallback = null; // Stores the function to call when a confirmation modal is confirmed
let animateItemId = null; // Stores the ID of an item to animate on next render
let pomodoroStopTime = null; // Timestamp when the main timer was last stopped (null if running)

// --- Inactivity State ---
let inactivityLogMode = 'tillNow'; // 'tillNow', '15', '30', '60', '120', 'custom' - Default mode

// --- Reminder State ---
let reminders = []; // Array of { id: string, text: string, time: number (timestamp), triggered: boolean }
let activeReminderInterval = null; // Interval timer ID for checking reminders
let activeReminderSound = null; // Holds the Tone.Loop object for the reminder sound

// --- NLP Time Suggestion State ---
let currentNlpSuggestions = []; // Holds the latest suggestions from the parser
let nlpSuggestionDebounceTimer = null; // Timeout ID for debouncing NLP parsing
const NLP_DEBOUNCE_DELAY = 500; // Milliseconds to wait after typing stops before parsing

// Track applied suggestion index for each form type
let appliedNlpSuggestionIndex = {
    manual: -1,
    inactivity: -1,
    reminder: -1 // *** ADD THIS LINE ***
};