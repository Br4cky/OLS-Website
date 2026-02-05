// Social Media Integration for Team-Specific Content

// Facebook page configurations for each team
const facebookPages = {
    all: {
        pageId: 'oldlaurentianrfc',
        displayName: 'Old Laurentian RFC',
        description: 'Main club updates and general news'
    },
    seniors: {
        pageId: 'oldlaurentianrfc.seniors',
        displayName: 'Old Laurentian RFC - Senior Teams',
        description: 'Mens 1st XV and 2nd XV updates'
    },
    ladies: {
        pageId: 'phoenixladiesrugby',
        displayName: 'Phoenix Ladies Rugby',
        description: 'Phoenix Ladies team news and updates'
    },
    youth: {
        pageId: 'oldlaurentianrfc.youth',
        displayName: 'Old Laurentian RFC - Youth',
        description: 'Minis, Juniors, and Colts updates'
    },
    club: {
        pageId: 'oldlaurentianrfc',
        displayName: 'Old Laurentian RFC',
        description: 'Club announcements and general information'
    },
    social: {
        pageId: 'oldlaurentianrfc.social',
        displayName: 'Old Laurentian RFC - Social',
        description: 'Social events and club gatherings'
    }
};

// Sample Facebook posts data (in real app, this would come from Facebook Graph API)
const sampleFacebookPosts = {
    all: [
        {
            id: '1',
            message: 'Great day of rugby ahead! Multiple teams in action today. Come down and support! 🏉 #OLRFC #RugbyFamily',
            created_time: '2025-06-26T09:00:00Z',
            likes: 45,
            comments: 12,
            shares: 8,
            link: 'https://facebook.com/oldlaurentianrfc/posts/1',
            image: '../images/social/club-matchday.jpg'
        },
        {
            id: '2',
            message: 'Congratulations to all our teams on a fantastic weekend of rugby! Special mention to our Phoenix Ladies for their championship performance! 👏',
            created_time: '2025-06-25T18:30:00Z',
            likes: 67,
            comments: 23,
            shares: 15,
            link: 'https://facebook.com/oldlaurentianrfc/posts/2'
        },
        {
            id: '3',
            message: 'Training sessions this week:\n🏉 Seniors: Tue & Thu 7PM\n👶 Youth: Wed 6:30PM & Sun 10AM\n👩 Ladies: Thu 7PM\nNew players always welcome!',
            created_time: '2025-06-24T16:00:00Z',
            likes: 32,
            comments: 8,
            shares: 12,
            link: 'https://facebook.com/oldlaurentianrfc/posts/3'
        }
    ],
    seniors: [
        {
            id: '4',
            message: '🏆 MATCH RESULT 🏆\nOld Laurentian RFC 24 - 17 Derby RFC\nWhat a performance from the lads! Next up: Birmingham RFC away. #SeniorsRugby',
            created_time: '2025-06-22T17:15:00Z',
            likes: 89,
            comments: 34,
            shares: 22,
            link: 'https://facebook.com/oldlaurentianrfc.seniors/posts/4',
            image: '../images/social/seniors-victory.jpg'
        },
        {
            id: '5',
            message: 'Pre-season training continues! Excellent turnout from both 1st XV and 2nd XV squads. Fitness levels looking sharp for the new season! 💪',
            created_time: '2025-06-20T20:00:00Z',
            likes: 56,
            comments: 15,
            shares: 9,
            link: 'https://facebook.com/oldlaurentianrfc.seniors/posts/5'
        }
    ],
    ladies: [
        {
            id: '6',
            message: '🔥 PHOENIX LADIES CHAMPIONS! 🔥\nIncredible 22-15 victory secures our spot in the championship! So proud of this team! 🏆👩‍🦰 #PhoenixRising',
            created_time: '2025-06-23T16:45:00Z',
            likes: 134,
            comments: 67,
            shares: 45,
            link: 'https://facebook.com/phoenixladiesrugby/posts/6',
            image: '../images/social/ladies-champions.jpg'
        },
        {
            id: '7',
            message: 'New players welcome! Join our inclusive, competitive team. No experience necessary - we provide full training and support. DM us for details! 💪👩‍🦰',
            created_time: '2025-06-21T14:30:00Z',
            likes: 78,
            comments: 28,
            shares: 35,
            link: 'https://facebook.com/phoenixladiesrugby/posts/7'
        }
    ],
    youth: [
        {
            id: '8',
            message: '🏆 COLTS UPDATE 🏆\nOur U18s are league champions! What an incredible season. These young players are the future of our club! #YouthRugby #ProudCoach',
            created_time: '2025-06-23T11:30:00Z',
            likes: 156,
            comments: 43,
            shares: 67,
            link: 'https://facebook.com/oldlaurentianrfc.youth/posts/8',
            image: '../images/social/colts-champions.jpg'
        },
        {
            id: '9',
            message: 'Minis Festival this Sunday! Ages 6-14 welcome. Fun, games, and introduction to rugby in a safe environment. Bring the family! 🏉👶',
            created_time: '2025-06-21T10:00:00Z',
            likes: 92,
            comments: 31,
            shares: 48,
            link: 'https://facebook.com/oldlaurentianrfc.youth/posts/9'
        }
    ],
    social: [
        {
            id: '10',
            message: '🍖 CLUB BBQ SUCCESS! 🍖\nAmazing turnout yesterday! Over £2,000 raised for new youth equipment. Thank you to everyone who supported! Next event: Quiz Night July 15th 🍻',
            created_time: '2025-06-24T12:00:00Z',
            likes: 187,
            comments: 89,
            shares: 34,
            link: 'https://facebook.com/oldlaurentianrfc.social/posts/10',
            image: '../images/social/club-bbq.jpg'
        },
        {
            id: '11',
            message: 'SAVE THE DATE 📅\nAnnual Awards Dinner - July 20th\nCelebrating another fantastic season! Tickets available at the bar. Early bird discount until July 1st! 🎉',
            created_time: '2025-06-22T09:30:00Z',
            likes: 143,
            comments: 52,
            shares: 28,
            link: 'https://facebook.com/oldlaurentianrfc.social/posts/11'
        }
    ]
};

