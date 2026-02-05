// ============================================================================
// 📅 OLS RUGBY CALENDAR DATA FETCHER
// Fetches from Google Calendar API + localStorage fixtures
// 🔒 SECURE VERSION - Uses serverless function for API key protection
// 🌐 WHITE-LABEL READY - Calendar IDs loaded from site-settings
// 🎯 OLS 124 - Dynamic filter groups and team assignments
// ============================================================================

class CalendarDataFetcher {
    constructor() {
        // 🔒 NO API KEY HERE - Uses serverless function instead
        
        // Default fixtures calendar ID (fallback)
        this.defaultFixturesCalendarId = '11ae9f30eba7d2aa9da970c0d3036210976d9c8a989189fd64caf3413ed8cf00@group.calendar.google.com';
        
        // Will be populated from site-settings and Teams API
        this.calendars = {};
        this.fixtureGroups = [];
        this.teamTypeMap = {};
        this.teams = []; // 🎯 OLS 129: Store teams array for name lookup
        this.settingsLoaded = false;
        
        // Default fixture groups (fallback)
        this.defaultFixtureGroups = [
            { id: 'senior', label: 'Senior Fixtures', color: '#e53935' },
            { id: 'junior', label: 'Junior Fixtures', color: '#1e88e5' },
            { id: 'colts', label: 'Colts Fixtures', color: '#43a047' }
        ];
        
        // Default team assignments (fallback when Teams API unavailable)
        this.defaultTeamAssignments = {
            'mens-1st': 'senior',
            'mens-2nd': 'senior',
            'colts': 'colts',
            'u16s': 'junior',
            'u15s': 'junior',
            'u14s': 'junior',
            'u13s': 'junior',
            'u12s': 'junior',
            'minis': 'junior',
            'ladies': 'senior',
            'phoenix-ladies': 'senior'
        };
        
        this.cache = {
            events: null,
            timestamp: null,
            duration: 5 * 60 * 1000 // 5 minutes cache
        };
    }
    
    // ========================================================================
    // LOAD CALENDAR SETTINGS FROM SITE-SETTINGS
    // ========================================================================
    async loadCalendarSettings() {
        if (this.settingsLoaded) return;
        
        try {
            // Try localStorage cache first (instant)
            const cachedSettings = localStorage.getItem('olrfc_site-settings');
            let settings = null;
            
            if (cachedSettings) {
                try {
                    settings = JSON.parse(cachedSettings);
                    console.log('📅 Loaded calendar settings from cache');
                } catch (e) {
                    console.warn('⚠️ Failed to parse cached settings');
                }
            }
            
            // If no cache, fetch from Netlify
            if (!settings) {
                try {
                    const response = await fetch('/.netlify/functions/site-settings');
                    if (response.ok) {
                        const result = await response.json();
                        settings = result.data || {};
                        console.log('📅 Loaded calendar settings from Netlify');
                    }
                } catch (e) {
                    console.warn('⚠️ Failed to fetch settings from Netlify');
                }
            }
            
            // Load fixture groups (definitions)
            if (settings?.['calendar-fixture-groups']) {
                try {
                    this.fixtureGroups = JSON.parse(settings['calendar-fixture-groups']);
                } catch (e) {
                    this.fixtureGroups = [...this.defaultFixtureGroups];
                }
            } else {
                this.fixtureGroups = [...this.defaultFixtureGroups];
            }
            
            // Fetch teams from API to get their filterGroup assignments
            await this.loadTeamsAndBuildMap();
            
            // Build calendars configuration
            // 1. Add fixtures calendar
            const fixturesCalendarId = settings?.['calendar-fixtures-id'] || this.defaultFixturesCalendarId;
            this.calendars = {
                'fixtures': {
                    id: fixturesCalendarId,
                    color: '#e53935',
                    type: 'Fixtures',
                    isFixtureCalendar: true
                }
            };
            
            // 2. Add additional calendars from config
            if (settings?.['calendar-additional-sources']) {
                try {
                    const additionalSources = JSON.parse(settings['calendar-additional-sources']);
                    additionalSources.forEach(source => {
                        if (source.enabled && source.calendarId) {
                            this.calendars[source.id] = {
                                id: source.calendarId,
                                color: source.color || '#607d8b',
                                type: source.label || source.id
                            };
                        }
                    });
                } catch (e) {
                    console.warn('⚠️ Failed to parse additional calendar sources');
                }
            }
            
            this.settingsLoaded = true;
            console.log('✅ Calendar configuration loaded:', {
                fixtureGroups: this.fixtureGroups.length,
                teamsWithFilters: Object.keys(this.teamTypeMap).length,
                calendars: Object.keys(this.calendars)
            });
            
        } catch (error) {
            console.error('❌ Error loading calendar settings, using defaults:', error);
            this.fixtureGroups = [...this.defaultFixtureGroups];
            this.useDefaultTeamAssignments();
            this.calendars = {
                'fixtures': {
                    id: this.defaultFixturesCalendarId,
                    color: '#e53935',
                    type: 'Fixtures',
                    isFixtureCalendar: true
                }
            };
            this.settingsLoaded = true;
        }
    }
    
