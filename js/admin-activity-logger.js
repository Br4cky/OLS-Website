// OLS 105: Admin Activity Logger (Frontend) - FIXED VERSION
// Wraps adminSystem.saveData() to log all CRUD operations

class AdminActivityLogger {
    constructor() {
        this.currentUser = null;
        this.enabled = true;
    }

    /**
     * Initialize logger
     * - Load current user from session
     * - Wrap adminSystem.saveData with logging
     */
    init() {
        console.log('🔍 Initializing Activity Logger...');
        
        // Load current user
        this.loadCurrentUser();
        
        if (!this.currentUser) {
            console.warn('⚠️ No user session found - activity logging disabled');
            this.enabled = false;
            return;
        }
        
        console.log(`✅ Activity logging enabled for: ${this.currentUser.email}`);
        
        // Wait for adminSystem to be available, then wrap it
        this.waitForAdminSystem();
    }

    /**
     * Wait for adminSystem to exist, then wrap its saveData method
     */
    waitForAdminSystem() {
        if (window.adminSystem && window.adminSystem.saveData) {
            console.log('✅ adminSystem found, wrapping saveData...');
            this.wrapSaveData();
        } else {
            console.log('⏳ Waiting for adminSystem...');
            setTimeout(() => this.waitForAdminSystem(), 100);
        }
    }

    /**
     * Wrap adminSystem.saveData() with activity logging
     */
    wrapSaveData() {
        const originalSaveData = window.adminSystem.saveData.bind(window.adminSystem);
        const logger = this;

        window.adminSystem.saveData = function(key, data) {
            console.log(`📝 saveData called: ${key}`, data);

            // Determine if this is create, update, or delete
            const previousData = JSON.parse(localStorage.getItem(`olrfc_${key}`) || '[]');
            const actionType = logger.determineActionType(previousData, data);
            
            // Get a title for the item being modified
            const itemTitle = logger.extractItemTitle(key, data, previousData);

            // Call original saveData
            const result = originalSaveData(key, data);

            // Log the activity (async, don't block)
            if (logger.enabled) {
                logger.logActivity(actionType, key, { itemTitle }).catch(err => {
                    console.warn('Activity logging failed:', err);
                });
            }

            return result;
        };

        console.log('✅ adminSystem.saveData wrapped with activity logging');
    }

    /**
     * Find which item was newly added to the array
     */
    findNewItem(key, previousData, newData) {
        // Use content-specific comparison to find the new item
        switch(key) {
            case 'fixtures':
                // Find fixture that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => 
                        prevItem.opponent === newItem.opponent &&
                        prevItem.date === newItem.date &&
                        prevItem.homeTeam === newItem.homeTeam
                    )
                );
                
