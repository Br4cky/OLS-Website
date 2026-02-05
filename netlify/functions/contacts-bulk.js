// netlify/functions/contacts-bulk.js
// OLS 127 - Bulk Contacts Operations
// Handles batch CREATE, UPDATE, and DELETE operations for contacts

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed. Use POST for bulk operations.' })
        };
    }

    try {
        const requestData = JSON.parse(event.body);
        const action = requestData.action || 'update';

        const store = getStore({
            name: 'ols-contacts',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        let allContacts = await store.get('all-contacts', { type: 'json' }) || [];
        console.log(`📊 Current contacts in store: ${allContacts.length}`);

        let result;

        switch (action) {
            case 'create':
                result = await handleBulkCreate(requestData.contacts, allContacts, store);
                break;
            case 'update':
                result = await handleBulkUpdate(requestData.contacts, allContacts, store);
                break;
            case 'delete':
                result = await handleBulkDelete(requestData.contactIds, allContacts, store);
                break;
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: `Unknown action: ${action}` })
                };
        }

        return { statusCode: 200, headers, body: JSON.stringify(result) };

    } catch (error) {
        console.error('❌ Bulk contact operation error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error during bulk operation',
                message: error.message
            })
        };
    }
};

async function handleBulkCreate(contacts, allContacts, store) {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return { success: false, error: 'Contacts array is required and cannot be empty' };
    }

    console.log(`📦 Bulk CREATE request for ${contacts.length} contacts`);

    const results = { created: [], failed: [] };

    for (const contactData of contacts) {
        // Validate required fields
        const required = ['name', 'role', 'category'];
        const missing = required.filter(field => !contactData[field]);
        
        if (missing.length > 0) {
            results.failed.push({ contact: contactData, error: `Missing required fields: ${missing.join(', ')}` });
            continue;
        }

        const newContact = {
            ...contactData,
            id: contactData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            displayOrder: contactData.displayOrder || 999
        };

        allContacts.push(newContact);
        results.created.push(newContact);
        console.log(`✅ Created contact: ${newContact.id} - ${newContact.name}`);
    }

    await store.set('all-contacts', JSON.stringify(allContacts));

    return {
        success: true,
        action: 'create',
        message: `Bulk create complete: ${results.created.length} contacts created`,
        results: { created: results.created.length, failed: results.failed.length },
        details: {
            createdContacts: results.created.map(c => ({ id: c.id, name: c.name, role: c.role, category: c.category })),
            failedContacts: results.failed
        }
    };
}

async function handleBulkUpdate(contacts, allContacts, store) {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return { success: false, error: 'Contacts array is required and cannot be empty' };
    }

    console.log(`📦 Bulk UPDATE request for ${contacts.length} contacts`);

    const results = { updated: [], failed: [], notFound: [] };

    for (const contactUpdate of contacts) {
        if (!contactUpdate.id) {
            results.failed.push({ contact: contactUpdate, error: 'Missing contact ID' });
            continue;
        }

        const contactIndex = allContacts.findIndex(c => c.id === contactUpdate.id);

        if (contactIndex === -1) {
            results.notFound.push({ id: contactUpdate.id, contact: contactUpdate });
            continue;
        }

        const updatedContact = {
            ...allContacts[contactIndex],
            ...contactUpdate,
            id: contactUpdate.id,
            updatedAt: new Date().toISOString()
        };

        allContacts[contactIndex] = updatedContact;
        results.updated.push(updatedContact);
        console.log(`✅ Updated contact: ${updatedContact.id} - ${updatedContact.name}`);
    }

    await store.set('all-contacts', JSON.stringify(allContacts));

    return {
        success: true,
        action: 'update',
        message: `Bulk update complete: ${results.updated.length} contacts updated`,
        results: { updated: results.updated.length, failed: results.failed.length, notFound: results.notFound.length },
        details: {
            updatedContacts: results.updated.map(c => ({ id: c.id, name: c.name, role: c.role })),
            failedContacts: results.failed,
            notFoundIds: results.notFound.map(nf => nf.id)
        }
    };
}

async function handleBulkDelete(contactIds, allContacts, store) {
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return { success: false, error: 'contactIds array is required and cannot be empty' };
    }

    console.log(`📦 Bulk DELETE request for ${contactIds.length} contacts`);

    const results = { deleted: [], notFound: [] };

    for (const contactId of contactIds) {
        const contactIndex = allContacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            results.notFound.push(contactId);
            continue;
        }

        const deletedContact = allContacts[contactIndex];
        results.deleted.push({ id: deletedContact.id, name: deletedContact.name, role: deletedContact.role });
        allContacts.splice(contactIndex, 1);
        console.log(`✅ Deleted contact: ${deletedContact.id} - ${deletedContact.name}`);
    }

    await store.set('all-contacts', JSON.stringify(allContacts));

    return {
        success: true,
        action: 'delete',
        message: `Bulk delete complete: ${results.deleted.length} contacts deleted`,
        results: { deleted: results.deleted.length, notFound: results.notFound.length },
        details: { deletedContacts: results.deleted, notFoundIds: results.notFound }
    };
}