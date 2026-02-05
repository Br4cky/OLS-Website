// OLS 103 Enhanced: Admin Dashboard Role-Based Access Control with Custom Permissions
// Manages permissions using BOTH role presets AND individual permission checkboxes

class AdminPermissions {
    constructor() {
        this.currentUser = null;
        
        // Map permission keys to section IDs
        this.permissionToSectionMap = {
            'news': 'news',
            'fixtures': 'fixtures',
            'players': 'players',
            'sponsors': 'sponsors',
            'gallery': 'gallery',
            'shop': 'shop',
            'teams': 'teams',
            'settings': 'site-customization',
            'users': 'admin-management'
        };
        
        // Default permission templates by role (used as fallback if user has no custom permissions)
        this.defaultPermissionsByRole = {
            'super-admin': {
                news: true,
                fixtures: true,
                players: true,
                sponsors: true,
                gallery: true,
                shop: true,
                teams: true,
                settings: true,
                users: true,
                contacts: true
            },
            'admin': {
                news: true,
                fixtures: true,
                players: true,
                sponsors: true,
                gallery: true,
                shop: true,
                teams: true,
                settings: true,
                users: false, // Admins cannot manage users
                contacts: true
            },
            'editor': {
                news: true,
                fixtures: true,
                players: false,
                sponsors: false,
                gallery: true,
                shop: false,
                teams: false,
                settings: false,
                users: false,
                contacts: false
            }
        };
    }

    /**
     * Initialize permissions system
     * - Loads current user from session (including custom permissions)
     * - Applies UI restrictions
     * - Shows user info banner
     */
    init() {
        console.log('🔒 Initializing Enhanced Admin Permissions System...');
        
        // Load current user from session
        this.loadCurrentUser();
        
        if (!this.currentUser) {
            console.error('❌ No authenticated user found');
            this.redirectToLogin();
            return;
        }
        
        console.log(`✅ User authenticated: ${this.currentUser.email} (${this.currentUser.role})`);
        console.log('📋 User permissions:', this.currentUser.permissions);
        
        // Apply UI restrictions based on role AND custom permissions
        this.applyUIRestrictions();
        
        // Show user info banner
        this.showUserInfoBanner();
        
        console.log('✅ Enhanced permission system initialized');
    }

    /**
     * Load current user from localStorage session
     * Includes both role and custom permission flags
     */
    loadCurrentUser() {
        try {
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            
            if (session.userId && session.email && session.role) {
                this.currentUser = {
                    userId: session.userId,
                    email: session.email,
                    username: session.username || session.email.split('@')[0],
                    role: session.role,
                    permissions: session.permissions || this.getDefaultPermissions(session.role)
                };
            } else {
                this.currentUser = null;
            }
        } catch (error) {
            console.error('Error loading user session:', error);
            this.currentUser = null;
        }
    }

    /**
     * Get default permissions for a role
     * @param {string} role - User role
     * @returns {Object} Default permissions object
     */
    getDefaultPermissions(role) {
        return this.defaultPermissionsByRole[role] || {};
    }

    /**
     * Check if user has a specific permission
     * PRIORITY: Custom permissions > Role defaults > Deny
     * @param {string} permissionKey - Permission key (e.g., 'news', 'fixtures', 'users')
     * @returns {boolean}
     */
    hasPermission(permissionKey) {
        if (!this.currentUser) return false;
        
        // 1. Check if user has custom permissions object
        if (this.currentUser.permissions && typeof this.currentUser.permissions === 'object') {
            // If permission explicitly set (true or false), use that
            if (permissionKey in this.currentUser.permissions) {
                const hasIt = this.currentUser.permissions[permissionKey] === true;
                console.log(`🔍 Permission check: ${permissionKey} = ${hasIt} (from user custom permissions)`);
                return hasIt;
            }
        }
        
        // 2. Fall back to role defaults
        const roleDefaults = this.defaultPermissionsByRole[this.currentUser.role];
        if (roleDefaults && permissionKey in roleDefaults) {
            const hasIt = roleDefaults[permissionKey] === true;
            console.log(`🔍 Permission check: ${permissionKey} = ${hasIt} (from role default)`);
            return hasIt;
        }
        
        // 3. Default to false if not found anywhere
        console.log(`🔍 Permission check: ${permissionKey} = false (not found, defaulting to deny)`);
        return false;
    }

