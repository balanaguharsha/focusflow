// js/inactivity.js

// --- Inactivity State (declared in state.js) ---
// let inactivityLogMode = 'tillNow'; // Default

// --- Other Inactivity State ---
let inactivityTimerId = null; // Holds the timeout ID for the popup
let inactivityDisplayIntervalId = null; // Holds interval ID for updating the display
const FALLBACK_MESSAGE = { cheeky: "Still there?", motivational: "Even small steps move you forward." };

const inactivityMessages = [
    // Initial 20 provided
    { cheeky: "Whatchaa doing????", motivational: "A little progress each day adds up to big results." },
    { cheeky: "Skipping work?", motivational: "Don't watch the clock; do what it does. Keep going." },
    { cheeky: "Daydreaming again?", motivational: "The expert in anything was once a beginner. Focus up!" },
    { cheeky: "Lost in thought, or just lost?", motivational: "Believe you can and you're halfway there." },
    { cheeky: "Remember that deadline? Tick-tock...", motivational: "The key is not to prioritize what's on your schedule, but to schedule your priorities." },
    { cheeky: "Are you contemplating the universe or your next snack?", motivational: "Success is the sum of small efforts, repeated day in and day out." },
    { cheeky: "Did a squirrel distract you?", motivational: "Focus on being productive instead of busy." },
    { cheeky: "Don't worry, the code won't write itself... usually.", motivational: "Push yourself, because no one else is going to do it for you." },
    { cheeky: "Is this procrastination or strategic waiting?", motivational: "The best way to get started is to quit talking and begin doing." },
    { cheeky: "Your keyboard misses you.", motivational: "You've got this! Just take the next step." },
    { cheeky: "Psst... still there?", motivational: "Hard work beats talent when talent doesn't work hard." },
    { cheeky: "Hello? Anyone home?", motivational: "It does not matter how slowly you go as long as you do not stop." },
    { cheeky: "Did you fall asleep?", motivational: "Wakey wakey, tasks to breaky!" },
    { cheeky: "The screen is lonely without your input.", motivational: "Action is the foundational key to all success." },
    { cheeky: "Time flies when you're... not doing anything?", motivational: "Don't let yesterday take up too much of today." },
    { cheeky: "Just checking in!", motivational: "Start where you are. Use what you have. Do what you can." },
    { cheeky: "Need a nudge?", motivational: "The secret of getting ahead is getting started." },
    { cheeky: "Back to reality!", motivational: "You are capable of amazing things. Let's prove it." },
    { cheeky: "Focus, focus, focus!", motivational: "Concentrate all your thoughts upon the work at hand." },
    { cheeky: "Let's get back on track!", motivational: "Discipline is the bridge between goals and accomplishment." },

    // Newly generated 80
    { cheeky: "Taking a screen break, or did the screen break you?", motivational: "Small breaks recharge, long breaks derail. Let's get back to it!" },
    { cheeky: "Did your brain go on a coffee run without you?", motivational: "Fuel your focus, then dive back in. You can do this!" },
    { cheeky: "Staring contest with the wall? Who's winning?", motivational: "Shift your gaze back to the goal. Progress awaits!" },
    { cheeky: "Calculating the optimal angle for a nap?", motivational: "Energy is key! Let's channel it into finishing this task first." },
    { cheeky: "Has the cursor frozen, or just your motivation?", motivational: "Unfreeze your potential! A little effort now goes a long way." },
    { cheeky: "Did you get lost in a Wikipedia rabbit hole?", motivational: "Curiosity is great, but let's channel it back to the task at hand." },
    { cheeky: "Is your chair *that* comfortable?", motivational: "Comfort zones don't yield results. Let's push forward!" },
    { cheeky: "Did a sudden urge to organize your sock drawer hit?", motivational: "Tackle the real priority first. Victory lies ahead!" },
    { cheeky: "Trying to communicate with aliens telepathically?", motivational: "Let's communicate progress on this project instead. Focus!" },
    { cheeky: "Perfecting your thousand-yard stare?", motivational: "Direct that intense focus onto your work. Let's make things happen!" },
    { cheeky: "Plotting world domination, or just what's for dinner?", motivational: "Dominate this task first! One step at a time leads to success." },
    { cheeky: "Did you accidentally hit the pause button on life?", motivational: "Hit play! Your goals are waiting for you to achieve them." },
    { cheeky: "Is the siren song of social media calling?", motivational: "Resist the scroll! Meaningful work brings greater satisfaction." },
    { cheeky: "Waiting for inspiration to strike like lightning?", motivational: "Inspiration often finds you working. Let's get started!" },
    { cheeky: "Did you forget your password... to productivity?", motivational: "Reset your focus! The password is 'Action'." },
    { cheeky: "Are the pixels rearranging themselves out of boredom?", motivational: "Give them something exciting to display! Let's create." },
    { cheeky: "Meditating on the meaning of procrastination?", motivational: "Less meditation, more creation! Let's make progress." },
    { cheeky: "Engaged in a deep philosophical debate with your pet?", motivational: "Save the deep thoughts for later. Right now, let's tackle this!" },
    { cheeky: "Did the Wi-Fi go down, or just your energy levels?", motivational: "Reboot your system! A burst of effort can reignite your drive." },
    { cheeky: "Admiring the ceiling architecture?", motivational: "Admire your completed work later. Let's build it first!" },
    { cheeky: "Thinking about the weekend already?", motivational: "Earn that weekend! Finish strong and enjoy it even more." },
    { cheeky: "Did your mouse run away?", motivational: "Grab control! Guide your focus back to the task." },
    { cheeky: "Is that a coffee break, or a coffee coma?", motivational: "Let that caffeine kick in and power through!" },
    { cheeky: "Counting sheep to stay awake or to fall asleep?", motivational: "Count your achievements instead! Add one more right now." },
    { cheeky: "Lost in the Spotify playlist again?", motivational: "Music can fuel work, not replace it. Tune in and type on!" },
    { cheeky: "Is your computer screen judging your inactivity?", motivational: "Show it who's boss! Input something brilliant." },
    { cheeky: "Trying to bend spoons with your mind?", motivational: "Bend this task to your will instead. Focus your power!" },
    { cheeky: "Is the void staring back?", motivational: "Fill the void with productivity! Let's get creating." },
    { cheeky: "Did you achieve zen, or just zone out?", motivational: "Channel that inner peace into productive focus." },
    { cheeky: "Window gazing? Is there a parade I missed?", motivational: "The real spectacle is the progress you're about to make. Let's go!" },
    { cheeky: "Did you mistake your desk for a pillow?", motivational: "Lift your head high and tackle the challenge!" },
    { cheeky: "Planning your escape route?", motivational: "The best escape is finishing the task. Freedom awaits on the other side!" },
    { cheeky: "Are you charging your batteries, or just drained?", motivational: "Even a small spark can restart the engine. Give it a try!" },
    { cheeky: "Did you enter a staring contest with your reflection?", motivational: "Reflect on your goals, then act on them!" },
    { cheeky: "Is the silence deafening, or just... silent?", motivational: "Break the silence with the sound of progress! Click, type, create!" },
    { cheeky: "Running simulations in your head?", motivational: "Run the actual task! Reality needs your input." },
    { cheeky: "Practicing your statue impersonation?", motivational: "Time to animate! Action brings results." },
    { cheeky: "Did your muse take an unscheduled vacation?", motivational: "Don't wait for the muse. Become the muse!" },
    { cheeky: "Is your brain buffering?", motivational: "Force refresh! A change of pace or a small step can clear the cache." },
    { cheeky: "Feeling the gravitational pull of the couch?", motivational: "Defy gravity! Stay upright and stay productive." },
    { cheeky: "Are you stuck, or just contemplating the next brilliant move?", motivational: "Even a small move forward breaks the inertia. Just do it!" },
    { cheeky: "Did you solve world peace in your head?", motivational: "Awesome! Now let's solve this task." },
    { cheeky: "Is this 'thinking time' or 'avoiding time'?", motivational: "Action clarifies thought. Dive in and figure it out as you go." },
    { cheeky: "Was that a blink or a micro-nap?", motivational: "Eyes open, focus sharp! Let's make some headway." },
    { cheeky: "Did the cat steal your motivation again?", motivational: "Reclaim your drive! You're the one in charge here." },
    { cheeky: "Contemplating the physics of dust bunnies?", motivational: "Let's focus on the physics of getting things done!" },
    { cheeky: "Are you waiting for a sign?", motivational: "This is your sign! Get back to work and make magic happen." },
    { cheeky: "Did your internal monologue get *really* interesting?", motivational: "Channel that inner voice into outer action." },
    { cheeky: "Trying to set a world record for stillness?", motivational: "Break the record! Movement equals progress." },
    { cheeky: "Is the screen too bright, or is the future looking dim?", motivational: "Brighten your future with action! Let's get glowing." },
    { cheeky: "Did you just discover the fascinating world of ceiling tiles?", motivational: "Discover the satisfaction of completing this task instead!" },
    { cheeky: "Are you mentally composing a symphony?", motivational: "Compose an email, a line of code, a paragraph! Create something tangible." },
    { cheeky: "Lost connection... with reality?", motivational: "Reconnect with your goals. They're waiting for you!" },
    { cheeky: "Did your train of thought derail?", motivational: "Get it back on the tracks! One task, one step at a time." },
    { cheeky: "Trying to remember what you were doing?", motivational: "It involves this screen and your brilliant mind. Let's re-engage!" },
    { cheeky: "Is your spirit animal currently a sloth?", motivational: "Channel your inner cheetah! Speed and focus time." },
    { cheeky: "Did you accidentally activate camouflage mode?", motivational: "Become visible through action! Let's see some progress." },
    { cheeky: "Are you communing with your inner child?", motivational: "Tell your inner child it's work time, playtime comes after results!" },
    { cheeky: "Is the task intimidating you into silence?", motivational: "Break it down, tackle one piece. You're stronger than the task!" },
    { cheeky: "Did you achieve peak inertia?", motivational: "Overcome it! The first movement is the hardest, but you can do it." },
    { cheeky: "Are you brewing ideas, or just tea?", motivational: "Turn those ideas into action! Let's start implementing." },
    { cheeky: "Testing the limits of your chair's warranty?", motivational: "Test the limits of your productivity instead!" },
    { cheeky: "Did you fall into a daydream dimension?", motivational: "Beam yourself back! Your mission is right here." },
    { cheeky: "Are we playing hide and seek with productivity?", motivational: "Okay, you found it! Now let's get to work." },
    { cheeky: "Is the weight of the world on your shoulders, or just sleepiness?", motivational: "Shake it off! A burst of focused work can energize you." },
    { cheeky: "Did you enter power-saving mode?", motivational: "Switch to performance mode! Let's output some results." },
    { cheeky: "Trying to photosynthesize by the window?", motivational: "Generate energy through action, not just sunlight! Let's move." },
    { cheeky: "Are you letting the ideas 'marinate'?", motivational: "Don't let them spoil! Time to cook up some results." },
    { cheeky: "Did you get mesmerized by the screensaver again?", motivational: "The real show is the work you create. Let's start the performance!" },
    { cheeky: "Checking if gravity still works?", motivational: "It does. Now let's see if your focus works!" },
    { cheeky: "Did your imaginary friend tell you to take a break?", motivational: "Listen to the voice of progress instead. It says 'Keep going!'" },
    { cheeky: "Is this the calm before the storm... of productivity?", motivational: "Let the storm begin! Unleash your focus." },
    { cheeky: "Searching for the meaning of life in your coffee cup?", motivational: "Find meaning in accomplishment. Let's finish this." },
    { cheeky: "Did time stop, or did you?", motivational: "Time waits for no one. Let's catch up!" },
    { cheeky: "Are you mentally redecorating the office?", motivational: "Redecorate your task list with 'Done' marks instead!" },
    { cheeky: "Have you become one with the chair?", motivational: "Separate yourself and conquer the task!" },
    { cheeky: "Did you just have a 'eureka!' moment about lunch?", motivational: "Channel that 'eureka!' energy into your work first." },
    { cheeky: "Is your brain optimizing its idle state?", motivational: "Let's optimize for output! Engage!" },
    { cheeky: "Did you find a really interesting spot on your desk?", motivational: "Find the interesting parts of this task and dive in!" },
    { cheeky: "Are you conducting a silent protest?", motivational: "Protest procrastination by being productive!" },
    { cheeky: "Waiting for the task to complete itself?", motivational: "It needs your magic touch. Lend your skills!" },
    { cheeky: "Did you achieve ultimate tranquility?", motivational: "Turn tranquility into focused flow. Create something amazing." }
];

