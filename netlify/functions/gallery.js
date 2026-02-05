const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    const store = getStore({
        name: 'ols-gallery',
        siteID: process.env.SITE_ID,
        token: process.env.NETLIFY_ACCESS_TOKEN
    });

    // GET - Read all gallery albums
    if (event.httpMethod === 'GET') {
        try {
            const galleryData = await store.get('all-gallery');
            
            if (!galleryData) {
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

            const gallery = JSON.parse(galleryData);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    data: gallery 
                })
            };
        } catch (error) {
            console.error('Error fetching gallery:', error);
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

    // POST - Create new gallery album
    if (event.httpMethod === 'POST') {
        try {
            const newAlbum = JSON.parse(event.body);
            
            // Validate required fields
            if (!newAlbum.title || !newAlbum.photos) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Missing required fields: title and photos are required' 
                    })
                };
            }

            // Get existing gallery
            const galleryData = await store.get('all-gallery');
            const gallery = galleryData ? JSON.parse(galleryData) : [];

            // Add new album
            gallery.push(newAlbum);

            // Save back to Blobs
            await store.set('all-gallery', JSON.stringify(gallery));

            return {
                statusCode: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    data: newAlbum 
                })
            };
        } catch (error) {
            console.error('Error creating gallery album:', error);
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

    // PUT - Update existing gallery album
    if (event.httpMethod === 'PUT') {
        try {
            const updatedAlbum = JSON.parse(event.body);
            
            if (!updatedAlbum.id) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Album ID is required' 
                    })
                };
            }

            // Get existing gallery
            const galleryData = await store.get('all-gallery');
            const gallery = galleryData ? JSON.parse(galleryData) : [];

            // Find and update album
            const index = gallery.findIndex(a => a.id === updatedAlbum.id);
            
            if (index === -1) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Album not found' 
                    })
                };
            }

            gallery[index] = updatedAlbum;

            // Save back to Blobs
            await store.set('all-gallery', JSON.stringify(gallery));

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    data: updatedAlbum 
                })
            };
        } catch (error) {
            console.error('Error updating gallery album:', error);
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

    // DELETE - Delete gallery album
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
                        error: 'Album ID is required' 
                    })
                };
            }

            // Get existing gallery
            const galleryData = await store.get('all-gallery');
            const gallery = galleryData ? JSON.parse(galleryData) : [];

            // Filter out the album to delete
            const filteredGallery = gallery.filter(a => a.id !== id);

            if (filteredGallery.length === gallery.length) {
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Album not found' 
                    })
                };
            }

            // Save back to Blobs
            await store.set('all-gallery', JSON.stringify(filteredGallery));

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Album deleted successfully' 
                })
            };
        } catch (error) {
            console.error('Error deleting gallery album:', error);
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

    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: ''
        };
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