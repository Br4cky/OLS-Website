/**
 * Shared Settings Service
 * Single fetch point for site-settings - all components share the same promise.
 * Eliminates 4-7 redundant API calls per page load.
 *
 * Usage:
 *   const settings = await window.siteSettings.get();
 *   const clubName = settings['club-name'] || 'Rugby Club';
 */
(function() {
    'use strict';

    let settingsPromise = null;
    let cachedSettings = null;
    let cacheTimestamp = 0;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    // Try to load from localStorage first for instant rendering
    try {
        const stored = localStorage.getItem('olrfc_site-settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                cachedSettings = parsed;
                cacheTimestamp = Date.now();
            }
        }
    } catch (e) {
        // Ignore parse errors
    }

    async function fetchSettings() {
        try {
            const response = await fetch('/.netlify/functions/site-settings');
            if (!response.ok) {
                console.warn('Settings fetch failed, using cached/defaults');
                return cachedSettings || {};
            }
            const result = await response.json();
            const settings = result.data || {};

            // Update cache
            cachedSettings = settings;
            cacheTimestamp = Date.now();

            // Persist to localStorage for instant loading on next visit
            try {
                localStorage.setItem('olrfc_site-settings', JSON.stringify(settings));
            } catch (e) {
                // localStorage full or unavailable
            }

            return settings;
        } catch (error) {
            console.error('Settings fetch error:', error);
            return cachedSettings || {};
        }
    }

    window.siteSettings = {
        /**
         * Get site settings. Returns cached data immediately if available,
         * and fetches fresh data in the background. Multiple concurrent callers
         * share the same fetch promise.
         */
        get: function() {
            // If cache is fresh, return it directly
            if (cachedSettings && (Date.now() - cacheTimestamp < CACHE_TTL)) {
                // Refresh in background if older than 30s
                if (Date.now() - cacheTimestamp > 30000 && !settingsPromise) {
                    settingsPromise = fetchSettings().finally(() => {
                        settingsPromise = null;
                    });
                }
                return Promise.resolve(cachedSettings);
            }

            // If a fetch is already in progress, share it
            if (settingsPromise) {
                return settingsPromise;
            }

            // Start a new fetch
            settingsPromise = fetchSettings().finally(() => {
                settingsPromise = null;
            });

            return settingsPromise;
        },

        /**
         * Force refresh settings (e.g., after admin saves changes)
         */
        refresh: function() {
            cacheTimestamp = 0;
            settingsPromise = null;
            return this.get();
        },

        /**
         * Get cached settings synchronously (may be stale or null)
         */
        getCached: function() {
            return cachedSettings;
        }
    };
})();