// You can then use this array in your application logic.
// For example, to get a random message pair:
// const randomIndex = Math.floor(Math.random() * inactivityMessages.length);
// const randomMessage = inactivityMessages[randomIndex];
// console.log("Cheeky:", randomMessage.cheeky);
// console.log("Motivational:", randomMessage.motivational);


/**
 * Selects a random message object from the list.
 * @returns {object} - A message object { cheeky, motivational }.
 */
function getRandomInactivityMessage() {
    if (inactivityMessages.length === 0) return FALLBACK_MESSAGE;
    const randomIndex = Math.floor(Math.random() * inactivityMessages.length);
    return inactivityMessages[randomIndex];
}

/**
 * Starts the inactivity timer countdown.
 * Should be called when the main Pomodoro timer stops.
 */
function startInactivityCountdown() {
    clearInactivityTimer(); // Clear any existing timer first

    // Only start if the feature is enabled (timeout > 0) and Pomodoro timer is NOT running
    if (settings.inactivityTimeoutMinutes > 0 && !isRunning) {
        // Set the timeout to trigger the popup
        inactivityTimerId = setTimeout(showInactivityPopup, settings.inactivityTimeoutMinutes * 60 * 1000);
        console.log(`Inactivity countdown started. Popup in ${settings.inactivityTimeoutMinutes} min if timer remains stopped.`);
        // Start the visual countdown display
        startInactivityDisplayUpdater();
    } else {
        // Ensure display is updated even if countdown doesn't start
        updateInactivityDisplay();
    }
}

