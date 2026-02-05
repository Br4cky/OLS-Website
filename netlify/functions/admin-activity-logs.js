// netlify/functions/admin-activity-logs.js
// OLS 104: Admin Activity Log System
// Tracks all admin actions for accountability and security

const { getStore } = require('@netlify/blobs');
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Require auth for write operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        // Configure Blobs store
        const store = getStore({
            name: 'ols-activity-logs',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        const method = event.httpMethod;

        switch (method) {
            case 'GET':
                // Get activity logs (with optional filters)
                return await getActivityLogs(store, event, headers);
            
            case 'POST':
                // Log a new activity
                return await logActivity(store, event, headers);
            
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Activity logs function error:', error);
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

/**
 * Get activity logs with optional filtering
 */
async function getActivityLogs(store, event, headers) {
    try {
        // Parse query parameters for filtering
        const params = new URLSearchParams(event.queryStringParameters);
        const limit = parseInt(params.get('limit')) || 100; // Default to last 100 logs
        const adminEmail = params.get('adminEmail'); // Filter by admin
        const contentType = params.get('contentType'); // Filter by content type (news, fixtures, etc.)
        const actionType = params.get('actionType'); // Filter by action (create, update, delete)
        
        // Fetch all logs from Blobs
        let logs = await store.get('all-activity-logs', { type: 'json' }) || [];
        
        // Apply filters if provided
        if (adminEmail) {
            logs = logs.filter(log => log.adminEmail === adminEmail);
        }
        
        if (contentType) {
            logs = logs.filter(log => log.contentType === contentType);
        }
        
        if (actionType) {
            logs = logs.filter(log => log.actionType === actionType);
        }
        
        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit
        logs = logs.slice(0, limit);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: logs,
                count: logs.length
            })
        };
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch activity logs',
                message: error.message 
            })
        };
    }
}

/**
 * Log a new activity
 */
async function logActivity(store, event, headers) {
    try {
        const body = JSON.parse(event.body || '{}');
        
        // Validate required fields
        if (!body.adminEmail || !body.adminUsername || !body.actionType || !body.contentType) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields: adminEmail, adminUsername, actionType, contentType' 
                })
            };
        }
        
        // Create log entry
        const logEntry = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            adminEmail: body.adminEmail,
            adminUsername: body.adminUsername,
            adminRole: body.adminRole || 'unknown',
            actionType: body.actionType, // 'create', 'update', 'delete'
            contentType: body.contentType, // 'news', 'fixtures', 'players', etc.
            itemId: body.itemId || null,
            itemTitle: body.itemTitle || null,
            description: body.description || generateDescription(body),
            metadata: body.metadata || {} // Optional: store before/after data, etc.
        };
        
        // Fetch existing logs
        const logs = await store.get('all-activity-logs', { type: 'json' }) || [];
        
        // Add new log at the beginning
        logs.unshift(logEntry);
        
        // Keep only last 1000 logs to prevent storage bloat
        const trimmedLogs = logs.slice(0, 1000);
        
        // Save back to Blobs
        await store.set('all-activity-logs', JSON.stringify(trimmedLogs));
        
        console.log(`📝 Activity logged: ${logEntry.adminUsername} ${logEntry.actionType} ${logEntry.contentType}`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Activity logged successfully',
                log: logEntry
            })
        };
    } catch (error) {
        console.error('Error logging activity:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to log activity',
                message: error.message 
            })
        };
    }
}

/**
 * Generate human-readable description from log data
 */
function generateDescription(logData) {
    const { actionType, contentType, itemTitle, adminUsername } = logData;
    
    const actionLabels = {
        'create': 'created',
        'update': 'updated',
        'delete': 'deleted'
    };
    
    const contentLabels = {
        'news': 'news article',
        'fixtures': 'fixture',
        'players': 'player',
        'sponsors': 'sponsor',
        'gallery': 'gallery photo',
        'shop': 'shop item',
        'teams': 'team',
        'contacts': 'contact',
        'admin-users': 'admin user',
        'site-settings': 'site settings'
    };
    
    const action = actionLabels[actionType] || actionType;
    const content = contentLabels[contentType] || contentType;
    const title = itemTitle ? ` "${itemTitle}"` : '';
    
    return `${adminUsername} ${action} ${content}${title}`;
}