    // Fetch teams from API and build teamTypeMap from their filterGroup field
    async loadTeamsAndBuildMap() {
        try {
            const response = await fetch('/.netlify/functions/teams');
            if (!response.ok) throw new Error('Failed to fetch teams');
            
            const result = await response.json();
            const teams = result.data || [];
            
            // 🎯 OLS 129: Store teams array for name lookup
            this.teams = teams;
            
            // Create a lookup for group id → {type, color}
            const groupLookup = {};
            this.fixtureGroups.forEach(group => {
                groupLookup[group.id] = {
                    type: group.label,
                    color: group.color
                };
            });
            
            // Build teamTypeMap from each team's filterGroup
            this.teamTypeMap = {};
            teams.forEach(team => {
                const filterGroup = team.filterGroup;
                if (filterGroup && groupLookup[filterGroup]) {
                    // Map by both team ID and slug for flexible matching
                    this.teamTypeMap[team.id] = groupLookup[filterGroup];
                    if (team.slug) {
                        this.teamTypeMap[team.slug] = groupLookup[filterGroup];
                    }
                }
            });
            
            // Add fallback mappings for backwards compatibility with old ageGroup field
            teams.forEach(team => {
                if (!this.teamTypeMap[team.id] && team.ageGroup) {
                    // Map old ageGroup values to new filter groups
                    const ageGroupToFilter = {
                        'senior': 'senior',
                        'youth': 'junior',
                        'junior': 'junior',
                        'mini': 'junior'
                    };
                    const mappedGroup = ageGroupToFilter[team.ageGroup];
                    if (mappedGroup && groupLookup[mappedGroup]) {
                        this.teamTypeMap[team.id] = groupLookup[mappedGroup];
                        if (team.slug) {
                            this.teamTypeMap[team.slug] = groupLookup[mappedGroup];
                        }
                    }
                }
            });
            
            console.log('📋 Team type map built from Teams API:', Object.keys(this.teamTypeMap).length, 'mappings');
            
        } catch (error) {
            console.warn('⚠️ Failed to load teams, using default assignments:', error);
            this.useDefaultTeamAssignments();
        }
    }
    
    // Use hardcoded default team assignments as fallback
    useDefaultTeamAssignments() {
        // Create a lookup for group id → {type, color}
        const groupLookup = {};
        this.fixtureGroups.forEach(group => {
            groupLookup[group.id] = {
                type: group.label,
                color: group.color
            };
        });
        
        // Default mappings
        this.teamTypeMap = {};
        Object.entries(this.defaultTeamAssignments).forEach(([teamId, groupId]) => {
            if (groupLookup[groupId]) {
                this.teamTypeMap[teamId] = groupLookup[groupId];
            }
        });
        
        console.log('📋 Using default team assignments:', Object.keys(this.teamTypeMap).length, 'mappings');
    }
    
    // Get available filter types for the UI
    getAvailableFilters() {
        const filters = [
            { id: 'all', label: 'All Events', color: null }
        ];
        
        // Add fixture group filters
        this.fixtureGroups.forEach(group => {
            filters.push({
                id: group.id,
                label: group.label,
                color: group.color,
                type: group.label
            });
        });
        
        // Add additional calendar filters
        Object.entries(this.calendars).forEach(([key, cal]) => {
            if (key !== 'fixtures') {
                filters.push({
                    id: key,
                    label: cal.type,
                    color: cal.color,
                    type: cal.type
                });
            }
        });
        
        return filters;
    }
    
    // 🎯 OLS 129: Get team display name from team slug
    getTeamName(teamSlug) {
        if (!teamSlug) return null;
        const team = this.teams.find(t => t.slug === teamSlug || t.id === teamSlug);
        return team ? team.name : null;
    }