/**
 * Clears the inactivity timer and stops the display update.
 * Should be called when the main Pomodoro timer starts or the feature is disabled.
 */
function clearInactivityTimer() {
    if (inactivityTimerId) {
        clearTimeout(inactivityTimerId);
        inactivityTimerId = null;
        console.log("Inactivity countdown cleared.");
    }
    stopInactivityDisplayUpdater(); // Stop the visual countdown
    updateInactivityDisplay(); // Update display to reflect cleared state
}

/**
 * Shows the inactivity popup modal with a random message, confetti, and alarm sound.
 * Sets the default time mode to 'tillNow'.
 * This is called by the setTimeout in startInactivityCountdown.
 */
function showInactivityPopup() {
    // Double-check: Only show if timer is STILL not running and no other modal is open
    if (isRunning || document.querySelector('.modal[style*="display: flex"]')) {
        console.log("Inactivity popup skipped (timer started again or modal opened).");
        return; // Don't restart countdown here
    }
     // Ensure pomodoroStopTime is set (should have been set when timer stopped)
     if (pomodoroStopTime === null) {
        console.warn("Inactivity popup triggered, but pomodoroStopTime is not set. Using current time as fallback start.");
        pomodoroStopTime = Date.now() - (settings.inactivityTimeoutMinutes * 60 * 1000); // Estimate stop time
    }

    console.log("Showing inactivity popup!");
    const message = getRandomInactivityMessage();

    // Play alarm sound FIRST to get attention
    playInactivityAlarmSound(); // Defined in audio.js

    // Open the modal with the selected message
    openInactivityModal(message);
    prepareInactivityLogForm(); // Populate dropdowns etc. for the embedded form

    // Set default mode to 'tillNow' and update UI
    inactivityLogMode = 'tillNow';
    updateInactivityTimeSelectionUI(); // Set active button and hide/show inputs

    // Show toast notification
    showNotification("Let's get back to work?", 'warning', 5000);

    // Trigger question mark confetti
    triggerQuestionMarkConfetti();

    // Stop the visual countdown display
    stopInactivityDisplayUpdater();
    // Update display to show popup is active
    updateInactivityDisplay();
}


