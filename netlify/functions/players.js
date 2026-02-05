// netlify/functions/players.js
// OLS-Website Players Management Function
// OLS 85 - Netlify Blobs Migration from Forms

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const method = event.httpMethod;
        
        switch (method) {
            case 'GET':
                return await getPlayers(headers);
            case 'POST':
                return await createPlayer(event, headers);
            case 'PUT':
                return await updatePlayer(event, headers);
            case 'DELETE':
                return await deletePlayer(event, headers);
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

async function getPlayers(headers) {
    try {
        const store = getStore({
            name: 'ols-players',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const players = await store.get('all-players', { type: 'json' });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: players || []
            })
        };
    } catch (error) {
        console.error('Error getting players:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve players',
                message: error.message
            })
        };
    }
}

async function createPlayer(event, headers) {
    try {
        const playerData = JSON.parse(event.body);
        
        // Validate required fields
        const required = ['name', 'team', 'position'];
        for (const field of required) {
            if (!playerData[field]) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: `Missing required field: ${field}`
                    })
                };
            }
        }

        const store = getStore({
            name: 'ols-players',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const players = await store.get('all-players', { type: 'json' }) || [];

        const newPlayer = {
            ...playerData,
            id: playerData.id || Date.now().toString(),
            createdAt: playerData.createdAt || new Date().toISOString(),
            appearances: playerData.appearances || 0,
            photo: playerData.photo || ''
        };

        // Check for existing player with same ID
        const existingIndex = players.findIndex(p => p.id === newPlayer.id);
        if (existingIndex !== -1) {
            players[existingIndex] = newPlayer;
        } else {
            players.push(newPlayer);
        }

        await store.set('all-players', JSON.stringify(players));

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                data: newPlayer,
                message: 'Player created successfully'
            })
        };
    } catch (error) {
        console.error('Error creating player:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to create player',
                message: error.message
            })
        };
    }
}

async function updatePlayer(event, headers) {
    try {
        const playerData = JSON.parse(event.body);
        const playerId = event.queryStringParameters?.id;

        if (!playerId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Player ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-players',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let players = await store.get('all-players', { type: 'json' }) || [];

        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Player not found'
                })
            };
        }

        const updatedPlayer = {
            ...players[playerIndex],
            ...playerData,
            id: playerId,
            updatedAt: new Date().toISOString()
        };

        players[playerIndex] = updatedPlayer;
        await store.set('all-players', JSON.stringify(players));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updatedPlayer,
                message: 'Player updated successfully'
            })
        };
    } catch (error) {
        console.error('Error updating player:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update player',
                message: error.message
            })
        };
    }
}

async function deletePlayer(event, headers) {
    try {
        const playerId = event.queryStringParameters?.id;

        if (!playerId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Player ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-players',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let players = await store.get('all-players', { type: 'json' }) || [];

        const playerIndex = players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Player not found'
                })
            };
        }

        players.splice(playerIndex, 1);
        await store.set('all-players', JSON.stringify(players));

        console.log('Deleted player:', playerId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Player deleted successfully',
                deletedId: playerId
            })
        };
    } catch (error) {
        console.error('Error deleting player:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to delete player',
                message: error.message
            })
        };
    }
}