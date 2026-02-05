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

/**
 * Enhanced login function
 * Use this instead of the basic login function
 */
async function performLogin(email, password) {
    try {
        console.log('🔑 Attempting login for:', email);
        
        // Call backend login
        const response = await window.netlifyDataManager.loginAdminUser(email, password);
        
        if (response.success && response.user) {
            console.log('✅ Login successful');
            console.log('👤 User role:', response.user.role);
            console.log('🔐 User permissions:', response.user.permissions);
            
            // Create session with full user data (INCLUDING permissions)
            const session = createAdminSession(response.user);
            
            // Store full user data in localStorage too (for admin management page)
            const adminUsers = JSON.parse(localStorage.getItem('olrfc_admin_users') || '[]');
            const userIndex = adminUsers.findIndex(u => u.id === response.user.id);
            
            if (userIndex >= 0) {
                // Update existing user data
                adminUsers[userIndex] = { ...adminUsers[userIndex], ...response.user };
                localStorage.setItem('olrfc_admin_users', JSON.stringify(adminUsers));
            }
            
            // Redirect to dashboard
            console.log('↗️ Redirecting to dashboard...');
            window.location.href = '/admin/admin-dashboard.html';
            
            return true;
        } else {
            throw new Error(response.error || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        alert('Login failed: ' + error.message);
        return false;
    }
}

// Example usage in your login form:
/*
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    await performLogin(email, password);
});
*/