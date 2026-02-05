// netlify/functions/site-settings.js
// OLS-Website Site Settings Management Function
// OLS 90 - Netlify Blobs with CommonJS format
// Single object storage (not array) - optimized for site-wide settings

const { getStore } = require('@netlify/blobs');
const { requireAuth, verifyAuthToken } = require('./auth-middleware');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Require auth for write operations
    if (event.httpMethod === 'PUT') {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        const method = event.httpMethod;
        
        switch (method) {
            case 'GET':
                return await getSettings(event, headers);
            case 'PUT':
                return await updateSettings(event, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};

// Keys that should never be exposed to unauthenticated callers
const SENSITIVE_KEYS = [
    'api-sendgrid-key',
    'api-sendgrid-from-email',
    'api-sendgrid-notify-email',
    'api-google-calendar-id',
    'api-google-calendar-key'
];

async function getSettings(event, headers) {
    try {
        const store = getStore({
            name: 'ols-site-settings',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        const settings = await store.get('current-settings', { type: 'json' }) || {};

        // Check if caller is authenticated - if not, strip sensitive keys
        const user = await verifyAuthToken(event.headers || {});
        if (!user) {
            const safeSettings = { ...settings };
            SENSITIVE_KEYS.forEach(key => delete safeSettings[key]);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: safeSettings })
            };
        }

        // Authenticated users get full settings
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data: settings })
        };
    } catch (error) {
        console.error('Error getting settings:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve settings',
                message: error.message
            })
        };
    }
}

async function updateSettings(event, headers) {
    try {
        const updates = JSON.parse(event.body);
        
        if (!updates || typeof updates !== 'object') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid request: updates must be an object'
                })
            };
        }

        const store = getStore({
            name: 'ols-site-settings',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        // Get existing settings
        const existingSettings = await store.get('current-settings', { type: 'json' }) || {};

        // Merge updates with existing settings
        const updatedSettings = {
            ...existingSettings,
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        // Save merged settings
        await store.set('current-settings', JSON.stringify(updatedSettings));

        console.log('Updated settings:', Object.keys(updates));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updatedSettings,
                message: `Successfully updated ${Object.keys(updates).length} setting(s)`,
                updatedKeys: Object.keys(updates)
            })
        };
    } catch (error) {
        console.error('Error updating settings:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update settings',
                message: error.message
            })
        };
    }
}