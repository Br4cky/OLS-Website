// Homepage News filtering - OLS 130
// Updated to use CMS-configurable categories AND club sections

// Track current filters and prevent duplicate renders
let currentCategory = 'all';
let currentClubSection = 'all'; // OLS 130: Default to all sections
let isRendering = false;
let hasInitialized = false;

// OLS 130: Categories and Club Sections loaded from CMS
let newsCategories = [];
let clubSections = [];

// OLS 128: Default match images - loaded from CMS (null = not configured, use gradient)
let defaultWinImage = null;
let defaultLossImage = null;

// OLS 130: Load categories, club sections and default match images from CMS
async function loadNewsSettings() {
    // Default categories (fallback)
    const defaultCategories = [
        { id: 'match', name: 'Match Report', icon: '🏉', showFilter: true },
        { id: 'training', name: 'Training', icon: '💪', showFilter: true },
        { id: 'social', name: 'Social Event', icon: '🎉', showFilter: true },
        { id: 'club', name: 'Club Update', icon: '📢', showFilter: true }
    ];
    
    // Default club sections (fallback)
    const defaultSections = [
        { id: 'senior', name: 'Senior', icon: '🏉', showFilter: true },
        { id: 'ladies', name: 'Ladies', icon: '👩', showFilter: true },
        { id: 'minis', name: 'Minis & Juniors', icon: '👶', showFilter: true }
    ];
    
    try {
        let settings = null;
        
        // Try localStorage first for instant load
        const cachedSettings = localStorage.getItem('olrfc_site-settings');
        if (cachedSettings) {
            settings = JSON.parse(cachedSettings);
            console.log('⚡ Loaded news settings from cache');
        } else {
            // Fetch fresh from API
            const response = await fetch('/.netlify/functions/site-settings');
            if (response.ok) {
                const result = await response.json();
                settings = result.data || {};
                console.log('📡 Loaded news settings from API');
            }
        }
        
        if (settings) {
            // Load categories
            if (settings['news-categories']) {
                newsCategories = JSON.parse(settings['news-categories']);
                console.log('✅ Loaded CMS categories:', newsCategories.length);
            } else {
                newsCategories = defaultCategories;
            }
            
            // OLS 130: Load club sections
            if (settings['club-sections']) {
                clubSections = JSON.parse(settings['club-sections']);
                console.log('✅ Loaded CMS club sections:', clubSections.length);
            } else {
                clubSections = defaultSections;
            }
            
            // Load default match images
            if (settings['default-match-win-image']) {
                defaultWinImage = settings['default-match-win-image'];
            }
            if (settings['default-match-loss-image']) {
                defaultLossImage = settings['default-match-loss-image'];
            }
        } else {
            newsCategories = defaultCategories;
            clubSections = defaultSections;
        }
        
    } catch (error) {
        console.warn('Could not load news settings from CMS:', error);
        newsCategories = defaultCategories;
        clubSections = defaultSections;
    }
}

// Get news from localStorage
function getNewsFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('olrfc_news')) || [];
    } catch (e) {
        console.error('Error loading news:', e);
        return [];
    }
}

// Initialize news section
async function initializeNewsFiltering() {
    if (hasInitialized) {
        console.log('🏉 Already initialized, skipping...');
        return;
    }
    
    console.log('🏉 initializeNewsFiltering called');
    hasInitialized = true;
    
    // Load CMS settings first
    await loadNewsSettings();
    
    // Create filters and render
    createNewsFilters();
    renderNewsGrid();
    setupFilterEventListeners();
    
    console.log('✅ News initialization complete');
}

