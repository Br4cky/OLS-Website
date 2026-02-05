/**
 * Dynamic sitemap.xml Generator
 * OLS 126 - SEO Enhancement (White-Label Compatible)
 * 
 * Automatically detects domain and generates correct URLs for all pages
 */

exports.handler = async (event, context) => {
    // Get the domain from the request
    const host = event.headers.host || event.headers.Host || 'localhost';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;
    
    // Get current date for lastmod
    const today = new Date().toISOString().split('T')[0];
    
    // Define all pages with their properties
    const pages = [
        { path: '/', changefreq: 'daily', priority: '1.0' },
        { path: '/pages/news.html', changefreq: 'daily', priority: '0.9' },
        { path: '/pages/fixtures.html', changefreq: 'weekly', priority: '0.9' },
        { path: '/pages/events.html', changefreq: 'weekly', priority: '0.8' },
        { path: '/pages/gallery.html', changefreq: 'weekly', priority: '0.7' },
        { path: '/pages/sponsors.html', changefreq: 'monthly', priority: '0.6' },
        { path: '/pages/teams.html', changefreq: 'monthly', priority: '0.7' },
        { path: '/pages/players.html', changefreq: 'monthly', priority: '0.7' },
        { path: '/pages/club-contacts.html', changefreq: 'monthly', priority: '0.6' },
        { path: '/pages/shop.html', changefreq: 'weekly', priority: '0.6' },
        { path: '/vp-wall.html', changefreq: 'monthly', priority: '0.5' },
        { path: '/pages/policies.html', changefreq: 'yearly', priority: '0.3' }
    ];
    
    // Generate URL entries
    const urlEntries = pages.map(page => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');
    
    // Generate complete sitemap XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        },
        body: sitemapXml
    };
};