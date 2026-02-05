// netlify/functions/admin-users.js
// OLS-Website Admin Users Management Function
// Handles authentication and CRUD operations for admin users using Netlify Blobs

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

exports.handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Configure Blobs store matching existing pattern
        const store = getStore({
            name: 'ols-admin-users',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const method = event.httpMethod;

        switch (method) {
            case 'GET':
                return await getAdminUsers(store, headers);
            
            case 'POST':
                // POST can be used for login OR creating/updating all users OR resetting password
                const body = JSON.parse(event.body || '{}');
                
                // Check if this is a login request
                if (body.action === 'login') {
                    return await loginAdmin(store, body, headers);
                }
                
                // Check if this is a password reset request (OLS 99)
                if (body.action === 'resetPassword') {
                    return await resetUserPassword(store, body, event.headers, headers);
                }
                
                // Otherwise, save all admin users (full array replacement - like fixtures/news/etc)
                return await saveAllAdminUsers(store, body, event.headers, headers);
            
            case 'DELETE':
                return await deleteAdminUser(store, event, headers);
            
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Admin users function error:', error);
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

// Get all admin users from Blobs
async function getAdminUsers(store, headers) {
    try {
        const users = await store.get('all-admin-users', { type: 'json' });
        
        // Never send passwords to frontend - strip them out
        const safeUsers = (users || []).map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: safeUsers,
                count: safeUsers.length
            })
        };
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch admin users',
                message: error.message 
            })
        };
    }
}

// Save all admin users (full array replacement - matches fixtures/news pattern)
// 🔒 OLS 98: REQUIRES SUPER-ADMIN AUTHENTICATION
async function saveAllAdminUsers(store, body, requestHeaders, responseHeaders) {
    try {
        // ✅ VERIFY AUTHENTICATION - Only super-admins can modify users
        const authenticatedUser = await verifySessionToken(store, requestHeaders);
        
        if (!authenticatedUser) {
            return {
                statusCode: 401,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Unauthorized',
                    message: 'Super-admin authentication required to modify admin users'
                })
            };
        }
        
        const incomingUsers = body.users || body;
        
        if (!Array.isArray(incomingUsers)) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ error: 'Users must be an array' })
            };
        }

        // 🛡️ CRITICAL FIX (OLS 98): Preserve existing passwords when not provided
        // Fetch existing users from Blobs (with passwords intact)
        const existingUsers = await store.get('all-admin-users', { type: 'json' }) || [];
        
        // Create a map of existing users by ID for quick lookup
        const existingUsersMap = {};
        existingUsers.forEach(user => {
            existingUsersMap[user.id] = user;
        });

        // Process incoming users and preserve passwords if not provided
        const processedUsers = incomingUsers.map(user => {
            // If user doesn't have a password, try to preserve from existing data
            if (!user.password && existingUsersMap[user.id]) {
                user.password = existingUsersMap[user.id].password;
            }
            
            // If password exists and doesn't start with 'hashed:', hash it
            if (user.password && !user.password.startsWith('hashed:')) {
                user.password = hashPassword(user.password);
            }
            
            return user;
        });

        await store.set('all-admin-users', JSON.stringify(processedUsers));

        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
                success: true,
                message: 'Admin users saved successfully',
                count: processedUsers.length
            })
        };
    } catch (error) {
        console.error('Error saving admin users:', error);
        return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ 
                error: 'Failed to save admin users',
                message: error.message 
            })
        };
    }
}

// Delete admin user by ID (fetch → filter → save pattern)
// 🔒 OLS 98: REQUIRES SUPER-ADMIN AUTHENTICATION
async function deleteAdminUser(store, event, responseHeaders) {
    try {
        // ✅ VERIFY AUTHENTICATION - Only super-admins can delete users
        const authenticatedUser = await verifySessionToken(store, event.headers);
        
        if (!authenticatedUser) {
            return {
                statusCode: 401,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Unauthorized',
                    message: 'Super-admin authentication required to delete admin users'
                })
            };
        }
        
        const params = new URLSearchParams(event.queryStringParameters);
        const userId = params.get('id');

        if (!userId) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }

        // Fetch current users
        const users = await store.get('all-admin-users', { type: 'json' }) || [];
        
        // Filter out the user to delete
        const updatedUsers = users.filter(user => user.id !== userId);

        // Check if user was found
        if (updatedUsers.length === users.length) {
            return {
                statusCode: 404,
                headers: responseHeaders,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        // Prevent deleting the last super-admin
        const remainingSuperAdmins = updatedUsers.filter(u => u.role === 'super-admin');
        if (remainingSuperAdmins.length === 0) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Cannot delete the last super-admin account' 
                })
            };
        }

        // Save updated array
        await store.set('all-admin-users', JSON.stringify(updatedUsers));

        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
                success: true,
                message: 'Admin user deleted successfully'
            })
        };
    } catch (error) {
        console.error('Error deleting admin user:', error);
        return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ 
                error: 'Failed to delete admin user',
                message: error.message 
            })
        };
    }
}

