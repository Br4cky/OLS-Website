/**
 * Universal Footer Generator
 * Generates consistent footer across all pages with page-specific quick links
 * Now supports admin customization via Netlify Forms
 */

// Default settings (fallback if API fails)
const defaultFooterSettings = {
    contactAddress: 'Fenley Field, Lime Tree Avenue\nRugby, Warwickshire, CV22 7QT',
    contactEmail: 'info@olsrugby.com',
    contactPhone: '',
    socialFacebook: 'https://www.facebook.com/olsrugby',
    socialInstagram: 'https://www.instagram.com/olsrugby',
    socialTwitter: 'https://twitter.com/YOUR_TWITTER',
    socialYoutube: '',
    copyright: '© 2025 Old Laurentian RFC. All rights reserved.'
};

// Cache for settings
let footerSettings = {...defaultFooterSettings};
let footerSettingsLoaded = false;

/**
 * Fetch customization settings from Netlify Blobs
 */
async function fetchFooterSettings() {
    if (footerSettingsLoaded) return footerSettings;

    try {
        // Use shared settings service to avoid redundant API calls
        const settings = window.siteSettings ? await window.siteSettings.get() : {};
        
        // Extract footer settings directly from object
        if (settings['contact-address']) footerSettings.contactAddress = settings['contact-address'];
        if (settings['contact-email']) footerSettings.contactEmail = settings['contact-email'];
        if (settings['contact-phone']) footerSettings.contactPhone = settings['contact-phone'];
        if (settings['social-facebook']) footerSettings.socialFacebook = settings['social-facebook'];
        if (settings['social-instagram']) footerSettings.socialInstagram = settings['social-instagram'];
        if (settings['social-twitter']) footerSettings.socialTwitter = settings['social-twitter'];
        if (settings['social-youtube']) footerSettings.socialYoutube = settings['social-youtube'];
        if (settings['copyright']) footerSettings.copyright = settings['copyright'];
        
        footerSettingsLoaded = true;
        console.log('✅ Footer settings loaded from Blobs');
        return footerSettings;
        
    } catch (error) {
        console.error('Error fetching footer settings:', error);
        footerSettingsLoaded = true;
        return footerSettings;
    }
}

