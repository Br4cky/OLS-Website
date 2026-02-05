// netlify/functions/fixtures-bulk.js
// OLS 127 - Enhanced Bulk Fixtures Function
// Handles batch CREATE, UPDATE, and DELETE operations

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
        const action = requestData.action || 'update'; // Default to update for backwards compatibility

        // Get the store
        const store = getStore({
            name: 'ols-fixtures',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        // Get all existing fixtures
        let allFixtures = await store.get('all-fixtures', { type: 'json' }) || [];
        console.log(`📊 Current fixtures in store: ${allFixtures.length}`);

        let result;

        switch (action) {
            case 'create':
                result = await handleBulkCreate(requestData.fixtures, allFixtures, store);
                break;
            case 'update':
                result = await handleBulkUpdate(requestData.fixtures, allFixtures, store);
                break;
            case 'delete':
                result = await handleBulkDelete(requestData.fixtureIds, allFixtures, store);
                break;
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, error: `Unknown action: ${action}` })
                };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('❌ Bulk operation error:', error);
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

/**
 * OLS 127: Handle bulk CREATE of new fixtures
 */
async function handleBulkCreate(fixtures, allFixtures, store) {
    if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        return { success: false, error: 'Fixtures array is required and cannot be empty' };
    }

    console.log(`📦 Bulk CREATE request for ${fixtures.length} fixtures`);

    const results = {
        created: [],
        failed: []
    };

    for (const fixtureData of fixtures) {
        // Validate required fields
        const required = ['team', 'opponent', 'dateTime', 'venue'];
        const missing = required.filter(field => !fixtureData[field]);
        
        if (missing.length > 0) {
            console.error(`❌ Fixture missing required fields: ${missing.join(', ')}`);
            results.failed.push({
                fixture: fixtureData,
                error: `Missing required fields: ${missing.join(', ')}`
            });
            continue;
        }

        // Create new fixture with ID and timestamps
        const newFixture = {
            ...fixtureData,
            id: fixtureData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            status: fixtureData.status || 'upcoming'
        };

        allFixtures.push(newFixture);
        results.created.push(newFixture);
        console.log(`✅ Created fixture: ${newFixture.id} - ${newFixture.opponent}`);
    }

    // Save all fixtures back to Blobs
    await store.set('all-fixtures', JSON.stringify(allFixtures));

    console.log(`✅ Bulk CREATE complete: ${results.created.length} created, ${results.failed.length} failed`);

    return {
        success: true,
        action: 'create',
        message: `Bulk create complete: ${results.created.length} fixtures created`,
        results: {
            created: results.created.length,
            failed: results.failed.length
        },
        details: {
            createdFixtures: results.created.map(f => ({ id: f.id, opponent: f.opponent, team: f.team })),
            failedFixtures: results.failed
        }
    };
}

/**
 * OLS 101/127: Handle bulk UPDATE of existing fixtures
 */
async function handleBulkUpdate(fixtures, allFixtures, store) {
    if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
        return { success: false, error: 'Fixtures array is required and cannot be empty' };
    }

    console.log(`📦 Bulk UPDATE request for ${fixtures.length} fixtures`);

    const results = {
        updated: [],
        failed: [],
        notFound: []
    };

    for (const fixtureUpdate of fixtures) {
        if (!fixtureUpdate.id) {
            console.error('❌ Fixture missing ID:', fixtureUpdate);
            results.failed.push({
                fixture: fixtureUpdate,
                error: 'Missing fixture ID'
            });
            continue;
        }

        const fixtureIndex = allFixtures.findIndex(f => f.id === fixtureUpdate.id);

        if (fixtureIndex === -1) {
            console.warn(`⚠️ Fixture not found: ${fixtureUpdate.id}`);
            results.notFound.push({
                id: fixtureUpdate.id,
                fixture: fixtureUpdate
            });
            continue;
        }

        // Update the fixture (merge with existing, keeping the ID)
        const updatedFixture = {
            ...allFixtures[fixtureIndex],
            ...fixtureUpdate,
            id: fixtureUpdate.id,
            updatedAt: new Date().toISOString()
        };

        allFixtures[fixtureIndex] = updatedFixture;
        results.updated.push(updatedFixture);
        console.log(`✅ Updated fixture: ${updatedFixture.id} - ${updatedFixture.opponent}`);
    }

    // Save all fixtures back to Blobs
    await store.set('all-fixtures', JSON.stringify(allFixtures));

    console.log(`✅ Bulk UPDATE complete: ${results.updated.length} updated, ${results.failed.length} failed, ${results.notFound.length} not found`);

    return {
        success: true,
        action: 'update',
        message: `Bulk update complete: ${results.updated.length} fixtures updated`,
        results: {
            updated: results.updated.length,
            failed: results.failed.length,
            notFound: results.notFound.length
        },
        details: {
            updatedFixtures: results.updated.map(f => ({ id: f.id, opponent: f.opponent, team: f.team })),
            failedFixtures: results.failed,
            notFoundIds: results.notFound.map(nf => nf.id)
        }
    };
}

/**
 * OLS 127: Handle bulk DELETE of fixtures
 */
async function handleBulkDelete(fixtureIds, allFixtures, store) {
    if (!fixtureIds || !Array.isArray(fixtureIds) || fixtureIds.length === 0) {
        return { success: false, error: 'fixtureIds array is required and cannot be empty' };
    }

    console.log(`📦 Bulk DELETE request for ${fixtureIds.length} fixtures`);

    const results = {
        deleted: [],
        notFound: []
    };

    for (const fixtureId of fixtureIds) {
        const fixtureIndex = allFixtures.findIndex(f => f.id === fixtureId);

        if (fixtureIndex === -1) {
            console.warn(`⚠️ Fixture not found for deletion: ${fixtureId}`);
            results.notFound.push(fixtureId);
            continue;
        }

        // Store info before deletion for response
        const deletedFixture = allFixtures[fixtureIndex];
        results.deleted.push({
            id: deletedFixture.id,
            opponent: deletedFixture.opponent,
            team: deletedFixture.team
        });

        // Remove from array
        allFixtures.splice(fixtureIndex, 1);
        console.log(`✅ Deleted fixture: ${deletedFixture.id} - ${deletedFixture.opponent}`);
    }

    // Save updated fixtures back to Blobs
    await store.set('all-fixtures', JSON.stringify(allFixtures));

    console.log(`✅ Bulk DELETE complete: ${results.deleted.length} deleted, ${results.notFound.length} not found`);

    return {
        success: true,
        action: 'delete',
        message: `Bulk delete complete: ${results.deleted.length} fixtures deleted`,
        results: {
            deleted: results.deleted.length,
            notFound: results.notFound.length
        },
        details: {
            deletedFixtures: results.deleted,
            notFoundIds: results.notFound
        }
    };
}