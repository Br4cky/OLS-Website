// netlify/functions/fixtures.js
// OLS-Website Fixtures Management Function
// Handles CRUD operations for rugby fixtures data

exports.handler = async (event, context) => {
    // Enable CORS for frontend communication
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight requests
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
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Get all fixtures
async function getFixtures(headers) {
    // For now, return mock data matching your olrfc_fixtures structure
    // Later we'll integrate with Netlify Forms for persistence
    const mockFixtures = [
        {
            id: '1',
            team: 'mens-1st',
            opponent: 'Richmond RFC',
            dateTime: '2025-09-13T15:00:00Z',
            venue: 'Old Deer Park',
            competition: 'London League',
            ourScore: null,
            theirScore: null,
            status: 'upcoming'
        },
        {
            id: '2', 
            team: 'mens-2nd',
            opponent: 'Ealing RFC',
            dateTime: '2025-09-20T14:30:00Z',
            venue: 'Home',
            competition: 'League',
            ourScore: 24,
            theirScore: 18,
            status: 'completed'
        }
    ];

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            data: mockFixtures,
            count: mockFixtures.length
        })
    };
}

// Create new fixture
async function createFixture(event, headers) {
    try {
        const fixtureData = JSON.parse(event.body);
        
        // Validate required fields
        const required = ['team', 'opponent', 'dateTime', 'venue', 'competition'];
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

        // Add ID and timestamp
        const newFixture = {
            ...fixtureData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: 'upcoming'
        };

        // TODO: Save to Netlify Forms
        console.log('Creating fixture:', newFixture);

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
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Invalid JSON data'
            })
        };
    }
}

// Update existing fixture
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

        // Add update timestamp
        const updatedFixture = {
            ...fixtureData,
            id: fixtureId,
            updatedAt: new Date().toISOString()
        };

        // TODO: Update in Netlify Forms
        console.log('Updating fixture:', updatedFixture);

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
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Invalid JSON data'
            })
        };
    }
}

// Delete fixture
async function deleteFixture(event, headers) {
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

    // TODO: Delete from Netlify Forms
    console.log('Deleting fixture:', fixtureId);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Fixture deleted successfully'
        })
    };
}