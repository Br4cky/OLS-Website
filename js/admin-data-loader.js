class OLRFCDataLoader {
    constructor() {
        this.newsContainer = null;
        this.fixturesContainer = null;
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

    loadAllContent() {
        this.loadNews();
        this.loadFixtures();
        this.loadStats();
    }

    getData(key) {
        try {
            return JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
        } catch (e) {
            console.error(`Error loading ${key} data:`, e);
            return [];
        }
    }

    // Load news articles for index.html
    loadNews() {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) return;

        const news = this.getData('news');
        newsGrid.innerHTML = '';

        if (news.length === 0) {
            newsGrid.innerHTML = this.getDefaultNewsHTML();
            return;
        }

        // Show latest 3 articles
        const latestNews = news.slice(0, 3);
        
        latestNews.forEach(article => {
            const newsCard = this.createNewsCard(article);
            newsGrid.appendChild(newsCard);
        });
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

        card.innerHTML = `
            <div class="news-image">
                <div class="placeholder-image">${categoryIcon} ${this.formatCategory(article.category)}</div>
            </div>
            <div class="news-content">
                <div class="news-date">${formattedDate}</div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${this.truncateText(article.content, 120)}</p>
                <a href="#" class="btn btn-primary" onclick="showNewsModal('${article.title}', '${article.content}', '${formattedDate}', '${article.author}')">Read More</a>
            </div>
        `;

        return card;
    }

    // Load fixtures for index.html
    loadFixtures() {
        const fixturesGrid = document.getElementById('fixtures-match-grid');
        if (!fixturesGrid) return;

        const fixtures = this.getData('fixtures');
        
        if (fixtures.length === 0) {
            fixturesGrid.innerHTML = this.getDefaultFixturesHTML();
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
            
            <h2 style="color: var(--primary-green); margin-bottom: 1rem;">${title}</h2>
            <div style="color: var(--text-light); margin-bottom: 1rem; font-size: 0.9rem;">
                📅 ${date} | ✍️ ${author}
            </div>
            <div style="line-height: 1.6; color: var(--text-dark);">
                ${content.replace(/\n/g, '<br>')}
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
                <h3>${album.title}</h3>
                <p>${album.description || ''}</p>
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
            return JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
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
            return JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
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