    // ========================================================================
    // MAIN: GET ALL EVENTS (Google Calendar only - fixtures now synced to Google)
    // ========================================================================
    async getAllEvents(startDate = null, endDate = null) {
        console.log('📅 Fetching all calendar events from Google Calendar...');
        
        // Ensure settings are loaded first
        await this.loadCalendarSettings();
        
        // Set default date range (3 months back, 12 months forward)
        if (!startDate) {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 3);
        }
        if (!endDate) {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 12);
        }

        try {
            // Fetch from Google Calendar (now includes fixtures synced from admin)
            const googleEvents = await this.fetchGoogleCalendarEvents(startDate, endDate);
            
            // Sort by date
            googleEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
            
            console.log(`✅ Total events loaded from Google Calendar: ${googleEvents.length}`);
            
            return googleEvents;
            
        } catch (error) {
            console.error('❌ Error fetching events:', error);
            return [];
        }
    }

    // ========================================================================
    // FETCH FROM GOOGLE CALENDAR API (via serverless function)
    // ========================================================================
    async fetchGoogleCalendarEvents(startDate, endDate) {
        const allEvents = [];
        
        for (const [key, calendar] of Object.entries(this.calendars)) {
            try {
                const events = await this.fetchFromCalendar(
                    calendar.id,
                    calendar.color,
                    calendar.type,
                    startDate,
                    endDate,
                    calendar.isFixtureCalendar || false // Pass flag for team-based type detection
                );
                allEvents.push(...events);
            } catch (error) {
                console.warn(`⚠️ Failed to fetch ${calendar.type}:`, error.message);
            }
        }
        
        return allEvents;
    }

    // 🔒 Fetch via serverless function instead of direct API call
    async fetchFromCalendar(calendarId, color, type, startDate, endDate, isFixtureCalendar = false) {
        const timeMin = startDate.toISOString();
        const timeMax = endDate.toISOString();
        
        try {
            // Call serverless function instead of Google API directly
            const response = await fetch('/.netlify/functions/get-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    calendarId: calendarId,
                    timeMin: timeMin,
                    timeMax: timeMax,
                    maxResults: 250
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            
            return data.events.map(event => this.formatGoogleEvent(event, color, type, isFixtureCalendar));
            
        } catch (error) {
            console.error(`❌ Error fetching ${type}:`, error);
            throw error;
        }
    }

    formatGoogleEvent(event, defaultColor, defaultType, isFixtureCalendar = false) {
        // Handle all-day events vs timed events
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        const allDay = !event.start.dateTime;

        // Determine type and color
        let type = defaultType;
        let color = defaultColor;
        
        // 🎯 OLS 129: Track team info for fixture display
        let teamSlug = null;
        let teamName = null;
        let fixtureData = null;
        
        // For fixtures calendar, detect team and assign correct type/color
        if (isFixtureCalendar) {
            const teamInfo = this.detectTeamFromEvent(event);
            if (teamInfo) {
                type = teamInfo.type;
                color = teamInfo.color;
            }
            
            // 🎯 OLS 129: Get team slug from extendedProperties
            teamSlug = event.extendedProperties?.private?.team || null;
            if (teamSlug) {
                teamName = this.getTeamName(teamSlug);
            }
            
            // Parse fixture data from description if available
            fixtureData = this.parseFixtureFromDescription(event.description, teamSlug, teamName);
        }
        
        // Handle title - use calendar name as fallback for free/busy events
        // Google returns "Busy" or empty/missing title for events shared as free/busy only
        let title = event.summary || '';
        const isBusyOrHidden = !title || 
                               title.toLowerCase() === 'busy' || 
                               title.toLowerCase() === 'no title' ||
                               title === 'Untitled Event';
        
        // Flag for private/free-busy events - these show start AND end times
        let isPrivate = false;
        
        if (isBusyOrHidden) {
            // Use the calendar type/label as the display title
            title = defaultType;
            isPrivate = true;
            console.log(`📅 Using calendar name "${defaultType}" for free/busy event`);
        }
        
        // 🎯 OLS 129: Replace "OLS" with actual team name in title
        if (isFixtureCalendar && teamName && title) {
            // Replace "OLS vs" or "OLS at" with "[Team Name] vs/at"
            title = title.replace(/^OLS\s+(vs|at)\s+/i, `${teamName} $1 `);
        }

        const formattedEvent = {
            id: event.id,
            source: 'google',
            title: title,
            description: event.description || '',
            start: start,
            end: end,
            allDay: allDay,
            location: event.location || '',
            type: type,
            color: color,
            url: event.htmlLink,
            isPrivate: isPrivate  // Flag to show end time on website
        };
        
        // 🎯 OLS 129: Add fixture object for fixture events
        if (isFixtureCalendar && fixtureData) {
            formattedEvent.fixture = fixtureData;
        }
        
        return formattedEvent;
    }
    
    // 🎯 OLS 129: Parse fixture details from Google Calendar event description
    parseFixtureFromDescription(description, teamSlug, teamName) {
        if (!description) return null;
        
        const fixture = {
            team: teamSlug,
            teamName: teamName || 'OLS',
            opponent: null,
            venue: null,
            competition: null,
            ourScore: null,
            theirScore: null
        };
        
        // Parse common description patterns set by sync function
        // Format: "Competition: League\nVenue: home/away\nTeam: Team Name\nOpponent: Opponent Name"
        const lines = description.split('\n');
        
        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            
            if (!key || !value) continue;
            
            const keyLower = key.toLowerCase().trim();
            
            if (keyLower === 'competition') {
                fixture.competition = value;
            } else if (keyLower === 'venue') {
                fixture.venue = value.toLowerCase().includes('home') ? 'home' : 'away';
            } else if (keyLower === 'opponent') {
                fixture.opponent = value;
            } else if (keyLower === 'result' || keyLower === 'score') {
                // Parse score like "24-17" or "24 - 17"
                const scoreMatch = value.match(/(\d+)\s*[-–]\s*(\d+)/);
                if (scoreMatch) {
                    fixture.ourScore = scoreMatch[1];
                    fixture.theirScore = scoreMatch[2];
                }
            }
        }
        
        // If we got at least some fixture data, return it
        if (fixture.opponent || fixture.competition || fixture.venue) {
            return fixture;
        }
        
        return null;
    }
    
    // Detect team from Google Calendar event extendedProperties or description
    detectTeamFromEvent(event) {
        // Method 1: Check extendedProperties.private.team (set by sync function)
        if (event.extendedProperties?.private?.team) {
            const team = event.extendedProperties.private.team;
            if (this.teamTypeMap[team]) {
                console.log(`📋 Detected team from extendedProperties: ${team}`);
                return this.teamTypeMap[team];
            }
        }
        
        // Method 2: Parse description for "Team: ..." line
        if (event.description) {
            const teamMatch = event.description.match(/Team:\s*(.+?)(?:\n|$)/i);
            if (teamMatch) {
                const teamName = teamMatch[1].trim().toLowerCase();
                
                // Map display names back to team IDs
                const displayNameMap = {
                    "men's 1st xv": 'mens-1st',
                    "mens 1st xv": 'mens-1st',
                    "1st xv": 'mens-1st',
                    "men's 2nd xv": 'mens-2nd',
                    "mens 2nd xv": 'mens-2nd',
                    "2nd xv": 'mens-2nd',
                    "colts": 'colts',
                    "u16s": 'u16s',
                    "u15s": 'u15s',
                    "u14s": 'u14s',
                    "u13s": 'u13s',
                    "u12s": 'u12s',
                    "minis": 'minis',
                    "ladies": 'ladies',
                    "phoenix ladies": 'phoenix-ladies'
                };
                
                const teamId = displayNameMap[teamName];
                if (teamId && this.teamTypeMap[teamId]) {
                    console.log(`📋 Detected team from description: ${teamName} → ${teamId}`);
                    return this.teamTypeMap[teamId];
                }
            }
        }
        
        // Method 3: Try to infer from title (fallback)
        if (event.summary) {
            const title = event.summary.toLowerCase();
            if (title.includes('colts')) {
                return this.teamTypeMap['colts'];
            }
            if (title.includes('u14') || title.includes('u13') || title.includes('u15') || title.includes('u16') || title.includes('u12') || title.includes('mini')) {
                return this.teamTypeMap['u14s']; // Returns Junior Fixtures
            }
            if (title.includes('ladies') || title.includes('phoenix')) {
                return this.teamTypeMap['ladies'];
            }
        }
        
        // Default to Senior Fixtures for OLS fixtures without team info
        if (event.summary && (event.summary.includes('OLS') || event.summary.includes('vs') || event.summary.includes('at'))) {
            console.log(`📋 Defaulting to Senior Fixtures for: ${event.summary}`);
            return this.teamTypeMap['mens-1st'];
        }
        
        return null; // Use default type/color
    }

    // ========================================================================
    // DEPRECATED: ADMIN FIXTURES FROM LOCALSTORAGE
    // Fixtures are now synced to Google Calendar via admin system
    // These methods are kept for reference but are no longer used
    // ========================================================================
    /*
    async fetchAdminFixtures() {
        try {
            const fixturesData = localStorage.getItem('olrfc_fixtures');
            if (!fixturesData) {
                console.log('📋 No admin fixtures in localStorage');
                return [];
            }

            const fixtures = JSON.parse(fixturesData);
            
            return fixtures.map(fixture => this.formatFixtureEvent(fixture));
            
        } catch (error) {
            console.error('❌ Error loading admin fixtures:', error);
            return [];
        }
    }

    formatFixtureEvent(fixture) {
        // Determine color based on team - UPDATED COLORS
        let color = '#e53935'; // Default: Senior (bright red)
        let type = 'Senior Fixtures';
        
        if (fixture.team === 'mens-2nd') {
            color = '#e53935';
            type = 'Senior Fixtures';
        } else if (fixture.team === 'colts') {
            color = '#43a047';
            type = 'Colts Fixtures';
        } else if (fixture.team === 'u16s' || fixture.team === 'u14s') {
            color = '#1e88e5';
            type = "Mini's/Junior Fixtures";
        }

        // Create title
        const homeAway = fixture.venue === 'home' ? 'vs' : 'at';
        const title = `OLS ${homeAway} ${fixture.opponent}`;
        
        // Has result?
        const hasResult = fixture.ourScore !== '' && fixture.theirScore !== '';
        const result = hasResult ? `${fixture.ourScore}-${fixture.theirScore}` : '';

        return {
            id: fixture.id,
            source: 'admin',
            title: title,
            description: `${fixture.competition}${result ? ` | Result: ${result}` : ''}`,
            start: fixture.dateTime,
            end: fixture.dateTime, // Same as start for fixtures
            allDay: false,
            location: fixture.venue === 'home' ? 'Fenley Field, Lime Tree Avenue, Rugby, CV22 7QT' : fixture.opponent,
            type: type,
            color: color,
            
            // Fixture-specific data
            fixture: {
                opponent: fixture.opponent,
                venue: fixture.venue,
                competition: fixture.competition,
                ourScore: fixture.ourScore,
                theirScore: fixture.theirScore,
                team: fixture.team
            }
        };
    }

    // ========================================================================
    // MERGE & DEDUPLICATE EVENTS
    // ========================================================================
    mergeEvents(googleEvents, fixtureEvents) {
        // Start with admin fixtures (priority)
        const merged = [...fixtureEvents];
        
        // Add Google events that don't duplicate fixtures
        for (const gEvent of googleEvents) {
            const isDuplicate = fixtureEvents.some(fEvent => 
                this.areEventsSimilar(gEvent, fEvent)
            );
            
            if (!isDuplicate) {
                merged.push(gEvent);
            }
        }
        
        return merged;
    }

    areEventsSimilar(event1, event2) {
        // Check if events are on same day and have similar titles
        const date1 = new Date(event1.start).toDateString();
        const date2 = new Date(event2.start).toDateString();
        
        if (date1 !== date2) return false;
        
        // Check for similar opponent names in title
        const title1 = event1.title.toLowerCase();
        const title2 = event2.title.toLowerCase();
        
        // Extract opponent names for comparison
        const words1 = title1.split(/\s+/);
        const words2 = title2.split(/\s+/);
        
        // If 2+ words match, consider it a duplicate
        const matches = words1.filter(w => words2.includes(w) && w.length > 3);
        
        return matches.length >= 2;
    }
    */

    // ========================================================================
    // GET EVENTS FOR SPECIFIC DATE
    // ========================================================================
    getEventsForDate(allEvents, date) {
        const targetDate = new Date(date).toDateString();
        
        return allEvents.filter(event => {
            const eventDate = new Date(event.start).toDateString();
            return eventDate === targetDate;
        });
    }

    // ========================================================================
    // GET EVENTS BY TYPE (for filtering)
    // ========================================================================
    getEventsByType(allEvents, type) {
        if (type === 'all') return allEvents;
        return allEvents.filter(event => event.type === type);
    }

    // ========================================================================
    // GET EVENTS FOR DATE RANGE
    // ========================================================================
    getEventsInRange(allEvents, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return allEvents.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate >= start && eventDate <= end;
        });
    }
}

// ============================================================================
// EXPORT
// ============================================================================
window.CalendarDataFetcher = CalendarDataFetcher;
console.log('✅ CalendarDataFetcher loaded (Secure Version)');