/**
 * Triggers confetti effect using question mark emojis.
 */
function triggerQuestionMarkConfetti() {
    if (typeof confetti !== 'function') return;
    const questionMarks = ['❓'];
    function shoot() {
        confetti({
            particleCount: 1, angle: 60 + Math.random() * 60, spread: 55 + Math.random() * 50,
            origin: { x: Math.random() }, gravity: 0.6, ticks: 200 + Math.random() * 100,
            scalar: 0.8 + Math.random() * 0.6, shapes: ['emoji'],
            shapeOptions: { emoji: { value: questionMarks } }, zIndex: 201
        });
    }
    const duration = 1 * 1000; const interval = 50; let count = 0;
    const intervalId = setInterval(() => { shoot(); count += interval; if (count >= duration) clearInterval(intervalId); }, interval);
}

// --- Inactivity Display Timer ---

/**
 * Updates the inactivity countdown display element.
 */
function updateInactivityDisplay() {
    if (!inactivityTimerDisplay) return;

    if (settings.inactivityTimeoutMinutes <= 0) {
        inactivityTimerDisplay.textContent = 'Inactive Popup: Off';
        inactivityTimerDisplay.title = 'Inactivity popup is disabled in settings.';
        return;
    }

    if (isRunning) {
        inactivityTimerDisplay.textContent = 'Inactive Popup: Paused (Timer Active)';
        inactivityTimerDisplay.title = `Inactivity popup is paused while the Pomodoro timer is running.`;
    } else if (pomodoroStopTime !== null && inactivityTimerId !== null) {
        // Timer stopped, countdown running
        const elapsedSeconds = (Date.now() - pomodoroStopTime) / 1000;
        const totalSeconds = settings.inactivityTimeoutMinutes * 60;
        const remainingSeconds = Math.max(0, Math.floor(totalSeconds - elapsedSeconds));

        if (remainingSeconds <= 0) {
            inactivityTimerDisplay.textContent = 'Inactive Popup: Now!';
            inactivityTimerDisplay.title = 'Popup should appear shortly.';
        } else {
            inactivityTimerDisplay.textContent = `Inactive Popup in: ${formatTime(remainingSeconds)}`;
            inactivityTimerDisplay.title = `Popup will appear if the Pomodoro timer remains stopped for ${settings.inactivityTimeoutMinutes} minutes.`;
        }
    } else if (inactivityModal && inactivityModal.style.display === 'flex') {
        // Popup is currently showing
        inactivityTimerDisplay.textContent = 'Inactive Popup: Active';
        inactivityTimerDisplay.title = 'Inactivity popup is currently displayed.';
    }
    else {
         // Timer stopped, but countdown not active (either finished or not started)
         inactivityTimerDisplay.textContent = 'Inactive Popup: Ready';
         inactivityTimerDisplay.title = 'Inactivity popup will trigger if the Pomodoro timer remains stopped.';
    }
}