function generateFooter(currentPage = 'home', settings = null) {
    // Use provided settings or defaults
    const activeSettings = settings || footerSettings;
    
    // Define quick links for each page - shows all main pages EXCEPT current page
    const quickLinks = {
        'home': [
            { text: 'Latest News', href: 'pages/news.html' },
            { text: 'Fixtures & Results', href: 'pages/fixtures.html' },
            { text: 'Events', href: 'pages/events.html' },
            { text: 'Gallery', href: 'pages/gallery.html' },
            { text: 'Sponsors', href: 'pages/sponsors.html' },
            { text: 'VP Wall', href: 'vp-wall.html' },
            { text: 'Contact', href: 'pages/club-contacts.html' }
        ],
        'news': [
            { text: 'Home', href: '../index.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Events', href: 'events.html' },
            { text: 'Gallery', href: 'gallery.html' },
            { text: 'Sponsors', href: 'sponsors.html' },
            { text: 'VP Wall', href: '../vp-wall.html' },
            { text: 'Contact', href: 'club-contacts.html' }
        ],
        'fixtures': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Events', href: 'events.html' },
            { text: 'Gallery', href: 'gallery.html' },
            { text: 'Sponsors', href: 'sponsors.html' },
            { text: 'VP Wall', href: '../vp-wall.html' },
            { text: 'Contact', href: 'club-contacts.html' }
        ],
        'events': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Gallery', href: 'gallery.html' },
            { text: 'Sponsors', href: 'sponsors.html' },
            { text: 'VP Wall', href: '../vp-wall.html' },
            { text: 'Contact', href: 'club-contacts.html' }
        ],
        'gallery': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Events', href: 'events.html' },
            { text: 'Sponsors', href: 'sponsors.html' },
            { text: 'VP Wall', href: '../vp-wall.html' },
            { text: 'Contact', href: 'club-contacts.html' }
        ],
        'sponsors': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Events', href: 'events.html' },
            { text: 'Gallery', href: 'gallery.html' },
            { text: 'VP Wall', href: '../vp-wall.html' },
            { text: 'Contact', href: 'club-contacts.html' }
        ],
        'contacts': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Events', href: 'events.html' },
            { text: 'Gallery', href: 'gallery.html' },
            { text: 'Sponsors', href: 'sponsors.html' },
            { text: 'VP Wall', href: '../vp-wall.html' }
        ],
        'shop': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Events', href: 'events.html' },
            { text: 'Gallery', href: 'gallery.html' },
            { text: 'VP Wall', href: '../vp-wall.html' },
            { text: 'Contact', href: 'club-contacts.html' }
        ],
        'vp-wall': [
            { text: 'Home', href: 'index.html' },
            { text: 'Latest News', href: 'pages/news.html' },
            { text: 'Fixtures & Results', href: 'pages/fixtures.html' },
            { text: 'Events', href: 'pages/events.html' },
            { text: 'Gallery', href: 'pages/gallery.html' },
            { text: 'Sponsors', href: 'pages/sponsors.html' },
            { text: 'Contact', href: 'pages/club-contacts.html' }
        ],
        'admin': [
            { text: 'Home', href: '../index.html' },
            { text: 'Latest News', href: 'news.html' },
            { text: 'Fixtures & Results', href: 'fixtures.html' },
            { text: 'Gallery', href: 'gallery.html' }
        ]
    };

    // Get the appropriate links for this page
    const pageLinks = quickLinks[currentPage] || quickLinks['home'];
    
    // Generate quick links HTML
    const quickLinksHTML = pageLinks.map(link => 
        `<a href="${link.href}">${link.text}</a>`
    ).join('\n                    ');

    // Format address for HTML (escape then replace newlines with <br>)
    const formattedAddress = window.escapeHtmlWithBreaks
        ? window.escapeHtmlWithBreaks(activeSettings.contactAddress)
        : activeSettings.contactAddress.replace(/\n/g, '<br>');
    
    // Build social media links (only show if URL is provided)
    let socialLinksHTML = '';
    if (activeSettings.socialFacebook) {
        socialLinksHTML += `<a href="${activeSettings.socialFacebook}" target="_blank" aria-label="Facebook">FB</a>\n                        `;
    }
    if (activeSettings.socialInstagram) {
        socialLinksHTML += `<a href="${activeSettings.socialInstagram}" target="_blank" aria-label="Instagram">IG</a>\n                        `;
    }
    if (activeSettings.socialTwitter) {
        socialLinksHTML += `<a href="${activeSettings.socialTwitter}" target="_blank" aria-label="Twitter">TW</a>\n                        `;
    }
    if (activeSettings.socialYoutube) {
        socialLinksHTML += `<a href="${activeSettings.socialYoutube}" target="_blank" aria-label="YouTube">YT</a>`;
    }
    
    // Generate complete footer HTML using admin settings
    const footerHTML = `
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Contact Information</h3>
                    <p>📍 ${formattedAddress}</p>
                    <p>📧 ${window.escapeHtml ? window.escapeHtml(activeSettings.contactEmail) : activeSettings.contactEmail}</p>
                    ${activeSettings.contactPhone ? `<p>📞 ${window.escapeHtml ? window.escapeHtml(activeSettings.contactPhone) : activeSettings.contactPhone}</p>` : ''}
                </div>
                
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    ${quickLinksHTML}
                </div>
                
                <div class="footer-section">
                    <h3>Follow Us</h3>
                    <div class="social-icons">
                        ${socialLinksHTML}
                    </div>
                </div>

                <div class="footer-section">
                    <h3>Admin Access</h3>
                    <a href="#" onclick="toggleAdminDashboard(event); return false;" style="color: var(--accent-gold); text-decoration: none; font-weight: bold; transition: color 0.3s ease;">
                        🔐 Admin Login
                    </a>
                    <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
                        Club administrators only
                    </p>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>${window.escapeHtml ? window.escapeHtml(activeSettings.copyright) : activeSettings.copyright}</p>
            </div>
        </div>
    </footer>
    `;

    return footerHTML;
}

/**
 * Initialize footer on page load
 * Call this function with the current page identifier
 * Example: initializeFooter('home') or initializeFooter('news')
 */
