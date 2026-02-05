// Netlify Function: get-removebg-key
// Returns the remove.bg API key from environment variables
// This keeps the API key secure and not exposed in client-side code

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get API key from environment variable
        const apiKey = process.env.REMOVE_BG_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 404,
                body: JSON.stringify({ 
                    error: 'Remove.bg API key not configured',
                    message: 'Please add REMOVE_BG_API_KEY to your Netlify environment variables'
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
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
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};