// Login admin user
// 🔒 OLS 98: Rate limiting to prevent brute force attacks
async function loginAdmin(store, body, headers) {
    try {
        const { email, password } = body;

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email and password are required' })
            };
        }

        // 🛡️ CHECK RATE LIMIT
        const rateLimitCheck = await isRateLimited(store, email);
        if (rateLimitCheck && rateLimitCheck.limited) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ 
                    error: 'Too many failed login attempts',
                    message: `Account temporarily locked. Please try again in ${rateLimitCheck.minutesLeft} minute(s).`,
                    lockedMinutes: rateLimitCheck.minutesLeft
                })
            };
        }

        // Fetch all users
        const users = await store.get('all-admin-users', { type: 'json' }) || [];
        
        // Find user by email
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            await recordFailedAttempt(store, email);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        // Check if account is disabled
        if (user.status === 'disabled') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Account is disabled' })
            };
        }

        // Verify password
        const hashedInput = hashPassword(password);
        if (user.password !== hashedInput) {
            await recordFailedAttempt(store, email);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        // ✅ SUCCESS - Clear rate limit
        await clearRateLimit(store, email);

        // Update last login time
        user.lastLogin = new Date().toISOString();
        await store.set('all-admin-users', JSON.stringify(users));

        // Clean up old rate limits periodically (10% chance)
        if (Math.random() < 0.1) {
            cleanupRateLimits(store).catch(err => console.error('Cleanup error:', err));
        }

        // Return user data (without password)
        const { password: _, ...safeUser } = user;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: safeUser,
                message: 'Login successful'
            })
        };
    } catch (error) {
        console.error('Error logging in admin:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Login failed',
                message: error.message 
            })
        };
    }
}

// Hash password using SHA-256 (simple but effective for client-side auth)
function hashPassword(password) {
    return 'hashed:' + crypto
        .createHash('sha256')
        .update(password + 'olrfc-salt-2025') // Add salt for extra security
        .digest('hex');
}

/**
 * Verify session token and check if user is super-admin (OLS 98)
 * @param {Object} store - Netlify Blobs store
 * @param {Object} headers - Request headers
 * @returns {Promise<Object|null>} User object if valid super-admin, null otherwise
 */
async function verifySessionToken(store, headers) {
    try {
        // Get authorization header (case-insensitive)
        const authHeader = headers.authorization || headers.Authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No authorization header found');
            return null;
        }
        
        // Extract and decode token
        const token = authHeader.replace('Bearer ', '');
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const sessionData = JSON.parse(decoded);
        
        // Verify token has required fields
        if (!sessionData.userId || !sessionData.email || !sessionData.role) {
            console.log('❌ Invalid session data structure');
            return null;
        }
        
        // Check if token is too old (24 hours)
        const tokenAge = Date.now() - sessionData.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
        
        if (tokenAge > maxAge) {
            console.log('❌ Session token expired');
            return null;
        }
        
        // Fetch all users and verify user exists
        const users = await store.get('all-admin-users', { type: 'json' }) || [];
        const user = users.find(u => u.id === sessionData.userId && u.email === sessionData.email);
        
        if (!user) {
            console.log('❌ User not found in database');
            return null;
        }
        
        // Check if user is active
        if (user.status !== 'active') {
            console.log('❌ User account is not active');
            return null;
        }
        
        // Verify user is super-admin
        if (user.role !== 'super-admin') {
            console.log('❌ User is not a super-admin');
            return null;
        }
        
        console.log('✅ Session verified: super-admin', user.email);
        return user;
        
    } catch (error) {
        console.error('Error verifying session token:', error);
        return null;
    }
}

/**
 * Rate Limiting for Login Attempts (OLS 98)
 * Prevents brute force attacks by limiting failed login attempts
 */

// Check if email is rate limited
async function isRateLimited(store, email) {
    try {
        const rateLimitData = await store.get('rate-limits', { type: 'json' }) || {};
        const emailKey = email.toLowerCase();
        const record = rateLimitData[emailKey];
        
        if (!record) return false;
        
        // Check if locked
        if (record.lockedUntil && Date.now() < record.lockedUntil) {
            const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
            console.log(`🚫 Rate limit active for ${email}: ${minutesLeft} minutes remaining`);
            return {
                limited: true,
                minutesLeft: minutesLeft,
                attempts: record.failedAttempts
            };
        }
        
        return false;
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return false;
    }
}

