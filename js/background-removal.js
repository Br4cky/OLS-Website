 /**
 * Background Removal Utility
 * Reusable module for removing backgrounds from images using remove.bg API
 * Works with logo uploads, player photos, sponsor logos, etc.
 */

class BackgroundRemovalService {
    constructor() {
        // API key should be stored in Netlify environment variables
        this.apiKey = null;
        this.apiEndpoint = 'https://api.remove.bg/v1.0/removebg';
        this.initialized = false;
    }

    /**
     * Initialize the service by fetching API key from Netlify Function
     */
    async initialize() {
        if (this.initialized) return true;
        
        try {
            // Fetch API key from Netlify Function (keeps it secure, requires auth)
            const authHeaders = {};
            const token = localStorage.getItem('olrfc_auth_token');
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            } else {
                const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
                if (session.userId && session.email) {
                    const legacyToken = btoa(JSON.stringify({ userId: session.userId, email: session.email, role: session.role, timestamp: Date.now() }));
                    authHeaders['Authorization'] = `Bearer ${legacyToken}`;
                }
            }
            const response = await fetch('/.netlify/functions/get-removebg-key', {
                headers: authHeaders
            });
            if (response.ok) {
                const data = await response.json();
                this.apiKey = data.apiKey;
                this.initialized = true;
                return true;
            }
        } catch (error) {
            console.warn('Remove.bg API key not configured. Background removal disabled.');
        }
        
        return false;
    }

    /**
     * Remove background from an image file
     * @param {File} imageFile - The image file to process
     * @param {Object} options - Processing options
     * @returns {Promise<Blob>} - The processed image as a blob
     */
    async removeBackground(imageFile, options = {}) {
        // Check if service is available
        const isInitialized = await this.initialize();
        if (!isInitialized || !this.apiKey) {
            throw new Error('Background removal service not available. Please configure remove.bg API key.');
        }

        try {
            const formData = new FormData();
            formData.append('image_file', imageFile);
            formData.append('size', options.size || 'auto');
            
            // Optional: add specific settings for different image types
            if (options.type === 'logo') {
                formData.append('type', 'product');
                formData.append('format', 'png'); // PNG for transparency
            } else if (options.type === 'person') {
                formData.append('type', 'person');
            }

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.errors?.[0]?.title || 'Background removal failed');
            }

            // Return the processed image as a blob
            const blob = await response.blob();
            return blob;

        } catch (error) {
            console.error('Background removal error:', error);
            throw error;
        }
    }

    /**
     * Check if background removal is available
     */
    async isAvailable() {
        return await this.initialize();
    }

    /**
     * Get remaining API credits (if available)
     */
    async getRemainingCredits() {
        if (!this.apiKey) return null;
        
        try {
            const response = await fetch('https://api.remove.bg/v1.0/account', {
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.data.attributes.credits;
            }
        } catch (error) {
            console.error('Error fetching credits:', error);
        }
        
        return null;
    }
}

// Global instance
window.backgroundRemovalService = new BackgroundRemovalService();