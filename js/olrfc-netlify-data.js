// js/olrfc-netlify-data.js
// OLS-Website Netlify Data Manager
// Handles data persistence using Netlify Forms as database

class OLRFCNetlifyDataManager {
    constructor() {
        this.siteUrl = window.location.origin;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic method to submit data to Netlify Forms
    async submitToNetlify(formName, data) {
        try {
            const formData = new FormData();
            
            // CRITICAL: Add form-name field first
            formData.append('form-name', formName);
            
            // Add all other data fields
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    // Convert booleans and objects to strings for form submission
                    const value = typeof data[key] === 'boolean' ? 
                        data[key].toString() : 
                        (typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
                    formData.append(key, value);
                }
            });

            // Debug logging (remove after testing)
            console.log('Submitting to form:', formName);
            console.log('Form data:', Object.fromEntries(formData));

            const response = await fetch('/', {
                method: 'POST',
                body: formData // Remove headers - let browser set correct headers for FormData
            });

            if (response.ok) {
                this.clearCache(formName);
                return { success: true, data };
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error submitting to ${formName}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get cached data or return null if expired
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        return null;
    }

    // Set cached data
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Clear cache for specific form type
    clearCache(formName) {
        this.cache.delete(formName);
    }


async createVP(vpData) {
    try {
        const response = await fetch('/.netlify/functions/vp-wall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vpData)
        });
        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async updateVP(vpId, vpData) {
    try {
        const response = await fetch('/.netlify/functions/vp-wall', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: vpId, ...vpData })
        });
        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async deleteVP(vpId) {
    try {
        const response = await fetch('/.netlify/functions/vp-wall', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: vpId })
        });
        return await response.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// OLS 127: Bulk VP operations
async createVPs(vps) {
    try {
        console.log(`📦 Bulk creating ${vps.length} VPs...`);

        const response = await fetch('/.netlify/functions/vp-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', vps })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Bulk VP create successful:', result.results);
            const currentVPs = JSON.parse(localStorage.getItem('olrfc_vps') || '[]');
            result.details.createdVPs.forEach(created => {
                const fullVP = vps.find(v => v.name === created.name);
                if (fullVP) currentVPs.push({ ...fullVP, id: created.id });
            });
            localStorage.setItem('olrfc_vps', JSON.stringify(currentVPs));
            return { success: true, data: result, message: result.message };
        } else {
            throw new Error(result.error || 'Failed to bulk create VPs');
        }
    } catch (error) {
        console.error('❌ Error bulk creating VPs:', error);
        return { success: false, error: error.message };
    }
}

async updateVPs(vps) {
    try {
        console.log(`📦 Bulk updating ${vps.length} VPs...`);

        const response = await fetch('/.netlify/functions/vp-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', vps })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Bulk VP update successful:', result.results);
            const currentVPs = JSON.parse(localStorage.getItem('olrfc_vps') || '[]');
            vps.forEach(vp => {
                const index = currentVPs.findIndex(v => v.id === vp.id);
                if (index !== -1) currentVPs[index] = { ...currentVPs[index], ...vp };
            });
            localStorage.setItem('olrfc_vps', JSON.stringify(currentVPs));
            return { success: true, data: result, message: result.message };
        } else {
            throw new Error(result.error || 'Failed to bulk update VPs');
        }
    } catch (error) {
        console.error('❌ Error bulk updating VPs:', error);
        return { success: false, error: error.message };
    }
}