// OLS 130: Create filter buttons from CMS categories AND club sections
function createNewsFilters() {
    const newsSection = document.querySelector('.news-section .container');
    if (!newsSection || document.querySelector('.news-filters')) return;
    
    // Get categories and sections that should show as filters
    const filterCategories = newsCategories.filter(c => c.showFilter !== false);
    const filterSections = clubSections.filter(s => s.showFilter !== false);
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'news-filters';
    filterContainer.innerHTML = `
        <!-- MOBILE DROPDOWNS -->
        <div class="news-filter-mobile">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <!-- Club Section Dropdown -->
                <select id="news-section-select" onchange="handleSectionFilterChange(this.value)" 
                        style="flex: 1; min-width: 140px; padding: 0.8rem; border: 2px solid var(--primary-green); border-radius: 10px; font-size: 0.95rem; font-weight: bold; color: var(--primary-green); background: white; cursor: pointer;">
                    <option value="all" selected>🏢 All Sections</option>
                    ${filterSections.map(s => `
                        <option value="${s.id}">${s.icon} ${s.name}</option>
                    `).join('')}
                </select>
                
                <!-- Category Dropdown -->
                <select id="news-filter-select" onchange="handleCategoryFilterChange(this.value)" 
                        style="flex: 1; min-width: 140px; padding: 0.8rem; border: 2px solid var(--primary-maroon); border-radius: 10px; font-size: 0.95rem; font-weight: bold; color: var(--primary-maroon); background: white; cursor: pointer;">
                    <option value="all" selected>📰 All News</option>
                    ${filterCategories.map(cat => `
                        <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                    `).join('')}
                </select>
            </div>
        </div>
        
        <!-- DESKTOP BUTTONS -->
        <div class="news-filter-desktop" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Club Section Buttons -->
            <div class="section-filter-row" style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                <span style="font-weight: bold; color: var(--text-light); margin-right: 0.5rem; display: flex; align-items: center;">Section:</span>
                <button class="section-btn active" data-section="all" style="--filter-color: var(--primary-green)">
                    🏢 All Sections
                </button>
                ${filterSections.map(s => `
                    <button class="section-btn" data-section="${s.id}" style="--filter-color: var(--primary-green)">
                        ${s.icon} ${s.name}
                    </button>
                `).join('')}
            </div>
            
            <!-- Category Buttons -->
            <div class="filter-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                <span style="font-weight: bold; color: var(--text-light); margin-right: 0.5rem; display: flex; align-items: center;">Type:</span>
                <button class="filter-btn active" data-category="all" style="--filter-color: var(--primary-maroon)">
                    📰 All News
                </button>
                ${filterCategories.map(cat => `
                    <button class="filter-btn" data-category="${cat.id}" style="--filter-color: var(--primary-maroon)">
                        ${cat.icon} ${cat.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    // Insert before the news grid
    const newsGrid = newsSection.querySelector('.news-grid');
    if (newsGrid) {
        newsSection.insertBefore(filterContainer, newsGrid);
    }
    
    console.log('✅ News filters created with', filterSections.length, 'sections and', filterCategories.length, 'categories');
}

// Setup filter event listeners
function setupFilterEventListeners() {
    // Desktop section button clicks
    document.querySelectorAll('.news-filters .section-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Update active state
            document.querySelectorAll('.news-filters .section-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Sync mobile dropdown
            const dropdown = document.getElementById('news-section-select');
            if (dropdown) dropdown.value = section;
            
            currentClubSection = section;
            renderNewsGrid();
        });
    });
    
    // Desktop category button clicks
    document.querySelectorAll('.news-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active state
            document.querySelectorAll('.news-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Sync mobile dropdown
            const dropdown = document.getElementById('news-filter-select');
            if (dropdown) dropdown.value = category;
            
            currentCategory = category;
            renderNewsGrid();
        });
    });
}

