// netlify/functions/vp-wall.js
// VP Wall data management with Netlify Blobs
// OLS 114: Simplified to name + type (lifetime/annual) only

const { getStore } = require('@netlify/blobs');
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Require auth for write operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        // Configure Blobs store
        const store = getStore({
            name: 'ols-vp-wall',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        const method = event.httpMethod;

        switch (method) {
            case 'GET':
                return await getVPs(store, headers);
            
            case 'POST':
                return await createVP(store, event, headers);
            
            case 'PUT':
                return await updateVP(store, event, headers);
            
            case 'DELETE':
                return await deleteVP(store, event, headers);
            
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('VP Wall function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: error.message 
            })
        };
    }
};

// Get all VPs
async function getVPs(store, headers) {
    try {
        const vpsData = await store.get('vps', { type: 'json' });
        const vps = vpsData || [];
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: vps,
                count: vps.length
            })
        };
    } catch (error) {
        console.error('Error fetching VPs:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: [],
                count: 0
            })
        };
    }
}

// Create new VP
async function createVP(store, event, headers) {
    try {
        const vpData = JSON.parse(event.body);
        
        // Validation - only name is required now
        if (!vpData.name) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Name is required'
                })
            };
        }
        
        // Get existing VPs
        const existingVPs = await store.get('vps', { type: 'json' }) || [];
        
        // Create new VP object (simplified structure)
        const newVP = {
            id: vpData.id || Date.now().toString(),
            name: vpData.name.trim(),
            type: vpData.type || 'annual', // 'lifetime' or 'annual'
            notes: vpData.notes || null,
            dateAdded: vpData.dateAdded || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        // Add to array
        existingVPs.push(newVP);
        
        // Save back to Blobs
        await store.setJSON('vps', existingVPs);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: newVP,
                message: 'VP added to wall successfully'
            })
        };
    } catch (error) {
        console.error('Error creating VP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}

// Update existing VP
async function updateVP(store, event, headers) {
    try {
        const { id, ...updateData } = JSON.parse(event.body);
        
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'VP ID is required'
                })
            };
        }
        
        // Get existing VPs
        const vps = await store.get('vps', { type: 'json' }) || [];
        
        // Find and update VP
        const vpIndex = vps.findIndex(vp => vp.id === id);
        
        if (vpIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'VP not found'
                })
            };
        }
        
        // Update VP (preserve id, update rest)
        vps[vpIndex] = {
            ...vps[vpIndex],
            name: updateData.name?.trim() || vps[vpIndex].name,
            type: updateData.type || vps[vpIndex].type,
            notes: updateData.notes !== undefined ? updateData.notes : vps[vpIndex].notes,
            id: id, // Preserve ID
            lastUpdated: new Date().toISOString()
        };
        
        // Save back to Blobs
        await store.setJSON('vps', vps);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: vps[vpIndex],
                message: 'VP updated successfully'
            })
        };
    } catch (error) {
        console.error('Error updating VP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}

// Delete VP
async function deleteVP(store, event, headers) {
    try {
        const { id } = JSON.parse(event.body);
        
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'VP ID is required'
                })
            };
        }
        
        // Get existing VPs
        const vps = await store.get('vps', { type: 'json' }) || [];
        
        // Find VP
        const vpIndex = vps.findIndex(vp => vp.id === id);
        
        if (vpIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'VP not found'
                })
            };
        }
        
        // Remove VP
        const deletedVP = vps.splice(vpIndex, 1)[0];
        
        // Save back to Blobs
        await store.setJSON('vps', vps);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: deletedVP,
                message: 'VP removed from wall successfully'
            })
        };
    } catch (error) {
        console.error('Error deleting VP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}