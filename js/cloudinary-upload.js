/**
 * Cloudinary Upload Utility for OLRFC Website
 * Cloud Name: dep5rhteb
 * Upload Presets: olrfc_sponsors, olrfc_gallery
 * 
 * FIXED: Added generic uploadImage() method for contacts and other uses
 * FIXED: Added cloudinaryUpload alias for backward compatibility
 */

class CloudinaryUploader {
    constructor() {
        this.cloudName = 'dep5rhteb';
        this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    }

    /**
     * Generic image upload method - works for any content type
     * @param {File} file - The image file
     * @param {string} folder - Folder/category name (e.g., 'contacts', 'news', 'players')
     * @returns {Promise<string>} - The uploaded image URL
     */
    async uploadImage(file, folder = 'general') {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Image must be less than 10MB');
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'olrfc_sponsors'); // Using existing preset
            formData.append('tags', `olrfc,${folder}`);
            formData.append('folder', `olrfc/${folder}`);

            console.log(`📤 Uploading image to Cloudinary (folder: ${folder})...`);

            // Upload to Cloudinary
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const result = await response.json();

            console.log('✅ Image uploaded successfully:', result.secure_url);

            // Return just the URL for simple usage
            return result.secure_url;

        } catch (error) {
            console.error('❌ Cloudinary upload error:', error);
            throw error; // Re-throw so caller can handle
        }
    }

    /**
     * Upload sponsor logo to Cloudinary
     * @param {File} file - The logo file
     * @returns {Promise<object>} - Upload result with URL
     */
    async uploadSponsorLogo(file) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Logo file must be less than 10MB');
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'olrfc_sponsors');
            formData.append('tags', 'sponsor,logo');

            console.log('📤 Uploading logo to Cloudinary...');

            // Upload to Cloudinary
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const result = await response.json();

            console.log('✅ Logo uploaded successfully:', result.secure_url);

            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                bytes: result.bytes
            };

        } catch (error) {
            console.error('❌ Cloudinary upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upload player photo to Cloudinary with optional background removal
     * @param {File} file - The player photo file
     * @param {boolean} removeBackground - Whether to remove background (default: true)
     * @returns {Promise<object>} - Upload result with URL
     */
    async uploadPlayerPhoto(file, removeBackground = true) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Player photo must be less than 10MB');
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'olrfc_sponsors'); // Using same preset
            formData.append('tags', 'player,profile');
            formData.append('folder', 'olrfc/players');

            console.log('📤 Uploading player photo to Cloudinary...');

            // Upload to Cloudinary
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const result = await response.json();

            // Get URL - apply background removal if requested
            let finalUrl = result.secure_url;
            if (removeBackground) {
                // Apply Cloudinary's background removal transformation
                finalUrl = this.applyBackgroundRemoval(result.secure_url);
                console.log('🎨 Background removal applied');
            }

            console.log('✅ Player photo uploaded successfully:', finalUrl);

            return {
                success: true,
                url: finalUrl,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                backgroundRemoved: removeBackground
            };

        } catch (error) {
            console.error('❌ Player photo upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Apply background removal transformation to Cloudinary URL
     * @param {string} url - Original Cloudinary URL
     * @returns {string} - URL with background removal and transparent background
     */
    applyBackgroundRemoval(url) {
        if (!url || !url.includes('cloudinary.com')) {
            console.warn('⚠️ Invalid URL for background removal:', url);
            return url;
        }

        const parts = url.split('/upload/');
        if (parts.length === 2) {
            // Background removal + explicit transparent background
            const transformedUrl = `${parts[0]}/upload/b_transparent/e_background_removal/${parts[1]}`;
            console.log('🎨 Background removal URL (with transparency):', transformedUrl);
            return transformedUrl;
        }

        console.warn('⚠️ Could not parse URL for background removal:', url);
        return url;
    }

    /**
     * Upload news article image to Cloudinary
     * @param {File} file - The news image file
     * @returns {Promise<object>} - Upload result with URL
     */
    async uploadNewsImage(file) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('News image must be less than 10MB');
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'olrfc_sponsors'); // Using same preset
            formData.append('tags', 'news,article');
            formData.append('folder', 'olrfc/news');

            console.log('📤 Uploading news image to Cloudinary...');

            // Upload to Cloudinary
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const result = await response.json();

            console.log('✅ News image uploaded successfully:', result.secure_url);

            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                bytes: result.bytes
            };

        } catch (error) {
            console.error('❌ News image upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upload gallery photo to Cloudinary with tag-based organization
     * @param {File} file - Photo file
     * @param {string} albumName - Album name for organization
     * @returns {Promise<object>} - Upload result with URL
     */
    async uploadGalleryPhoto(file, albumName) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Photo must be less than 10MB');
            }

            // Validate album name
            if (!albumName || albumName.trim() === '') {
                throw new Error('Album name is required');
            }

            // Clean album name for tag
            const cleanAlbumTag = albumName
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'olrfc_gallery');
            formData.append('tags', `olrfc-gallery,album-${cleanAlbumTag}`);
            formData.append('folder', 'olrfc/gallery');

            console.log(`📤 Uploading photo to album: ${albumName} (tag: album-${cleanAlbumTag})`);

            // Upload to Cloudinary
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const result = await response.json();

            console.log('✅ Photo uploaded successfully:', result.secure_url);

            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                tags: result.tags,
                albumTag: `album-${cleanAlbumTag}`,
                width: result.width,
                height: result.height,
                bytes: result.bytes
            };

        } catch (error) {
            console.error('❌ Gallery upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Upload multiple gallery photos at once
     * @param {FileList|Array} files - Array of photo files
     * @param {string} albumName - Album name for all photos
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Promise<Array>} - Array of upload results
     */
    async uploadMultipleGalleryPhotos(files, albumName, progressCallback = null) {
        const results = [];
        const total = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (progressCallback) {
                progressCallback({
                    current: i + 1,
                    total: total,
                    fileName: file.name
                });
            }

            const result = await this.uploadGalleryPhoto(file, albumName);
            results.push(result);

            // Small delay between uploads to avoid rate limiting
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return results;
    }

    /**
     * Generate thumbnail URL from Cloudinary URL
     * @param {string} url - Original Cloudinary URL
     * @param {number} width - Thumbnail width
     * @param {number} height - Thumbnail height
     */
    getThumbnailUrl(url, width = 200, height = 200) {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }

        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${parts[1]}`;
        }

        return url;
    }
}

// Create global instance
const cloudinaryUploaderInstance = new CloudinaryUploader();

// Expose with BOTH names for compatibility
window.cloudinaryUploader = cloudinaryUploaderInstance;
window.cloudinaryUpload = cloudinaryUploaderInstance;  // 🔧 FIX: Alias for admin dashboard

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudinaryUploader;
}