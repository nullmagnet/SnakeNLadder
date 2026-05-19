/**
 * analytics.js — Snake & Ladder Analytics Tracker
 * Stores all data in localStorage under the key "snl_analytics"
 */
(function () {
    const KEY = 'snl_analytics';
    const SESSION_KEY = 'snl_session_start';

    function load() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || defaultData();
        } catch { return defaultData(); }
    }

    function defaultData() {
        return {
            totalViews: 0,
            totalSessions: 0,
            totalGamesPlayed: 0,
            totalGamesCompleted: 0,
            totalTimeSec: 0,
            diceRolls: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
            playerCountDist: { 2: 0, 3: 0, 4: 0 },
            snakeHits: 0,
            ladderHits: 0,
            sessions: [],         // last 50 sessions [{date, durationSec, gamesPlayed}]
            dailyViews: {},       // "YYYY-MM-DD": count
        };
    }

    function save(data) {
        localStorage.setItem(KEY, JSON.stringify(data));
    }

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    // ── Public API ──────────────────────────────────────────────
    window.SnLAnalytics = {

        /** Called once on page load */
        trackPageView() {
            const data = load();
            data.totalViews++;
            data.totalSessions++;
            data.dailyViews[today()] = (data.dailyViews[today()] || 0) + 1;
            save(data);
            // Record session start time
            sessionStorage.setItem(SESSION_KEY, Date.now());
        },

        /** Call when a game starts, pass playerCount */
        trackGameStart(playerCount) {
            const data = load();
            data.totalGamesPlayed++;
            const pc = String(playerCount);
            if (data.playerCountDist[pc] !== undefined) data.playerCountDist[pc]++;
            save(data);
        },

        /** Call when a game ends (someone wins) */
        trackGameComplete() {
            const data = load();
            data.totalGamesCompleted++;
            save(data);
        },

        /** Call on every dice roll with the result (1-6) */
        trackDiceRoll(result) {
            const data = load();
            data.diceRolls[String(result)] = (data.diceRolls[String(result)] || 0) + 1;
            save(data);
        },

        /** Call when a player hits a snake */
        trackSnakeHit() {
            const data = load();
            data.snakeHits++;
            save(data);
        },

        /** Call when a player climbs a ladder */
        trackLadderHit() {
            const data = load();
            data.ladderHits++;
            save(data);
        },

        /** Call on page unload to record session duration */
        finaliseSession() {
            const start = parseInt(sessionStorage.getItem(SESSION_KEY) || '0');
            if (!start) return;
            const durationSec = Math.round((Date.now() - start) / 1000);
            const data = load();
            data.totalTimeSec += durationSec;
            // Keep last 50 sessions
            data.sessions.unshift({
                date: new Date().toISOString(),
                durationSec,
                gamesPlayed: 0 // updated inline per session if needed
            });
            if (data.sessions.length > 50) data.sessions = data.sessions.slice(0, 50);
            save(data);
        },

        /** Returns the full data object for the dashboard */
        getData() { return load(); },

        /** Reset all data (admin action) */
        reset() { save(defaultData()); }
    };

    // Auto-track page view and session end
    window.SnLAnalytics.trackPageView();
    window.addEventListener('beforeunload', () => window.SnLAnalytics.finaliseSession());
})();