async function initializeFooter(currentPage = 'home') {
    // Check if footer placeholder exists
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    if (footerPlaceholder) {
        // Fetch customization settings first
        const settings = await fetchFooterSettings();
        
        // Generate footer with settings
        footerPlaceholder.innerHTML = generateFooter(currentPage, settings);
    } else {
        console.warn('Footer placeholder not found. Add <div id="footer-placeholder"></div> to your HTML.');
    }
}

/**
 * Admin Login Modal Functions (OLS 98)
 * Defined globally so they work on all pages
 */

// Open the login modal
if (typeof window.openAdminLoginModal === 'undefined') {
    window.openAdminLoginModal = function(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.style.display = 'flex'; // Use flex for centering
            const emailInput = document.getElementById('adminEmail');
            if (emailInput) emailInput.focus();
        }
        return false;
    };
}

// Close the login modal
if (typeof window.closeAdminLoginModal === 'undefined') {
    window.closeAdminLoginModal = function() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.style.display = 'none';
        }
        const form = document.getElementById('adminLoginForm');
        if (form) form.reset();
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'none';
    };
}

// Handle admin login form submission
if (typeof window.handleAdminLogin === 'undefined') {
    window.handleAdminLogin = async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');
        const errorDiv = document.getElementById('loginError');
        
        if (!loginButton || !loginButtonText || !loginSpinner || !errorDiv) {
            console.error('Login form elements not found');
            return;
        }
        
        // Show loading state
        loginButtonText.style.display = 'none';
        loginSpinner.style.display = 'inline';
        loginButton.disabled = true;
        errorDiv.style.display = 'none';
        
        try {
            // Call admin-auth Netlify function
            const response = await fetch('/.netlify/functions/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store session/token
                sessionStorage.setItem('olrfc_admin_logged_in', 'true');
                sessionStorage.setItem('olrfc_admin_user', JSON.stringify(data.user));
                
                // Close modal and redirect to admin dashboard
                closeAdminLoginModal();
                
                // Determine correct path to admin dashboard
                const currentPath = window.location.pathname;
                let adminPath;
                
                if (currentPath.includes('/pages/')) {
                    adminPath = 'admin-dashboard.html';
                } else if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
                    adminPath = 'admin/admin-dashboard.html';
                } else {
                    // Root level page like vp-wall.html
                    adminPath = 'admin/admin-dashboard.html';
                }
                
                window.location.href = adminPath;
            } else {
                // Show error
                errorDiv.textContent = data.error || 'Invalid email or password';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            // Reset button state
            loginButtonText.style.display = 'inline';
            loginSpinner.style.display = 'none';
            loginButton.disabled = false;
        }
    };
}

/**
 * Inject admin login modal HTML into page
 */
