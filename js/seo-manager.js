/**
 * SEO Manager - Dynamic Meta Tag Injection
 * Injects SEO meta tags from CMS settings into page <head>
 * Works with existing page-title and page-description fields from admin dashboard
 * 
 * Features:
 * - Dynamic page titles (already working, this adds meta title tag)
 * - Meta descriptions from CMS
 * - Open Graph tags for Facebook/LinkedIn sharing
 * - Twitter Card tags
 * - Canonical URLs
 * - Schema.org structured data (SportsOrganization)
 */

// Page configuration mapping
const SEO_PAGE_CONFIG = {
    'home': {
        titleKey: 'homepage-page-title',
        descriptionKey: 'homepage-page-description',
        descriptionFallbackKey: 'homepage-hero-tagline', // Fallback to hero tagline if no description
        defaultTitle: 'Rugby Club',
        defaultDescription: 'Official website of our rugby club. News, fixtures, results and events.',
        schemaType: 'homepage'
    },
    'fixtures': {
        titleKey: 'fixtures-page-title',
        descriptionKey: 'fixtures-page-description',
        defaultTitle: 'Fixtures & Results',
        defaultDescription: 'View upcoming fixtures and past results for all teams.',
        schemaType: 'fixtures'
    },
    'news': {
        titleKey: 'news-page-title',
        descriptionKey: 'news-page-description',
        defaultTitle: 'Club News',
        defaultDescription: 'Latest news, match reports and updates from the club.',
        schemaType: 'page'
    },
    'events': {
        titleKey: 'events-page-title',
        descriptionKey: 'events-page-description',
        defaultTitle: 'Events Calendar',
        defaultDescription: 'Upcoming events, social functions and club activities.',
        schemaType: 'events'
    },
    'gallery': {
        titleKey: 'gallery-page-title',
        descriptionKey: 'gallery-page-description',
        defaultTitle: 'Photo Gallery',
        defaultDescription: 'Photos and memories from matches, events and club life.',
        schemaType: 'page'
    },
    'contacts': {
        titleKey: 'contacts-page-title',
        descriptionKey: 'contacts-page-description',
        defaultTitle: 'Club Contacts',
        defaultDescription: 'Get in touch with club officials, coaches and committee members.',
        schemaType: 'contact'
    },
    'teams': {
        titleKey: 'teams-page-title',
        descriptionKey: 'teams-page-description',
        defaultTitle: 'Our Teams',
        defaultDescription: 'Meet our senior, junior and youth rugby teams.',
        schemaType: 'page'
    },
    'players': {
        titleKey: 'players-page-title',
        descriptionKey: 'players-page-description',
        defaultTitle: 'Players',
        defaultDescription: 'Player profiles and squad information.',
        schemaType: 'page'
    },
    'sponsors': {
        titleKey: 'sponsors-page-title',
        descriptionKey: 'sponsors-page-description',
        defaultTitle: 'Our Sponsors',
        defaultDescription: 'Thank you to our sponsors and partners who support the club.',
        schemaType: 'page'
    },
    'shop': {
        titleKey: 'shop-page-title',
        descriptionKey: 'shop-page-description',
        defaultTitle: 'Club Shop',
        defaultDescription: 'Official club merchandise, kit and clothing.',
        schemaType: 'page'
    },
    'vp-wall': {
        titleKey: 'vpwall-page-title',
        descriptionKey: 'vpwall-page-description',
        descriptionFallbackKey: 'vpwall-page-subtitle', // Fallback to subtitle
        defaultTitle: 'Vice Presidents Wall',
        defaultDescription: 'Honouring our Vice Presidents who have supported the club.',
        schemaType: 'page'
    },
    'policies': {
        titleKey: 'policies-page-title',
        descriptionKey: 'policies-page-description',
        defaultTitle: 'Club Policies',
        defaultDescription: 'Club policies, safeguarding and governance documents.',
        schemaType: 'page'
    }
};