async deleteVPs(vpIds) {
    try {
        console.log(`📦 Bulk deleting ${vpIds.length} VPs...`);

        const response = await fetch('/.netlify/functions/vp-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', vpIds })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Bulk VP delete successful:', result.results);
            const currentVPs = JSON.parse(localStorage.getItem('olrfc_vps') || '[]');
            const updatedVPs = currentVPs.filter(v => !vpIds.includes(v.id));
            localStorage.setItem('olrfc_vps', JSON.stringify(updatedVPs));
            return { success: true, data: result, message: result.message };
        } else {
            throw new Error(result.error || 'Failed to bulk delete VPs');
        }
    } catch (error) {
        console.error('❌ Error bulk deleting VPs:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all Vice Presidents from Netlify Blobs (OLS 114)
 * @returns {Promise<Array>} Array of VP objects
 */
async getVPs() {
    try {
        console.log('📥 Fetching VPs from Netlify Blobs...');
        
        const response = await fetch('/.netlify/functions/vp-wall', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const vps = result.data || [];
        
        // Update localStorage for immediate availability
        localStorage.setItem('olrfc_vps', JSON.stringify(vps));
        
        console.log('✅ VPs fetched successfully:', vps.length, 'VPs');
        return vps;
    } catch (error) {
        console.error('❌ Error fetching VPs:', error);
        // Fallback to localStorage
        const cached = JSON.parse(localStorage.getItem('olrfc_vps') || '[]');
        console.log('📦 Using cached VPs:', cached.length);
        return cached;
    }
}


    // FIXTURES METHODS
    async createFixture(fixtureData) {
        try {
            const data = {
                id: fixtureData.id || Date.now().toString(),
                ...fixtureData,
                createdAt: fixtureData.createdAt || new Date().toISOString(),
                status: fixtureData.status || 'upcoming'
            };

            // Call Netlify Blobs function instead of Forms
            const response = await fetch('/.netlify/functions/fixtures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update localStorage for immediate availability
                this.saveToLocalStorage('fixtures', data);
                
                // Sync to Google Calendar
                await this.syncFixtureToGoogleCalendar('create', data);
                
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to create fixture');
            }
        } catch (error) {
            console.error('Error creating fixture:', error);
            return { success: false, error: error.message };
        }
    }

    async updateFixture(fixtureId, fixtureData) {
        try {
            const data = {
                id: fixtureId,
                ...fixtureData,
                updatedAt: new Date().toISOString()
            };

            // Call Netlify Blobs function with PUT method
            const response = await fetch(`/.netlify/functions/fixtures?id=${fixtureId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update localStorage
                this.updateInLocalStorage('fixtures', fixtureId, data);
                
                // Sync to Google Calendar
                await this.syncFixtureToGoogleCalendar('update', data);
                
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to update fixture');
            }
        } catch (error) {
            console.error('Error updating fixture:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * OLS 101: Bulk update multiple fixtures in one request
     * More efficient than updating individually
     * @param {Array} fixtures - Array of fixture objects with IDs to update
     * @returns {Promise<Object>} Response with update results
     */
    async updateFixtures(fixtures) {
        try {
            console.log(`📦 Bulk updating ${fixtures.length} fixtures...`);

            // Validate all fixtures have IDs
            const fixturesWithoutIds = fixtures.filter(f => !f.id);
            if (fixturesWithoutIds.length > 0) {
                console.error('❌ Some fixtures missing IDs:', fixturesWithoutIds);
                return {
                    success: false,
                    error: `${fixturesWithoutIds.length} fixtures missing IDs`
                };
            }

            // Call the bulk update function
            const response = await fetch('/.netlify/functions/fixtures-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fixtures })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk update successful:', result.results);
                
                // Update localStorage with all fixtures
                fixtures.forEach(fixture => {
                    this.updateInLocalStorage('fixtures', fixture.id, fixture);
                });
                
                return {
                    success: true,
                    data: result,
                    message: result.message
                };
            } else {
                throw new Error(result.error || 'Failed to bulk update fixtures');
            }
        } catch (error) {
            console.error('❌ Error bulk updating fixtures:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * OLS 127: Bulk create multiple new fixtures in one request
     * @param {Array} fixtures - Array of fixture objects to create
     * @returns {Promise<Object>} Response with create results
     */
    async createFixtures(fixtures) {
        try {
            console.log(`📦 Bulk creating ${fixtures.length} fixtures...`);

            // Validate all fixtures have required fields
            const required = ['team', 'opponent', 'dateTime', 'venue'];
            const invalidFixtures = fixtures.filter(f => {
                return required.some(field => !f[field]);
            });

            if (invalidFixtures.length > 0) {
                console.error('❌ Some fixtures missing required fields:', invalidFixtures);
                return {
                    success: false,
                    error: `${invalidFixtures.length} fixtures missing required fields`
                };
            }

            // Call the bulk function with create action
            const response = await fetch('/.netlify/functions/fixtures-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'create',
                    fixtures: fixtures 
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk create successful:', result.results);
                
                // Update localStorage with new fixtures
                const currentFixtures = JSON.parse(localStorage.getItem('olrfc_fixtures') || '[]');
                result.details.createdFixtures.forEach(created => {
                    const fullFixture = fixtures.find(f => 
                        f.opponent === created.opponent && f.team === created.team
                    );
                    if (fullFixture) {
                        currentFixtures.push({ ...fullFixture, id: created.id });
                    }
                });
                localStorage.setItem('olrfc_fixtures', JSON.stringify(currentFixtures));
                
                return {
                    success: true,
                    data: result,
                    message: result.message
                };
            } else {
                throw new Error(result.error || 'Failed to bulk create fixtures');
            }
        } catch (error) {
            console.error('❌ Error bulk creating fixtures:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * OLS 127: Bulk delete multiple fixtures in one request
     * @param {Array} fixtureIds - Array of fixture IDs to delete
     * @returns {Promise<Object>} Response with delete results
     */
    async deleteFixtures(fixtureIds) {
        try {
            console.log(`📦 Bulk deleting ${fixtureIds.length} fixtures...`);

            if (!fixtureIds || fixtureIds.length === 0) {
                return {
                    success: false,
                    error: 'No fixture IDs provided'
                };
            }

            // Call the bulk function with delete action
            const response = await fetch('/.netlify/functions/fixtures-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'delete',
                    fixtureIds: fixtureIds 
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk delete successful:', result.results);
                
                // Update localStorage - remove deleted fixtures
                const currentFixtures = JSON.parse(localStorage.getItem('olrfc_fixtures') || '[]');
                const updatedFixtures = currentFixtures.filter(f => !fixtureIds.includes(f.id));
                localStorage.setItem('olrfc_fixtures', JSON.stringify(updatedFixtures));
                
                return {
                    success: true,
                    data: result,
                    message: result.message
                };
            } else {
                throw new Error(result.error || 'Failed to bulk delete fixtures');
            }
        } catch (error) {
            console.error('❌ Error bulk deleting fixtures:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async deleteFixture(fixtureData) {
        try {
            // Call Netlify Blobs function with DELETE method
            const response = await fetch(`/.netlify/functions/fixtures?id=${fixtureData.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Delete from localStorage
                const fixtures = JSON.parse(localStorage.getItem('olrfc_fixtures') || '[]');
                const updatedFixtures = fixtures.filter(f => f.id !== fixtureData.id);
                localStorage.setItem('olrfc_fixtures', JSON.stringify(updatedFixtures));
                
                // Delete from Google Calendar
                await this.syncFixtureToGoogleCalendar('delete', fixtureData);
                
                return { success: true };
            } else {
                throw new Error(result.error || 'Failed to delete fixture');
            }
        } catch (error) {
            console.error('Error deleting fixture:', error);
            return { success: false, error: error.message };
        }
    }

    // NEWS METHODS
    async createNews(newsData) {
    try {
        const data = {
            id: newsData.id || Date.now().toString(),
            ...newsData,
            createdAt: newsData.createdAt || new Date().toISOString(),
            date: newsData.date || new Date().toISOString().split('T')[0]
        };

        // Call Netlify Blobs function instead of Forms
        const response = await fetch('/.netlify/functions/news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Update localStorage for immediate availability
            this.saveToLocalStorage('olrfc_news', data);
            
            return { success: true, data: result.data };
        } else {
            throw new Error(result.error || 'Failed to create news article');
        }
    } catch (error) {
        console.error('Error creating news article:', error);
        return { success: false, error: error.message };
    }
}

async updateNews(articleId, newsData) {
    try {
        const data = {
            id: articleId,
            ...newsData,
            updatedAt: new Date().toISOString()
        };

        // Call Netlify Blobs function with PUT method
        const response = await fetch(`/.netlify/functions/news?id=${articleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Update localStorage
            this.updateInLocalStorage('olrfc_news', articleId, data);
            
            return { success: true, data: result.data };
        } else {
            throw new Error(result.error || 'Failed to update news article');
        }
    } catch (error) {
        console.error('Error updating news article:', error);
        return { success: false, error: error.message };
    }
}

async deleteNews(articleId) {
    try {
        // Call Netlify Blobs function with DELETE method
        const response = await fetch(`/.netlify/functions/news?id=${articleId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Delete from localStorage
            const news = JSON.parse(localStorage.getItem('olrfc_news') || '[]');
            const updatedNews = news.filter(article => article.id !== articleId);
            localStorage.setItem('olrfc_news', JSON.stringify(updatedNews));
            
            return { success: true };
        } else {
            throw new Error(result.error || 'Failed to delete news article');
        }
    } catch (error) {
        console.error('Error deleting news article:', error);
        return { success: false, error: error.message };
    }
}

    // PLAYERS METHODS
    async createPlayer(playerData) {
    try {
        const data = {
            id: playerData.id || Date.now().toString(),
            ...playerData,
            createdAt: playerData.createdAt || new Date().toISOString(),
            appearances: playerData.appearances || 0
        };

        // Call Netlify Blobs function instead of Forms
        const response = await fetch('/.netlify/functions/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Update localStorage for immediate availability
            this.saveToLocalStorage('olrfc_players', data);
            
            return { success: true, data: result.data };
        } else {
            throw new Error(result.error || 'Failed to create player');
        }
    } catch (error) {
        console.error('Error creating player:', error);
        return { success: false, error: error.message };
    }
}

async updatePlayer(playerId, playerData) {
    try {
        const data = {
            id: playerId,
            ...playerData,
            updatedAt: new Date().toISOString()
        };

        // Call Netlify Blobs function with PUT method
        const response = await fetch(`/.netlify/functions/players?id=${playerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Update localStorage
            this.updateInLocalStorage('olrfc_players', playerId, data);
            
            return { success: true, data: result.data };
        } else {
            throw new Error(result.error || 'Failed to update player');
        }
    } catch (error) {
        console.error('Error updating player:', error);
        return { success: false, error: error.message };
    }
}

async deletePlayer(playerId) {
    try {
        // Call Netlify Blobs function with DELETE method
        const response = await fetch(`/.netlify/functions/players?id=${playerId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Delete from localStorage
            const players = JSON.parse(localStorage.getItem('olrfc_players') || '[]');
            const updatedPlayers = players.filter(player => player.id !== playerId);
            localStorage.setItem('olrfc_players', JSON.stringify(updatedPlayers));
            
            return { success: true };
        } else {
            throw new Error(result.error || 'Failed to delete player');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        return { success: false, error: error.message };
    }
}

// OLS 127: Bulk player operations
async createPlayers(players) {
    try {
        console.log(`📦 Bulk creating ${players.length} players...`);

        const response = await fetch('/.netlify/functions/players-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', players })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Bulk player create successful:', result.results);
            const currentPlayers = JSON.parse(localStorage.getItem('olrfc_players') || '[]');
            result.details.createdPlayers.forEach(created => {
                const fullPlayer = players.find(p => p.name === created.name && p.team === created.team);
                if (fullPlayer) currentPlayers.push({ ...fullPlayer, id: created.id });
            });
            localStorage.setItem('olrfc_players', JSON.stringify(currentPlayers));
            return { success: true, data: result, message: result.message };
        } else {
            throw new Error(result.error || 'Failed to bulk create players');
        }
    } catch (error) {
        console.error('❌ Error bulk creating players:', error);
        return { success: false, error: error.message };
    }
}

async updatePlayers(players) {
    try {
        console.log(`📦 Bulk updating ${players.length} players...`);

        const response = await fetch('/.netlify/functions/players-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', players })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Bulk player update successful:', result.results);
            const currentPlayers = JSON.parse(localStorage.getItem('olrfc_players') || '[]');
            players.forEach(player => {
                const index = currentPlayers.findIndex(p => p.id === player.id);
                if (index !== -1) currentPlayers[index] = { ...currentPlayers[index], ...player };
            });
            localStorage.setItem('olrfc_players', JSON.stringify(currentPlayers));
            return { success: true, data: result, message: result.message };
        } else {
            throw new Error(result.error || 'Failed to bulk update players');
        }
    } catch (error) {
        console.error('❌ Error bulk updating players:', error);
        return { success: false, error: error.message };
    }
}

async deletePlayers(playerIds) {
    try {
        console.log(`📦 Bulk deleting ${playerIds.length} players...`);

        const response = await fetch('/.netlify/functions/players-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', playerIds })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Bulk player delete successful:', result.results);
            const currentPlayers = JSON.parse(localStorage.getItem('olrfc_players') || '[]');
            const updatedPlayers = currentPlayers.filter(p => !playerIds.includes(p.id));
            localStorage.setItem('olrfc_players', JSON.stringify(updatedPlayers));
            return { success: true, data: result, message: result.message };
        } else {
            throw new Error(result.error || 'Failed to bulk delete players');
        }
    } catch (error) {
        console.error('❌ Error bulk deleting players:', error);
        return { success: false, error: error.message };
    }
}


    // TEAMS METHODS
    async createTeam(teamData) {
        try {
            const data = {
                id: teamData.id || Date.now().toString(),
                ...teamData,
                createdAt: teamData.createdAt || new Date().toISOString(),
                slug: teamData.slug || '',
                ageGroup: teamData.ageGroup || 'senior',
                description: teamData.description || '',
                photo: teamData.photo || ''
            };

            // Call Netlify Blobs function instead of Forms
            const response = await fetch('/.netlify/functions/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Team created in cloud storage');
                this.saveToLocalStorage('olrfc_teams', data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to create team');
            }
        } catch (error) {
            console.error('❌ Error creating team:', error);
            return { success: false, error: error.message };
        }
    }

    async updateTeam(teamId, teamData) {
        try {
            const data = {
                id: teamId,
                ...teamData,
                updatedAt: new Date().toISOString()
            };

            // Call Netlify Blobs function with PUT method
            const response = await fetch('/.netlify/functions/teams', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Team updated in cloud storage');
                this.updateInLocalStorage('olrfc_teams', teamId, data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to update team');
            }
        } catch (error) {
            console.error('❌ Error updating team:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteTeam(teamId) {
        try {
            // Pass ID in query string, matching fixtures pattern
            const response = await fetch(`/.netlify/functions/teams?id=${teamId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Team deleted from cloud storage');
                // Delete from localStorage
                const teams = JSON.parse(localStorage.getItem('olrfc_teams') || '[]');
                const updatedTeams = teams.filter(t => t.id !== teamId);
                localStorage.setItem('olrfc_teams', JSON.stringify(updatedTeams));
                return { success: true };
            } else {
                throw new Error(result.error || 'Failed to delete team');
            }
        } catch (error) {
            console.error('❌ Error deleting team:', error);
            return { success: false, error: error.message };
        }
    }

    // 🆕 OLS 119: Team filters now stored in site-settings, not Netlify Forms
    // createFilter() method removed - filters saved directly to site-settings['team-display-filters']

    // SPONSORS METHODS (Netlify Blobs)
    async createSponsor(sponsorData) {
        try {
            const data = {
                id: sponsorData.id || Date.now().toString(),
                ...sponsorData,
                createdAt: sponsorData.createdAt || new Date().toISOString()
            };

            const response = await fetch('/.netlify/functions/sponsors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Sponsor created in cloud storage');
                this.saveToLocalStorage('olrfc_sponsors', data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to create sponsor');
            }
        } catch (error) {
            console.error('❌ Error creating sponsor:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSponsor(sponsorId, sponsorData) {
        try {
            const data = {
                id: sponsorId,
                ...sponsorData,
                updatedAt: new Date().toISOString()
            };

            const response = await fetch('/.netlify/functions/sponsors', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Sponsor updated in cloud storage');
                this.updateInLocalStorage('olrfc_sponsors', sponsorId, data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to update sponsor');
            }
        } catch (error) {
            console.error('❌ Error updating sponsor:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteSponsor(sponsorId) {
        try {
            const response = await fetch('/.netlify/functions/sponsors', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: sponsorId })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Sponsor deleted from cloud storage');
                return true;
            } else {
                throw new Error(result.error || 'Failed to delete sponsor');
            }
        } catch (error) {
            console.error('❌ Error deleting sponsor:', error);
            throw error;
        }
    }

    // OLS 127: Bulk sponsor operations
    async createSponsors(sponsors) {
        try {
            console.log(`📦 Bulk creating ${sponsors.length} sponsors...`);

            const response = await fetch('/.netlify/functions/sponsors-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', sponsors })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk sponsor create successful:', result.results);
                const currentSponsors = JSON.parse(localStorage.getItem('olrfc_sponsors') || '[]');
                result.details.createdSponsors.forEach(created => {
                    const fullSponsor = sponsors.find(s => s.name === created.name);
                    if (fullSponsor) currentSponsors.push({ ...fullSponsor, id: created.id });
                });
                localStorage.setItem('olrfc_sponsors', JSON.stringify(currentSponsors));
                return { success: true, data: result, message: result.message };
            } else {
                throw new Error(result.error || 'Failed to bulk create sponsors');
            }
        } catch (error) {
            console.error('❌ Error bulk creating sponsors:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSponsors(sponsors) {
        try {
            console.log(`📦 Bulk updating ${sponsors.length} sponsors...`);

            const response = await fetch('/.netlify/functions/sponsors-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', sponsors })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk sponsor update successful:', result.results);
                sponsors.forEach(sponsor => {
                    this.updateInLocalStorage('olrfc_sponsors', sponsor.id, sponsor);
                });
                return { success: true, data: result, message: result.message };
            } else {
                throw new Error(result.error || 'Failed to bulk update sponsors');
            }
        } catch (error) {
            console.error('❌ Error bulk updating sponsors:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteSponsors(sponsorIds) {
        try {
            console.log(`📦 Bulk deleting ${sponsorIds.length} sponsors...`);

            const response = await fetch('/.netlify/functions/sponsors-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', sponsorIds })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk sponsor delete successful:', result.results);
                const currentSponsors = JSON.parse(localStorage.getItem('olrfc_sponsors') || '[]');
                const updatedSponsors = currentSponsors.filter(s => !sponsorIds.includes(s.id));
                localStorage.setItem('olrfc_sponsors', JSON.stringify(updatedSponsors));
                return { success: true, data: result, message: result.message };
            } else {
                throw new Error(result.error || 'Failed to bulk delete sponsors');
            }
        } catch (error) {
            console.error('❌ Error bulk deleting sponsors:', error);
            return { success: false, error: error.message };
        }
    }

    // SHOP METHODS
    async createShopItem(shopData) {
        const data = {
            'form-name': 'olrfc-shop',
            id: Date.now().toString(),
            ...shopData,
            createdAt: new Date().toISOString(),
            status: shopData.status || 'active',
            stock: shopData.stock || 0
        };

        const result = await this.submitToNetlify('olrfc-shop', data);
        if (result.success) {
            this.saveToLocalStorage('olrfc_shop', data);
        }
        return result;
    }

    // GALLERY METHODS
    async createGalleryAlbum(galleryData) {
        try {
            const data = {
                id: galleryData.id || Date.now().toString(),
                title: galleryData.title,
                category: galleryData.category,
                team: galleryData.team || 'other',
                fixtureId: galleryData.fixtureId || '',
                description: galleryData.description || '',
                date: galleryData.date || new Date().toISOString(),
                photoCount: galleryData.photoCount || galleryData.photos?.length || 0,
                photos: galleryData.photos || [],
                albumTag: galleryData.albumTag || '',
                createdAt: galleryData.date || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Call Netlify Blobs function instead of Forms
            const response = await fetch('/.netlify/functions/gallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Gallery album created in cloud storage');
                this.saveToLocalStorage('olrfc_gallery', data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to create gallery album');
            }
        } catch (error) {
            console.error('❌ Error creating gallery album:', error);
            return { success: false, error: error.message };
        }
    }

    async updateGalleryAlbum(albumId, galleryData) {
        try {
            const data = {
                id: albumId,
                ...galleryData,
                updatedAt: new Date().toISOString()
            };

            // Call Netlify Blobs function with PUT method
            const response = await fetch('/.netlify/functions/gallery', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Gallery album updated in cloud storage');
                this.updateInLocalStorage('olrfc_gallery', albumId, data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Failed to update gallery album');
            }
        } catch (error) {
            console.error('❌ Error updating gallery album:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteGalleryAlbum(albumId) {
        try {
            const response = await fetch('/.netlify/functions/gallery', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: albumId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Gallery album deleted from cloud storage');
                // Delete from localStorage
                const gallery = JSON.parse(localStorage.getItem('olrfc_gallery') || '[]');
                const updatedGallery = gallery.filter(a => a.id !== albumId);
                localStorage.setItem('olrfc_gallery', JSON.stringify(updatedGallery));
                return { success: true };
            } else {
                throw new Error(result.error || 'Failed to delete gallery album');
            }
        } catch (error) {
            console.error('❌ Error deleting gallery album:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 🆕 GOOGLE CALENDAR SYNC METHOD
    async syncFixtureToGoogleCalendar(action, fixtureData) {
        try {
            console.log(`📅 Syncing fixture to Google Calendar: ${action}`);
            
            const response = await fetch('/.netlify/functions/sync-fixture-to-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    fixture: fixtureData
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ Fixture synced to Google Calendar: ${result.action}`);
            
            return result;
        } catch (error) {
            console.error('⚠️ Failed to sync fixture to Google Calendar:', error);
            // Don't throw - allow the fixture creation to succeed even if calendar sync fails
            return { success: false, error: error.message };
        }
    }
    
    // UTILITY METHODS FOR LOCALSTORAGE SYNC
    saveToLocalStorage(key, data) {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            
            // 🔧 CHECK FOR DUPLICATES - Don't add if ID already exists
            const existingIndex = existing.findIndex(item => item.id === data.id);
            if (existingIndex !== -1) {
                console.log(`⚠️ Item with ID ${data.id} already exists in ${key}, skipping duplicate`);
                return; // Don't add duplicate
            }
            
            existing.push(data);
            localStorage.setItem(key, JSON.stringify(existing));
            console.log(`✅ Added item ${data.id} to ${key}`);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    updateInLocalStorage(key, id, data) {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const index = existing.findIndex(item => item.id === id);
            if (index !== -1) {
                existing[index] = { ...existing[index], ...data };
                localStorage.setItem(key, JSON.stringify(existing));
            }
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    }

    // OFFLINE FALLBACK - Use localStorage when Netlify unavailable
    async createWithFallback(type, data) {
        const methodMap = {
            'fixtures': () => this.createFixture(data),
            'news': () => this.createNews(data),
            'players': () => this.createPlayer(data),
            'teams': () => this.createTeam(data),
            'sponsors': () => this.createSponsor(data),
            'shop': () => this.createShopItem(data),
            'gallery': () => this.createGallery(data)
        };

        try {
            // Try Netlify first
            const result = await methodMap[type]();
            if (result.success) {
                return result;
            }
            throw new Error('Netlify submission failed');
        } catch (error) {
            console.warn('Netlify unavailable, using localStorage fallback:', error);
            
            // Fallback to localStorage
            const key = `olrfc_${type}`;
            const item = {
                id: Date.now().toString(),
                ...data,
                createdAt: new Date().toISOString(),
                _pendingSync: true // Flag for later sync
            };
            
            this.saveToLocalStorage(key, item);
            return { success: true, data: item, fallback: true };
        }
    }

    // Check if online and sync pending items
    async syncPendingItems() {
        const keys = ['olrfc_fixtures', 'olrfc_news', 'olrfc_players', 'olrfc_teams', 'olrfc_sponsors', 'olrfc_shop', 'olrfc_gallery'];
        
        for (const key of keys) {
            try {
                const items = JSON.parse(localStorage.getItem(key) || '[]');
                const pendingItems = items.filter(item => item._pendingSync);
                
                for (const item of pendingItems) {
                    const type = key.replace('olrfc_', '');
                    const cleanItem = { ...item };
                    delete cleanItem._pendingSync;
                    
                    const result = await this.createWithFallback(type, cleanItem);
                    if (result.success && !result.fallback) {
                        // Remove from localStorage pending list
                        const updatedItems = items.filter(i => i.id !== item.id || !i._pendingSync);
                        localStorage.setItem(key, JSON.stringify(updatedItems));
                    }
                }
            } catch (error) {
                console.error(`Error syncing ${key}:`, error);
            }
        }
    }

    // ========================================
    // ADMIN USERS METHODS (OLS 97)
    // ========================================

    /**
     * Login admin user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} User data if successful
     */
    async loginAdminUser(email, password) {
        try {
            const response = await fetch('/.netlify/functions/admin-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Get all admin users from Netlify Blobs
     * Passwords are never returned to frontend
     * @returns {Promise<Array>} Array of admin users (without passwords)
     */
    async getAdminUsers() {
        try {
            // Build auth token from session
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            const authToken = btoa(JSON.stringify({
                userId: session.userId,
                email: session.email,
                role: session.role,
                timestamp: Date.now()
            }));

            const response = await fetch('/.netlify/functions/admin-users', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching admin users:', error);
            return [];
        }
    }

    /**
     * Create a new admin user
     * Note: This saves the ENTIRE array like fixtures/news/etc.
     * @param {Object} newUser - New user object
     * @returns {Promise<Object>} Response from server
     */
    async createAdminUser(newUser) {
        try {
            // Get current users from localStorage first (faster)
            const currentUsers = JSON.parse(localStorage.getItem('olrfc_admin_users') || '[]');
            
            // Add new user
            const updatedUsers = [...currentUsers, newUser];
            
            // Save to localStorage immediately (instant UI feedback)
            localStorage.setItem('olrfc_admin_users', JSON.stringify(updatedUsers));

            // 🔒 OLS 98: Get session token for authentication
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            const authToken = btoa(JSON.stringify({
                userId: session.userId,
                email: session.email,
                role: session.role,
                timestamp: Date.now()
            }));

            // Save to Netlify Blobs (persistence)
            const response = await fetch('/.netlify/functions/admin-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ users: updatedUsers })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Admin user created in Blobs:', result);
            
            return result;
        } catch (error) {
            console.error('Error creating admin user:', error);
            throw error;
        }
    }

    /**
     * Update an existing admin user
     * @param {string} userId - ID of user to update
     * @param {Object} updates - Updated user data
     * @returns {Promise<Object>} Response from server
     */
    async updateAdminUser(userId, updates) {
        try {
            // Get current users
            const currentUsers = JSON.parse(localStorage.getItem('olrfc_admin_users') || '[]');
            
            // Find and update the user
            const updatedUsers = currentUsers.map(user => 
                user.id === userId ? { ...user, ...updates } : user
            );
            
            // Save to localStorage immediately
            localStorage.setItem('olrfc_admin_users', JSON.stringify(updatedUsers));

            // 🔒 OLS 98: Get session token for authentication
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            const authToken = btoa(JSON.stringify({
                userId: session.userId,
                email: session.email,
                role: session.role,
                timestamp: Date.now()
            }));

            // Save to Netlify Blobs
            const response = await fetch('/.netlify/functions/admin-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ users: updatedUsers })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Admin user updated in Blobs:', result);
            
            return result;
        } catch (error) {
            console.error('Error updating admin user:', error);
            throw error;
        }
    }

    /**
     * Delete an admin user from Netlify Blobs
     * @param {string} userId - ID of user to delete
     * @returns {Promise<Object>} Response from server
     */
    async deleteAdminUser(userId) {
        try {
            console.log('🗑️ Deleting admin user from Blobs:', userId);

            // 🔒 OLS 98: Get session token for authentication
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            const authToken = btoa(JSON.stringify({
                userId: session.userId,
                email: session.email,
                role: session.role,
                timestamp: Date.now()
            }));

            // Delete from Netlify Blobs first
            const response = await fetch(`/.netlify/functions/admin-users?id=${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Admin user deleted from Blobs:', result);

            // Update localStorage to match
            const currentUsers = JSON.parse(localStorage.getItem('olrfc_admin_users') || '[]');
            const updatedUsers = currentUsers.filter(user => user.id !== userId);
            localStorage.setItem('olrfc_admin_users', JSON.stringify(updatedUsers));

            return result;
        } catch (error) {
            console.error('Error deleting admin user:', error);
            throw error;
        }
    }

    /**
     * Reset an admin user's password (OLS 99)
     * Super-admin only feature
     * @param {string} userId - ID of user whose password to reset
     * @param {string} newPassword - New temporary password
     * @returns {Promise<Object>} Response from server
     */
    async resetAdminPassword(userId, newPassword) {
        try {
            console.log('🔒 Resetting password for user:', userId);

            // 🔒 Get session token for authentication
            const session = JSON.parse(localStorage.getItem('olrfc_admin_session') || '{}');
            const authToken = btoa(JSON.stringify({
                userId: session.userId,
                email: session.email,
                role: session.role,
                timestamp: Date.now()
            }));

            // Send reset request to serverless function
            const response = await fetch('/.netlify/functions/admin-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    action: 'resetPassword',
                    userId: userId,
                    newPassword: newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Password reset successful:', result);

            return result;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }

    // ==========================================
    // EVENTS ENQUIRY METHODS (OLS 107)
    // ==========================================

    // Get events enquiry settings
    async getEventsEnquirySettings() {
        try {
            const response = await fetch('/.netlify/functions/events-enquiry-settings', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching events enquiry settings:', error);
            throw error;
        }
    }

    // Save events enquiry settings
    async saveEventsEnquirySettings(settings) {
        try {
            const response = await fetch('/.netlify/functions/events-enquiry-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Events enquiry settings saved:', result);
            return result;
        } catch (error) {
            console.error('Error saving events enquiry settings:', error);
            throw error;
        }
    }

    // Submit events enquiry (public form submission)
    async submitEventsEnquiry(formData) {
        try {
            const response = await fetch('/.netlify/functions/events-enquiry-submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Enquiry submitted successfully:', result);
            return result;
        } catch (error) {
            console.error('Error submitting enquiry:', error);
            throw error;
        }
    }

    // Get all enquiries (admin only)
    async getEventsEnquiries() {
        try {
            const response = await fetch('/.netlify/functions/events-enquiries', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching enquiries:', error);
            throw error;
        }
    }

    // Update enquiry status/notes (admin only)
    async updateEventsEnquiry(id, updates) {
        try {
            const response = await fetch('/.netlify/functions/events-enquiries', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, ...updates })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Enquiry updated:', result);
            return result;
        } catch (error) {
            console.error('Error updating enquiry:', error);
            throw error;
        }
    }

    // Delete enquiry (admin only)
    async deleteEventsEnquiry(id) {
        try {
            const response = await fetch(`/.netlify/functions/events-enquiries?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Enquiry deleted:', result);
            return result;
        } catch (error) {
            console.error('Error deleting enquiry:', error);
            throw error;
        }
    }

    // ==========================================
    // OLS 127: BULK CONTACTS METHODS
    // ==========================================

    async createContacts(contacts) {
        try {
            console.log(`📦 Bulk creating ${contacts.length} contacts...`);

            const response = await fetch('/.netlify/functions/contacts-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', contacts })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk contact create successful:', result.results);
                const currentContacts = JSON.parse(localStorage.getItem('olrfc_contacts') || '[]');
                result.details.createdContacts.forEach(created => {
                    const fullContact = contacts.find(c => c.name === created.name && c.role === created.role);
                    if (fullContact) currentContacts.push({ ...fullContact, id: created.id });
                });
                localStorage.setItem('olrfc_contacts', JSON.stringify(currentContacts));
                return { success: true, data: result, message: result.message };
            } else {
                throw new Error(result.error || 'Failed to bulk create contacts');
            }
        } catch (error) {
            console.error('❌ Error bulk creating contacts:', error);
            return { success: false, error: error.message };
        }
    }

    async updateContacts(contacts) {
        try {
            console.log(`📦 Bulk updating ${contacts.length} contacts...`);

            const response = await fetch('/.netlify/functions/contacts-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', contacts })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk contact update successful:', result.results);
                const currentContacts = JSON.parse(localStorage.getItem('olrfc_contacts') || '[]');
                contacts.forEach(contact => {
                    const index = currentContacts.findIndex(c => c.id === contact.id);
                    if (index !== -1) currentContacts[index] = { ...currentContacts[index], ...contact };
                });
                localStorage.setItem('olrfc_contacts', JSON.stringify(currentContacts));
                return { success: true, data: result, message: result.message };
            } else {
                throw new Error(result.error || 'Failed to bulk update contacts');
            }
        } catch (error) {
            console.error('❌ Error bulk updating contacts:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteContacts(contactIds) {
        try {
            console.log(`📦 Bulk deleting ${contactIds.length} contacts...`);

            const response = await fetch('/.netlify/functions/contacts-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', contactIds })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Bulk contact delete successful:', result.results);
                const currentContacts = JSON.parse(localStorage.getItem('olrfc_contacts') || '[]');
                const updatedContacts = currentContacts.filter(c => !contactIds.includes(c.id));
                localStorage.setItem('olrfc_contacts', JSON.stringify(updatedContacts));
                return { success: true, data: result, message: result.message };
            } else {
                throw new Error(result.error || 'Failed to bulk delete contacts');
            }
        } catch (error) {
            console.error('❌ Error bulk deleting contacts:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize global instance
window.netlifyDataManager = new OLRFCNetlifyDataManager();

// Sync pending items when online
window.addEventListener('online', () => {
    window.netlifyDataManager.syncPendingItems();
});