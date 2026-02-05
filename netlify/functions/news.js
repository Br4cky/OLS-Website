// netlify/functions/news.js
// OLS-Website News Management Function
// OLS 85 - Netlify Blobs Migration from Forms

const { getStore } = require('@netlify/blobs');
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
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
                return await getNews(headers);
            case 'POST':
                return await createNewsArticle(event, headers);
            case 'PUT':
                return await updateNewsArticle(event, headers);
            case 'DELETE':
                return await deleteNewsArticle(event, headers);
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

async function getNews(headers) {
    try {
        const store = getStore({
            name: 'ols-news',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const news = await store.get('all-news', { type: 'json' });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: news || []
            })
        };
    } catch (error) {
        console.error('Error getting news:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to retrieve news',
                message: error.message
            })
        };
    }
}

async function createNewsArticle(event, headers) {
    try {
        const newsData = JSON.parse(event.body);
        
        // Validate required fields
        const required = ['title', 'content', 'category'];
        for (const field of required) {
            if (!newsData[field]) {
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
            name: 'ols-news',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        const news = await store.get('all-news', { type: 'json' }) || [];

        const newArticle = {
            ...newsData,
            id: newsData.id || Date.now().toString(),
            date: newsData.date || new Date().toISOString().split('T')[0],
            createdAt: newsData.createdAt || new Date().toISOString(),
            author: newsData.author || 'Club Admin',
            featured: newsData.featured || false
        };

        // Check for existing article with same ID
        const existingIndex = news.findIndex(article => article.id === newArticle.id);
        if (existingIndex !== -1) {
            news[existingIndex] = newArticle;
        } else {
            news.push(newArticle);
        }

        await store.set('all-news', JSON.stringify(news));

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                success: true,
                data: newArticle,
                message: 'News article created successfully'
            })
        };
    } catch (error) {
        console.error('Error creating news article:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to create news article',
                message: error.message
            })
        };
    }
}

async function updateNewsArticle(event, headers) {
    try {
        const newsData = JSON.parse(event.body);
        const articleId = event.queryStringParameters?.id;

        if (!articleId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Article ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-news',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let news = await store.get('all-news', { type: 'json' }) || [];

        const articleIndex = news.findIndex(article => article.id === articleId);

        if (articleIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Article not found'
                })
            };
        }

        const updatedArticle = {
            ...news[articleIndex],
            ...newsData,
            id: articleId,
            updatedAt: new Date().toISOString()
        };

        news[articleIndex] = updatedArticle;
        await store.set('all-news', JSON.stringify(news));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updatedArticle,
                message: 'News article updated successfully'
            })
        };
    } catch (error) {
        console.error('Error updating news article:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update news article',
                message: error.message
            })
        };
    }
}

async function deleteNewsArticle(event, headers) {
    try {
        const articleId = event.queryStringParameters?.id;

        if (!articleId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Article ID required'
                })
            };
        }

        const store = getStore({
            name: 'ols-news',
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        let news = await store.get('all-news', { type: 'json' }) || [];

        const articleIndex = news.findIndex(article => article.id === articleId);

        if (articleIndex === -1) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Article not found'
                })
            };
        }

        news.splice(articleIndex, 1);
        await store.set('all-news', JSON.stringify(news));

        console.log('Deleted news article:', articleId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'News article deleted successfully',
                deletedId: articleId
            })
        };
    } catch (error) {
        console.error('Error deleting news article:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to delete news article',
                message: error.message
            })
        };
    }
}