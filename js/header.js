/**
 * Universal Header/Navigation Generator
 * Generates consistent header across all pages with page-specific active states
 * Now supports admin customization via Netlify Forms
 * OLS 129: Added header style support (gradient, solid, glass)
 */

// Default settings (fallback if API fails)
const defaultHeaderSettings = {
    clubName: 'Old Laurentian RFC',
    clubTagline: 'Est. 1919',
    logoUrl: null, // will use default path if null
    headerStyle: 'gradient', // OLS 129: gradient, solid, glass
    navigation: {
        home: true,
        players: true,
        shop: true,
        policies: true,
        contact: true,
        'venue-booking': true,
        'vp-wall': true
    }
};

// Cache for settings
let headerSettings = {...defaultHeaderSettings};
let settingsLoaded = false;

/**
 * Fetch customization settings from Netlify Blobs
 */
async function fetchHeaderSettings() {
    if (settingsLoaded) return headerSettings;

    try {
        // Use shared settings service to avoid redundant API calls
        const settings = window.siteSettings ? await window.siteSettings.get() : {};
        
        // Initialize navigation settings with defaults (all enabled)
        headerSettings.navigation = {
            home: true,
            players: true,
            shop: true,
            policies: true,
            contact: true,
            'venue-booking': true,
            'vp-wall': true
        };
        
        // Extract header settings directly from object
        if (settings['club-name']) {
            headerSettings.clubName = settings['club-name'];
            console.log(`  ✓ club-name = ${settings['club-name']}`);
        }
        if (settings['club-tagline']) {
            headerSettings.clubTagline = settings['club-tagline'];
            console.log(`  ✓ club-tagline = ${settings['club-tagline']}`);
        }
        if (settings['logo-url']) {
            headerSettings.logoUrl = settings['logo-url'];
            console.log(`  ✓ logo-url = ${settings['logo-url']}`);
        }
        
        // OLS 129: Extract header style
        if (settings['header-style']) {
            headerSettings.headerStyle = settings['header-style'];
            console.log(`  ✓ header-style = ${settings['header-style']}`);
        }
        
        // Extract navigation settings
        Object.keys(settings).forEach(key => {
            if (key.startsWith('navigation-')) {
                const navKey = key.replace('navigation-', '');
                headerSettings.navigation[navKey] = settings[key] === 'true';
                console.log(`  ✓ ${key} = ${settings[key]}`);
            }
        });
        
        console.log('🎯 Final navigation settings:', headerSettings.navigation);
        
        settingsLoaded = true;
        console.log('✅ Header settings loaded from Blobs');
        return headerSettings;
        
    } catch (error) {
        console.error('Error fetching header settings:', error);
        settingsLoaded = true;
        return headerSettings;
    }
}

