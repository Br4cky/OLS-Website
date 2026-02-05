import { getStore } from "@netlify/blobs";

// Page configuration - mirrors seo-manager.js keys so CMS values are consistent
const SEO_PAGE_CONFIG = {
    'home': {
        titleKey: 'homepage-page-title',
        descriptionKey: 'homepage-page-description',
        descriptionFallbackKey: 'homepage-hero-tagline',
        defaultTitle: 'Home',
        defaultDescription: 'Official website. News, fixtures, results and events.'
    },
    'fixtures': {
        titleKey: 'fixtures-page-title',
        descriptionKey: 'fixtures-page-description',
        defaultTitle: 'Fixtures & Results',
        defaultDescription: 'View upcoming fixtures and past results for all teams.'
    },
    'news': {
        titleKey: 'news-page-title',
        descriptionKey: 'news-page-description',
        defaultTitle: 'Club News',
        defaultDescription: 'Latest news, match reports and updates from the club.'
    },
    'news-article': {
        titleKey: 'news-page-title',
        descriptionKey: 'news-page-description',
        defaultTitle: 'News Article',
        defaultDescription: 'Latest news, match reports and updates from the club.'
    },
    'events': {
        titleKey: 'events-page-title',
        descriptionKey: 'events-page-description',
        defaultTitle: 'Events Calendar',
        defaultDescription: 'Upcoming events, social functions and club activities.'
    },
    'gallery': {
        titleKey: 'gallery-page-title',
        descriptionKey: 'gallery-page-description',
        defaultTitle: 'Photo Gallery',
        defaultDescription: 'Photos and memories from matches, events and club life.'
    },
    'contacts': {
        titleKey: 'contacts-page-title',
        descriptionKey: 'contacts-page-description',
        defaultTitle: 'Club Contacts',
        defaultDescription: 'Get in touch with club officials, coaches and committee members.'
    },
    'teams': {
        titleKey: 'teams-page-title',
        descriptionKey: 'teams-page-description',
        defaultTitle: 'Our Teams',
        defaultDescription: 'Meet our senior, junior and youth rugby teams.'
    },
    'sponsors': {
        titleKey: 'sponsors-page-title',
        descriptionKey: 'sponsors-page-description',
        defaultTitle: 'Our Sponsors',
        defaultDescription: 'Thank you to our sponsors and partners who support the club.'
    },
    'shop': {
        titleKey: 'shop-page-title',
        descriptionKey: 'shop-page-description',
        defaultTitle: 'Club Shop',
        defaultDescription: 'Official club merchandise, kit and clothing.'
    },
    'vp-wall': {
        titleKey: 'vpwall-page-title',
        descriptionKey: 'vpwall-page-description',
        descriptionFallbackKey: 'vpwall-page-subtitle',
        defaultTitle: 'Vice Presidents Wall',
        defaultDescription: 'Honouring our Vice Presidents who have supported the club.'
    },
    'policies': {
        titleKey: 'policies-page-title',
        descriptionKey: 'policies-page-description',
        defaultTitle: 'Club Policies',
        defaultDescription: 'Club policies, safeguarding and governance documents.'
    }
};

// Detect which page config to use based on URL path
function detectPage(pathname) {
    const path = pathname.toLowerCase();

    if (path === '/' || path === '/index.html') {
        return 'home';
    }

    // Map URL paths to config keys
    const pathMappings = {
        'fixtures': 'fixtures',
        'news-article': 'news-article',
        'news': 'news',
        'events': 'events',
        'gallery': 'gallery',
        'club-contacts': 'contacts',
        'teams': 'teams',
        'sponsors': 'sponsors',
        'shop': 'shop',
        'vp-wall': 'vp-wall',
        'policies': 'policies'
    };

    for (const [urlPart, configKey] of Object.entries(pathMappings)) {
        if (path.includes(urlPart)) {
            return configKey;
        }
    }

    return null;
}

