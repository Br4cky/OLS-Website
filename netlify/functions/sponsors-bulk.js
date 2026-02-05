// netlify/functions/sponsors-bulk.js
// OLS 127 - Bulk Sponsors Operations
// Handles batch CREATE, UPDATE, and DELETE operations for sponsors

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
            name: 'ols-sponsors',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        let allSponsors = await store.get('all-sponsors', { type: 'json' }) || [];
        console.log(`📊 Current sponsors in store: ${allSponsors.length}`);

        let result;

        switch (action) {
            case 'create':
                result = await handleBulkCreate(requestData.sponsors, allSponsors, store);
                break;
            case 'update':
                result = await handleBulkUpdate(requestData.sponsors, allSponsors, store);
                break;
            case 'delete':
                result = await handleBulkDelete(requestData.sponsorIds, allSponsors, store);
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
        console.error('❌ Bulk sponsor operation error:', error);
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

async function handleBulkCreate(sponsors, allSponsors, store) {
    if (!sponsors || !Array.isArray(sponsors) || sponsors.length === 0) {
        return { success: false, error: 'Sponsors array is required and cannot be empty' };
    }

    console.log(`📦 Bulk CREATE request for ${sponsors.length} sponsors`);

    const results = { created: [], failed: [] };

    for (const sponsorData of sponsors) {
        // Validate required fields
        if (!sponsorData.name) {
            results.failed.push({ sponsor: sponsorData, error: 'Missing required field: name' });
            continue;
        }

        const newSponsor = {
            ...sponsorData,
            id: sponsorData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            active: sponsorData.active !== false,
            banner: sponsorData.banner !== false
        };

        allSponsors.push(newSponsor);
        results.created.push(newSponsor);
        console.log(`✅ Created sponsor: ${newSponsor.id} - ${newSponsor.name}`);
    }

    await store.set('all-sponsors', JSON.stringify(allSponsors));

    return {
        success: true,
        action: 'create',
        message: `Bulk create complete: ${results.created.length} sponsors created`,
        results: { created: results.created.length, failed: results.failed.length },
        details: {
            createdSponsors: results.created.map(s => ({ id: s.id, name: s.name, tier: s.tier })),
            failedSponsors: results.failed
        }
    };
}

async function handleBulkUpdate(sponsors, allSponsors, store) {
    if (!sponsors || !Array.isArray(sponsors) || sponsors.length === 0) {
        return { success: false, error: 'Sponsors array is required and cannot be empty' };
    }

    console.log(`📦 Bulk UPDATE request for ${sponsors.length} sponsors`);

    const results = { updated: [], failed: [], notFound: [] };

    for (const sponsorUpdate of sponsors) {
        if (!sponsorUpdate.id) {
            results.failed.push({ sponsor: sponsorUpdate, error: 'Missing sponsor ID' });
            continue;
        }

        const sponsorIndex = allSponsors.findIndex(s => s.id === sponsorUpdate.id);

        if (sponsorIndex === -1) {
            results.notFound.push({ id: sponsorUpdate.id, sponsor: sponsorUpdate });
            continue;
        }

        const updatedSponsor = {
            ...allSponsors[sponsorIndex],
            ...sponsorUpdate,
            id: sponsorUpdate.id,
            updatedAt: new Date().toISOString()
        };

        allSponsors[sponsorIndex] = updatedSponsor;
        results.updated.push(updatedSponsor);
        console.log(`✅ Updated sponsor: ${updatedSponsor.id} - ${updatedSponsor.name}`);
    }

    await store.set('all-sponsors', JSON.stringify(allSponsors));

    return {
        success: true,
        action: 'update',
        message: `Bulk update complete: ${results.updated.length} sponsors updated`,
        results: { updated: results.updated.length, failed: results.failed.length, notFound: results.notFound.length },
        details: {
            updatedSponsors: results.updated.map(s => ({ id: s.id, name: s.name, tier: s.tier })),
            failedSponsors: results.failed,
            notFoundIds: results.notFound.map(nf => nf.id)
        }
    };
}

async function handleBulkDelete(sponsorIds, allSponsors, store) {
    if (!sponsorIds || !Array.isArray(sponsorIds) || sponsorIds.length === 0) {
        return { success: false, error: 'sponsorIds array is required and cannot be empty' };
    }

    console.log(`📦 Bulk DELETE request for ${sponsorIds.length} sponsors`);

    const results = { deleted: [], notFound: [] };

    for (const sponsorId of sponsorIds) {
        const sponsorIndex = allSponsors.findIndex(s => s.id === sponsorId);

        if (sponsorIndex === -1) {
            results.notFound.push(sponsorId);
            continue;
        }

        const deletedSponsor = allSponsors[sponsorIndex];
        results.deleted.push({ id: deletedSponsor.id, name: deletedSponsor.name, tier: deletedSponsor.tier });
        allSponsors.splice(sponsorIndex, 1);
        console.log(`✅ Deleted sponsor: ${deletedSponsor.id} - ${deletedSponsor.name}`);
    }

    await store.set('all-sponsors', JSON.stringify(allSponsors));

    return {
        success: true,
        action: 'delete',
        message: `Bulk delete complete: ${results.deleted.length} sponsors deleted`,
        results: { deleted: results.deleted.length, notFound: results.notFound.length },
        details: { deletedSponsors: results.deleted, notFoundIds: results.notFound }
    };
}