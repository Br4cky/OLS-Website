const { getStore } = require('@netlify/blobs');

// ONE-TIME CLEANUP FUNCTION
// Deploy this, run it once via browser, then remove it

exports.handler = async (event, context) => {
    const store = getStore({
        name: 'ols-sponsors',
        siteID: process.env.SITE_ID,
        token: process.env.NETLIFY_ACCESS_TOKEN
    });

    // Placeholder image for sponsors that need logo re-upload
    const PLACEHOLDER_LOGO = 'https://res.cloudinary.com/dep5rhteb/image/upload/v1/placeholder-logo.png';

    try {
        console.log('🔍 Starting sponsor data cleanup...');
        
        // Get existing sponsor data
        const sponsorsData = await store.get('all-sponsors');
        
        if (!sponsorsData) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    message: 'No sponsor data found',
                    cleaned: 0
                })
            };
        }

        const sponsors = JSON.parse(sponsorsData);
        let cleanedCount = 0;
        let urlCount = 0;
        const cleanedNames = [];

        // Process each sponsor
        const cleanedSponsors = sponsors.map(sponsor => {
            if (sponsor.logo && sponsor.logo.startsWith('data:')) {
                // Found base64 logo - replace with placeholder
                cleanedCount++;
                cleanedNames.push(sponsor.name);
                console.log(`❌ Cleaning base64 from: ${sponsor.name}`);
                
                return {
                    ...sponsor,
                    logo: PLACEHOLDER_LOGO,
                    needsLogoUpload: true // Flag for admin to know
                };
            } else if (sponsor.logo && sponsor.logo.startsWith('http')) {
                urlCount++;
            }
            return sponsor;
        });

        // Calculate sizes
        const originalSize = Buffer.byteLength(sponsorsData, 'utf8');
        const cleanedData = JSON.stringify(cleanedSponsors);
        const newSize = Buffer.byteLength(cleanedData, 'utf8');

        // Save cleaned data
        await store.set('all-sponsors', cleanedData);

        console.log(`✅ Cleanup complete! Cleaned ${cleanedCount} sponsors`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Sponsor data cleaned successfully!',
                stats: {
                    totalSponsors: sponsors.length,
                    cleanedSponsors: cleanedCount,
                    urlSponsors: urlCount,
                    originalSizeBytes: originalSize,
                    originalSizeMB: (originalSize / 1024 / 1024).toFixed(2),
                    newSizeBytes: newSize,
                    newSizeMB: (newSize / 1024 / 1024).toFixed(2),
                    savedBytes: originalSize - newSize,
                    savedMB: ((originalSize - newSize) / 1024 / 1024).toFixed(2)
                },
                cleanedSponsorNames: cleanedNames,
                nextSteps: [
                    'Go to Admin Dashboard > Sponsors',
                    'Find sponsors with placeholder logos',
                    'Re-upload their logos via the normal upload process',
                    'Delete this cleanup function after done'
                ]
            })
        };

    } catch (error) {
        console.error('Error during cleanup:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};