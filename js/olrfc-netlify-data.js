// js/olrfc-netlify-data.js
// OLS-Website Netlify Data Manager
// Handles data persistence using Netlify Forms as database

class OLRFCNetlifyDataManager {
    constructor() {
        this.siteUrl = window.location.origin;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic method to submit data to Netlify Forms
    async submitToNetlify(formName, data) {
        try {
            const formData = new FormData();
            
            // Add all data fields to form
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });

            const response = await fetch('/', {
                method: 'POST',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                // Clear cache for this form type
                this.clearCache(formName);
                return { success: true, data };
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error submitting to ${formName}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get cached data or return null if expired
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        return null;
    }

    // Set cached data
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Clear cache for specific form type
    clearCache(formName) {
        this.cache.delete(formName);
    }

    // FIXTURES METHODS
    async createFixture(fixtureData) {
        const data = {
            'form-name': 'olrfc-fixtures',
            id: Date.now().toString(),
            ...fixtureData,
            createdAt: new Date().toISOString(),
            status: fixtureData.status || 'upcoming'
        };

        const result = await this.submitToNetlify('olrfc-fixtures', data);
        if (result.success) {
            // Also save to localStorage for immediate availability
            this.saveToLocalStorage('olrfc_fixtures', data);
        }
        return result;
    }

    async updateFixture(fixtureId, fixtureData) {
        const data = {
            'form-name': 'olrfc-fixtures',
            id: fixtureId,
            ...fixtureData,
            updatedAt: new Date().toISOString()
        };

        const result = await this.submitToNetlify('olrfc-fixtures', data);
        if (result.success) {
            // Update localStorage
            this.updateInLocalStorage('olrfc_fixtures', fixtureId, data);
        }
        return result;
    }

    // NEWS METHODS
    async createNews(newsData) {
        const data = {
            'form-name': 'olrfc-news',
            id: Date.now().toString(),
            ...newsData,
            createdAt: new Date().toISOString(),
            date: newsData.date || new Date().toISOString()
        };

        const result = await this.submitToNetlify('olrfc-news', data);
        if (result.success) {
            this.saveToLocalStorage('olrfc_news', data);
        }
        return result;
    }

    // PLAYERS METHODS
    async createPlayer(playerData) {
        const data = {
            'form-name': 'olrfc-players',
            id: Date.now().toString(),
            ...playerData,
            createdAt: new Date().toISOString(),
            appearances: playerData.appearances || 0
        };

        const result = await this.submitToNetlify('olrfc-players', data);
        if (result.success) {
            this.saveToLocalStorage('olrfc_players', data);
        }
        return result;
    }

    // SPONSORS METHODS
    async createSponsor(sponsorData) {
        const data = {
            'form-name': 'olrfc-sponsors',
            id: Date.now().toString(),
            ...sponsorData,
            createdAt: new Date().toISOString(),
            active: sponsorData.active || true,
            showInBanner: sponsorData.showInBanner || true
        };

        const result = await this.submitToNetlify('olrfc-sponsors', data);
        if (result.success) {
            this.saveToLocalStorage('olrfc_sponsors', data);
        }
        return result;
    }

    // SHOP METHODS
    async createShopItem(shopData) {
        const data = {
            'form-name': 'olrfc-shop',
            id: Date.now().toString(),
            ...shopData,
            createdAt: new Date().toISOString(),
            status: shopData.status || 'active',
            stock: shopData.stock || 0
        };

        const result = await this.submitToNetlify('olrfc-shop', data);
        if (result.success) {
            this.saveToLocalStorage('olrfc_shop', data);
        }
        return result;
    }

    // GALLERY METHODS
    async createGallery(galleryData) {
        const data = {
            'form-name': 'olrfc-gallery',
            id: Date.now().toString(),
            ...galleryData,
            createdAt: new Date().toISOString(),
            date: galleryData.date || new Date().toISOString()
        };

        const result = await this.submitToNetlify('olrfc-gallery', data);
        if (result.success) {
            this.saveToLocalStorage('olrfc_gallery', data);
        }
        return result;
    }

    // UTILITY METHODS FOR LOCALSTORAGE SYNC
    saveToLocalStorage(key, data) {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(data);
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    updateInLocalStorage(key, id, data) {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const index = existing.findIndex(item => item.id === id);
            if (index !== -1) {
                existing[index] = { ...existing[index], ...data };
                localStorage.setItem(key, JSON.stringify(existing));
            }
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    }

    // OFFLINE FALLBACK - Use localStorage when Netlify unavailable
    async createWithFallback(type, data) {
        const methodMap = {
            'fixtures': () => this.createFixture(data),
            'news': () => this.createNews(data),
            'players': () => this.createPlayer(data),
            'sponsors': () => this.createSponsor(data),
            'shop': () => this.createShopItem(data),
            'gallery': () => this.createGallery(data)
        };

        try {
            // Try Netlify first
            const result = await methodMap[type]();
            if (result.success) {
                return result;
            }
            throw new Error('Netlify submission failed');
        } catch (error) {
            console.warn('Netlify unavailable, using localStorage fallback:', error);
            
            // Fallback to localStorage
            const key = `olrfc_${type}`;
            const item = {
                id: Date.now().toString(),
                ...data,
                createdAt: new Date().toISOString(),
                _pendingSync: true // Flag for later sync
            };
            
            this.saveToLocalStorage(key, item);
            return { success: true, data: item, fallback: true };
        }
    }

    // Check if online and sync pending items
    async syncPendingItems() {
        const keys = ['olrfc_fixtures', 'olrfc_news', 'olrfc_players', 'olrfc_sponsors', 'olrfc_shop', 'olrfc_gallery'];
        
        for (const key of keys) {
            try {
                const items = JSON.parse(localStorage.getItem(key) || '[]');
                const pendingItems = items.filter(item => item._pendingSync);
                
                for (const item of pendingItems) {
                    const type = key.replace('olrfc_', '');
                    const cleanItem = { ...item };
                    delete cleanItem._pendingSync;
                    
                    const result = await this.createWithFallback(type, cleanItem);
                    if (result.success && !result.fallback) {
                        // Remove from localStorage pending list
                        const updatedItems = items.filter(i => i.id !== item.id || !i._pendingSync);
                        localStorage.setItem(key, JSON.stringify(updatedItems));
                    }
                }
            } catch (error) {
                console.error(`Error syncing ${key}:`, error);
            }
        }
    }
}

// Initialize global instance
window.netlifyDataManager = new OLRFCNetlifyDataManager();

// Sync pending items when online
window.addEventListener('online', () => {
    window.netlifyDataManager.syncPendingItems();
});