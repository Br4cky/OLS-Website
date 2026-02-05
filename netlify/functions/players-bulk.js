// netlify/functions/players-bulk.js
// OLS 127 - Bulk Players Operations
// Handles batch CREATE, UPDATE, and DELETE operations for players

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
            name: 'ols-players',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        let allPlayers = await store.get('all-players', { type: 'json' }) || [];
        console.log(`📊 Current players in store: ${allPlayers.length}`);

        let result;

        switch (action) {
            case 'create':
                result = await handleBulkCreate(requestData.players, allPlayers, store);
                break;
            case 'update':
                result = await handleBulkUpdate(requestData.players, allPlayers, store);
                break;
            case 'delete':
                result = await handleBulkDelete(requestData.playerIds, allPlayers, store);
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
        console.error('❌ Bulk player operation error:', error);
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

async function handleBulkCreate(players, allPlayers, store) {
    if (!players || !Array.isArray(players) || players.length === 0) {
        return { success: false, error: 'Players array is required and cannot be empty' };
    }

    console.log(`📦 Bulk CREATE request for ${players.length} players`);

    const results = { created: [], failed: [] };

    for (const playerData of players) {
        // Validate required fields
        const required = ['name', 'team', 'position'];
        const missing = required.filter(field => !playerData[field]);
        
        if (missing.length > 0) {
            results.failed.push({ player: playerData, error: `Missing required fields: ${missing.join(', ')}` });
            continue;
        }

        const newPlayer = {
            ...playerData,
            id: playerData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            appearances: playerData.appearances || 0,
            photo: playerData.photo || ''
        };

        allPlayers.push(newPlayer);
        results.created.push(newPlayer);
        console.log(`✅ Created player: ${newPlayer.id} - ${newPlayer.name}`);
    }

    await store.set('all-players', JSON.stringify(allPlayers));

    return {
        success: true,
        action: 'create',
        message: `Bulk create complete: ${results.created.length} players created`,
        results: { created: results.created.length, failed: results.failed.length },
        details: {
            createdPlayers: results.created.map(p => ({ id: p.id, name: p.name, team: p.team, position: p.position })),
            failedPlayers: results.failed
        }
    };
}

async function handleBulkUpdate(players, allPlayers, store) {
    if (!players || !Array.isArray(players) || players.length === 0) {
        return { success: false, error: 'Players array is required and cannot be empty' };
    }

    console.log(`📦 Bulk UPDATE request for ${players.length} players`);

    const results = { updated: [], failed: [], notFound: [] };

    for (const playerUpdate of players) {
        if (!playerUpdate.id) {
            results.failed.push({ player: playerUpdate, error: 'Missing player ID' });
            continue;
        }

        const playerIndex = allPlayers.findIndex(p => p.id === playerUpdate.id);

        if (playerIndex === -1) {
            results.notFound.push({ id: playerUpdate.id, player: playerUpdate });
            continue;
        }

        const updatedPlayer = {
            ...allPlayers[playerIndex],
            ...playerUpdate,
            id: playerUpdate.id,
            updatedAt: new Date().toISOString()
        };

        allPlayers[playerIndex] = updatedPlayer;
        results.updated.push(updatedPlayer);
        console.log(`✅ Updated player: ${updatedPlayer.id} - ${updatedPlayer.name}`);
    }

    await store.set('all-players', JSON.stringify(allPlayers));

    return {
        success: true,
        action: 'update',
        message: `Bulk update complete: ${results.updated.length} players updated`,
        results: { updated: results.updated.length, failed: results.failed.length, notFound: results.notFound.length },
        details: {
            updatedPlayers: results.updated.map(p => ({ id: p.id, name: p.name, team: p.team })),
            failedPlayers: results.failed,
            notFoundIds: results.notFound.map(nf => nf.id)
        }
    };
}

async function handleBulkDelete(playerIds, allPlayers, store) {
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
        return { success: false, error: 'playerIds array is required and cannot be empty' };
    }

    console.log(`📦 Bulk DELETE request for ${playerIds.length} players`);

    const results = { deleted: [], notFound: [] };

    for (const playerId of playerIds) {
        const playerIndex = allPlayers.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            results.notFound.push(playerId);
            continue;
        }

        const deletedPlayer = allPlayers[playerIndex];
        results.deleted.push({ id: deletedPlayer.id, name: deletedPlayer.name, team: deletedPlayer.team });
        allPlayers.splice(playerIndex, 1);
        console.log(`✅ Deleted player: ${deletedPlayer.id} - ${deletedPlayer.name}`);
    }

    await store.set('all-players', JSON.stringify(allPlayers));

    return {
        success: true,
        action: 'delete',
        message: `Bulk delete complete: ${results.deleted.length} players deleted`,
        results: { deleted: results.deleted.length, notFound: results.notFound.length },
        details: { deletedPlayers: results.deleted, notFoundIds: results.notFound }
    };
}