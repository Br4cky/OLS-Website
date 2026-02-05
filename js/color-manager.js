/**
 * Color Manager v4 - Hybrid Approach with Netlify Blobs
 * OLS 90 - Updated to use site-settings Blobs endpoint
 * - First visit: Professional blue spinner + fetch from Netlify Blobs + cache
 * - Repeat visits: Instant colors from localStorage cache (no spinner)
 * - Background validation every 5 minutes
 */

class ColorManager {
    constructor() {
        this.defaultColors = {
            'primary-green': '#6b7280',
            'primary-maroon': '#374151',
            'accent-gold': '#9ca3af',
            'text-dark': '#333',
            'text-light': '#666',
            'bg-light': '#f8f9fa',
            'white': '#ffffff'
        };
        this.customColors = {};
        this.initialized = false;
        this.cacheKey = 'olrfc-custom-colors';
        this.timestampKey = 'olrfc-colors-timestamp';
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    /**
     * Initialize and apply colors with hybrid approach
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Check if we have cached colors
            const cachedColors = this.loadFromCache();
            
            if (cachedColors) {
                // REPEAT VISIT: Apply cached colors instantly (no spinner)
                console.log('🎨 Applying cached colors (instant - no spinner)');
                this.customColors = cachedColors;
                this.applyColors();
                this.initialized = true;
                
                // Validate cache in background (don't block UI)
                this.validateCacheInBackground();
            } else {
                // FIRST VISIT: Show spinner, fetch, cache, hide spinner
                console.log('🎨 First visit - showing loading spinner');
                this.showLoadingSpinner();
                
                await this.fetchCustomColors();
                this.applyColors();
                this.saveToCache(this.customColors);
                
                this.hideLoadingSpinner();
                this.initialized = true;
            }
            
            console.log('✅ Color Manager v4 initialized (Netlify Blobs)');
        } catch (error) {
            console.warn('⚠️ Color Manager failed, using defaults:', error);
            this.hideLoadingSpinner();
            this.applyColors(); // Apply defaults
        }
    }

    /**
     * Load colors from localStorage cache
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            const timestamp = localStorage.getItem(this.timestampKey);
            
            if (!cached || !timestamp) {
                console.log('🔭 No cache found');
                return null;
            }
            
            const age = Date.now() - parseInt(timestamp, 10);
            
            if (age > this.cacheExpiry) {
                console.log('⏰ Cache expired (age: ' + Math.round(age / 1000) + 's)');
                this.clearCache();
                return null;
            }
            
            const colors = JSON.parse(cached);
            console.log('✅ Cache valid (age: ' + Math.round(age / 1000) + 's)');
            return colors;
            
        } catch (error) {
            console.error('❌ Cache read error:', error);
            this.clearCache();
            return null;
        }
    }

    /**
     * Save colors to localStorage cache
     */
    saveToCache(colors) {
        try {
            if (Object.keys(colors).length === 0) {
                console.log('🔭 No custom colors to cache');
                return;
            }
            
            localStorage.setItem(this.cacheKey, JSON.stringify(colors));
            localStorage.setItem(this.timestampKey, Date.now().toString());
            console.log('💾 Colors cached successfully');
        } catch (error) {
            console.error('❌ Cache write error:', error);
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        try {
            localStorage.removeItem(this.cacheKey);
            localStorage.removeItem(this.timestampKey);
            console.log('🗑️ Cache cleared');
        } catch (error) {
            console.error('❌ Cache clear error:', error);
        }
    }

    /**
     * Validate cache in background (async, non-blocking)
     */
    async validateCacheInBackground() {
        try {
            const freshColors = await this.fetchCustomColorsQuiet();
            
            // Compare with cached version
            const cachedStr = JSON.stringify(this.customColors);
            const freshStr = JSON.stringify(freshColors);
            
            if (cachedStr !== freshStr && Object.keys(freshColors).length > 0) {
                console.log('🔄 Cache outdated, updating...');
                this.customColors = freshColors;
                this.applyColors();
                this.saveToCache(freshColors);
            } else {
                console.log('✅ Cache validated (still fresh)');
            }
        } catch (error) {
            console.warn('⚠️ Background validation failed:', error);
        }
    }

    /**
     * Show professional blue loading spinner
     */
    showLoadingSpinner() {
        // Don't add if already exists
        if (document.getElementById('color-loading-spinner')) return;
        
        const spinner = document.createElement('div');
        spinner.id = 'color-loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-overlay">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-text">Loading...</div>
                </div>
            </div>
        `;
        
        // Add spinner styles
        const styles = document.createElement('style');
        styles.id = 'color-loading-spinner-styles';
        styles.textContent = `
            .spinner-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.3s ease;
            }
            
            .spinner-overlay.fade-out {
                opacity: 0;
            }
            
            .spinner-container {
                text-align: center;
            }
            
            .spinner-ring {
                border: 4px solid #e3f2fd;
                border-top: 4px solid #2196F3;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .spinner-text {
                color: #1976D2;
                font-size: 16px;
                font-weight: 500;
                font-family: 'Arial', sans-serif;
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(spinner);
    }

    /**
     * Hide loading spinner with smooth fade
     */
    hideLoadingSpinner() {
        const spinner = document.getElementById('color-loading-spinner');
        const styles = document.getElementById('color-loading-spinner-styles');
        
        if (spinner) {
            const overlay = spinner.querySelector('.spinner-overlay');
            overlay.classList.add('fade-out');
            
            // Remove after fade animation
            setTimeout(() => {
                spinner.remove();
                if (styles) styles.remove();
            }, 300);
        }
    }

    /**
     * Fetch custom colors from Netlify Blobs (OLS 90)
     * Now uses site-settings Blobs endpoint instead of Forms
     */
    async fetchCustomColors() {
        try {
            const response = await fetch('/.netlify/functions/site-settings', {
                method: 'GET'
            });

            if (!response.ok) {
                console.log('No custom colors found, using defaults');
                return;
            }

            const result = await response.json();
            const settings = result.data || {};

            // Extract color settings from the settings object
            const colors = {};
            
            Object.keys(settings).forEach(key => {
                if (key.startsWith('color-')) {
                    const colorKey = key.replace('color-', '');
                    colors[colorKey] = settings[key];
                }
            });

            this.customColors = colors;

            if (Object.keys(this.customColors).length > 0) {
                console.log('✅ Custom colors loaded from Blobs:', this.customColors);
            }

        } catch (error) {
            console.error('Error fetching custom colors:', error);
        }
    }

    /**
     * Fetch custom colors quietly (for background validation)
     */
    async fetchCustomColorsQuiet() {
        try {
            const response = await fetch('/.netlify/functions/site-settings', {
                method: 'GET'
            });

            if (!response.ok) {
                return {};
            }

            const result = await response.json();
            const settings = result.data || {};

            const colors = {};
            
            Object.keys(settings).forEach(key => {
                if (key.startsWith('color-')) {
                    const colorKey = key.replace('color-', '');
                    colors[colorKey] = settings[key];
                }
            });

            return colors;

        } catch (error) {
            return {};
        }
    }

    /**
     * Convert hex color to RGB values
     */
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }

    /**
     * Apply colors to the page by injecting CSS variables
     */
    applyColors() {
        // Merge custom colors with defaults
        const colors = { ...this.defaultColors, ...this.customColors };

        // Create CSS variables for both hex AND rgb formats
        const cssVars = Object.entries(colors)
            .map(([key, value]) => {
                const hexVar = `--${key}: ${value};`;
                const rgbVar = `--${key}-rgb: ${this.hexToRgb(value)};`;
                return `${hexVar}\n    ${rgbVar}`;
            })
            .join('\n    ');

        // Inject CSS into document
        const styleId = 'custom-color-variables';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = `
            :root {
                ${cssVars}
            }
        `;

        console.log('🎨 Colors applied to page (hex + rgb)');
    }

    /**
     * Get current color value
     */
    getColor(colorKey) {
        return this.customColors[colorKey] || this.defaultColors[colorKey];
    }

    /**
     * Manually set a color (for preview purposes)
     */
    setColor(colorKey, value) {
        this.customColors[colorKey] = value;
        this.applyColors();
    }

    /**
     * Reset all colors to defaults
     */
    resetToDefaults() {
        this.customColors = {};
        this.applyColors();
    }

    /**
     * Force refresh colors (useful for admin panel)
     */
    async forceRefresh() {
        console.log('🔄 Force refreshing colors...');
        this.clearCache();
        await this.fetchCustomColors();
        this.applyColors();
        this.saveToCache(this.customColors);
        console.log('✅ Colors force refreshed');
    }
}

// Global instance
window.colorManager = new ColorManager();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    window.colorManager.init();
});