// netlify/functions/vp-bulk.js
// OLS 127 - Bulk Vice Presidents Operations
// Handles batch CREATE, UPDATE, and DELETE operations for VPs

const { getStore } = require('@netlify/blobs');
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

    // Require auth for write operations
    if (['POST', 'PUT', 'DELETE'].includes(event.httpMethod)) {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        const requestData = JSON.parse(event.body);
        const action = requestData.action || 'update';

        const store = getStore({
            name: 'ols-vp-wall',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        let allVPs = await store.get('vps', { type: 'json' }) || [];
        console.log(`📊 Current VPs in store: ${allVPs.length}`);

        let result;

        switch (action) {
            case 'create':
                result = await handleBulkCreate(requestData.vps, allVPs, store);
                break;
            case 'update':
                result = await handleBulkUpdate(requestData.vps, allVPs, store);
                break;
            case 'delete':
                result = await handleBulkDelete(requestData.vpIds, allVPs, store);
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
        console.error('❌ Bulk VP operation error:', error);
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

async function handleBulkCreate(vps, allVPs, store) {
    if (!vps || !Array.isArray(vps) || vps.length === 0) {
        return { success: false, error: 'VPs array is required and cannot be empty' };
    }

    console.log(`📦 Bulk CREATE request for ${vps.length} VPs`);

    const results = { created: [], failed: [] };

    for (const vpData of vps) {
        // Validate required fields
        const required = ['name', 'type'];
        const missing = required.filter(field => !vpData[field]);
        
        if (missing.length > 0) {
            results.failed.push({ vp: vpData, error: `Missing required fields: ${missing.join(', ')}` });
            continue;
        }

        // Validate type
        if (!['annual', 'lifetime'].includes(vpData.type)) {
            results.failed.push({ vp: vpData, error: 'Type must be "annual" or "lifetime"' });
            continue;
        }

        const newVP = {
            ...vpData,
            id: vpData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };

        allVPs.push(newVP);
        results.created.push(newVP);
        console.log(`✅ Created VP: ${newVP.id} - ${newVP.name}`);
    }

    await store.set('vps', JSON.stringify(allVPs));

    return {
        success: true,
        action: 'create',
        message: `Bulk create complete: ${results.created.length} VPs created`,
        results: { created: results.created.length, failed: results.failed.length },
        details: {
            createdVPs: results.created.map(v => ({ id: v.id, name: v.name, type: v.type })),
            failedVPs: results.failed
        }
    };
}

async function handleBulkUpdate(vps, allVPs, store) {
    if (!vps || !Array.isArray(vps) || vps.length === 0) {
        return { success: false, error: 'VPs array is required and cannot be empty' };
    }

    console.log(`📦 Bulk UPDATE request for ${vps.length} VPs`);

    const results = { updated: [], failed: [], notFound: [] };

    for (const vpUpdate of vps) {
        if (!vpUpdate.id) {
            results.failed.push({ vp: vpUpdate, error: 'Missing VP ID' });
            continue;
        }

        const vpIndex = allVPs.findIndex(v => v.id === vpUpdate.id);

        if (vpIndex === -1) {
            results.notFound.push({ id: vpUpdate.id, vp: vpUpdate });
            continue;
        }

        const updatedVP = {
            ...allVPs[vpIndex],
            ...vpUpdate,
            id: vpUpdate.id,
            updatedAt: new Date().toISOString()
        };

        allVPs[vpIndex] = updatedVP;
        results.updated.push(updatedVP);
        console.log(`✅ Updated VP: ${updatedVP.id} - ${updatedVP.name}`);
    }

    await store.set('vps', JSON.stringify(allVPs));

    return {
        success: true,
        action: 'update',
        message: `Bulk update complete: ${results.updated.length} VPs updated`,
        results: { updated: results.updated.length, failed: results.failed.length, notFound: results.notFound.length },
        details: {
            updatedVPs: results.updated.map(v => ({ id: v.id, name: v.name, type: v.type })),
            failedVPs: results.failed,
            notFoundIds: results.notFound.map(nf => nf.id)
        }
    };
}

async function handleBulkDelete(vpIds, allVPs, store) {
    if (!vpIds || !Array.isArray(vpIds) || vpIds.length === 0) {
        return { success: false, error: 'vpIds array is required and cannot be empty' };
    }

    console.log(`📦 Bulk DELETE request for ${vpIds.length} VPs`);

    const results = { deleted: [], notFound: [] };

    for (const vpId of vpIds) {
        const vpIndex = allVPs.findIndex(v => v.id === vpId);

        if (vpIndex === -1) {
            results.notFound.push(vpId);
            continue;
        }

        const deletedVP = allVPs[vpIndex];
        results.deleted.push({ id: deletedVP.id, name: deletedVP.name, type: deletedVP.type });
        allVPs.splice(vpIndex, 1);
        console.log(`✅ Deleted VP: ${deletedVP.id} - ${deletedVP.name}`);
    }

    await store.set('vps', JSON.stringify(allVPs));

    return {
        success: true,
        action: 'delete',
        message: `Bulk delete complete: ${results.deleted.length} VPs deleted`,
        results: { deleted: results.deleted.length, notFound: results.notFound.length },
        details: { deletedVPs: results.deleted, notFoundIds: results.notFound }
    };
}