    /**
     * Check if current user has access to a specific section
     * Uses the permissionToSectionMap to convert section IDs to permission keys
     * @param {string} sectionId - The section to check access for
     * @returns {boolean}
     */
    canAccessSection(sectionId) {
        if (!this.currentUser) return false;
        
        // Dashboard is always accessible
        if (sectionId === 'dashboard') return true;
        
        // OLS 104: Activity log is super-admin only
        if (sectionId === 'activity-log') {
            return this.currentUser.role === 'super-admin';
        }
        
        // Map section ID to permission key
        // Look for a permission key that maps to this section
        for (const [permKey, mappedSection] of Object.entries(this.permissionToSectionMap)) {
            if (mappedSection === sectionId) {
                return this.hasPermission(permKey);
            }
        }
        
        // Special case: contacts section (add to map if needed)
        if (sectionId === 'contacts') {
            return this.hasPermission('contacts');
        }
        
        // If no mapping found, check role defaults as fallback
        // This handles any sections not explicitly mapped
        if (this.currentUser.role === 'super-admin') {
            return true;
        } else if (this.currentUser.role === 'admin') {
            return sectionId !== 'admin-management';
        } else if (this.currentUser.role === 'editor') {
            return ['news', 'fixtures', 'gallery'].includes(sectionId);
        }
        
        return false;
    }

    /**
     * Check if current user can perform an action
     * @param {string} action - 'create', 'edit', 'delete'
     * @returns {boolean}
     */
    canPerformAction(action) {
        if (!this.currentUser) return false;
        
        switch(action) {
            case 'create':
                return true; // All logged-in users can create within their sections
            case 'edit':
                return true; // All logged-in users can edit within their sections
            case 'delete':
                // Only super-admin and admin can delete
                return this.currentUser.role === 'super-admin' || this.currentUser.role === 'admin';
            case 'manageUsers':
                // Check 'users' permission specifically
                return this.hasPermission('users');
            case 'manageSiteSettings':
                // Check 'settings' permission specifically
                return this.hasPermission('settings');
            default:
                return false;
        }
    }

    /**
     * Apply UI restrictions based on user role AND custom permissions
     * - Hide unauthorized dashboard cards
     * - Hide unauthorized sections
     * - Disable delete buttons for editors
     */
    applyUIRestrictions() {
        console.log('🎨 Applying UI restrictions based on custom permissions...');
        
        // Map dashboard cards to section IDs
        const dashboardCardMapping = {
            'news': 'news',
            'fixtures': 'fixtures',
            'gallery': 'gallery',
            'players': 'players',
            'teams': 'teams',
            'shop': 'shop',
            'sponsors': 'sponsors',
            'contacts': 'contacts',
            'admin-management': 'admin-management',
            'site-customization': 'site-customization'
        };

        // Hide unauthorized dashboard cards
        document.querySelectorAll('.dashboard-card').forEach(card => {
            const onclickAttr = card.getAttribute('onclick');
            if (onclickAttr) {
                // Extract section name from onclick="showSection('xxx')"
                const match = onclickAttr.match(/showSection\('([^']+)'\)/);
                if (match) {
                    const sectionId = match[1];
                    
                    if (!this.canAccessSection(sectionId)) {
                        card.style.display = 'none';
                        console.log(`🚫 Hidden card: ${sectionId}`);
                    } else {
                        console.log(`✅ Showing card: ${sectionId}`);
                    }
                }
            }
        });

        // Hide unauthorized sections
        document.querySelectorAll('.admin-section').forEach(section => {
            const sectionId = section.id;
            
            if (sectionId && sectionId !== 'dashboard' && !this.canAccessSection(sectionId)) {
                section.style.display = 'none';
                console.log(`🚫 Hidden section: ${sectionId}`);
            }
        });

        // If user cannot delete, hide all delete buttons
        if (!this.canPerformAction('delete')) {
            document.querySelectorAll('.btn-danger, button[onclick*="delete"]').forEach(btn => {
                // Don't hide if it's in admin-management (different type of delete)
                if (!btn.closest('#admin-management')) {
                    btn.style.display = 'none';
                }
            });
            console.log('🚫 Hidden delete buttons for non-admin role');
        }

        // Hide quick action buttons for unauthorized sections
        const quickActionsContainer = document.querySelector('.dashboard-section .section-header + div');
        if (quickActionsContainer) {
            quickActionsContainer.querySelectorAll('button').forEach(btn => {
                const btnText = btn.textContent.toLowerCase();
                
                // Hide buttons based on permissions
                if (btnText.includes('product') && !this.hasPermission('shop')) {
                    btn.style.display = 'none';
                }
                if (btnText.includes('sponsor') && !this.hasPermission('sponsors')) {
                    btn.style.display = 'none';
                }
                if (btnText.includes('player') && !this.hasPermission('players')) {
                    btn.style.display = 'none';
                }
                if (btnText.includes('contact') && !this.hasPermission('contacts')) {
                    btn.style.display = 'none';
                }
            });
        }

        // Hide site customization link in nav if no access
        if (!this.hasPermission('settings')) {
            document.querySelectorAll('.admin-nav a').forEach(link => {
                if (link.textContent.includes('Customize') || link.href?.includes('site-customization')) {
                    link.style.display = 'none';
                }
            });
        }
    }