// Simple in-memory cache to avoid hitting Blobs on every request
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getSettings() {
    const now = Date.now();
    if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedSettings;
    }

    try {
        const store = getStore('ols-site-settings');
        const settings = await store.get('current-settings', { type: 'json' });
        cachedSettings = settings || {};
        cacheTimestamp = now;
        return cachedSettings;
    } catch (error) {
        console.error('SEO Injector: Error fetching settings:', error);
        return cachedSettings || {};
    }
}

function getSetting(settings, key, fallback) {
    return settings[key] || fallback;
}

export default async function handler(request, context) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Only process HTML pages - skip assets, API calls, admin pages
    const isHTML = pathname === '/' ||
        pathname.endsWith('.html') ||
        (!pathname.includes('.') && !pathname.startsWith('/.netlify'));

    // Skip admin pages - no SEO needed
    if (pathname.includes('admin')) {
        return;
    }

    // Skip non-HTML requests
    if (!isHTML) {
        return;
    }

    // Detect which page this is
    const pageKey = detectPage(pathname);
    if (!pageKey) {
        return;
    }

    const pageConfig = SEO_PAGE_CONFIG[pageKey];
    if (!pageConfig) {
        return;
    }

    // Get the original response
    const response = await context.next();
    const contentType = response.headers.get('content-type') || '';

    // Only transform HTML responses
    if (!contentType.includes('text/html')) {
        return response;
    }

    // Fetch settings from Blobs
    const settings = await getSettings();

    // Build the club name
    const clubName = getSetting(settings, 'club-name', '');

    // Build page title from CMS settings
    let pageTitle = getSetting(settings, pageConfig.titleKey, pageConfig.defaultTitle);

    // Build full title: "Page Title - Club Name" (or just club name for home)
    let fullTitle;
    if (clubName) {
        if (pageKey === 'home') {
            // For home, use CMS title if it already contains the club name, else "Club Name"
            fullTitle = pageTitle.toLowerCase().includes(clubName.toLowerCase())
                ? pageTitle
                : clubName;
        } else {
            // For other pages, append club name if not already present
            fullTitle = pageTitle.toLowerCase().includes(clubName.toLowerCase())
                ? pageTitle
                : `${pageTitle} - ${clubName}`;
        }
    } else {
        fullTitle = pageTitle;
    }

    // Build description from CMS settings
    let description = getSetting(settings, pageConfig.descriptionKey, '');
    if (!description && pageConfig.descriptionFallbackKey) {
        description = getSetting(settings, pageConfig.descriptionFallbackKey, '');
    }
    if (!description) {
        // Build a generic description using the club name if available
        if (clubName) {
            description = pageConfig.defaultDescription.replace(/the club/gi, clubName);
        } else {
            description = pageConfig.defaultDescription;
        }
    }

    // Read original HTML
    let html = await response.text();

    // Replace <title> tag content (handles any existing title, with or without id attribute)
    html = html.replace(
        /<title[^>]*>([^<]*)<\/title>/i,
        `<title>${fullTitle}</title>`
    );

    // Inject <meta name="description"> if not already present
    if (!html.includes('name="description"')) {
        html = html.replace(
            '</title>',
            `</title>\n    <meta name="description" content="${description.replace(/"/g, '&quot;')}">`
        );
    }

    // Inject Open Graph tags if not present
    if (!html.includes('property="og:title"')) {
        const ogImage = getSetting(settings, 'seo-og-image', '') || getSetting(settings, 'logo-url', '');
        let ogTags = `\n    <meta property="og:type" content="website">`;
        if (clubName) {
            ogTags += `\n    <meta property="og:site_name" content="${clubName.replace(/"/g, '&quot;')}">`;
        }
        ogTags += `\n    <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}">`;
        ogTags += `\n    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">`;
        ogTags += `\n    <meta property="og:url" content="${url.origin}${pathname}">`;
        if (ogImage) {
            ogTags += `\n    <meta property="og:image" content="${ogImage.replace(/"/g, '&quot;')}">`;
        }

        // Inject after description meta tag
        html = html.replace(
            /<meta name="description"[^>]*>/i,
            (match) => `${match}${ogTags}`
        );
    }

    // Return transformed HTML with original headers
    return new Response(html, {
        status: response.status,
        headers: response.headers
    });
}