function generateHeader(currentPage = 'home', settings = null) {
    // Determine if we're on homepage, in pages folder, or root-level page
    const isHomepage = currentPage === 'home';
    const isRootPage = currentPage === 'vp-wall'; // Root-level pages (not in /pages/)
    const pathType = isHomepage ? 'home' : (isRootPage ? 'root' : 'pages');
    
    // Define navigation items with their properties
    const navItems = [
        { 
            id: 'home', 
            text: 'Home', 
            href: { home: '#home', pages: '../index.html', root: 'index.html' },
            isActive: currentPage === 'home',
            adminControlled: true,
            settingKey: 'home'
        },
        { 
            id: 'news', 
            text: 'News', 
            href: { home: 'pages/news.html', pages: 'news.html', root: 'pages/news.html' },
            isActive: currentPage === 'news',
            alwaysVisible: true
        },
        { 
            id: 'fixtures', 
            text: 'Fixtures', 
            href: { home: 'pages/fixtures.html', pages: 'fixtures.html', root: 'pages/fixtures.html' },
            isActive: currentPage === 'fixtures',
            alwaysVisible: true
        },
        { 
            id: 'events', 
            text: 'Events', 
            href: { home: 'pages/events.html', pages: 'events.html', root: 'pages/events.html' },
            isActive: currentPage === 'events',
            alwaysVisible: true
        },
       
        { 
            id: 'sponsors', 
            text: 'Sponsors', 
            href: { home: 'pages/sponsors.html', pages: 'sponsors.html', root: 'pages/sponsors.html' },
            isActive: currentPage === 'sponsors',
            alwaysVisible: true
        },
        { 
            id: 'gallery', 
            text: 'Gallery', 
            href: { home: 'pages/gallery.html', pages: 'gallery.html', root: 'pages/gallery.html' },
            isActive: currentPage === 'gallery',
            alwaysVisible: true
        },
        { 
            id: 'about', 
            text: 'About', 
            href: { home: '#about', pages: '../index.html#about', root: 'index.html#about' },
            isActive: currentPage === 'about',
            alwaysVisible: true
        },
        { 
            id: 'players', 
            text: 'Players', 
            href: { home: 'pages/players.html', pages: 'players.html', root: 'pages/players.html' },
            isActive: currentPage === 'players',
            adminControlled: true,
            settingKey: 'players'
        },
        { 
            id: 'shop', 
            text: 'Shop', 
            href: { home: 'pages/shop.html', pages: 'shop.html', root: 'pages/shop.html' },
            isActive: currentPage === 'shop',
            adminControlled: true,
            settingKey: 'shop'
        },
        { 
            id: 'policies', 
            text: 'Policies', 
            href: { home: 'pages/policies.html', pages: 'policies.html', root: 'pages/policies.html' },
            isActive: currentPage === 'policies',
            adminControlled: true,
            settingKey: 'policies'
        },
        { 
            id: 'vp-wall', 
            text: 'VP Wall', 
            href: { home: 'vp-wall.html', pages: '../vp-wall.html', root: 'vp-wall.html' },
            isActive: currentPage === 'vp-wall',
            adminControlled: true,
            settingKey: 'vp-wall'
        },
        { 
            id: 'contact', 
            text: 'Contact', 
            href: { home: 'pages/club-contacts.html', pages: 'club-contacts.html', root: 'pages/club-contacts.html' },
            isActive: currentPage === 'contacts',
            adminControlled: true,
            settingKey: 'contact'
        },
         { 
            id: 'venue-booking', 
            text: 'Book Venue', 
            href: { home: 'pages/events.html#venue-enquiry-section', pages: 'events.html#venue-enquiry-section', root: 'pages/events.html#venue-enquiry-section' },
            isActive: false,
            adminControlled: true,
            settingKey: 'venue-booking',
            mobileOnly: true
        },
    ];

    // Use provided settings or defaults
    const activeSettings = settings || headerSettings;
    
    console.log('🔍 Generating header with navigation settings:', activeSettings.navigation);
    
    // Filter navigation items based on admin settings
    const visibleNavItems = navItems.filter(item => {
        // Always show items marked as alwaysVisible (core pages)
        if (item.alwaysVisible) {
            console.log(`  ✓ ${item.text} - always visible`);
            return true;
        }
        
        // For admin-controlled items, check the navigation settings
        if (item.adminControlled && item.settingKey) {
            // If navigation settings exist, use them; otherwise default to true (show)
            const navSettings = activeSettings.navigation || {};
            const isVisible = navSettings[item.settingKey] !== false;
            console.log(`  ${isVisible ? '✓' : '✗'} ${item.text} - admin controlled (${item.settingKey}=${navSettings[item.settingKey]})`);
            return isVisible;
        }
        
        // Show all other items by default
        console.log(`  ✓ ${item.text} - default visible`);
        return true;
    });
    
    // Use custom logo if set, otherwise use default path
    let logoPath;
    if (activeSettings.logoUrl) {
        logoPath = activeSettings.logoUrl;
    } else {
        logoPath = isHomepage ? 'images/logo/olrfc-logo.png' : (isRootPage ? 'images/logo/olrfc-logo.png' : '../images/logo/olrfc-logo.png');
    }

    // Determine logo link destination (homepage or scroll to top)
    const logoLink = isHomepage ? '#home' : (isRootPage ? 'index.html' : '../index.html');

    // Generate navigation items HTML (only for visible items)
    const navItemsHTML = visibleNavItems.map(item => {
        const href = item.href[pathType];
        const activeClass = item.isActive ? 'active' : '';
        const mobileOnlyClass = item.mobileOnly ? 'mobile-only' : '';
        
        return `<a href="${href}" class="nav-link ${activeClass} ${mobileOnlyClass}">${item.text}</a>`;
    }).join('\n    ');

    // OLS 129: Get header style class
    const headerStyle = activeSettings.headerStyle || 'gradient';
    const headerStyleClass = `header-style-${headerStyle}`;

    // Generate complete header HTML with customizable club name and tagline
    const headerHTML = `
    <header class="header ${headerStyleClass}">
        <div class="header-content">
            <a href="${logoLink}" class="logo-section logo-link">
                <div class="logo">
                    <img src="${logoPath}" alt="${activeSettings.clubName} Crest">
                </div>
                <div>
                    <div class="club-name">${activeSettings.clubName}</div>
                    <div class="tagline">${activeSettings.clubTagline}</div>
                </div>
            </a>
            <nav class="nav" id="nav">
    ${navItemsHTML}
</nav>
            <button class="menu-toggle" id="menuToggle">☰</button>
        </div>
    </header>
    `;

    return headerHTML;
}

