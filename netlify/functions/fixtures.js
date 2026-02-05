// netlify/functions/fixtures.js
// OLS-Website Fixtures Management Function
// OLS 83 - Netlify Blobs with CommonJS format

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
                return await getFixtures(headers);
            case 'POST':
                return await createFixture(event, headers);
            case 'PUT':
                return await updateFixture(event, headers);
            case 'DELETE':
                return await deleteFixture(event, headers);
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

async function getFixtures(headers) {
    try {
        const store = getStore({
            name: 'ols-fixtures',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const fixtures = await store.get('all-fixtures', { type: 'json' });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: fixtures || []
            })
        };
    } catch (error) {
        console.error('Error getting fixtures:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve fixtures',
                message: error.message
            })
        };
    }
}

async function createFixture(event, headers) {
    try {
        const fixtureData = JSON.parse(event.body);
        
        const required = ['team', 'opponent', 'dateTime', 'venue'];
        for (const field of required) {
            if (!fixtureData[field]) {
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
            name: 'ols-fixtures',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const fixtures = await store.get('all-fixtures', { type: 'json' }) || [];

        const newFixture = {
            ...fixtureData,
            id: fixtureData.id || Date.now().toString(),
            createdAt: fixtureData.createdAt || new Date().toISOString(),
            status: fixtureData.status || 'upcoming'
        };

        const existingIndex = fixtures.findIndex(f => f.id === newFixture.id);
        if (existingIndex !== -1) {
            fixtures[existingIndex] = newFixture;
        } else {
            fixtures.push(newFixture);
        }

        await store.set('all-fixtures', JSON.stringify(fixtures));

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                data: newFixture,
                message: 'Fixture created successfully'
            })
        };
    } catch (error) {
        console.error('Error creating fixture:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to create fixture',
                message: error.message
            })
        };
    }
}

async function updateFixture(event, headers) {
    try {
        const fixtureData = JSON.parse(event.body);
        const fixtureId = event.queryStringParameters?.id;

        if (!fixtureId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Fixture ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-fixtures',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let fixtures = await store.get('all-fixtures', { type: 'json' }) || [];

        const fixtureIndex = fixtures.findIndex(f => f.id === fixtureId);

        if (fixtureIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Fixture not found'
                })
            };
        }

        const updatedFixture = {
            ...fixtures[fixtureIndex],
            ...fixtureData,
            id: fixtureId,
            updatedAt: new Date().toISOString()
        };

        fixtures[fixtureIndex] = updatedFixture;
        await store.set('all-fixtures', JSON.stringify(fixtures));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updatedFixture,
                message: 'Fixture updated successfully'
            })
        };
    } catch (error) {
        console.error('Error updating fixture:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update fixture',
                message: error.message
            })
        };
    }
}

async function deleteFixture(event, headers) {
    try {
        const fixtureId = event.queryStringParameters?.id;

        if (!fixtureId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Fixture ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-fixtures',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let fixtures = await store.get('all-fixtures', { type: 'json' }) || [];

        const fixtureIndex = fixtures.findIndex(f => f.id === fixtureId);

        if (fixtureIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Fixture not found'
                })
            };
        }

        fixtures.splice(fixtureIndex, 1);
        await store.set('all-fixtures', JSON.stringify(fixtures));

        console.log('Deleted fixture:', fixtureId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Fixture deleted successfully',
                deletedId: fixtureId
            })
        };
    } catch (error) {
        console.error('Error deleting fixture:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to delete fixture',
                message: error.message
            })
        };
    }
}