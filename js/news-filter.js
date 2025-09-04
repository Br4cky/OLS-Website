// Enhanced News filtering with match results and fixtures

// News categories and sample data
const newsCategories = {
    all: { name: 'All News', color: 'var(--primary-green)' },
    seniors: { name: 'Senior Teams', color: 'var(--primary-maroon)' },
    ladies: { name: 'Phoenix Ladies', color: 'var(--accent-gold)' },
    youth: { name: 'Minis & Juniors', color: 'var(--primary-green)' },
    club: { name: 'Club News', color: 'var(--primary-maroon)' },
    social: { name: 'Social Events', color: 'var(--accent-gold)' }
};

// Match results and fixtures by category
const matchData = {
    all: {
        lastResult: {
            homeTeam: "Old Laurentian RFC",
            awayTeam: "Derby RFC", 
            homeScore: 24,
            awayScore: 17,
            date: "2025-06-22",
            venue: "Home",
            competition: "Regional Championship"
        },
        nextFixture: {
            homeTeam: "Old Laurentian RFC",
            awayTeam: "Birmingham RFC",
            date: "2025-07-06", 
            time: "15:00",
            venue: "Home",
            competition: "Regional Championship"
        }
    },
    seniors: {
        lastResult: {
            homeTeam: "Old Laurentian RFC 1st XV",
            awayTeam: "Derby RFC", 
            homeScore: 24,
            awayScore: 17,
            date: "2025-06-22",
            venue: "Home",
            competition: "Regional Championship"
        },
        nextFixture: {
            homeTeam: "Old Laurentian RFC 1st XV",
            awayTeam: "Birmingham RFC",
            date: "2025-07-06", 
            time: "15:00",
            venue: "Home",
            competition: "Regional Championship"
        }
    },
    ladies: {
        lastResult: {
            homeTeam: "Phoenix Ladies",
            awayTeam: "Coventry Ladies", 
            homeScore: 22,
            awayScore: 15,
            date: "2025-06-23",
            venue: "Home",
            competition: "Midlands Women's Championship"
        },
        nextFixture: {
            homeTeam: "Phoenix Ladies",
            awayTeam: "Birmingham Ladies",
            date: "2025-07-07", 
            time: "14:00",
            venue: "Away",
            competition: "Midlands Women's Championship"
        }
    },
    youth: {
        lastResult: {
            homeTeam: "Old Laurentian RFC Colts",
            awayTeam: "Leicester Forest Colts", 
            homeScore: 28,
            awayScore: 14,
            date: "2025-06-23",
            venue: "Home",
            competition: "Midlands Colts Championship"
        },
        nextFixture: {
            homeTeam: "Old Laurentian RFC Colts",
            awayTeam: "Coventry Colts",
            date: "2025-07-07", 
            time: "11:00",
            venue: "Away",
            competition: "Midlands Colts Championship"
        }
    },
    club: {
        lastResult: {
            homeTeam: "Old Laurentian RFC",
            awayTeam: "Derby RFC", 
            homeScore: 24,
            awayScore: 17,
            date: "2025-06-22",
            venue: "Home",
            competition: "Regional Championship"
        },
        nextFixture: {
            homeTeam: "Old Laurentian RFC",
            awayTeam: "Birmingham RFC",
            date: "2025-07-06", 
            time: "15:00",
            venue: "Home",
            competition: "Regional Championship"
        }
    },
    social: {
        lastResult: {
            homeTeam: "Old Laurentian RFC",
            awayTeam: "Derby RFC", 
            homeScore: 24,
            awayScore: 17,
            date: "2025-06-22",
            venue: "Home",
            competition: "Regional Championship"
        },
        nextFixture: {
            homeTeam: "Club BBQ",
            awayTeam: "Annual Awards Dinner",
            date: "2025-07-20", 
            time: "19:00",
            venue: "Club House",
            competition: "Social Events"
        }
    }
};