function injectAdminLoginModal() {
    // Check if modal already exists
    if (document.getElementById('adminLoginModal')) {
        return;
    }
    
    const modalCode = `
<div id="adminLoginModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>🔐 Admin Login</h2>
            <button class="close" onclick="closeAdminLoginModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="adminLoginForm" onsubmit="handleAdminLogin(event)">
                <div class="form-group">
                    <label for="adminEmail">Email Address</label>
                    <input 
                        type="email" 
                        id="adminEmail" 
                        name="adminEmail" 
                        required 
                        placeholder="your.email@example.com"
                        autocomplete="email"
                    >
                </div>
                
                <div class="form-group">
                    <label for="adminPassword">Password</label>
                    <input 
                        type="password" 
                        id="adminPassword" 
                        name="adminPassword" 
                        required 
                        placeholder="Enter your password"
                        autocomplete="current-password"
                    >
                </div>
                
                <div id="loginError" class="error-message" style="display: none; color: #d32f2f; margin-bottom: 15px;"></div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeAdminLoginModal()">Cancel</button>
                    <button type="submit" class="btn-primary" id="loginButton">
                        <span id="loginButtonText">Login</span>
                        <span id="loginSpinner" style="display: none;">⏳ Logging in...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
/* Admin Login Modal Styles (OLS 98 - Injected) */
/* Highly specific selectors to avoid conflicts with existing page styles */

#adminLoginModal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10000;
    justify-content: center;
    align-items: center;
}

#adminLoginModal.modal {
    display: none;
}

#adminLoginModal .modal-content {
    max-width: 400px;
    background: var(--white, #ffffff);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    width: 90%;
}

#adminLoginModal .modal-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, var(--primary-green), var(--primary-maroon));
    color: var(--white, #ffffff);
    border-radius: 8px 8px 0 0;
}

#adminLoginModal .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--white, #ffffff);
}

#adminLoginModal .modal-header .close {
    background: transparent;
    border: none;
    color: var(--white, #ffffff);
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#adminLoginModal .modal-header .close:hover {
    opacity: 0.7;
}

#adminLoginModal .modal-body {
    padding: 25px;
}

#adminLoginModal .form-group {
    margin-bottom: 20px;
}

#adminLoginModal .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--text-dark, #333);
    font-size: 14px;
}

#adminLoginModal .form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    font-family: inherit;
}

#adminLoginModal .form-group input:focus {
    outline: none;
    border-color: var(--primary-green);
    box-shadow: 0 0 0 3px rgba(var(--primary-green-rgb), 0.1);
}

#adminLoginModal .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 25px;
}

#adminLoginModal .btn-secondary {
    padding: 10px 20px;
    background: var(--bg-light, #f5f5f5);
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    color: var(--text-dark, #333);
}

#adminLoginModal .btn-secondary:hover {
    background: #e0e0e0;
}

#adminLoginModal .btn-primary {
    padding: 10px 25px;
    background: var(--primary-green);
    color: var(--white, #ffffff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
}

#adminLoginModal .btn-primary:hover {
    background: var(--primary-maroon);
}

#adminLoginModal .btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}

#adminLoginModal .error-message {
    padding: 10px;
    background: #ffebee;
    border: 1px solid #ef5350;
    border-radius: 4px;
    font-size: 14px;
    color: #d32f2f;
}
</style>
    `;
    
    // Inject into page
    document.body.insertAdjacentHTML('beforeend', modalCode);
    console.log('✅ Admin login modal injected successfully');
}

/**
 * Dynamically load SEO Manager script (OLS 126)
 * Detects correct path based on page location
 */
function loadSEOManager() {
    // Determine if we're in root or /pages/ folder
    const path = window.location.pathname;
    const isInPagesFolder = path.includes('/pages/');
    const isRootPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/vp-wall.html') || !path.includes('/pages/');
    
    // Set correct script path
    let scriptPath;
    if (isInPagesFolder) {
        scriptPath = '../js/seo-manager.js';
    } else {
        scriptPath = 'js/seo-manager.js';
    }
    
    // Check if already loaded
    if (document.querySelector(`script[src="${scriptPath}"]`) || document.querySelector('script[src*="seo-manager.js"]')) {
        console.log('SEO Manager already loaded');
        return;
    }
    
    // Create and append script element
    const script = document.createElement('script');
    script.src = scriptPath;
    script.async = true;
    script.onload = () => console.log('✅ SEO Manager loaded via footer.js');
    script.onerror = () => console.warn('⚠️ SEO Manager failed to load from:', scriptPath);
    
    document.head.appendChild(script);
}

// Auto-detect page and initialize footer on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Inject modal first (so it's available immediately)
    injectAdminLoginModal();
    
    // Load SEO Manager dynamically (OLS 126)
    loadSEOManager();
    
    // Try to auto-detect current page from URL or data attribute
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        const currentPage = footerPlaceholder.dataset.page || 'home';
        initializeFooter(currentPage);
    }
});

/**
 * Page-aware admin dashboard toggle (OLS 98 - Simplified)
 * Opens login modal (now always available on every page)
 */
function toggleAdminDashboard(event) {
    // Save current scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Prevent page jump when clicking the link
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    
    // Open modal (injected by footer.js on every page)
    if (typeof openAdminLoginModal === 'function') {
        openAdminLoginModal();
    } else {
        console.error('openAdminLoginModal function not found');
    }
    
    // Restore scroll position immediately
    setTimeout(() => {
        window.scrollTo(0, scrollPosition);
    }, 0);
    
    return false; // Extra safeguard to prevent page jump
}