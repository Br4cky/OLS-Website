// netlify/functions/deduplicate-calendar.js
// Scans Google Calendar for duplicate fixture events and optionally deletes them.
// Used as a one-off admin tool when fixtures are re-added and create duplicate calendar entries.

const { google } = require('googleapis');
const { requireAuth } = require('./auth-middleware');

const CALENDAR_ID = '11ae9f30eba7d2aa9da970c0d3036210976d9c8a989189fd64caf3413ed8cf00@group.calendar.google.com';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Require authentication
    const authError = await requireAuth(event, headers);
    if (authError) return authError;

    try {
        const { action, fixtureIds, eventIds } = JSON.parse(event.body || '{}');

        if (!action) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing action field' }) };
        }

        // Initialise Google Calendar API with service account
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured' })
            };
        }

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(serviceAccountKey),
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // ===========================
        // ACTION: SCAN for duplicates
        // ===========================
        if (action === 'scan') {
            console.log('🔍 Scanning Google Calendar for duplicate events...');

            // Fetch ALL events from the calendar (paginated)
            const allEvents = [];
            let pageToken = null;

            // Time range: 1 year ago → 2 years ahead
            const timeMin = new Date();
            timeMin.setFullYear(timeMin.getFullYear() - 1);
            const timeMax = new Date();
            timeMax.setFullYear(timeMax.getFullYear() + 2);

            do {
                const params = {
                    calendarId: CALENDAR_ID,
                    maxResults: 250,
                    singleEvents: true,
                    orderBy: 'startTime',
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                };
                if (pageToken) params.pageToken = pageToken;

                const response = await calendar.events.list(params);
                const items = response.data.items || [];
                allEvents.push(...items);
                pageToken = response.data.nextPageToken || null;

                console.log(`📄 Fetched page: ${items.length} events (total so far: ${allEvents.length})`);
            } while (pageToken);

            console.log(`📊 Total calendar events: ${allEvents.length}`);

            // Build a set of current website fixture IDs for matching
            const currentFixtureIds = new Set(fixtureIds || []);

            // Group events by normalised key: title + date
            const groups = {};
            allEvents.forEach(evt => {
                const summary = (evt.summary || '').toLowerCase().trim();
                const startDate = evt.start?.dateTime
                    ? evt.start.dateTime.split('T')[0]
                    : (evt.start?.date || 'unknown');
                const key = `${summary}|${startDate}`;

                if (!groups[key]) groups[key] = [];
                groups[key].push({
                    googleEventId: evt.id,
                    summary: evt.summary || '(no title)',
                    date: startDate,
                    startTime: evt.start?.dateTime || evt.start?.date || '',
                    fixtureId: evt.extendedProperties?.private?.fixtureId || null,
                    team: evt.extendedProperties?.private?.team || null,
                    created: evt.created || '',
                });
            });

            // Find groups with duplicates
            const duplicates = [];
            let keepCount = 0;

            Object.values(groups).forEach(group => {
                if (group.length <= 1) {
                    keepCount++;
                    return;
                }

                // Multiple events with same title + date = duplicates
                // Decide which one to keep:
                // Priority 1: event whose fixtureId matches a current website fixture
                // Priority 2: most recently created event
                let keepIndex = -1;

                // Try to find one matching a current fixture
                for (let i = 0; i < group.length; i++) {
                    if (group[i].fixtureId && currentFixtureIds.has(group[i].fixtureId)) {
                        keepIndex = i;
                        break;
                    }
                }

                // Fallback: keep the most recently created
                if (keepIndex === -1) {
                    let latestDate = '';
                    group.forEach((evt, i) => {
                        if (evt.created > latestDate) {
                            latestDate = evt.created;
                            keepIndex = i;
                        }
                    });
                }

                // If still no keeper found, keep the first one
                if (keepIndex === -1) keepIndex = 0;

                keepCount++;

                // All others are duplicates
                group.forEach((evt, i) => {
                    if (i !== keepIndex) {
                        duplicates.push({
                            ...evt,
                            keepEventId: group[keepIndex].googleEventId,
                            keepFixtureId: group[keepIndex].fixtureId,
                        });
                    }
                });
            });

            console.log(`✅ Scan complete: ${duplicates.length} duplicates found, ${keepCount} unique events`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    action: 'scan',
                    totalEvents: allEvents.length,
                    uniqueGroups: Object.keys(groups).length,
                    keepCount,
                    duplicateCount: duplicates.length,
                    duplicates,
                })
            };
        }

        // ==============================
        // ACTION: DELETE duplicate events
        // ==============================
        if (action === 'delete') {
            if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'No event IDs provided for deletion' })
                };
            }

            console.log(`🗑️ Deleting ${eventIds.length} duplicate calendar events...`);

            let deleted = 0;
            const failed = [];

            for (const eventId of eventIds) {
                try {
                    await calendar.events.delete({
                        calendarId: CALENDAR_ID,
                        eventId: eventId,
                    });
                    deleted++;
                    console.log(`✅ Deleted event: ${eventId}`);
                } catch (error) {
                    console.error(`❌ Failed to delete event ${eventId}:`, error.message);
                    failed.push({ eventId, error: error.message });
                }
            }

            console.log(`🗑️ Deletion complete: ${deleted} deleted, ${failed.length} failed`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    action: 'delete',
                    deleted,
                    failed,
                    message: `Deleted ${deleted} duplicate events${failed.length > 0 ? `, ${failed.length} failed` : ''}`
                })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Unknown action: ${action}. Use 'scan' or 'delete'.` })
        };

    } catch (error) {
        console.error('❌ Deduplication error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