/**
 * Generate favicon URLs from logo using Cloudinary transformations
 * @param {string} logoUrl - The Cloudinary logo URL
 * @returns {Object} Object containing favicon URLs for different sizes
 */
function generateFaviconUrls(logoUrl) {
    if (!logoUrl) return null;
    
    // Check if it's a Cloudinary URL
    if (!logoUrl.includes('cloudinary.com') || !logoUrl.includes('/upload/')) {
        console.log('Logo is not from Cloudinary, skipping favicon generation');
        return null;
    }
    
    // Generate different sizes using Cloudinary transformations
    // Format: c_fill (crop to fill), w/h (dimensions), f_png (force PNG format)
    return {
        favicon32: logoUrl.replace('/upload/', '/upload/c_fill,w_32,h_32,f_png/'),
        favicon16: logoUrl.replace('/upload/', '/upload/c_fill,w_16,h_16,f_png/'),
        appleTouchIcon: logoUrl.replace('/upload/', '/upload/c_fill,w_180,h_180,f_png/')
    };
}

/**
 * Inject favicon links into document head
 * @param {Object} faviconUrls - Object containing favicon URLs
 */
function injectFavicons(faviconUrls) {
    if (!faviconUrls) return;
    
    // Remove any existing favicon links to avoid duplicates
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());
    
    const head = document.head;
    
    // Standard favicon 32x32
    const favicon32 = document.createElement('link');
    favicon32.rel = 'icon';
    favicon32.type = 'image/png';
    favicon32.sizes = '32x32';
    favicon32.href = faviconUrls.favicon32;
    head.appendChild(favicon32);
    
    // Standard favicon 16x16
    const favicon16 = document.createElement('link');
    favicon16.rel = 'icon';
    favicon16.type = 'image/png';
    favicon16.sizes = '16x16';
    favicon16.href = faviconUrls.favicon16;
    head.appendChild(favicon16);
    
    // Apple touch icon for iOS
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.sizes = '180x180';
    appleTouchIcon.href = faviconUrls.appleTouchIcon;
    head.appendChild(appleTouchIcon);
    
    console.log('✅ Favicons auto-generated from logo');
}

/**
 * Initialize header on page load
 * Call this function with the current page identifier
 */
async function initializeHeader(currentPage = 'home') {
    const headerPlaceholder = document.getElementById('header-placeholder');
    
    if (headerPlaceholder) {
        // Fetch customization settings first
        const settings = await fetchHeaderSettings();
        
        // Generate header with settings
        headerPlaceholder.innerHTML = generateHeader(currentPage, settings);
        
        // Auto-generate favicons from logo (if logo is from Cloudinary)
        if (settings.logoUrl) {
            const faviconUrls = generateFaviconUrls(settings.logoUrl);
            injectFavicons(faviconUrls);
        }
        
        // Initialize mobile menu toggle after header is inserted
        initMobileMenu();
    } else {
        console.warn('Header placeholder not found. Add <div id="header-placeholder"></div> to your HTML.');
    }
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    if (menuToggle && nav) {
        // Toggle mobile menu
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
        
        // Close mobile menu when clicking a link
        const navLinks = nav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = nav.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle && nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
        });
    }
}

// Auto-detect page and initialize header on DOM load
document.addEventListener('DOMContentLoaded', function() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const currentPage = headerPlaceholder.dataset.page || 'home';
        initializeHeader(currentPage);
    }
});