// Sample news articles
const newsArticles = [
    {
        id: 1,
        title: "Victory Against Local Rivals",
        excerpt: "Old Laurentian RFC secured a thrilling 24-17 victory in last weekend's derby match, showcasing exceptional teamwork and determination...",
        category: "seniors",
        date: "2025-06-20",
        author: "Match Reporter",
        image: "../images/news/victory-derby.jpg"
    },
    {
        id: 2,
        title: "New Season Training Begins",
        excerpt: "Pre-season training has commenced with great enthusiasm from players and coaching staff. Join us every Tuesday and Thursday...",
        category: "seniors",
        date: "2025-06-15",
        author: "Head Coach",
        image: "../images/news/training-begins.jpg"
    },
    {
        id: 3,
        title: "Youth Rugby Initiative Launch",
        excerpt: "We're excited to announce our new youth development program, aimed at introducing rugby to the next generation...",
        category: "youth",
        date: "2025-06-10",
        author: "Youth Coordinator",
        image: "../images/news/youth-initiative.jpg"
    },
    {
        id: 4,
        title: "Phoenix Ladies Secure Championship Spot",
        excerpt: "Our Phoenix Ladies team has secured a spot in the championship finals after a dominant 22-15 victory...",
        category: "ladies",
        date: "2025-06-08",
        author: "Ladies Team Reporter",
        image: "../images/news/ladies-championship.jpg"
    },
    {
        id: 5,
        title: "Annual Club BBQ - Family Day Success",
        excerpt: "Over 200 members and families attended our annual BBQ, raising £2,000 for new youth equipment...",
        category: "social",
        date: "2025-06-05",
        author: "Social Secretary",
        image: "../images/news/club-bbq.jpg"
    },
    {
        id: 6,
        title: "U16s Reach County Cup Final",
        excerpt: "Our U16s team has reached the county cup final after defeating three strong opponents in the knockout stages...",
        category: "youth",
        date: "2025-06-03",
        author: "Youth Coach",
        image: "../images/news/u16s-cup.jpg"
    },
    {
        id: 7,
        title: "New Club Sponsor Partnership",
        excerpt: "We're delighted to announce our partnership with Local Business Ltd, who will be supporting our senior teams...",
        category: "club",
        date: "2025-06-01",
        author: "Club Chairman",
        image: "../images/news/new-sponsor.jpg"
    },
    {
        id: 8,
        title: "Minis Festival Huge Success",
        excerpt: "Over 150 young players aged 6-12 participated in our annual minis festival, with teams from across the region...",
        category: "youth",
        date: "2025-05-28",
        author: "Minis Coordinator",
        image: "../images/news/minis-festival.jpg"
    }
];

// Initialize enhanced news section
function initializeNewsFiltering() {
    createNewsFilters();
    createMatchResultsSection();
    //createSocialMediaPreview();
    renderNewsGrid('all');
    updateMatchResults('all');
    updateSocialPreview('all');
    setupFilterEventListeners();
}

// Create filter buttons
function createNewsFilters() {
    const newsSection = document.querySelector('.news-section .container');
    const filterContainer = document.createElement('div');
    filterContainer.className = 'news-filters';
    filterContainer.innerHTML = `
        <div class="filter-buttons">
            ${Object.entries(newsCategories).map(([key, category]) => `
                <button class="filter-btn ${key === 'all' ? 'active' : ''}" 
                        data-category="${key}"
                        style="--filter-color: ${category.color}">
                    ${category.name}
                </button>
            `).join('')}
        </div>
    `;
    
    const sectionTitle = newsSection.querySelector('.section-title');
    sectionTitle.insertAdjacentElement('afterend', filterContainer);
}

// Create match results section
function createMatchResultsSection() {
    const newsSection = document.querySelector('.news-section .container');
    const matchSection = document.createElement('div');
    matchSection.className = 'match-results-section';
    matchSection.innerHTML = `
        <div class="match-cards-container">
            <div class="match-card result-card">
                <h3 class="match-card-title">Latest Result</h3>
                <div id="latest-result-content">
                    <!-- Populated by JavaScript -->
                </div>
            </div>
            <div class="match-card fixture-card">
                <h3 class="match-card-title">Next Fixture</h3>
                <div id="next-fixture-content">
                    <!-- Populated by JavaScript -->
                </div>
            </div>
        </div>
    `;
    
    const filtersSection = newsSection.querySelector('.news-filters');
    filtersSection.insertAdjacentElement('afterend', matchSection);
}

// Create social media preview section
function createSocialMediaPreview() {
    const newsSection = document.querySelector('.news-section .container');
    const socialSection = document.createElement('div');
    socialSection.className = 'social-preview-section';
    socialSection.innerHTML = `
        <div class="social-preview-header">
            <h3>Recent Social Media Posts</h3>
            <div class="social-page-info-mini">
                <img id="social-avatar-mini" src="../images/logo/olrfc-logo.png" alt="Team Avatar">
                <div>
                    <span id="social-page-name-mini">Old Laurentian RFC</span>
                    <a href="#" id="social-follow-mini" target="_blank">Follow →</a>
                </div>
            </div>
        </div>
        <div class="social-posts-preview" id="social-posts-preview">
            <!-- Populated by JavaScript -->
        </div>
        <div class="social-view-more">
            <button id="view-more-posts" class="btn btn-secondary">View All Posts</button>
        </div>
    `;
    
    const matchSection = newsSection.querySelector('.match-results-section');
    matchSection.insertAdjacentElement('afterend', socialSection);
}