/** Starts the interval timer to update the inactivity countdown display visually. */
function startInactivityDisplayUpdater() {
    stopInactivityDisplayUpdater(); // Clear existing interval first

    // Only start if timer is stopped and feature enabled
    if (!isRunning && settings.inactivityTimeoutMinutes > 0) {
        inactivityDisplayIntervalId = setInterval(updateInactivityDisplay, 1000); // Update every second
        // Initial update
        updateInactivityDisplay();
    }
}

/** Stops the interval timer for the inactivity countdown display. */
function stopInactivityDisplayUpdater() {
    clearInterval(inactivityDisplayIntervalId);
    inactivityDisplayIntervalId = null;
}

/** Sets up the initial inactivity timer state and listeners for the embedded form. */
function initializeInactivityFeature() {
    // Start countdown only if timer is initially stopped
    if (!isRunning) {
        // If pomodoroStopTime is somehow null on load but timer isn't running, estimate it.
        if (pomodoroStopTime === null) {
             pomodoroStopTime = Date.now(); // Or Date.now() - some default? Let's use now.
             console.warn("Initialized inactivity countdown, but pomodoroStopTime was null.");
        }
        startInactivityCountdown();
    } else {
        pomodoroStopTime = null; // Ensure it's null if timer starts running immediately
        updateInactivityDisplay(); // Update display to show "Paused"
    }
    setupInactivityModalListeners(); // Add listeners for the embedded form
}

