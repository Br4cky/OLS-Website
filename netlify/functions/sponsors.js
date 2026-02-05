const { getStore } = require('@netlify/blobs');
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: ''
        };
    }

    // Require auth for write operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        };
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    const store = getStore({
        name: 'ols-sponsors',
        siteID: process.env.SITE_ID,
        token: process.env.NETLIFY_ACCESS_TOKEN
    });

    // GET - Read all sponsors
    if (event.httpMethod === 'GET') {
        try {
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
                        data: [] 
                    })
                };
            }

            const sponsors = JSON.parse(sponsorsData);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    data: sponsors 
                })
            };
        } catch (error) {
            console.error('Error fetching sponsors:', error);
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
    }

    // POST - Create new sponsor
    if (event.httpMethod === 'POST') {
        try {
            const newSponsor = JSON.parse(event.body);
            
            // Validate required fields
            if (!newSponsor.name || !newSponsor.logo) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Missing required fields: name and logo are required' 
                    })
                };
            }

            // Get existing sponsors
            const sponsorsData = await store.get('all-sponsors');
            const sponsors = sponsorsData ? JSON.parse(sponsorsData) : [];

            // Add new sponsor
            sponsors.push(newSponsor);

            // Save back to Blobs
            await store.set('all-sponsors', JSON.stringify(sponsors));

            return {
                statusCode: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    data: newSponsor 
                })
            };
        } catch (error) {
            console.error('Error creating sponsor:', error);
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
    }

    // PUT - Update existing sponsor
    if (event.httpMethod === 'PUT') {
        try {
            const updatedSponsor = JSON.parse(event.body);
            
            if (!updatedSponsor.id) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Sponsor ID is required' 
                    })
                };
            }

            // Get existing sponsors
            const sponsorsData = await store.get('all-sponsors');
            const sponsors = sponsorsData ? JSON.parse(sponsorsData) : [];

            // Find and update sponsor
            const index = sponsors.findIndex(s => s.id === updatedSponsor.id);
            
            if (index === -1) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Sponsor not found' 
                    })
                };
            }

            sponsors[index] = updatedSponsor;

            // Save back to Blobs
            await store.set('all-sponsors', JSON.stringify(sponsors));

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    data: updatedSponsor 
                })
            };
        } catch (error) {
            console.error('Error updating sponsor:', error);
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
    }

    // DELETE - Delete sponsor
    if (event.httpMethod === 'DELETE') {
        try {
            const { id } = JSON.parse(event.body);
            
            if (!id) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Sponsor ID is required' 
                    })
                };
            }

            // Get existing sponsors
            const sponsorsData = await store.get('all-sponsors');
            const sponsors = sponsorsData ? JSON.parse(sponsorsData) : [];

            // Filter out the sponsor to delete
            const filteredSponsors = sponsors.filter(s => s.id !== id);

            if (filteredSponsors.length === sponsors.length) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Sponsor not found' 
                    })
                };
            }

            // Save back to Blobs
            await store.set('all-sponsors', JSON.stringify(filteredSponsors));

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Sponsor deleted successfully' 
                })
            };
        } catch (error) {
            console.error('Error deleting sponsor:', error);
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
    }

    return {
        statusCode: 405,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
            success: false, 
            error: 'Method not allowed' 
        })
    };
};