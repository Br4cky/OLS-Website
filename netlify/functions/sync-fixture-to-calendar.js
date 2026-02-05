// netlify/functions/sync-fixture-to-calendar.js
// Pushes fixture data to Google Calendar when created/updated/deleted

const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, fixture } = JSON.parse(event.body || '{}');
    
    if (!action || !fixture) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: action and fixture' })
      };
    }

    console.log(`📅 Processing ${action} for fixture: ${fixture.opponent}`);

    // Get Google Calendar credentials from environment
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          hint: 'Set GOOGLE_SERVICE_ACCOUNT_KEY in environment variables'
        })
      };
    }

    // Initialize Google Calendar API client
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(serviceAccountKey),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    // Determine which calendar to use based on team
    const calendarId = getCalendarIdForTeam(fixture.team);
    
    if (!calendarId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unknown team: ${fixture.team}` })
      };
    }

    // Handle different actions
    if (action === 'create' || action === 'update') {
      const event = createGoogleCalendarEvent(fixture);
      
      if (action === 'create') {
        // Create new event
        const result = await calendar.events.insert({
          calendarId: calendarId,
          resource: event,
        });
        
        console.log(`✅ Created event in Google Calendar: ${result.data.id}`);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            eventId: result.data.id,
            action: 'created'
          }),
        };
      } else {
        // Update existing event - first find it by fixtureId
        const googleEventId = await findEventByFixtureId(calendar, calendarId, fixture.id);
        
        if (!googleEventId) {
          // Event doesn't exist, create it instead
          const result = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
          });
          
          console.log(`✅ Created event (update fallback): ${result.data.id}`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              eventId: result.data.id,
              action: 'created_fallback'
            }),
          };
        }
        
        const result = await calendar.events.update({
          calendarId: calendarId,
          eventId: googleEventId,
          resource: event,
        });
        
        console.log(`✅ Updated event in Google Calendar: ${result.data.id}`);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            eventId: result.data.id,
            action: 'updated'
          }),
        };
      }
    } else if (action === 'delete') {
      // Delete event
      const googleEventId = await findEventByFixtureId(calendar, calendarId, fixture.id);
      
      if (!googleEventId) {
        console.log(`⚠️ Event not found for deletion: ${fixture.id}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Event not found (may already be deleted)',
            action: 'deleted'
          }),
        };
      }
      
      await calendar.events.delete({
        calendarId: calendarId,
        eventId: googleEventId,
      });
      
      console.log(`✅ Deleted event from Google Calendar`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          action: 'deleted'
        }),
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unknown action: ${action}` })
      };
    }

  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// Helper function to determine calendar ID based on team
// ALL fixtures go to Senior Fixtures calendar, color-coded by team
function getCalendarIdForTeam(team) {
  // Single calendar for all fixtures
  return '11ae9f30eba7d2aa9da970c0d3036210976d9c8a989189fd64caf3413ed8cf00@group.calendar.google.com';
}

// Helper function to create Google Calendar event from fixture data
function createGoogleCalendarEvent(fixture) {
  // 🎯 OLS 129: Use actual team name instead of hardcoded "OLS"
  const teamName = getTeamDisplayName(fixture.team);
  const homeAway = fixture.venue === 'home' ? 'vs' : 'at';
  const title = `${teamName} ${homeAway} ${fixture.opponent}`;
  
  // Add result to description if available
  const hasResult = fixture.ourScore !== '' && fixture.ourScore !== undefined && 
                    fixture.ourScore !== null && fixture.theirScore !== '' && 
                    fixture.theirScore !== undefined && fixture.theirScore !== null;
  const result = hasResult ? `Result: ${fixture.ourScore}-${fixture.theirScore}` : 'Result: TBC';
  
  const description = `Team: ${getTeamDisplayName(fixture.team)}\n${result}\n${fixture.competition}`;
  
  // Calculate end time (assume 2 hours for a match)
  const startTime = new Date(fixture.dateTime);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 2);
  
  // Determine location
  const location = fixture.venue === 'home' 
    ? 'Fenley Field, Lime Tree Avenue, Rugby, CV22 7QT'
    : fixture.opponent;

  return {
    summary: title,
    description: description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Europe/London',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Europe/London',
    },
    location: location,
    // Store the fixture ID so we can update/delete later
    extendedProperties: {
      private: {
        fixtureId: fixture.id,
        eventType: 'fixture',
        team: fixture.team,
      },
    },
    // Set color based on venue: Green for Home, Red for Away
    colorId: fixture.venue === 'home' ? '10' : '11',
    // 🆕 Add automatic reminders
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },  // 24 hours before
        { method: 'popup', minutes: 60 },        // 1 hour before
        { method: 'popup', minutes: 30 },        // 30 minutes before
      ],
    },
  };
}

// Helper function to find Google Calendar event by fixture ID
async function findEventByFixtureId(calendar, calendarId, fixtureId) {
  try {
    const response = await calendar.events.list({
      calendarId: calendarId,
      privateExtendedProperty: `fixtureId=${fixtureId}`,
      maxResults: 1,
    });
    
    return response.data.items && response.data.items.length > 0 
      ? response.data.items[0].id 
      : null;
  } catch (error) {
    console.error('Error finding event:', error);
    return null;
  }
}

// Helper function to get display name for team
function getTeamDisplayName(team) {
  const teamNames = {
    'mens-1st': "Men's 1st XV",
    'mens-2nd': "Men's 2nd XV",
    'colts': 'Colts',
    'u16s': 'U16s',
    'u14s': 'U14s',
  };
  return teamNames[team] || team;
}

// Helper function to get Google Calendar color ID for team
// NOTE: No longer used - colors now based on Home/Away venue
// Kept for reference in case we want to revert
function getColorIdForTeam(team) {
  const colorMap = {
    'mens-1st': '11',  // Red - Senior teams
    'mens-2nd': '11',  // Red - Senior teams
    'colts': '10',     // Green - Colts
    'u16s': '9',       // Blue - Junior teams
    'u14s': '9',       // Blue - Junior teams
  };
  return colorMap[team] || '11';
}

// Google Calendar Color Reference:
// '10' = Green (used for HOME fixtures)
// '11' = Red (used for AWAY fixtures)
// '9'  = Blue
// '6'  = Orange
// '5'  = Yellow