// Update match results based on category
function updateMatchResults(category) {
    const data = matchData[category] || matchData.all;
    
    // Update latest result
    const resultContent = document.getElementById('latest-result-content');
    const result = data.lastResult;
    resultContent.innerHTML = `
        <div class="match-teams">${result.homeTeam} vs ${result.awayTeam}</div>
        <div class="match-score">${result.homeScore} - ${result.awayScore}</div>
        <div class="match-details">
            <span class="match-date">${formatDate(result.date)}</span>
            <span class="match-venue">${result.venue}</span>
        </div>
        <div class="match-competition">${result.competition}</div>
    `;
    
    // Update next fixture
    const fixtureContent = document.getElementById('next-fixture-content');
    const fixture = data.nextFixture;
    
    if (category === 'social') {
        // Special handling for social events
        fixtureContent.innerHTML = `
            <div class="event-name">${fixture.homeTeam}</div>
            <div class="event-date">${formatDate(fixture.date)}</div>
            <div class="match-details">
                <span class="match-time">${fixture.time}</span>
                <span class="match-venue">${fixture.venue}</span>
            </div>
            <div class="match-competition">${fixture.competition}</div>
        `;
    } else {
        fixtureContent.innerHTML = `
            <div class="match-teams">${fixture.homeTeam} vs ${fixture.awayTeam}</div>
            <div class="match-datetime">${formatDate(fixture.date)} - ${fixture.time}</div>
            <div class="match-details">
                <span class="match-venue">${fixture.venue}</span>
            </div>
            <div class="match-competition">${fixture.competition}</div>
        `;
    }
}

// Update social media preview
function updateSocialPreview(category) {
    // This function will call the social media module
    if (window.updateSocialFeed) {
        window.updateSocialFeed(category, true); // true for preview mode
    }
}

// Render news grid based on category
function renderNewsGrid(category) {
    const newsGrid = document.querySelector('.news-grid');
    const filteredNews = category === 'all' 
        ? newsArticles 
        : newsArticles.filter(article => article.category === category);
    
    newsGrid.innerHTML = filteredNews.map(article => `
        <article class="news-card fade-in" data-category="${article.category}">
            <div class="news-image">
                <div class="news-placeholder" style="background: linear-gradient(45deg, var(--primary-green), var(--primary-maroon));">
                    <span>${getCategoryIcon(article.category)} ${newsCategories[article.category].name}</span>
                </div>
            </div>
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-date">${formatDate(article.date)}</span>
                    <span class="news-category" style="color: ${newsCategories[article.category].color}">
                        ${newsCategories[article.category].name}
                    </span>
                </div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.excerpt}</p>
                <div class="news-footer">
                    <span class="news-author">By ${article.author}</span>
                    <a href="pages/news-article.html?id=${article.id}" class="btn btn-primary">Read More</a>
                </div>
            </div>
        </article>
    `).join('');
    
    // Re-initialize fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.news-card').forEach(card => {
        observer.observe(card);
    });
}

// Setup filter event listeners
function setupFilterEventListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get category and update all sections
            const category = this.getAttribute('data-category');
            updateMatchResults(category);
            updateSocialPreview(category);
            renderNewsGrid(category);
            
            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.set('category', category);
            window.history.pushState({}, '', url);
        });
    });
    
    // View more posts button
    document.getElementById('view-more-posts').addEventListener('click', function() {
        // In real implementation, this would open a modal or navigate to full social feed
        alert('This would show all social media posts for the selected team');
    });
}

// Helper functions
function getCategoryIcon(category) {
    const icons = {
        seniors: '🏉',
        ladies: '👩‍🦰',
        youth: '👶',
        club: '🏛️',
        social: '🎉',
        all: '📰'
    };
    return icons[category] || '📰';
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.news-section')) {
        initializeNewsFiltering();
        
        // Check URL for category parameter
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        if (categoryParam && newsCategories[categoryParam]) {
            const filterBtn = document.querySelector(`[data-category="${categoryParam}"]`);
            if (filterBtn) {
                filterBtn.click();
            }
        }
    }
});