/**
 * Fetch SEO settings via shared settings service
 */
async function fetchSEOSettings() {
    try {
        // Use shared settings service to avoid redundant API calls
        const settings = window.siteSettings ? await window.siteSettings.get() : {};
        console.log('🔍 SEO Manager: Settings loaded via shared service');
        return settings;
    } catch (error) {
        console.error('SEO Manager: Error fetching settings:', error);
        return {};
    }
}

/**
 * Get a setting value with fallback
 */
function getSetting(settings, key, fallback) {
    return settings[key] || fallback;
}

/**
 * Create or update a meta tag
 */
function setMetaTag(name, content, isProperty = false) {
    if (!content) return;
    
    const attribute = isProperty ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
}

/**
 * Create or update a link tag
 */
function setLinkTag(rel, href) {
    if (!href) return;
    
    let link = document.querySelector(`link[rel="${rel}"]`);
    
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
    }
    
    link.setAttribute('href', href);
}

/**
 * Inject or update schema.org structured data
 */
function setSchemaMarkup(schemaData) {
    // Remove existing schema if present
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo-manager]');
    if (existingSchema) {
        existingSchema.remove();
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-manager', 'true');
    script.textContent = JSON.stringify(schemaData, null, 2);
    document.head.appendChild(script);
}

/**
 * Generate SportsOrganization schema for the club
 */
function generateClubSchema(settings) {
    const clubName = getSetting(settings, 'club-name', 'Rugby Club');
    const logoUrl = getSetting(settings, 'logo-url', '');
    const address = getSetting(settings, 'contact-address', ''); // Fixed: was club-address
    const email = getSetting(settings, 'contact-email', '');
    const phone = getSetting(settings, 'contact-phone', '');
    const facebook = getSetting(settings, 'social-facebook', '');
    const twitter = getSetting(settings, 'social-twitter', '');
    const instagram = getSetting(settings, 'social-instagram', '');
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "SportsOrganization",
        "name": clubName,
        "sport": "Rugby Union",
        "url": window.location.origin
    };
    
    // Add optional fields if available
    if (logoUrl) schema.logo = logoUrl;
    if (email) schema.email = email;
    if (phone) schema.telephone = phone;
    
    // Add address if available
    if (address) {
        schema.address = {
            "@type": "PostalAddress",
            "streetAddress": address
        };
    }
    
    // Add social profiles
    const sameAs = [];
    if (facebook) sameAs.push(facebook);
    if (twitter) sameAs.push(twitter);
    if (instagram) sameAs.push(instagram);
    if (sameAs.length > 0) schema.sameAs = sameAs;
    
    return schema;
}

/**
 * Generate canonical URL for current page
 */
function generateCanonicalUrl() {
    // Use clean URL without query params or hash
    const url = new URL(window.location.href);
    return url.origin + url.pathname;
}

/**
 * Main SEO injection function
 */
