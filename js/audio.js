// js/audio.js

// --- Audio State ---
let synth = null; // Tone.js Synth instance
let alarmSynth = null; // Separate synth for inactivity alarm
// *** activeReminderSound moved to state.js ***

// --- Audio Functions ---

/**
 * Initializes the Tone.js audio context and creates the synths.
 * Must be called after a user interaction (like button click).
 * Handles potential errors during initialization.
 */
function initializeAudio() {
    // Check if already initialized or context is running
    if ((synth && alarmSynth) || (Tone.context && Tone.context.state === 'running')) {
        // Ensure synths exist if context is running but they weren't created
        if (!synth) synth = new Tone.Synth().toDestination();
        if (!alarmSynth) {
             // Use a slightly different sound for the alarm, e.g., sawtooth
             alarmSynth = new Tone.Synth({ oscillator: { type: "sawtooth" } }).toDestination();
             alarmSynth.volume.value = -6; // Make it slightly less loud than default
        }
        return;
    }

    // Attempt to start the audio context
    Tone.start()
        .then(() => {
            console.log("Audio context started successfully.");
            // Create synths after context starts
            synth = new Tone.Synth().toDestination();
            alarmSynth = new Tone.Synth({ oscillator: { type: "sawtooth" } }).toDestination();
            alarmSynth.volume.value = -6;
        })
        .catch(e => {
            console.error("Audio context failed to start:", e);
            // Disable sound if context fails to start
            settings.soundEnabled = false;
            if (soundEnabledInput) soundEnabledInput.checked = false; // Update UI if element exists
            showNotification("Audio failed to initialize. Sound disabled.", "error");
        });
}

/**
 * Plays the standard timer completion notification sound.
 */
function playNotificationSound() {
    if (!settings.soundEnabled) return;

    // Ensure synth is initialized
    if (!synth) {
        initializeAudio(); // Try to initialize again
        if (!synth) {
            console.warn("Synth not available for notification sound.");
            showNotification("Timer finished (audio failed)", "warning");
            return;
        }
    }

    // Play the sound using Tone.js
    try {
        const now = Tone.now();
        // Play a simple two-note melody
        synth.triggerAttackRelease("C5", "8n", now); // Note C5 for an 8th note duration
        synth.triggerAttackRelease("G5", "8n", now + 0.2); // Note G5 shortly after
    } catch (e) {
        console.error("Error playing notification sound:", e);
        showNotification("Timer finished (sound error)", "error");
    }
}

/**
 * Plays an attention-grabbing sound for the inactivity popup.
 */
function playInactivityAlarmSound() {
    if (!settings.soundEnabled) return;

    // Ensure alarm synth is initialized
    if (!alarmSynth) {
        initializeAudio(); // Try to initialize again
        if (!alarmSynth) {
            console.warn("Alarm synth not available for inactivity sound.");
            // Don't show a notification here, as the popup itself is the main notification
            return;
        }
    }

    // Play a more insistent sound
    try {
        const now = Tone.now();
        // Play a short, slightly dissonant or faster sequence
        alarmSynth.triggerAttackRelease("E5", "16n", now);
        alarmSynth.triggerAttackRelease("G#5", "16n", now + 0.1);
        alarmSynth.triggerAttackRelease("E5", "16n", now + 0.2);

    } catch (e) {
        console.error("Error playing inactivity alarm sound:", e);
        // Don't show notification, popup is already showing
    }
}


// *** NEW: Reminder Alarm Functions ***

/**
 * Plays a looping sound for the reminder alert.
 * Stores the loop object in the global state `activeReminderSound`.
 */
function playReminderAlarm() {
    // Ensure audio context is ready (important!)
    initializeAudio();

    if (!settings.soundEnabled || !synth) {
        console.warn("Reminder triggered, but sound is disabled or synth not ready.");
        return;
    }

    // Stop any previously playing reminder sound first
    stopReminderAlarm();

    console.log("Starting reminder alarm sound loop.");
    try {
        // Create a new loop
        activeReminderSound = new Tone.Loop(time => {
            // Play a short, noticeable sound (e.g., a higher pitch note)
            synth.triggerAttackRelease("C6", "16n", time); // Example: High C for a 16th note
        }, "1s"); // Loop interval (e.g., every 1 second)

        // Set loop properties
        activeReminderSound.humanize = true; // Add slight timing variations

        // Start the loop immediately
        activeReminderSound.start(0);

        // Make sure the Transport is running for the loop to play
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }
    } catch (e) {
        console.error("Error starting reminder alarm loop:", e);
        showNotification("Reminder sound error.", "error");
        // Clean up if loop creation failed
        if (activeReminderSound) {
            activeReminderSound.dispose();
            activeReminderSound = null;
        }
    }
}

/**
 * Stops the currently playing reminder alarm loop.
 */
function stopReminderAlarm() {
    if (activeReminderSound) {
        console.log("Stopping reminder alarm sound loop.");
        try {
            activeReminderSound.stop(0); // Stop the loop at the next cycle
            activeReminderSound.dispose(); // Clean up the loop object
        } catch (e) {
            console.error("Error stopping reminder alarm loop:", e);
        } finally {
            activeReminderSound = null; // Clear the state variable
        }
        // Optional: Stop the transport if nothing else relies on it continuously
        // if (Tone.Transport.state === 'started') {
        //     Tone.Transport.stop();
        // }
    }
}
// *** END NEW ***
