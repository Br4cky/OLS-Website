// netlify/functions/events-enquiries.js
// OLS 107 - Events Enquiries Storage
// Handles CRUD operations for individual enquiries

const { getStore } = require("@netlify/blobs");
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Require auth for write operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        // Initialize Netlify Blobs
        const store = getStore({
            name: "events-enquiries",
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        const method = event.httpMethod;

        // GET - Retrieve all enquiries
        if (method === 'GET') {
            const enquiries = await store.get("list", { type: "json" }) || [];
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: enquiries })
            };
        }

        // POST - Create new enquiry
        if (method === 'POST') {
            const enquiryData = JSON.parse(event.body);
            
            // Get existing enquiries
            const enquiries = await store.get("list", { type: "json" }) || [];
            
            // Create new enquiry with metadata
            const newEnquiry = {
                id: Date.now().toString(),
                ...enquiryData,
                status: 'new',
                createdAt: new Date().toISOString(),
                readAt: null,
                notes: ''
            };
            
            // Add to beginning of array (newest first)
            enquiries.unshift(newEnquiry);
            
            // Keep only last 500 enquiries (prevent unlimited growth)
            if (enquiries.length > 500) {
                enquiries.splice(500);
            }
            
            // Save back to Blobs
            await store.setJSON("list", enquiries);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Enquiry stored successfully',
                    data: newEnquiry
                })
            };
        }

        // PUT - Update enquiry (status, notes, etc)
        if (method === 'PUT') {
            const { id, status, notes, readAt } = JSON.parse(event.body);
            
            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Enquiry ID required' })
                };
            }
            
            // Get existing enquiries
            const enquiries = await store.get("list", { type: "json" }) || [];
            
            // Find and update enquiry
            const index = enquiries.findIndex(e => e.id === id);
            
            if (index === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Enquiry not found' })
                };
            }
            
            // Update fields
            if (status) enquiries[index].status = status;
            if (notes !== undefined) enquiries[index].notes = notes;
            if (readAt !== undefined) enquiries[index].readAt = readAt;
            enquiries[index].updatedAt = new Date().toISOString();
            
            // Save back to Blobs
            await store.setJSON("list", enquiries);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Enquiry updated successfully',
                    data: enquiries[index]
                })
            };
        }

        // DELETE - Remove enquiry
        if (method === 'DELETE') {
            const { id } = event.queryStringParameters || {};
            
            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Enquiry ID required' })
                };
            }
            
            // Get existing enquiries
            const enquiries = await store.get("list", { type: "json" }) || [];
            
            // Filter out the enquiry
            const filtered = enquiries.filter(e => e.id !== id);
            
            if (filtered.length === enquiries.length) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Enquiry not found' })
                };
            }
            
            // Save back to Blobs
            await store.setJSON("list", filtered);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Enquiry deleted successfully'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Events enquiries error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to process request',
                details: error.message 
            })
        };
    }
};