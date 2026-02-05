class OLRFCDataLoader {
    constructor() {
        this.newsContainer = null;
        this.fixturesContainer = null;
        this.netlifyToken = null; // Will be set from admin dashboard
        this.siteId = 'gleeful-panda-146290';
        this.init();
    }

    init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadAllContent());
        } else {
            this.loadAllContent();
        }
    }

    // NEW: Fetch data from Netlify Blobs via serverless function
    async syncFromNetlify(formName) {
    try {
        console.log(`Syncing ${formName} from Netlify...`);
        
        let response;
        let parsedData;

        // FIXTURES: Use Blobs endpoint
        if (formName === 'fixtures') {
            response = await fetch('/.netlify/functions/fixtures', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch fixtures: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // NEWS: Use Blobs endpoint
        else if (formName === 'news') {
            response = await fetch('/.netlify/functions/news', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch news: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // PLAYERS: Use Blobs endpoint (NEW!)
        else if (formName === 'players') {
            response = await fetch('/.netlify/functions/players', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch players: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // SPONSORS: Use Blobs endpoint
        else if (formName === 'sponsors') {
            response = await fetch('/.netlify/functions/sponsors', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch sponsors: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // GALLERY: Use Blobs endpoint
        else if (formName === 'gallery') {
            response = await fetch('/.netlify/functions/gallery', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch gallery: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // CONTACTS: Use Blobs endpoint
        else if (formName === 'contacts') {
            response = await fetch('/.netlify/functions/contacts', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch contacts: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // TEAMS: Use Blobs endpoint
        else if (formName === 'teams') {
            response = await fetch('/.netlify/functions/teams', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch teams: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }
        // SITE-SETTINGS: Use Blobs endpoint (OLS 90)
        // Returns single object (not array) with all settings
        else if (formName === 'site-settings') {
            response = await fetch('/.netlify/functions/site-settings', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch site-settings: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || {};
            
            // Store as object (not array) in localStorage
            localStorage.setItem(`olrfc_${formName}`, JSON.stringify(parsedData));
            console.log(`✅ Synced ${Object.keys(parsedData).length} site settings from Netlify Blobs`);
            
            return parsedData;
        }
        // ADMIN-USERS: Use Blobs endpoint (OLS 97)
        else if (formName === 'admin-users') {
            response = await fetch('/.netlify/functions/admin-users', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch admin-users: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
            
            // Store in localStorage (passwords are already stripped by backend)
            localStorage.setItem(`olrfc_${formName}`, JSON.stringify(parsedData));
            console.log(`✅ Synced ${parsedData.length} admin users from Netlify Blobs`);
            
            return parsedData;
        }
        // VPS (VICE PRESIDENTS): Use Blobs endpoint (OLS 114)
        else if (formName === 'vps') {
            response = await fetch('/.netlify/functions/vp-wall', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch vps: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
            
            // Store in localStorage
            localStorage.setItem(`olrfc_${formName}`, JSON.stringify(parsedData));
            console.log(`✅ Synced ${parsedData.length} VPs from Netlify Blobs`);
            
            return parsedData;
        }
        // ALL OTHER CONTENT TYPES: Use existing Forms endpoint
        else {
            response = await fetch('/.netlify/functions/get-submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formName })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch from Netlify: ${response.status}`);
            }

            const result = await response.json();
            parsedData = result.data || [];
        }

        // SAFETY CHECK: Don't overwrite existing data with empty cloud response
        const existingData = this.getData(formName);
        if (Array.isArray(parsedData) && parsedData.length === 0 && Array.isArray(existingData) && existingData.length > 0) {
            console.warn(`Sync returned empty ${formName} but localStorage has ${existingData.length} items - keeping existing data`);
            return existingData;
        }

        // Save to localStorage
        localStorage.setItem(`olrfc_${formName}`, JSON.stringify(parsedData));
        console.log(`Synced ${parsedData.length} ${formName} from Netlify`);

        return parsedData;
    } catch (error) {
        console.error(`Error syncing ${formName}:`, error);
        console.log(`Using localStorage data as fallback`);
        return this.getData(formName);
    }
}


    // NEW: Sync all data from Netlify - SMART SYNC WITH SAFETY CHECKS
    async syncAllFromNetlify(forceUpdate = false) {
        try {
            console.log('🌐 Starting Netlify sync...');
            
            // Store old data counts before syncing
            const oldNewsCount = this.getData('news').length;
            const oldFixturesCount = this.getData('fixtures').length;
            
            await this.syncFromNetlify('news');
            await this.syncFromNetlify('fixtures');
            await this.syncFromNetlify('players');
            await this.syncFromNetlify('sponsors');
            await this.syncFromNetlify('gallery');
            await this.syncFromNetlify('contacts');
            await this.syncFromNetlify('teams');
            await this.syncFromNetlify('team-filters'); // 🆕 OLS 72: Add team-filters sync
            await this.syncFromNetlify('site-settings'); // 🆕 OLS 74: Add site-settings sync (matches pattern: short name without prefix)
            await this.syncFromNetlify('admin-users'); // 🆕 OLS 97: Add admin-users sync
            await this.syncFromNetlify('vps'); // 🆕 OLS 114: Add VP Wall sync
            
            // Get new data counts after syncing
            const newNewsCount = this.getData('news').length;
            const newFixturesCount = this.getData('fixtures').length;
            
            console.log(`✅ Sync complete - News: ${oldNewsCount}→${newNewsCount}, Fixtures: ${oldFixturesCount}→${newFixturesCount}`);
            
            // Safety check now handled in syncFromNetlify() for all data types
            
            // Dispatch custom event to notify admin dashboard
            // console.log('📡 Dispatching netlifyDataSynced event');
            //window.dispatchEvent(new CustomEvent('netlifyDataSynced', {
                //detail: {
                   // timestamp: new Date().toISOString(),
                   // synced: true,
                  //  dataTypes: ['news', 'fixtures', 'players', 'sponsors'],
                  //  counts: {
                  //      news: newNewsCount,
                   //     fixtures: newFixturesCount
                  //  }
               // }
           // }));
            
            // Force immediate stats update if on admin dashboard
            if (window.location.pathname.includes('admin-dashboard.html')) {
                console.log('🔄 Admin dashboard detected, forcing stats refresh');
                
                // Wait a moment for data to settle
                setTimeout(function() {
                    if (window.adminSystem) {
                        console.log('✅ Calling forceStatsRefresh()');
                        window.adminSystem.forceStatsRefresh();
                    } else {
                        console.warn('⚠️ adminSystem not available yet');
                    }
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ Netlify sync failed:', error);
        }
    }

    // ✅ SMART SYNC: Sync on first visit, then cache for session
    async loadAllContent() {
    // Check if we've already synced this session
    const lastSync = sessionStorage.getItem('olrfc_last_sync');
    const now = Date.now();
    const syncInterval = 5 * 60 * 1000; // 5 minutes
    
    // ✅ SMART DECISION: Sync if...
    const shouldSync = !lastSync || (now - parseInt(lastSync)) > syncInterval;
    
    if (shouldSync && (window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
        console.log('🔄 Syncing data from Netlify (first visit or 5+ min elapsed)');
        
        // Sync from Netlify (empty data protection is built into syncFromNetlify)
        await this.syncAllFromNetlify();
        
        // Mark sync time
        sessionStorage.setItem('olrfc_last_sync', now.toString());
    } else {
        console.log('✅ Using cached data (synced recently)');
    }
    
    // ✅ NEW: Wait a moment for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Always load from localStorage
    //this.loadNews();
    this.loadFixtures();
    this.loadStats();
    
    console.log('✅ Content loaded');
    
    // ✅ NEW: Dispatch event to tell news-filter.js that data is ready
    window.dispatchEvent(new CustomEvent('olrfcDataReady', {
        detail: {
            timestamp: new Date().toISOString(),
            newsCount: this.getData('news').length,
            fixturesCount: this.getData('fixtures').length
        }
    }));
}

    getData(key) {
        try {
            const data = JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
            
            // 🔧 DEDUPLICATE by ID to prevent showing duplicates
            if (data.length > 0 && data[0] && data[0].id) {
                const seen = new Map();
                const deduplicated = [];
                
                for (const item of data) {
                    if (item && item.id && !seen.has(item.id)) {
                        seen.set(item.id, true);
                        deduplicated.push(item);
                    }
                }
                
                // If we found duplicates, save the cleaned version
                if (deduplicated.length < data.length) {
                    console.log(`🧹 [OLRFCDataLoader] Removed ${data.length - deduplicated.length} duplicate ${key} items`);
                    localStorage.setItem(`olrfc_${key}`, JSON.stringify(deduplicated));
                }
                
                return deduplicated;
            }
            
            return data;
        } catch (e) {
            console.error(`Error loading ${key} data:`, e);
            return [];
        }
    }

    // ✅ FIX #2: Smart loading - never clear if data exists
    loadNews() {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) return;

        const news = this.getData('news');
        
        // ✅ SAFETY CHECK - Don't clear if no data AND grid has content
        if (news.length === 0) {
            const existingCards = newsGrid.querySelectorAll('.news-card');
            if (existingCards.length > 0) {
                console.log('⚠️ No news in localStorage but cards exist - keeping existing content');
                return;
            }
            
            console.log('⚠️ No news in localStorage - showing placeholder');
            newsGrid.innerHTML = this.getDefaultNewsHTML();
            return;
        }

        // Clear and render new content
        newsGrid.innerHTML = '';

        // Show latest 3 articles
        const latestNews = news
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
        
        latestNews.forEach(article => {
            const newsCard = this.createNewsCard(article);
            newsGrid.appendChild(newsCard);
        });
        
        console.log(`✅ Loaded ${latestNews.length} news articles`);
    }

    createNewsCard(article) {
        const card = document.createElement('article');
        card.className = 'news-card fade-in';
        
        const categoryIcon = this.getCategoryIcon(article.category);
        const formattedDate = new Date(article.date).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // ✅ FIXED: Add custom image support with proper cropping
        const hasCustomImage = article.image && article.image.trim() !== '';
        
        const imageHTML = hasCustomImage 
            ? `<img src="${article.image}" 
                   alt="${article.title}" 
                   style="width: 100%; height: 200px; object-fit: cover; object-position: center top; border-radius: 10px 10px 0 0;">`
            : `<div class="placeholder-image">${categoryIcon} ${this.formatCategory(article.category)}</div>`;

        card.innerHTML = `
            <div class="news-image">
                ${imageHTML}
            </div>
            <div class="news-content">
                <div class="news-date">Published On ${formattedDate}</div>
                <h3 class="news-title">${window.escapeHtml ? window.escapeHtml(article.title) : this.escapeHtml(article.title)}</h3>
                <p class="news-excerpt">${window.escapeHtml ? window.escapeHtml(this.truncateText(article.content, 120)) : this.escapeHtml(this.truncateText(article.content, 120))}</p>
                <a href="#" class="btn btn-primary" onclick="showNewsModal('${this.escapeHtml(article.title)}', '${this.escapeHtml(article.content)}', '${formattedDate}', '${this.escapeHtml(article.author)}')">Read More</a>
            </div>
        `;

        return card;
    }

    // ✅ FIX #3: Added safety check for fixtures too
    loadFixtures() {
        const fixturesGrid = document.getElementById('fixtures-match-grid');
        if (!fixturesGrid) return;

        const fixtures = this.getData('fixtures');
        
        // ✅ SAFETY CHECK - Don't clear if no fixtures exist
        if (fixtures.length === 0) {
            console.log('⚠️ No fixtures in localStorage - keeping existing content');
            return;
        }

        // Get current team filter
        const activeTeam = document.querySelector('.team-filter-btn.active')?.dataset.team || 'mens-1st';
        
        // Filter fixtures by team
        const teamFixtures = fixtures.filter(fixture => fixture.team === activeTeam);
        
        // Sort by date
        teamFixtures.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        // Show latest 6 fixtures
        const displayFixtures = teamFixtures.slice(0, 6);
        
        fixturesGrid.innerHTML = '';
        
        displayFixtures.forEach(fixture => {
            const fixtureCard = this.createFixtureCard(fixture);
            fixturesGrid.appendChild(fixtureCard);
        });

        if (displayFixtures.length === 0) {
            fixturesGrid.innerHTML = `<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">No fixtures found for ${this.formatTeam(activeTeam)}.</p>`;
        }
        
        console.log(`✅ Loaded ${displayFixtures.length} fixtures`);
    }

    createFixtureCard(fixture) {
        const card = document.createElement('div');
        const isPlayed = fixture.ourScore !== null && fixture.theirScore !== null;
        
        if (isPlayed) {
            card.className = 'match-card result-card-detailed';
            const ourScore = parseInt(fixture.ourScore);
            const theirScore = parseInt(fixture.theirScore);
            const isWin = ourScore > theirScore;
            const isDraw = ourScore === theirScore;
            
            card.innerHTML = `
                <div class="match-type">Result</div>
                <div class="match-teams">Old Laurentian RFC vs ${fixture.opponent}</div>
                <div class="match-score">${fixture.ourScore} - ${fixture.theirScore}</div>
                <div class="match-details">
                    <span>${new Date(fixture.dateTime).toLocaleDateString()}</span>
                    <span>${fixture.venue === 'home' ? 'Home' : 'Away'}</span>
                    <span>${isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}</span>
                </div>
                <div class="match-competition">${fixture.competition || 'Friendly'}</div>
            `;
        } else {
            card.className = 'match-card fixture-card-detailed';
            const matchDate = new Date(fixture.dateTime);
            
            card.innerHTML = `
                <div class="match-type">Fixture</div>
                <div class="match-teams">Old Laurentian RFC vs ${fixture.opponent}</div>
                <div class="match-time-large">
                    ${matchDate.toLocaleDateString()}<br>
                    ${matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div class="match-details">
                    <span>${fixture.venue === 'home' ? 'Home Ground' : 'Away'}</span>
                    <span>Kick-off: ${matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="match-competition">${fixture.competition || 'Friendly'}</div>
            `;
        }

        return card;
    }

    // Load and update stats
    loadStats() {
        const news = this.getData('news');
        const fixtures = this.getData('fixtures');
        
        // Update wins count
        const results = fixtures.filter(f => f.ourScore !== null && f.theirScore !== null);
        const wins = results.filter(f => parseInt(f.ourScore) > parseInt(f.theirScore)).length;
        
        const winsElement = document.querySelector('.stat-item .stat-number');
        if (winsElement && winsElement.nextElementSibling?.textContent.includes('Wins')) {
            winsElement.textContent = wins;
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCategoryIcon(category) {
        const icons = {
            'match': '🏉',
            'training': '🏃',
            'social': '🎉',
            'club': '📢'
        };
        return icons[category] || '📰';
    }

    formatCategory(category) {
        const categories = {
            'match': 'Match Report',
            'training': 'Training',
            'social': 'Social Event',
            'club': 'Club Update'
        };
        return categories[category] || category;
    }

    formatTeam(team) {
        const teams = {
            'mens-1st': 'Mens 1st XV',
            'mens-2nd': 'Mens 2nd XV',
            'ladies': 'Phoenix Ladies',
            'colts': 'Colts',
            'u16s': 'U16s',
            'u14s': 'U14s'
        };
        return teams[team] || team;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    getDefaultNewsHTML() {
        return `
            <article class="news-card fade-in">
                <div class="news-image">
                    <div class="placeholder-image">🏉 Match Report</div>
                </div>
                <div class="news-content">
                    <div class="news-date">Recent</div>
                    <h3 class="news-title">Victory Against Local Rivals</h3>
                    <p class="news-excerpt">Old Laurentian RFC secured a thrilling victory in last weekend's derby match...</p>
                    <a href="#" class="btn btn-primary">Read More</a>
                </div>
            </article>
            <article class="news-card fade-in">
                <div class="news-image">
                    <div class="placeholder-image">🏃 Training</div>
                </div>
                <div class="news-content">
                    <div class="news-date">This Week</div>
                    <h3 class="news-title">New Season Training Begins</h3>
                    <p class="news-excerpt">Pre-season training has commenced with great enthusiasm from players and coaching staff...</p>
                    <a href="#" class="btn btn-primary">Read More</a>
                </div>
            </article>
            <article class="news-card fade-in">
                <div class="news-image">
                    <div class="placeholder-image">🎉 Community</div>
                </div>
                <div class="news-content">
                    <div class="news-date">Coming Soon</div>
                    <h3 class="news-title">Youth Rugby Initiative Launch</h3>
                    <p class="news-excerpt">We're excited to announce our new youth development program...</p>
                    <a href="#" class="btn btn-primary">Read More</a>
                </div>
            </article>
        `;
    }

    getDefaultFixturesHTML() {
        return `
            <div class="match-card result-card-detailed">
                <div class="match-type">Latest Result</div>
                <div class="match-teams">Old Laurentian RFC vs Derby RFC</div>
                <div class="match-score">24 - 17</div>
                <div class="match-details">
                    <span>June 22, 2025</span>
                    <span>Home</span>
                    <span>Victory</span>
                </div>
                <div class="match-competition">Regional Championship</div>
            </div>
            <div class="match-card fixture-card-detailed">
                <div class="match-type">Next Fixture</div>
                <div class="match-teams">Old Laurentian RFC vs Birmingham RFC</div>
                <div class="match-time-large">
                    July 6, 2025<br>
                    15:00
                </div>
                <div class="match-details">
                    <span>Home Ground</span>
                    <span>Kick-off: 15:00</span>
                </div>
                <div class="match-competition">Regional Championship</div>
            </div>
        `;
    }
}

// Initialize data loader
const olrfcData = new OLRFCDataLoader();

// ✅ Expose sync function globally for MANUAL use from admin dashboard ONLY
window.syncDataFromNetlify = async function() {
    console.log('🔄 Manual sync triggered from admin dashboard');
    await olrfcData.syncAllFromNetlify();
    alert('✅ Data synced from Netlify Forms!');
    location.reload();
};

// Team filter functionality for fixtures
function initializeTeamFilters() {
    const filterButtons = document.querySelectorAll('.team-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Reload fixtures for the selected team
            olrfcData.loadFixtures();
        });
    });
}

// Initialize team filters when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTeamFilters);

// News modal functionality
function showNewsModal(title, content, date, author) {
    const modal = document.createElement('div');
    modal.className = 'news-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 15px;
            padding: 2rem;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        ">
            <button onclick="this.closest('.news-modal').remove()" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: background 0.3s ease;
            " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">&times;</button>
            
            <h2 style="color: var(--primary-green); margin-bottom: 1rem;">${window.escapeHtml ? window.escapeHtml(title) : title}</h2>
            <div style="color: var(--text-light); margin-bottom: 1rem; font-size: 0.9rem;">
                📅 ${window.escapeHtml ? window.escapeHtml(date) : date} | ✍️ ${window.escapeHtml ? window.escapeHtml(author) : author}
            </div>
            <div style="line-height: 1.6; color: var(--text-dark);">
                ${window.sanitizeHTML ? window.sanitizeHTML(content) : content.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// Gallery data loader (for gallery.html)
class GalleryDataLoader {
    constructor() {
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadGallery());
        } else {
            this.loadGallery();
        }
    }

    loadGallery() {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        const gallery = this.getData('gallery');
        galleryGrid.innerHTML = '';

        if (gallery.length === 0) {
            galleryGrid.innerHTML = this.getDefaultGalleryHTML();
            this.initializeFilters();
            return;
        }

        gallery.forEach((album, index) => {
            album.photos.forEach((photo, photoIndex) => {
                const galleryItem = this.createGalleryItem(album, photo, `${index}-${photoIndex}`);
                galleryGrid.appendChild(galleryItem);
            });
        });

        this.initializeFilters();
    }

    createGalleryItem(album, photo, id) {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-in';
        item.dataset.category = album.category;

        item.innerHTML = `
            <img src="${photo.url}" alt="${album.title}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 10px;">
            <div class="gallery-overlay">
                <h3>${window.escapeHtml ? window.escapeHtml(album.title) : album.title}</h3>
                <p>${window.escapeHtml ? window.escapeHtml(album.description || '') : (album.description || '')}</p>
            </div>
        `;

        // Add click listener for lightbox
        item.addEventListener('click', () => {
            this.openLightbox(photo.url, album.title, album.description);
        });

        return item;
    }

    openLightbox(imageSrc, title, description) {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            const lightboxImage = document.getElementById('lightbox-image');
            const lightboxTitle = document.getElementById('lightbox-title');
            const lightboxDescription = document.getElementById('lightbox-description');

            lightboxImage.src = imageSrc;
            lightboxTitle.textContent = title;
            lightboxDescription.textContent = description || '';

            lightbox.style.display = 'block';
        }
    }

    initializeFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Filter gallery items
                const filter = button.dataset.filter;
                this.filterGallery(filter);
            });
        });
    }

    filterGallery(filter) {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = 'block';
                item.classList.add('fade-in');
            } else {
                item.style.display = 'none';
            }
        });
    }

    getData(key) {
        try {
            const data = JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
            
            // 🔧 DEDUPLICATE by ID
            if (data.length > 0 && data[0] && data[0].id) {
                const seen = new Map();
                const deduplicated = [];
                
                for (const item of data) {
                    if (item && item.id && !seen.has(item.id)) {
                        seen.set(item.id, true);
                        deduplicated.push(item);
                    }
                }
                
                if (deduplicated.length < data.length) {
                    console.log(`🧹 [GalleryDataLoader] Removed ${data.length - deduplicated.length} duplicate ${key} items`);
                    localStorage.setItem(`olrfc_${key}`, JSON.stringify(deduplicated));
                }
                
                return deduplicated;
            }
            
            return data;
        } catch (e) {
            console.error(`Error loading ${key} data:`, e);
            return [];
        }
    }

    getDefaultGalleryHTML() {
        // Return existing placeholder content as fallback
        return document.querySelector('.gallery-grid').innerHTML;
    }
}

// Initialize gallery loader if on gallery page
if (window.location.pathname.includes('gallery.html')) {
    const galleryLoader = new GalleryDataLoader();
}

// Player data loader for team pages
class PlayerDataLoader {
    loadTeamPlayers(teamId) {
        const players = this.getData('players');
        const teamPlayers = players.filter(player => player.team === teamId);
        
        // Find player grid container
        const playerGrid = document.querySelector('.current-squad .grid, [style*="grid-template-columns"]');
        if (!playerGrid) return;

        // Clear existing placeholder players
        playerGrid.innerHTML = '';

        if (teamPlayers.length === 0) {
            // Show placeholder content
            playerGrid.innerHTML = this.getDefaultPlayersHTML();
            return;
        }

        // Add real players
        teamPlayers.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            playerGrid.appendChild(playerCard);
        });
    }

    createPlayerCard(player) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: var(--bg-light);
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.3s ease;
        `;

        const photoDisplay = player.photo 
            ? `<img src="${player.photo}" alt="${player.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`
            : `<div style="height: 200px; background: linear-gradient(45deg, var(--primary-green), var(--primary-maroon)); border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem;">Player Photo</div>`;

        card.innerHTML = `
            ${photoDisplay}
            <h3 style="color: var(--primary-green); margin-bottom: 0.5rem;">${player.name}</h3>
            <p style="color: var(--text-light); margin-bottom: 0.5rem;"><strong>Position:</strong> ${player.position}</p>
            <p style="color: var(--text-light); font-size: 0.9rem;"><strong>Caps:</strong> ${player.appearances} appearances</p>
        `;

        return card;
    }

    getData(key) {
        try {
            const data = JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
            
            // 🔧 DEDUPLICATE by ID
            if (data.length > 0 && data[0] && data[0].id) {
                const seen = new Map();
                const deduplicated = [];
                
                for (const item of data) {
                    if (item && item.id && !seen.has(item.id)) {
                        seen.set(item.id, true);
                        deduplicated.push(item);
                    }
                }
                
                if (deduplicated.length < data.length) {
                    console.log(`🧹 [PlayerDataLoader] Removed ${data.length - deduplicated.length} duplicate ${key} items`);
                    localStorage.setItem(`olrfc_${key}`, JSON.stringify(deduplicated));
                }
                
                return deduplicated;
            }
            
            return data;
        } catch (e) {
            console.error(`Error loading ${key} data:`, e);
            return [];
        }
    }

    getDefaultPlayersHTML() {
        return `
            <div style="background: var(--bg-light); border-radius: 10px; padding: 1.5rem; text-align: center;">
                <div style="height: 200px; background: linear-gradient(45deg, var(--primary-green), var(--primary-maroon)); border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem;">Captain Photo</div>
                <h3 style="color: var(--primary-green); margin-bottom: 0.5rem;">[Captain Name]</h3>
                <p style="color: var(--text-light); margin-bottom: 0.5rem;"><strong>Position:</strong> Captain / Fly-half</p>
                <p style="color: var(--text-light); font-size: 0.9rem;"><strong>Caps:</strong> 87 appearances</p>
            </div>
        `;
    }
}

// Auto-load team players based on current page
document.addEventListener('DOMContentLoaded', function() {
    const playerLoader = new PlayerDataLoader();
    
    // Determine team based on current page
    const currentPage = window.location.pathname;
    if (currentPage.includes('mens-1st-xv.html')) {
        playerLoader.loadTeamPlayers('mens-1st');
    } else if (currentPage.includes('mens-2nd-xv.html')) {
        playerLoader.loadTeamPlayers('mens-2nd');
    } else if (currentPage.includes('phoenix-ladies.html')) {
        playerLoader.loadTeamPlayers('ladies');
    } else if (currentPage.includes('colts.html')) {
        playerLoader.loadTeamPlayers('colts');
    }
});