// --- Features Overview Modal ---

/** Opens the features overview modal. */
function openFeaturesOverviewModal() {
    if (featuresOverviewModal) {
        featuresOverviewModal.style.display = 'flex';
    }
}

/** Closes the features overview modal. */
function closeFeaturesOverviewModal() {
    if (featuresOverviewModal) {
        featuresOverviewModal.style.display = 'none';
    }
}

/** Marks the features overview popup as seen in local storage. */
function markFeaturesOverviewSeen() {
    try {
        localStorage.setItem(LS_FEATURES_SEEN_KEY, 'true');
    } catch (e) {
        console.error("Failed to mark features overview as seen:", e);
    }
}

/** Checks if the features overview popup has been seen. */
function hasSeenFeaturesOverview() {
    try {
        return localStorage.getItem(LS_FEATURES_SEEN_KEY) === 'true';
    } catch (e) {
        console.error("Failed to check features overview status:", e);
        return false; // Default to not seen on error
    }
}