// --- Embedded Manual Log Form Logic ---

/**
 * Sets up event listeners for the embedded manual log form within the inactivity modal.
 */
function setupInactivityModalListeners() {
    // Listener for the embedded form submission
    if (inactivityManualLogForm) {
        inactivityManualLogForm.addEventListener('submit', handleEmbeddedLogSubmit);
    } else { console.error("Inactivity manual log form not found."); }

    // Listener for the cancel button within the embedded form (now closes the modal)
    if (inactivityCancelManualLog) {
        // Use the wrapper function to ensure countdown restarts
        inactivityCancelManualLog.addEventListener('click', closeInactivityModalAndRestartCountdown);
    } else { console.error("Inactivity cancel manual log button not found."); }

     // Add listeners for time mode buttons
     const timeModeButtons = inactivityTimeSuggestionContainer?.querySelectorAll('.time-suggestion-btn');
     timeModeButtons?.forEach(button => {
         button.addEventListener('click', () => {
             const mode = button.dataset.mode; // Read mode from data-mode attribute
             if (mode) {
                 inactivityLogMode = mode; // Update the global state for inactivity mode
                 // Ensure updateInactivityTimeSelectionUI function exists (should be in inactivity.js or ui.js)
                 if (typeof updateInactivityTimeSelectionUI === 'function') {
                     updateInactivityTimeSelectionUI(); // Update button styles and input visibility
                 } else {
                     console.error("updateInactivityTimeSelectionUI function not found!");
                 }
             }
         });
     });

     // --- Combined NLP & Project Prediction Listener ---
     if (inactivityManualLogTaskInput) {
         inactivityManualLogTaskInput.addEventListener('input', (event) => {
             // Reset applied suggestion state immediately for inactivity form
             appliedNlpSuggestionIndex.inactivity = -1;

             // Re-render existing suggestions without highlight while typing
             if (typeof renderTimeSuggestions === 'function') {
                 renderTimeSuggestions(currentNlpSuggestions, 'inactivity', -1);
             }

             // Call the NLP handler (debounced) - PASS 'inactivity' as formType
             if (typeof handleNlpTaskInput === 'function') {
                 // This function (likely in log.js) handles debouncing, parsing,
                 // and calling renderTimeSuggestions/applyNlpSuggestionUI
                 handleNlpTaskInput(event, 'inactivity'); // *** Pass 'inactivity' ***
             } else {
                 console.error("handleNlpTaskInput function not found.");
             }

             // Also call project prediction (function likely in main.js)
             if (typeof handleTaskInputForPrediction === 'function') {
                  handleTaskInputForPrediction(inactivityManualLogTaskInput, inactivityManualLogProjectSelect, 'inactivity-quick-projects');
             } else {
                  console.error("handleTaskInputForPrediction function not found.");
             }
         });
     } else { console.error("Inactivity manual log task input not found."); }
     // --- End Combined Listener ---

     // Listener for project dropdown change to update quick buttons
     if (inactivityManualLogProjectSelect) {
        inactivityManualLogProjectSelect.addEventListener('change', (e) => {
            // Ensure updateProjectLastUsed exists (likely in projects.js)
            if(typeof updateProjectLastUsed === 'function') {
                updateProjectLastUsed(e.target.value);
            } else {
                console.error("updateProjectLastUsed function not found!");
            }
            // Ensure updateQuickSelectActiveState exists (likely in ui.js)
            if(typeof updateQuickSelectActiveState === 'function') {
                updateQuickSelectActiveState('inactivity-quick-projects', 'inactivity-manual-log-project');
            } else {
                 console.error("updateQuickSelectActiveState function not found!");
            }
        });
     } // End if (inactivityManualLogProjectSelect)

} // End setupInactivityModalListeners

