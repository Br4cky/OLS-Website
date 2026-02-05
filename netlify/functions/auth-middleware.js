// netlify/functions/auth-middleware.js
// Shared authentication middleware for all Netlify Functions
// Provides HMAC-signed token verification and proper password hashing

const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

// HMAC secret - uses environment variable, falls back to a derived key
// In production, set AUTH_HMAC_SECRET in Netlify environment variables
function getHmacSecret() {
    return process.env.AUTH_HMAC_SECRET ||
        crypto.createHash('sha256')
            .update((process.env.NETLIFY_ACCESS_TOKEN || '') + '-auth-signing-key')
            .digest('hex');
}

// Standard CORS headers for authenticated endpoints
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
}

// Handle CORS preflight
function handlePreflight(headers) {
    return { statusCode: 200, headers, body: '' };
}

// Return 401 response
function unauthorizedResponse(headers, message = 'Authentication required') {
    return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message })
    };
}

/**
 * Create an HMAC-signed auth token
 * Called server-side during login to generate the token
 */
function createAuthToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        timestamp: Date.now()
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto
        .createHmac('sha256', getHmacSecret())
        .update(payloadStr)
        .digest('hex');

    // Token format: base64(payload).signature
    const token = Buffer.from(payloadStr).toString('base64') + '.' + signature;
    return token;
}

/**
 * Verify an HMAC-signed auth token
 * Returns the user object if valid, null otherwise
 *
 * @param {Object} headers - Request headers (must contain Authorization: Bearer <token>)
 * @param {Object} options - Options
 * @param {boolean} options.requireSuperAdmin - If true, only super-admins pass (default: false)
 * @returns {Promise<Object|null>} User object if valid, null otherwise
 */
async function verifyAuthToken(headers, options = {}) {
    try {
        const authHeader = headers.authorization || headers.Authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.replace('Bearer ', '');

        // Try new HMAC format first (payload.signature)
        let sessionData;
        if (token.includes('.')) {
            const [payloadB64, signature] = token.split('.');
            const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');

            // Verify HMAC signature
            const expectedSignature = crypto
                .createHmac('sha256', getHmacSecret())
                .update(payloadStr)
                .digest('hex');

            if (!crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            )) {
                console.log('❌ Auth: Invalid token signature');
                return null;
            }

            sessionData = JSON.parse(payloadStr);
        } else {
            // Backwards compatibility: accept old base64-only tokens during migration
            // These will stop working once all clients update
            try {
                const decoded = Buffer.from(token, 'base64').toString('utf8');
                sessionData = JSON.parse(decoded);
                console.log('⚠️ Auth: Legacy unsigned token used - will be deprecated');
            } catch {
                return null;
            }
        }

        // Verify token has required fields
        if (!sessionData.userId || !sessionData.email || !sessionData.role) {
            return null;
        }

        // Check token age (24 hours max)
        const tokenAge = Date.now() - sessionData.timestamp;
        if (tokenAge > 24 * 60 * 60 * 1000) {
            console.log('❌ Auth: Token expired');
            return null;
        }

        // Verify user exists and is active in the database
        const store = getStore({
            name: 'ols-admin-users',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        const users = await store.get('all-admin-users', { type: 'json' }) || [];
        const user = users.find(u => u.id === sessionData.userId && u.email === sessionData.email);

        if (!user || user.status !== 'active') {
            return null;
        }

        // Check super-admin requirement
        if (options.requireSuperAdmin && user.role !== 'super-admin') {
            console.log('❌ Auth: Super-admin required');
            return null;
        }

        // Return safe user (no password)
        const { password, ...safeUser } = user;
        return safeUser;

    } catch (error) {
        console.error('Auth verification error:', error);
        return null;
    }
}

/**
 * Hash a password using PBKDF2 with a unique salt per password
 * Much stronger than SHA-256 with static salt
 */
function hashPasswordSecure(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * Supports both new PBKDF2 and legacy SHA-256 formats
 */
function verifyPassword(password, storedHash) {
    if (storedHash.startsWith('pbkdf2:')) {
        // New PBKDF2 format
        const [, salt, hash] = storedHash.split(':');
        const inputHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
    }

    if (storedHash.startsWith('hashed:')) {
        // Legacy SHA-256 format - still verify but flag for upgrade
        const legacyHash = 'hashed:' + crypto
            .createHash('sha256')
            .update(password + 'olrfc-salt-2025')
            .digest('hex');
        return storedHash === legacyHash;
    }

    return false;
}

/**
 * Check if a password hash needs upgrading to PBKDF2
 */
function needsPasswordUpgrade(storedHash) {
    return storedHash && storedHash.startsWith('hashed:');
}

/**
 * Middleware wrapper: require auth for write operations
 * Use this to protect POST/PUT/DELETE handlers
 *
 * @param {Object} event - Netlify event
 * @param {Object} corsHeaders - CORS headers to include
 * @param {Object} options - Auth options (requireSuperAdmin, etc.)
 * @returns {Object|null} Error response if auth fails, null if auth succeeds
 */
async function requireAuth(event, corsHeaders, options = {}) {
    const user = await verifyAuthToken(event.headers, options);
    if (!user) {
        return unauthorizedResponse(corsHeaders);
    }
    // Attach user to event for downstream use
    event.authenticatedUser = user;
    return null; // Auth passed
}

module.exports = {
    createAuthToken,
    verifyAuthToken,
    hashPasswordSecure,
    verifyPassword,
    needsPasswordUpgrade,
    requireAuth,
    getCorsHeaders,
    handlePreflight,
    unauthorizedResponse
};