            case 'news':
                // Find news that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => 
                        prevItem.title === newItem.title &&
                        prevItem.date === newItem.date
                    )
                );
                
            case 'players':
                // Find player that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => prevItem.name === newItem.name)
                );
                
            case 'sponsors':
                // Find sponsor that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => 
                        (prevItem.id && prevItem.id === newItem.id) ||
                        prevItem.name === newItem.name
                    )
                );
                
            case 'teams':
                // Find team that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => prevItem.slug === newItem.slug)
                );
                
            case 'shop':
                // Find shop item that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => 
                        (prevItem.sku && prevItem.sku === newItem.sku) ||
                        prevItem.name === newItem.name
                    )
                );
                
            case 'gallery':
                // Find gallery item that's in newData but not in previousData
                return newData.find(newItem => 
                    !previousData.some(prevItem => 
                        (prevItem.cloudinaryId && prevItem.cloudinaryId === newItem.cloudinaryId) ||
                        (prevItem.url && prevItem.url === newItem.url)
                    )
                );
                
            default:
                // Generic: find item by ID or JSON comparison
                return newData.find(newItem => 
                    !previousData.some(prevItem => 
                        (prevItem.id && prevItem.id === newItem.id) ||
                        JSON.stringify(prevItem) === JSON.stringify(newItem)
                    )
                );
        }
    }

    /**
     * Find which item in the array actually changed
     */
    findChangedItem(key, previousData, newData) {
        // Use content-specific comparison to find the changed item
        switch(key) {
            case 'fixtures':
                // Find fixture that changed by comparing opponent, date, homeTeam
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData.find(p => 
                        p.opponent === newItem.opponent &&
                        p.date === newItem.date &&
                        p.homeTeam === newItem.homeTeam
                    );
                    
                    // If found, check if anything changed
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
                break;
                
            case 'news':
                // Find news that changed by comparing title and date
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData.find(p => 
                        p.title === newItem.title &&
                        p.date === newItem.date
                    );
                    
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
                break;
                
            case 'players':
                // Find player that changed by comparing name
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData.find(p => p.name === newItem.name);
                    
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
                break;
                
            case 'sponsors':
                // Find sponsor that changed by comparing id or name
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData.find(p => 
                        (p.id && p.id === newItem.id) || p.name === newItem.name
                    );
                    
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
                break;
                
            case 'teams':
                // Find team that changed by comparing slug (unique identifier)
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData.find(p => p.slug === newItem.slug);
                    
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
                break;
                
            case 'shop':
                // Find shop item that changed by comparing sku or name
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData.find(p => 
                        (p.sku && p.sku === newItem.sku) || p.name === newItem.name
                    );
                    
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
                break;
                
            default:
                // Generic comparison: find any item that changed
                for (let i = 0; i < newData.length; i++) {
                    const newItem = newData[i];
                    const oldItem = previousData[i];
                    
                    if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                        return newItem;
                    }
                }
        }
        
        return null;
    }

    /**
     * Get title from an item based on content type
     */
    getItemTitle(key, item) {
        if (!item) return key;
        
        switch(key) {
            case 'news':
                return item.title || 'news article';
            case 'fixtures':
                return item.opponent ? `vs ${item.opponent}` : 'fixture';
            case 'players':
                return item.name || 'player';
            case 'sponsors':
                return item.name || 'sponsor';
            case 'gallery':
                return item.title || item.caption || 'photo';
            case 'teams':
                return item.name || 'team';
            case 'shop':
                return item.name || 'product';
            default:
                return key;
        }
    }

    /**
     * Determine if operation is create, update, or delete
     */
    determineActionType(previousData, newData) {
        // If arrays
        if (Array.isArray(previousData) && Array.isArray(newData)) {
            if (newData.length > previousData.length) {
                return 'create';
            } else if (newData.length < previousData.length) {
                return 'delete';
            } else {
                return 'update';
            }
        }
        
        // If objects or other types, assume update
        return 'update';
    }

    /**
     * Extract a meaningful title from the data being saved
     */
    extractItemTitle(key, data, previousData) {
        // For CREATE operations (array got bigger)
        if (Array.isArray(previousData) && Array.isArray(data) && data.length > previousData.length) {
            // Find the new item that wasn't in previousData
            const newItem = this.findNewItem(key, previousData, data);
            if (newItem) {
                return this.getItemTitle(key, newItem);
            }
            // Fallback: if we can't determine which is new, use last item
            return this.getItemTitle(key, data[data.length - 1]);
        }

        // For UPDATE operations (same array length, but content changed)
        if (Array.isArray(previousData) && Array.isArray(data) && data.length === previousData.length) {
            // Find which item changed
            const changedItem = this.findChangedItem(key, previousData, data);
            if (changedItem) {
                return this.getItemTitle(key, changedItem);
            }
            
            // Fallback: if we can't determine which changed, use last item
            if (data.length > 0) {
                return this.getItemTitle(key, data[data.length - 1]);
            }
        }

        // For single items (not arrays) or empty arrays
        if (Array.isArray(data) && data.length > 0) {
            return this.getItemTitle(key, data[data.length - 1]);
        }

        // For deleted items, try to find what was removed
        if (Array.isArray(previousData) && Array.isArray(data) && data.length < previousData.length) {
            // Find the missing item using content-specific comparison
            const removedItem = this.findRemovedItem(key, previousData, data);
            
            if (removedItem) {
                return this.getItemTitle(key, removedItem);
            }
        }

        return key;
    }

    /**
     * Find which item was removed from the array
     */
    findRemovedItem(key, previousData, newData) {
        // Use content-specific comparison to find the removed item
        switch(key) {
            case 'fixtures':
                // Compare fixtures by opponent, date, and homeTeam
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        newItem.opponent === prevItem.opponent &&
                        newItem.date === prevItem.date &&
                        newItem.homeTeam === prevItem.homeTeam
                    )
                );
                
            case 'news':
                // Compare news by title and date
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        newItem.title === prevItem.title &&
                        newItem.date === prevItem.date
                    )
                );
                
            case 'players':
                // Compare players by name and position
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        newItem.name === prevItem.name &&
                        newItem.position === prevItem.position
                    )
                );
                
            case 'gallery':
                // Compare gallery by cloudinaryId or url
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        (newItem.cloudinaryId && newItem.cloudinaryId === prevItem.cloudinaryId) ||
                        (newItem.url && newItem.url === prevItem.url)
                    )
                );
                
            case 'sponsors':
                // Compare sponsors by id or name
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        (newItem.id && newItem.id === prevItem.id) ||
                        newItem.name === prevItem.name
                    )
                );
                
            case 'teams':
                // Compare teams by slug (unique identifier)
                return previousData.find(prevItem => 
                    !newData.some(newItem => newItem.slug === prevItem.slug)
                );
                
            case 'shop':
                // Compare shop items by sku or name
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        (newItem.sku && newItem.sku === prevItem.sku) ||
                        newItem.name === prevItem.name
                    )
                );
                
            default:
                // For other types, try ID first, then fallback to comparison
                return previousData.find(prevItem => 
                    !newData.some(newItem => 
                        (newItem.id && newItem.id === prevItem.id) ||
                        JSON.stringify(newItem) === JSON.stringify(prevItem)
                    )
                );
        }
    }

    /**
     * Load current user from session
     */
    loadCurrentUser() {
        try {
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            
            if (session.userId && session.email) {
                this.currentUser = {
                    userId: session.userId,
                    email: session.email,
                    username: session.username || session.email.split('@')[0],
                    role: session.role
                };
            }
        } catch (error) {
            console.error('Error loading user session:', error);
            this.currentUser = null;
        }
    }

    /**
     * Log an activity to the backend
     * @param {string} actionType - 'create', 'update', 'delete'
     * @param {string} contentType - 'news', 'fixtures', 'players', etc.
     * @param {Object} details - Additional details (itemId, itemTitle, metadata)
     */
    async logActivity(actionType, contentType, details = {}) {
        if (!this.enabled || !this.currentUser) {
            return;
        }

        try {
            const logData = {
                adminEmail: this.currentUser.email,
                adminUsername: this.currentUser.username,
                adminRole: this.currentUser.role,
                actionType: actionType,
                contentType: contentType,
                itemId: details.itemId || null,
                itemTitle: details.itemTitle || details.title || null,
                description: details.description || null,
                metadata: details.metadata || {}
            };

            console.log('📤 Sending activity log:', logData);

            const response = await fetch('/.netlify/functions/admin-activity-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Logged: ${actionType} ${contentType}`, result);
            } else {
                console.warn('⚠️ Failed to log activity:', response.status);
            }
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw - logging failures shouldn't break the app
        }
    }

    /**
     * Convenience methods for manual logging (if needed)
     */
    logCreate(contentType, itemTitle, itemId = null) {
        return this.logActivity('create', contentType, { itemTitle, itemId });
    }

    logUpdate(contentType, itemTitle, itemId = null) {
        return this.logActivity('update', contentType, { itemTitle, itemId });
    }

    logDelete(contentType, itemTitle, itemId = null) {
        return this.logActivity('delete', contentType, { itemTitle, itemId });
    }
}

// Create global instance
window.activityLogger = new AdminActivityLogger();

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing activity logger...');
    window.activityLogger.init();
});