/**
 * Prepares the embedded manual log form by populating dropdowns and setting defaults.
 * Called when the inactivity modal is opened.
 */
function prepareInactivityLogForm() {
    if (inactivityManualLogProjectSelect) {
        populateProjectDropdown(inactivityManualLogProjectSelect);
        inactivityManualLogProjectSelect.value = DEFAULT_PROJECT_ID;
    } else { console.error("Inactivity project select not found for prep."); }

    // Date/Time inputs are handled by updateInactivityTimeSelectionUI
    if (inactivityManualLogTaskInput) inactivityManualLogTaskInput.value = '';

    populateTaskSuggestions();
    renderQuickSelectButtons('inactivity-quick-projects', 'inactivity-manual-log-project'); // Render quick projects

    // Clear NLP suggestions and applied state when preparing form
    appliedNlpSuggestionIndex.inactivity = -1;
    if (typeof renderTimeSuggestions === 'function') {
        renderTimeSuggestions([], 'inactivity', -1);
    }
}

/**
 * Updates the visual state of time selection buttons and hides/shows custom time inputs.
 */
function updateInactivityTimeSelectionUI() {
    const buttons = inactivityTimeSuggestionContainer?.querySelectorAll('.time-suggestion-btn');
    buttons?.forEach(button => {
        if (button.dataset.mode === inactivityLogMode) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Show/hide the custom date/time input container
    if (inactivityCustomTimeInputs) {
        if (inactivityLogMode === 'custom') {
            inactivityCustomTimeInputs.classList.add('show');
             // Clear and focus start time for custom input
             if (inactivityManualLogStartInput) inactivityManualLogStartInput.value = '';
             if (inactivityManualLogEndInput) inactivityManualLogEndInput.value = '';
             if (inactivityManualLogDateInput) inactivityManualLogDateInput.value = getDateString(new Date()); // Default to today
             setTimeout(() => inactivityManualLogStartInput?.focus(), 50); // Delay focus slightly
        } else {
            inactivityCustomTimeInputs.classList.remove('show');
        }
    }
}


/**
 * Handles the submission of the embedded manual log form.
 * Calculates time based on selected mode ('tillNow', fixed duration, or 'custom').
 * Trims project phrase from task text before saving.
 * @param {Event} event - The form submission event.
 */
function handleEmbeddedLogSubmit(event) {
    event.preventDefault();
    const rawTaskText = inactivityManualLogTaskInput.value.trim();
    const projectId = inactivityManualLogProjectSelect.value;

    let startTime, endTime, durationMinutes;
    const now = Date.now();

    // Determine start, end, and duration based on selected mode
    if (inactivityLogMode === 'tillNow') {
        if (pomodoroStopTime === null) {
            showNotification("Error: Timer stop time not recorded.", "error"); return;
        }
        startTime = pomodoroStopTime; // Use the time the main timer stopped
        endTime = now;
        durationMinutes = Math.round((endTime - startTime) / (60 * 1000));
        // Ensure minimum 1 minute is logged if clicked quickly after timer stop
        durationMinutes = Math.max(1, durationMinutes);
    } else if (inactivityLogMode === 'custom') {
        // Read from inputs for custom mode
        const dateStr = inactivityManualLogDateInput.value;
        const startTimeStr = inactivityManualLogStartInput.value;
        const endTimeStr = inactivityManualLogEndInput.value;
        if (!dateStr || !startTimeStr || !endTimeStr) {
            showNotification("Please fill Date, Start Time, and End Time for Custom mode.", "warning"); return;
        }
        const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
        const endDateTime = new Date(`${dateStr}T${endTimeStr}`);
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            showNotification("Invalid date or time format for Custom mode.", "error"); return;
        }
        if (endDateTime <= startDateTime) {
            showNotification("End time must be after start time for Custom mode.", "warning"); return;
        }
        startTime = startDateTime.getTime();
        endTime = endDateTime.getTime();
        durationMinutes = Math.round((endTime - startTime) / (60 * 1000));
    }
    else {
        // Calculate from fixed duration mode ('15', '30', '60', '120')
        const duration = parseInt(inactivityLogMode);
         if (isNaN(duration)) {
             showNotification("Invalid time mode selected.", "error"); return;
         }
         endTime = now; // End time is now for fixed durations
         startTime = endTime - duration * 60 * 1000;
         durationMinutes = duration;
    }

    // --- Validation (Common) ---
    if (!rawTaskText || !projectId) {
        showNotification("Please provide Task Name and Project.", "warning"); return;
    }
    if (durationMinutes <= 0) {
        showNotification("Calculated duration is zero or negative. Please check times.", "warning"); return;
    }
    // --- End Validation ---

    // Trim project phrase from the task text before saving
    let finalTaskText = rawTaskText;
    if(typeof trimProjectPhrase === 'function') {
        finalTaskText = trimProjectPhrase(rawTaskText);
    }

    updateProjectLastUsed(projectId);
    addLogEntry({
        timestamp: endTime, startTime: startTime, taskText: finalTaskText, // Use trimmed text
        duration: durationMinutes, projectId: projectId
    });

    showNotification("Manual log entry saved! 👍", "success");

    // Clear NLP suggestions before closing
    appliedNlpSuggestionIndex.inactivity = -1; // Reset applied state
    if (typeof renderTimeSuggestions === 'function') {
        renderTimeSuggestions([], 'inactivity', -1);
    }

    // Use wrapper function to close modal AND restart countdown
    closeInactivityModalAndRestartCountdown();
}


/**
 * Wrapper function to close the inactivity modal and restart the inactivity countdown.
 */
function closeInactivityModalAndRestartCountdown() {
    // Reset mode to default
    inactivityLogMode = 'tillNow';

    // Clear NLP suggestions and applied state when closing
    appliedNlpSuggestionIndex.inactivity = -1;
    if (typeof renderTimeSuggestions === 'function') {
        renderTimeSuggestions([], 'inactivity', -1);
    }

    if (inactivityModal) {
        inactivityModal.style.display = 'none';
    }
    // Restart countdown because user interacted by closing the modal
    // Ensure pomodoroStopTime is set correctly before restarting
    if (!isRunning) { // Double-check timer isn't running
       pomodoroStopTime = Date.now(); // Reset stop time to now
       startInactivityCountdown();
    } else {
        clearInactivityTimer(); // If timer somehow started, just clear inactivity
    }
}
