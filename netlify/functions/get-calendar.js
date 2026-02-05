// netlify/functions/get-calendar.js
// Secure proxy for Google Calendar API calls

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { calendarId, timeMin, timeMax, maxResults = 50 } = JSON.parse(event.body || '{}');
    
    if (!calendarId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'calendarId is required' })
      };
    }

    // Get API key from environment variable (set in Netlify dashboard)
    const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ GOOGLE_CALENDAR_API_KEY not set in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          hint: 'Set GOOGLE_CALENDAR_API_KEY in Netlify environment variables'
        })
      };
    }

    // Build Google Calendar API URL
    const params = new URLSearchParams({
      key: API_KEY,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: maxResults,
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

    console.log(`📅 Fetching calendar: ${calendarId}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Calendar API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Google Calendar API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    
    console.log(`✅ Retrieved ${data.items?.length || 0} events from ${calendarId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        calendarId,
        events: data.items || [],
        count: data.items?.length || 0
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
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