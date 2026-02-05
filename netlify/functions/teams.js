// netlify/functions/teams.js
// OLS-Website Teams Management Function
// OLS 89 - Netlify Blobs with CommonJS format

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
                return await getTeams(headers);
            case 'POST':
                return await createTeam(event, headers);
            case 'PUT':
                return await updateTeam(event, headers);
            case 'DELETE':
                return await deleteTeam(event, headers);
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

async function getTeams(headers) {
    try {
        const store = getStore({
            name: 'ols-teams',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const teams = await store.get('all-teams', { type: 'json' });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: teams || []
            })
        };
    } catch (error) {
        console.error('Error getting teams:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve teams',
                message: error.message
            })
        };
    }
}

async function createTeam(event, headers) {
    try {
        const teamData = JSON.parse(event.body);
        
        const required = ['name', 'slug', 'ageGroup'];
        for (const field of required) {
            if (!teamData[field]) {
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
            name: 'ols-teams',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const teams = await store.get('all-teams', { type: 'json' }) || [];

        const newTeam = {
            ...teamData,
            id: teamData.id || Date.now().toString(),
            createdAt: teamData.createdAt || new Date().toISOString(),
            slug: teamData.slug || '',
            ageGroup: teamData.ageGroup || 'senior',
            description: teamData.description || '',
            photo: teamData.photo || ''
        };

        const existingIndex = teams.findIndex(t => t.id === newTeam.id);
        if (existingIndex !== -1) {
            teams[existingIndex] = newTeam;
        } else {
            teams.push(newTeam);
        }

        await store.set('all-teams', JSON.stringify(teams));

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                data: newTeam,
                message: 'Team created successfully'
            })
        };
    } catch (error) {
        console.error('Error creating team:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to create team',
                message: error.message
            })
        };
    }
}

async function updateTeam(event, headers) {
    try {
        const teamData = JSON.parse(event.body);
        const teamId = teamData.id || event.queryStringParameters?.id;

        if (!teamId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Team ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-teams',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let teams = await store.get('all-teams', { type: 'json' }) || [];

        const teamIndex = teams.findIndex(t => t.id === teamId);

        if (teamIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Team not found'
                })
            };
        }

        const updatedTeam = {
            ...teams[teamIndex],
            ...teamData,
            id: teamId,
            updatedAt: new Date().toISOString()
        };

        teams[teamIndex] = updatedTeam;
        await store.set('all-teams', JSON.stringify(teams));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updatedTeam,
                message: 'Team updated successfully'
            })
        };
    } catch (error) {
        console.error('Error updating team:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update team',
                message: error.message
            })
        };
    }
}

async function deleteTeam(event, headers) {
    try {
        const teamId = event.queryStringParameters?.id;

        if (!teamId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Team ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-teams',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let teams = await store.get('all-teams', { type: 'json' }) || [];

        const teamIndex = teams.findIndex(t => t.id === teamId);

        if (teamIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Team not found'
                })
            };
        }

        teams.splice(teamIndex, 1);
        await store.set('all-teams', JSON.stringify(teams));

        console.log('Deleted team:', teamId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Team deleted successfully',
                deletedId: teamId
            })
        };
    } catch (error) {
        console.error('Error deleting team:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to delete team',
                message: error.message
            })
        };
    }
}