async function injectSEO(currentPage = 'home') {
    const settings = await fetchSEOSettings();
    const pageConfig = SEO_PAGE_CONFIG[currentPage] || SEO_PAGE_CONFIG['home'];
    
    // Get club-level settings
    const clubName = getSetting(settings, 'club-name', 'Rugby Club');
    const logoUrl = getSetting(settings, 'logo-url', '');
    const siteUrl = window.location.origin;
    
    // Get page-specific settings
    const pageTitle = getSetting(settings, pageConfig.titleKey, pageConfig.defaultTitle);
    
    // Try primary description key, then fallback key, then default
    let pageDescription = getSetting(settings, pageConfig.descriptionKey, '');
    if (!pageDescription && pageConfig.descriptionFallbackKey) {
        pageDescription = getSetting(settings, pageConfig.descriptionFallbackKey, '');
    }
    if (!pageDescription) {
        pageDescription = pageConfig.defaultDescription;
    }
    
    // Construct full title (page title should already include club name from CMS)
    // If it doesn't, we append it
    let fullTitle = pageTitle;
    if (!pageTitle.toLowerCase().includes(clubName.toLowerCase()) && currentPage !== 'home') {
        fullTitle = `${pageTitle} - ${clubName}`;
    }
    
    console.log(`🔍 SEO Manager: Injecting tags for "${currentPage}" page`);
    console.log(`   Title: ${fullTitle}`);
    console.log(`   Description: ${pageDescription.substring(0, 50)}...`);
    
    // ========== Basic Meta Tags ==========
    
    // Meta description
    setMetaTag('description', pageDescription);
    
    // Meta keywords (optional - less important for modern SEO but doesn't hurt)
    const keywords = `${clubName}, rugby club, rugby, fixtures, results, news`;
    setMetaTag('keywords', keywords);
    
    // ========== Open Graph Tags (Facebook, LinkedIn) ==========
    
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', clubName, true);
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', pageDescription, true);
    setMetaTag('og:url', generateCanonicalUrl(), true);
    
    // Use logo as default OG image, or a specific OG image if set
    const ogImage = getSetting(settings, 'seo-og-image', logoUrl);
    if (ogImage) {
        setMetaTag('og:image', ogImage, true);
        setMetaTag('og:image:alt', `${clubName} logo`, true);
    }
    
    // ========== Twitter Card Tags ==========
    
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', pageDescription);
    
    if (ogImage) {
        setMetaTag('twitter:image', ogImage);
        setMetaTag('twitter:image:alt', `${clubName} logo`);
    }
    
    // Twitter handle - try dedicated field first, then extract from URL
    let twitterHandle = getSetting(settings, 'social-twitter-handle', '');
    if (!twitterHandle) {
        // Try to extract handle from Twitter URL
        const twitterUrl = getSetting(settings, 'social-twitter', '');
        if (twitterUrl) {
            const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/i);
            if (match && match[1]) {
                twitterHandle = match[1];
            }
        }
    }
    if (twitterHandle) {
        setMetaTag('twitter:site', twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`);
    }
    
    // ========== Canonical URL ==========
    
    setLinkTag('canonical', generateCanonicalUrl());
    
    // ========== Schema.org Structured Data ==========
    
    if (pageConfig.schemaType === 'homepage' || pageConfig.schemaType === 'contact') {
        // Full club schema on homepage and contact page
        const clubSchema = generateClubSchema(settings);
        setSchemaMarkup(clubSchema);
    }
    
    console.log('✅ SEO Manager: All meta tags injected');
}

/**
 * Auto-detect current page from header placeholder or URL
 */
function detectCurrentPage() {
    // First try to get from header placeholder data attribute
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder && headerPlaceholder.dataset.page) {
        return headerPlaceholder.dataset.page;
    }
    
    // Fallback: detect from URL path
    const path = window.location.pathname.toLowerCase();
    
    if (path === '/' || path === '/index.html' || path.endsWith('/index.html')) {
        return 'home';
    }
    
    // Check for page names in path
    const pageMatches = [
        'fixtures', 'news', 'events', 'gallery', 'contacts', 'club-contacts',
        'teams', 'players', 'sponsors', 'shop', 'vp-wall', 'policies'
    ];
    
    for (const page of pageMatches) {
        if (path.includes(page)) {
            // Normalize club-contacts to contacts
            return page === 'club-contacts' ? 'contacts' : page;
        }
    }
    
    return 'home';
}

/**
 * Initialize SEO Manager
 * Call this after DOM is ready
 */
async function initializeSEO(currentPage = null) {
    const page = currentPage || detectCurrentPage();
    await injectSEO(page);
}

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure header.js has loaded settings first (can share cache)
    setTimeout(() => {
        initializeSEO();
    }, 100);
});

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeSEO, injectSEO, fetchSEOSettings };
}