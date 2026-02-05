// netlify/functions/contacts.js
// OLS-Website Contacts Management Function
// FIXED: Now matches working fixtures.js pattern (CommonJS + proper getStore config)

const { getStore } = require('@netlify/blobs');
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Require auth for write operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        const method = event.httpMethod;
        
        switch (method) {
            case 'GET':
                return await getContacts(headers);
            case 'POST':
                return await saveContacts(event, headers);
            case 'PUT':
                return await updateContact(event, headers);
            case 'DELETE':
                return await deleteContact(event, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};

// GET - Retrieve all contacts
async function getContacts(headers) {
    try {
        const store = getStore({
            name: 'ols-contacts',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        const contacts = await store.get('all-contacts', { type: 'json' });

        console.log(`📞 GET contacts: ${(contacts || []).length} contacts`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: contacts || [],
                count: (contacts || []).length
            })
        };
    } catch (error) {
        console.error('Error getting contacts:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve contacts',
                message: error.message
            })
        };
    }
}

// POST - Save all contacts (bulk update) or add single contact
async function saveContacts(event, headers) {
    try {
        const body = JSON.parse(event.body);
        
        const store = getStore({
            name: 'ols-contacts',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        // Check if this is a bulk save (array in data property) or single contact
        if (body.data && Array.isArray(body.data)) {
            // Bulk save - replace all contacts
            const contacts = body.data;
            
            await store.set('all-contacts', JSON.stringify(contacts));
            
            console.log(`💾 POST contacts: Saved ${contacts.length} contacts (bulk)`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Contacts saved successfully',
                    count: contacts.length
                })
            };
        } else {
            // Single contact add - get existing, add new, save
            let contacts = await store.get('all-contacts', { type: 'json' }) || [];
            
            const newContact = {
                ...body,
                id: body.id || 'contact_' + Date.now().toString(),
                createdAt: body.createdAt || new Date().toISOString()
            };

            // Check if contact already exists (update) or is new (add)
            const existingIndex = contacts.findIndex(c => c.id === newContact.id);
            if (existingIndex !== -1) {
                contacts[existingIndex] = newContact;
            } else {
                contacts.push(newContact);
            }

            await store.set('all-contacts', JSON.stringify(contacts));

            console.log(`✅ POST contact: Added/updated ${newContact.id}`);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: newContact,
                    message: 'Contact saved successfully'
                })
            };
        }
    } catch (error) {
        console.error('Error saving contacts:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to save contacts',
                message: error.message
            })
        };
    }
}

// PUT - Update specific contact
async function updateContact(event, headers) {
    try {
        const contactData = JSON.parse(event.body);
        const contactId = event.queryStringParameters?.id || contactData.id;

        if (!contactId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Contact ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-contacts',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        let contacts = await store.get('all-contacts', { type: 'json' }) || [];

        const contactIndex = contacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Contact not found'
                })
            };
        }

        const updatedContact = {
            ...contacts[contactIndex],
            ...contactData,
            id: contactId,
            updatedAt: new Date().toISOString()
        };

        contacts[contactIndex] = updatedContact;
        await store.set('all-contacts', JSON.stringify(contacts));

        console.log(`✏️ PUT contact: Updated ${contactId}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updatedContact,
                message: 'Contact updated successfully'
            })
        };
    } catch (error) {
        console.error('Error updating contact:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update contact',
                message: error.message
            })
        };
    }
}

// DELETE - Delete specific contact
async function deleteContact(event, headers) {
    try {
        const contactId = event.queryStringParameters?.id;

        if (!contactId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Contact ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-contacts',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        let contacts = await store.get('all-contacts', { type: 'json' }) || [];

        const contactIndex = contacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Contact not found'
                })
            };
        }

        contacts.splice(contactIndex, 1);
        await store.set('all-contacts', JSON.stringify(contacts));

        console.log('🗑️ Deleted contact:', contactId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Contact deleted successfully',
                deletedId: contactId
            })
        };
    } catch (error) {
        console.error('Error deleting contact:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to delete contact',
                message: error.message
            })
        };
    }
}