// Record failed login attempt
async function recordFailedAttempt(store, email) {
    try {
        const rateLimitData = await store.get('rate-limits', { type: 'json' }) || {};
        const emailKey = email.toLowerCase();
        const now = Date.now();
        
        if (!rateLimitData[emailKey]) {
            rateLimitData[emailKey] = {
                failedAttempts: 1,
                firstAttempt: now,
                lastAttempt: now
            };
        } else {
            rateLimitData[emailKey].failedAttempts += 1;
            rateLimitData[emailKey].lastAttempt = now;
        }
        
        const record = rateLimitData[emailKey];
        
        // After 5 failed attempts, lock for 15 minutes
        if (record.failedAttempts >= 5) {
            record.lockedUntil = now + (15 * 60 * 1000); // 15 minutes
            console.log(`🔒 Account locked for ${email}: 15 minutes`);
        }
        
        await store.set('rate-limits', JSON.stringify(rateLimitData));
        
        console.log(`⚠️ Failed attempt #${record.failedAttempts} for ${email}`);
        
    } catch (error) {
        console.error('Error recording failed attempt:', error);
    }
}

// Clear rate limit on successful login
async function clearRateLimit(store, email) {
    try {
        const rateLimitData = await store.get('rate-limits', { type: 'json' }) || {};
        const emailKey = email.toLowerCase();
        
        if (rateLimitData[emailKey]) {
            delete rateLimitData[emailKey];
            await store.set('rate-limits', JSON.stringify(rateLimitData));
            console.log(`✅ Rate limit cleared for ${email}`);
        }
    } catch (error) {
        console.error('Error clearing rate limit:', error);
    }
}

// Clean up old rate limit records (run periodically)
async function cleanupRateLimits(store) {
    try {
        const rateLimitData = await store.get('rate-limits', { type: 'json' }) || {};
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        let cleaned = 0;
        
        for (const email in rateLimitData) {
            const record = rateLimitData[email];
            
            // Remove records older than 24 hours with no active lock
            if (record.lastAttempt < oneDayAgo && (!record.lockedUntil || record.lockedUntil < now)) {
                delete rateLimitData[email];
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            await store.set('rate-limits', JSON.stringify(rateLimitData));
            console.log(`🧹 Cleaned up ${cleaned} old rate limit records`);
        }
    } catch (error) {
        console.error('Error cleaning rate limits:', error);
    }
}

/**
 * Reset user password (OLS 99)
 * Super-admin only feature
 * @param {Object} store - Netlify Blobs store
 * @param {Object} body - Request body with userId and newPassword
 * @param {Object} requestHeaders - Request headers (for authentication)
 * @param {Object} responseHeaders - Response headers (for CORS)
 * @returns {Promise<Object>} Response
 */
async function resetUserPassword(store, body, requestHeaders, responseHeaders) {
    try {
        // ✅ VERIFY AUTHENTICATION - Only super-admins can reset passwords
        const authenticatedUser = await verifySessionToken(store, requestHeaders);
        
        if (!authenticatedUser) {
            return {
                statusCode: 401,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Unauthorized',
                    message: 'Super-admin authentication required to reset passwords'
                })
            };
        }
        
        const { userId, newPassword } = body;
        
        // Validate inputs
        if (!userId) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ error: 'User ID is required' })
            };
        }
        
        if (!newPassword || newPassword.length < 8) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ error: 'New password must be at least 8 characters' })
            };
        }
        
        // Fetch all users
        const users = await store.get('all-admin-users', { type: 'json' }) || [];
        
        // Find the user
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return {
                statusCode: 404,
                headers: responseHeaders,
                body: JSON.stringify({ error: 'User not found' })
            };
        }
        
        // Prevent super-admin from resetting their own password (use profile instead)
        if (userId === authenticatedUser.id) {
            return {
                statusCode: 400,
                headers: responseHeaders,
                body: JSON.stringify({ 
                    error: 'Cannot reset your own password. Use your profile settings instead.'
                })
            };
        }
        
        // Hash the new password
        const hashedPassword = hashPassword(newPassword);
        
        // Update the user's password
        users[userIndex].password = hashedPassword;
        users[userIndex].passwordResetAt = new Date().toISOString();
        users[userIndex].passwordResetBy = authenticatedUser.email;
        
        // Save updated users array
        await store.set('all-admin-users', JSON.stringify(users));
        
        console.log(`🔒 Password reset for user ${users[userIndex].email} by ${authenticatedUser.email}`);
        
        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify({
                success: true,
                message: `Password successfully reset for ${users[userIndex].username}`,
                user: {
                    id: users[userIndex].id,
                    email: users[userIndex].email,
                    username: users[userIndex].username
                }
            })
        };
        
    } catch (error) {
        console.error('Error resetting password:', error);
        return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify({ 
                error: 'Failed to reset password',
                message: error.message 
            })
        };
    }
}