// Initialize social media section
function initializeSocialMedia() {
    createSocialMediaSection();
    updateSocialFeed('all');
}

// Create social media section in the DOM
function createSocialMediaSection() {
    const newsSection = document.querySelector('.news-section');
    const socialMediaSection = document.createElement('section');
    socialMediaSection.className = 'social-media-section';
    socialMediaSection.innerHTML = `
        <div class="container">
            <h2 class="section-title fade-in">Social Media Updates</h2>
            <div class="social-header">
                <div class="social-page-info">
                    <div class="page-avatar">
                        <img src="../images/logo/olrfc-logo.png" alt="Page Avatar">
                    </div>
                    <div class="page-details">
                        <h3 id="page-name">Old Laurentian RFC</h3>
                        <p id="page-description">Main club updates and general news</p>
                        <a href="#" id="page-link" target="_blank" class="follow-btn">Follow on Facebook</a>
                    </div>
                </div>
            </div>
            <div class="social-posts-grid" id="social-posts">
                <!-- Posts will be populated by JavaScript -->
            </div>
        </div>
    `;
    
    newsSection.insertAdjacentElement('afterend', socialMediaSection);
}

// Update social feed based on category
function updateSocialFeed(category, previewMode = false) {
    const pageInfo = facebookPages[category] || facebookPages.all;
    const posts = sampleFacebookPosts[category] || sampleFacebookPosts.all;
    
    if (previewMode) {
        // Update mini social info
        const miniAvatar = document.getElementById("social-avatar-mini");
        const miniName = document.getElementById("social-page-name-mini");
        const miniFollow = document.getElementById("social-follow-mini");
        
        if (miniAvatar) miniAvatar.src = "../images/logo/olrfc-logo.png";
        if (miniName) miniName.textContent = pageInfo.displayName;
        if (miniFollow) miniFollow.href = `https://facebook.com/${pageInfo.pageId}`;
        
        // Update preview posts (show only first 2)
        const previewContainer = document.getElementById("social-posts-preview");
        if (previewContainer) {
            previewContainer.innerHTML = posts.slice(0, 2).map(post => `
                <div class="social-post-mini fade-in">
                    <div class="post-header">
                        <div class="post-avatar">
                            <img src="../images/logo/olrfc-logo.png" alt="${pageInfo.displayName}">
                        </div>
                        <div class="post-info">
                            <h4>${pageInfo.displayName}</h4>
                            <span class="post-time">${formatSocialTime(post.created_time)}</span>
                        </div>
                    </div>
                    <div class="post-content">
                        <p class="post-message">${formatPostMessage(post.message.length > 120 ? post.message.substring(0, 120) + "..." : post.message)}</p>
                    </div>
                    <div class="post-engagement">
                        <div class="engagement-stats">
                            <span>👍 ${post.likes}</span>
                            <span>💬 ${post.comments}</span>
                            <span>📤 ${post.shares}</span>
                        </div>
                    </div>
                </div>
            `).join("");
        }
        return;
    }
    
    // Full social media section (existing code)
    if (!document.getElementById("page-name")) return;
    
    const pageInfo_full = facebookPages[category] || facebookPages.all;
    const posts_full = sampleFacebookPosts[category] || sampleFacebookPosts.all;
    
    document.getElementById("page-name").textContent = pageInfo_full.displayName;
    document.getElementById("page-description").textContent = pageInfo_full.description;
    document.getElementById("page-link").href = `https://facebook.com/${pageInfo_full.pageId}`;
    
    const postsContainer = document.getElementById("social-posts");
    if (postsContainer) {
        postsContainer.innerHTML = posts_full.map(post => `
            <div class="social-post fade-in">
                <div class="post-header">
                    <div class="post-avatar">
                        <img src="../images/logo/olrfc-logo.png" alt="${pageInfo_full.displayName}">
                    </div>
                    <div class="post-info">
                        <h4>${pageInfo_full.displayName}</h4>
                        <span class="post-time">${formatSocialTime(post.created_time)}</span>
                    </div>
                </div>
                <div class="post-content">
                    <p class="post-message">${formatPostMessage(post.message)}</p>
                    ${post.image ? `
                        <div class="post-image">
                            <div class="post-placeholder" style="background: linear-gradient(45deg, var(--primary-green), var(--primary-maroon)); height: 200px; display: flex; align-items: center; justify-content: center; color: white; border-radius: 8px;">
                                📸 ${pageInfo_full.displayName} Photo
                            </div>
                        </div>
                    ` : ""}
                </div>
                <div class="post-engagement">
                    <div class="engagement-stats">
                        <span>👍 ${post.likes}</span>
                        <span>💬 ${post.comments}</span>
                        <span>📤 ${post.shares}</span>
                    </div>
                    <a href="${post.link}" target="_blank" class="view-post-btn">View on Facebook</a>
                </div>
            </div>
        `).join("");
    }
}
// Helper functions
function formatSocialTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatPostMessage(message) {
    // Convert line breaks to HTML and add hashtag styling
    return message
        .replace(/\n/g, '<br>')
        .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

// Export function to be called from news filter
window.updateSocialFeed = updateSocialFeed;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.news-section')) {
        initializeSocialMedia();
    }
});