// Handle mobile section dropdown change
function handleSectionFilterChange(section) {
    // Sync desktop buttons
    document.querySelectorAll('.news-filters .section-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
    
    currentClubSection = section;
    renderNewsGrid();
}

// Handle mobile category dropdown change
function handleCategoryFilterChange(category) {
    // Sync desktop buttons
    document.querySelectorAll('.news-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    currentCategory = category;
    renderNewsGrid();
}

// Get category info from CMS categories
function getCategoryInfo(categoryId) {
    const category = newsCategories.find(c => c.id === categoryId);
    if (category) {
        return { name: category.name, icon: category.icon };
    }
    // Fallback
    return { name: categoryId || 'News', icon: '📰' };
}

// Get default match image based on article content
function getDefaultMatchImage(article) {
    if (article.matchResult) {
        return article.matchResult === 'win' ? defaultWinImage : defaultLossImage;
    }
    
    const content = (article.title + ' ' + article.content).toLowerCase();
    
    if (content.includes('win') || content.includes('victory') || content.includes('triumph') || content.includes('beat')) {
        return defaultWinImage;
    }
    
    if (content.includes('loss') || content.includes('lost') || content.includes('defeat') || content.includes('fell to')) {
        return defaultLossImage;
    }
    
    return defaultLossImage;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

// OLS 130: Render news grid with two-level filtering
function renderNewsGrid() {
    console.log('🏉 renderNewsGrid - Section:', currentClubSection, 'Category:', currentCategory);
    
    // Prevent simultaneous renders
    if (isRendering) {
        console.log('🏉 Already rendering, skipping...');
        return;
    }
    
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) {
        console.error('❌ News grid not found!');
        return;
    }
    
    isRendering = true;
    
    const allNews = getNewsFromStorage();
    console.log(`📊 Total news count: ${allNews.length}`);
    
    // OLS 130: Two-level filtering
    let filteredNews = allNews;
    
    // Filter by club section (articles with 'all' always show)
    if (currentClubSection !== 'all') {
        filteredNews = filteredNews.filter(article => 
            article.clubSection === 'all' || 
            article.clubSection === currentClubSection ||
            !article.clubSection // Legacy articles without clubSection show everywhere
        );
    }
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredNews = filteredNews.filter(article => article.category === currentCategory);
    }
    
    // Sort by date (newest first)
    filteredNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`📊 Filtered news count: ${filteredNews.length}`);
    
    if (filteredNews.length === 0) {
        const categoryInfo = getCategoryInfo(currentCategory);
        const sectionName = currentClubSection === 'all' ? 'All Sections' : 
            (clubSections.find(s => s.id === currentClubSection)?.name || currentClubSection);
        
        newsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <h3>No News Available</h3>
                <p style="color: var(--text-light); margin-top: 1rem;">
                    No articles found for ${sectionName}${currentCategory !== 'all' ? ` / ${categoryInfo.name}` : ''}.
                </p>
            </div>
        `;
        isRendering = false;
        return;
    }
    
    // Build cards HTML
    const cardsHTML = filteredNews.map((article, index) => {
        const categoryInfo = getCategoryInfo(article.category);
        
        // Check for custom image
        const hasCustomImage = article.image && article.image.trim() !== '';
        const isMatchReport = article.category === 'match' || 
                             article.title.toLowerCase().includes('win') || 
                             article.title.toLowerCase().includes('loss') || 
                             article.title.toLowerCase().includes('vs');
        
        // Get CMS default image (may be null)
        const defaultMatchImg = isMatchReport ? getDefaultMatchImage(article) : null;
        
        let imageHTML;
        if (hasCustomImage) {
            imageHTML = `<img src="${article.image}" alt="${article.title}" style="width: 100%; height: 200px; object-fit: cover; object-position: center top;">`;
        } else if (isMatchReport && defaultMatchImg) {
            imageHTML = `<img src="${defaultMatchImg}" alt="Match Report" style="width: 100%; height: 200px; object-fit: cover; object-position: center top;">`;
        } else {
            imageHTML = `<div class="news-placeholder" style="background: linear-gradient(45deg, var(--primary-green), var(--primary-maroon)); height: 200px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 1.2rem;">${categoryInfo.icon} ${categoryInfo.name}</span>
            </div>`;
        }
        
        return `
        <article class="news-card" 
             data-category="${article.category}" 
             data-section="${article.clubSection || 'all'}"
             onclick="openNewsArticle(${index})"
             style="cursor: pointer;">
            <div class="news-image">
                ${imageHTML}
            </div>
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-date">Published on ${formatDate(article.date)}</span>
                    <span class="news-category" style="color: var(--primary-green)">
                        ${categoryInfo.icon} ${categoryInfo.name}
                    </span>
                </div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p>
            </div>
        </article>
    `;
    }).join('');
    
    newsGrid.innerHTML = cardsHTML;
    console.log(`✅ Rendered ${filteredNews.length} news cards`);
    
    isRendering = false;
}

// Open news article - OLS 130: Updated to work with filtered list
function openNewsArticle(displayIndex) {
    const allNews = getNewsFromStorage();
    
    // Apply same filters to find the actual article
    let filteredNews = allNews;
    
    if (currentClubSection !== 'all') {
        filteredNews = filteredNews.filter(article => 
            article.clubSection === 'all' || 
            article.clubSection === currentClubSection ||
            !article.clubSection
        );
    }
    
    if (currentCategory !== 'all') {
        filteredNews = filteredNews.filter(article => article.category === currentCategory);
    }
    
    filteredNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const article = filteredNews[displayIndex];
    
    if (!article) {
        console.error('❌ Article not found');
        return;
    }
    
    sessionStorage.setItem('currentArticle', JSON.stringify(article));
    window.location.href = 'pages/news-article.html';
}

// Listen for data updates
function setupDataUpdateListeners() {
    window.addEventListener('olrfcDataReady', function(e) {
        console.log('🔄 Data ready event received');
        renderNewsGrid();
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'olrfc_news') {
            console.log('🔄 News data updated');
            renderNewsGrid();
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏉 news-filter.js loaded (OLS 130)');
    
    const newsSection = document.querySelector('.news-section');
    const newsGrid = document.querySelector('.news-grid');
    
    if (newsSection && newsGrid) {
        // Show loading state
        newsGrid.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid var(--primary-green); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h3 style="margin-top: 1rem; color: var(--primary-green);">Loading Latest News...</h3>
            </div>
        `;
        
        // Add spinner CSS
        if (!document.getElementById('news-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'news-spinner-style';
            style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
        
        // Setup data listeners
        setupDataUpdateListeners();
        
        // Wait for data then initialize
        let initAttempts = 0;
        const maxAttempts = 20;
        
        const initWhenReady = async () => {
            initAttempts++;
            const newsData = JSON.parse(localStorage.getItem('olrfc_news') || '[]');
            
            if (newsData.length > 0 || initAttempts >= maxAttempts) {
                await initializeNewsFiltering();
            } else {
                setTimeout(initWhenReady, 500);
            }
        };
        
        // Listen for data ready event
        window.addEventListener('olrfcDataReady', function() {
            setTimeout(initWhenReady, 100);
        }, { once: true });
        
        // Start checking
        setTimeout(initWhenReady, 500);
    }
});

// Responsive CSS for filters
(function addNewsFilterResponsiveCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .news-filters {
            margin-bottom: 2rem;
        }
        
        .news-filters .section-btn,
        .news-filters .filter-btn {
            background: white;
            border: 2px solid var(--filter-color, var(--primary-green));
            color: var(--filter-color, var(--primary-green));
            padding: 0.5rem 1rem;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        }
        
        .news-filters .section-btn:hover,
        .news-filters .filter-btn:hover {
            background: var(--bg-light);
            transform: translateY(-2px);
        }
        
        .news-filters .section-btn.active {
            background: var(--primary-green);
            color: white;
        }
        
        .news-filters .filter-btn.active {
            background: var(--primary-maroon);
            color: white;
        }
        
        /* Desktop: show buttons, hide dropdowns */
        .news-filter-desktop {
            display: flex !important;
        }
        .news-filter-mobile {
            display: none !important;
        }
        
        /* Mobile: show dropdowns, hide buttons */
        @media (max-width: 768px) {
            .news-filter-desktop {
                display: none !important;
            }
            .news-filter-mobile {
                display: block !important;
                margin-bottom: 1.5rem;
            }
        }
    `;
    document.head.appendChild(style);
})();