    /**
     * Show user info banner at top of admin dashboard
     */
    showUserInfoBanner() {
        const header = document.querySelector('.admin-header-content');
        if (!header) return;

        // Create user info banner
        const banner = document.createElement('div');
        banner.id = 'admin-user-info';
        banner.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            font-size: 0.9rem;
        `;

        const roleColor = {
            'super-admin': '#ffd700',
            'admin': '#90ee90',
            'editor': '#87ceeb'
        }[this.currentUser.role] || '#fff';

        banner.innerHTML = `
            <span style="font-weight: 500;">${this.currentUser.username}</span>
            <span style="background: ${roleColor}; color: #333; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem; font-weight: bold;">
                ${this.currentUser.role.toUpperCase()}
            </span>
        `;

        // Insert before logout button
        const logoutLink = header.querySelector('.logout');
        if (logoutLink && logoutLink.parentElement) {
            logoutLink.parentElement.insertBefore(banner, logoutLink);
        }
    }

    /**
     * Verify permission before performing an action
     * Shows alert if unauthorized
     * @param {string} action - Action to verify
     * @param {string} itemType - Type of item (for error message)
     * @returns {boolean}
     */
    verifyPermission(action, itemType = 'item') {
        if (!this.canPerformAction(action)) {
            const actionLabels = {
                'create': 'create',
                'edit': 'edit',
                'delete': 'delete',
                'manageUsers': 'manage users',
                'manageSiteSettings': 'manage site settings'
            };
            
            alert(`❌ Permission Denied\n\nYour role (${this.currentUser.role}) does not have permission to ${actionLabels[action]} ${itemType}.\n\nContact a super-admin if you need additional permissions.`);
            return false;
        }
        return true;
    }

    /**
     * Verify section access before showing
     * @param {string} sectionId - Section to verify
     * @returns {boolean}
     */
    verifySectionAccess(sectionId) {
        if (!this.canAccessSection(sectionId)) {
            alert(`❌ Access Denied\n\nYour custom permissions do not allow access to this section.\n\nContact a super-admin if you need additional permissions.`);
            return false;
        }
        return true;
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = '/admin/admin-login.html';
    }

    /**
     * Get current user info
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if current user is super-admin
     * @returns {boolean}
     */
    isSuperAdmin() {
        return this.currentUser?.role === 'super-admin';
    }

    /**
     * Check if current user is admin or higher
     * @returns {boolean}
     */
    isAdmin() {
        return this.currentUser?.role === 'super-admin' || this.currentUser?.role === 'admin';
    }

    /**
     * Get role display name
     * @returns {string}
     */
    getRoleDisplayName() {
        const roleNames = {
            'super-admin': 'Super Administrator',
            'admin': 'Administrator',
            'editor': 'Editor'
        };
        return roleNames[this.currentUser?.role] || 'Unknown';
    }
}

// Create global instance
window.adminPermissions = new AdminPermissions();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.adminPermissions.init();
});