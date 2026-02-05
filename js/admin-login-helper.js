// OLS 103: Login Session Helper
// Ensures user permissions are properly stored in localStorage session
// Add this to your admin-login.html page

/**
 * Handle successful login - stores complete user data including permissions
 * @param {Object} userData - User data returned from backend login
 */
function createAdminSession(userData) {
    console.log('🔐 Creating admin session with permissions...');
    console.log('User data received:', userData);
    
    // Create complete session object
    const session = {
        userId: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || {}, // CRITICAL: Include permissions
        status: userData.status,
        lastLogin: userData.lastLogin,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('olrfc_admin_session', JSON.stringify(session));
    
    console.log('✅ Session created with permissions:', session.permissions);
    console.log('✅ User has access to sections:', getAccessibleSections(session));
    
    return session;
}

/**
 * Get list of sections user can access (for debugging)
 * @param {Object} session - User session object
 * @returns {Array} Array of accessible section names
 */
function getAccessibleSections(session) {
    if (!session.permissions) return [];
    
    const sections = [];
    const permissionMap = {
        news: 'News',
        fixtures: 'Fixtures',
        gallery: 'Gallery',
        players: 'Players',
        teams: 'Teams',
        shop: 'Shop',
        sponsors: 'Sponsors',
        contacts: 'Contacts',
        events: 'Events & Enquiries',
        'vp-wall': 'VP Wall',
        settings: 'Site Settings',
        users: 'Admin Management'
    };
    
    for (const [key, label] of Object.entries(permissionMap)) {
        if (session.permissions[key] === true) {
            sections.push(label);
        }
    }
    
    return sections;
}

// createAdminSession() and getAccessibleSections() are used by admin-login.html
// The login page's AdminAuth class handles the full login flow directly