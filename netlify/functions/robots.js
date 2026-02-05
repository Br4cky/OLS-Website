/**
 * Dynamic robots.txt Generator
 * OLS 126 - SEO Enhancement (White-Label Compatible)
 * 
 * Automatically detects domain and generates correct sitemap URL
 */

exports.handler = async (event, context) => {
    // Get the domain from the request
    const host = event.headers.host || event.headers.Host || 'localhost';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;
    
    // Generate robots.txt content
    const robotsTxt = `# robots.txt
# Auto-generated for ${host}

# Allow all search engines to crawl the site
User-agent: *
Allow: /

# Block admin pages from indexing
Disallow: /pages/admin-dashboard.html
Disallow: /admin/
Disallow: /.netlify/

# Point to sitemap
Sitemap: ${siteUrl}/sitemap.xml
`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        },
        body: robotsTxt
    };
};