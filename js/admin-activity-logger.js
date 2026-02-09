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

            // Build detailed log info
            const logDetails = { itemTitle };

            if (actionType === 'update' && Array.isArray(previousData) && Array.isArray(data)) {
                // Get field-level changes for updates
                const changed = logger.findChangedItem(key, previousData, data);
                if (changed) {
                    const changeInfo = logger.generateChangeDescription(key, changed.oldItem, changed.newItem);
                    if (changeInfo) {
                        logDetails.description = changeInfo.description;
                        logDetails.metadata = {
                            changedFields: changeInfo.changedFields,
                            changeCount: changeInfo.changeCount
                        };
                    }
                    logDetails.itemId = changed.newItem.id || null;
                }
            } else if (actionType === 'create') {
                const newItem = logger.findNewItem(key, previousData, data);
                if (newItem) {
                    logDetails.itemId = newItem.id || null;
                    logDetails.description = `Created new ${key.replace(/s$/, '')}: ${itemTitle}`;
                }
            } else if (actionType === 'delete') {
                const removedItem = logger.findRemovedItem(key, previousData, data);
                if (removedItem) {
                    logDetails.itemId = removedItem.id || null;
                    logDetails.description = `Deleted ${key.replace(/s$/, '')}: ${logger.getItemTitle(key, removedItem)}`;
                }
            }

            // Call original saveData
            const result = originalSaveData(key, data);

            // Log the activity (async, don't block)
            if (logger.enabled) {
                logger.logActivity(actionType, key, logDetails).catch(err => {
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
     * Returns { oldItem, newItem } so callers can compute field diffs
     */
    findChangedItem(key, previousData, newData) {
        // Helper: match by ID first (most reliable), then content-specific fallback
        const findMatch = (item, candidates) => {
            // Always try ID match first
            if (item.id) {
                const match = candidates.find(c => c.id === item.id);
                if (match) return match;
            }

            // Content-specific fallback
            switch(key) {
                case 'fixtures':
                    return candidates.find(c =>
                        c.opponent === item.opponent && c.date === item.date && c.homeTeam === item.homeTeam
                    );
                case 'news':
                    return candidates.find(c => c.title === item.title && c.date === item.date);
                case 'players':
                    return candidates.find(c => c.name === item.name);
                case 'sponsors':
                    return candidates.find(c => c.name === item.name);
                case 'teams':
                    return candidates.find(c => c.slug === item.slug);
                case 'shop':
                    return candidates.find(c => (c.sku && c.sku === item.sku) || c.name === item.name);
                case 'gallery':
                    return candidates.find(c =>
                        (c.cloudinaryId && c.cloudinaryId === item.cloudinaryId) || (c.url && c.url === item.url)
                    );
                default:
                    return candidates.find(c => JSON.stringify(c) === JSON.stringify(item));
            }
        };

        for (let i = 0; i < newData.length; i++) {
            const newItem = newData[i];
            const oldItem = findMatch(newItem, previousData);

            if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                return { oldItem, newItem };
            }
        }

        return null;
    }

    /**
     * Generate a human-readable description of what fields changed
     */
    generateChangeDescription(key, oldItem, newItem) {
        if (!oldItem || !newItem) return null;

        // Fields to skip in diff (internal/meta fields)
        const skipFields = ['id', 'dateAdded', 'createdAt', 'updatedAt', 'lastUpdated'];

        // Human-readable field name mapping
        const fieldLabels = {
            opponent: 'opponent', ourScore: 'our score', theirScore: 'their score',
            dateTime: 'date/time', venue: 'venue', competition: 'competition',
            team: 'team', name: 'name', title: 'title', content: 'content',
            category: 'category', author: 'author', featured: 'featured',
            position: 'position', appearances: 'appearances', photo: 'photo',
            tier: 'tier', phone: 'phone', email: 'email', website: 'website',
            active: 'active status', showInBanner: 'banner visibility',
            logo: 'logo', slug: 'slug', description: 'description',
            price: 'price', stock: 'stock', image: 'image'
        };

        const changes = [];
        const changedFields = {};

        // Get all keys from both objects
        const allKeys = new Set([...Object.keys(oldItem), ...Object.keys(newItem)]);

        for (const field of allKeys) {
            if (skipFields.includes(field)) continue;

            const oldVal = oldItem[field];
            const newVal = newItem[field];

            // Skip if values are the same
            if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

            const label = fieldLabels[field] || field;

            // Format values for display
            const formatVal = (val) => {
                if (val === null || val === undefined || val === '') return 'empty';
                if (typeof val === 'boolean') return val ? 'yes' : 'no';
                if (typeof val === 'string' && val.length > 50) return val.substring(0, 50) + '...';
                return String(val);
            };

            changes.push(`${label}: "${formatVal(oldVal)}" → "${formatVal(newVal)}"`);
            changedFields[field] = { from: oldVal, to: newVal };
        }

        if (changes.length === 0) return null;

        return {
            description: `Changed ${changes.join(', ')}`,
            changedFields: changedFields,
            changeCount: changes.length
        };
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
            // Find which item changed (returns { oldItem, newItem })
            const changed = this.findChangedItem(key, previousData, data);
            if (changed) {
                return this.getItemTitle(key, changed.newItem);
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
     * Get auth headers for authenticated API calls
     */
    getAuthHeaders() {
        const token = localStorage.getItem('olrfc_auth_token');
        if (token) {
            return { 'Authorization': `Bearer ${token}` };
        }
        const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
        if (session.userId && session.email) {
            const legacyToken = btoa(JSON.stringify({
                userId: session.userId,
                email: session.email,
                role: session.role,
                timestamp: Date.now()
            }));
            return { 'Authorization': `Bearer ${legacyToken}` };
        }
        return {};
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
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
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
     * Convenience methods for manual logging from external code
     * (contacts, VPs, site-settings, etc. that bypass adminSystem.saveData)
     */
    logCreate(contentType, itemTitle, itemId = null, description = null) {
        return this.logActivity('create', contentType, {
            itemTitle,
            itemId,
            description: description || `Created new ${contentType.replace(/s$/, '')}: ${itemTitle}`
        });
    }

    logUpdate(contentType, itemTitle, itemId = null, description = null, metadata = null) {
        return this.logActivity('update', contentType, {
            itemTitle,
            itemId,
            description: description || `Updated ${contentType.replace(/s$/, '')}: ${itemTitle}`,
            metadata: metadata || {}
        });
    }

    logDelete(contentType, itemTitle, itemId = null) {
        return this.logActivity('delete', contentType, {
            itemTitle,
            itemId,
            description: `Deleted ${contentType.replace(/s$/, '')}: ${itemTitle}`
        });
    }

    /**
     * Log a field-level update with before/after values
     * Used by external code that knows exactly what changed
     */
    logDetailedUpdate(contentType, itemTitle, itemId, changedFields) {
        const changes = Object.entries(changedFields).map(([field, { from, to }]) => {
            const formatVal = (val) => {
                if (val === null || val === undefined || val === '') return 'empty';
                if (typeof val === 'boolean') return val ? 'yes' : 'no';
                if (typeof val === 'string' && val.length > 50) return val.substring(0, 50) + '...';
                return String(val);
            };
            return `${field}: "${formatVal(from)}" → "${formatVal(to)}"`;
        });

        return this.logActivity('update', contentType, {
            itemTitle,
            itemId,
            description: `Changed ${changes.join(', ')}`,
            metadata: { changedFields, changeCount: changes.length }
        });
    }
}

// Create global instance
window.activityLogger = new AdminActivityLogger();

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing activity logger...');
    window.activityLogger.init();
});