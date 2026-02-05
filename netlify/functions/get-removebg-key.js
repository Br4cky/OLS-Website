// Netlify Function: get-removebg-key
// Returns the remove.bg API key from environment variables
// This keeps the API key secure and not exposed in client-side code

const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only allow GET and POST requests
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Require auth for all methods
    const authError = await requireAuth(event, headers);
    if (authError) return authError;

    try {
        // Get API key from environment variable
        const apiKey = process.env.REMOVE_BG_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Remove.bg API key not configured',
                    message: 'Please add REMOVE_BG_API_KEY to your Netlify environment variables'
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
            },
            body: JSON.stringify({
                apiKey: apiKey,
                available: true
            })
        };

    } catch (error) {
        console.error('Error in get-removebg-key:', error);
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