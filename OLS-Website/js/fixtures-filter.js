// Fixtures and Results Filtering System

// Team fixtures data
const teamFixturesData = {
    'mens-1st': {
        teamName: 'Mens 1st XV',
        lastResult: {
            homeTeam: 'Old Laurentian RFC',
            awayTeam: 'Derby RFC',
            homeScore: 24,
            awayScore: 17,
            date: '2025-06-22',
            venue: 'Home Ground',
            competition: 'Regional Championship',
            matchReport: 'Excellent performance in challenging conditions...'
        },
        nextFixtures: [
            {
                homeTeam: 'Old Laurentian RFC',
                awayTeam: 'Birmingham RFC',
                date: '2025-07-06',
                time: '15:00',
                venue: 'Home Ground',
                competition: 'Regional Championship',
                status: 'confirmed'
            },
            {
                homeTeam: 'Leicester Forest RFC',
                awayTeam: 'Old Laurentian RFC',
                date: '2025-07-13',
                time: '15:00',
                venue: 'Leicester Forest Ground',
                competition: 'Regional Championship',
                status: 'confirmed'
            }
        ]
    },
    'mens-2nd': {
        teamName: 'Mens 2nd XV',
        lastResult: {
            homeTeam: 'Old Laurentian RFC 2nd XV',
            awayTeam: 'Nottingham RFC 2nd XV',
            homeScore: 18,
            awayScore: 12,
            date: '2025-06-22',
            venue: 'Away Ground',
            competition: 'Regional Championship 2nd XV',
            matchReport: 'Hard-fought away victory...'
        },
        nextFixtures: [
            {
                homeTeam: 'Old Laurentian RFC 2nd XV',
                awayTeam: 'Leicester Forest RFC 2nd XV',
                date: '2025-07-06',
                time: '13:00',
                venue: 'Home Ground',
                competition: 'Regional Championship 2nd XV',
                status: 'confirmed'
            },
            {
                homeTeam: 'Birmingham RFC 2nd XV',
                awayTeam: 'Old Laurentian RFC 2nd XV',
                date: '2025-07-13',
                time: '13:00',
                venue: 'Birmingham RFC Ground',
                competition: 'Regional Championship 2nd XV',
                status: 'confirmed'
            }
        ]
    },
    'ladies': {
        teamName: 'Phoenix Ladies',
        lastResult: {
            homeTeam: 'Phoenix Ladies',
            awayTeam: 'Coventry Ladies',
            homeScore: 22,
            awayScore: 15,
            date: '2025-06-23',
            venue: 'Home Ground',
            competition: 'Midlands Womens Championship',
            matchReport: 'Dominant display secures championship spot...'
        },
        nextFixtures: [
            {
                homeTeam: 'Birmingham Ladies',
                awayTeam: 'Phoenix Ladies',
                date: '2025-07-07',
                time: '14:00',
                venue: 'Birmingham RFC Ground',
                competition: 'Midlands Womens Championship',
                status: 'confirmed'
            },
            {
                homeTeam: 'Phoenix Ladies',
                awayTeam: 'Worcester Ladies',
                date: '2025-07-14',
                time: '14:00',
                venue: 'Home Ground',
                competition: 'Midlands Womens Championship',
                status: 'confirmed'
            }
        ]
    },
    'colts': {
        teamName: 'Colts (U18s)',
        lastResult: {
            homeTeam: 'Old Laurentian RFC Colts',
            awayTeam: 'Leicester Forest Colts',
            homeScore: 28,
            awayScore: 14,
            date: '2025-06-23',
            venue: 'Home Ground',
            competition: 'Midlands Colts Championship',
            matchReport: 'Impressive attacking display...'
        },
        nextFixtures: [
            {
                homeTeam: 'Coventry Colts',
                awayTeam: 'Old Laurentian RFC Colts',
                date: '2025-07-07',
                time: '11:00',
                venue: 'Coventry RFC Ground',
                competition: 'Midlands Colts Championship',
                status: 'confirmed'
            },
            {
                homeTeam: 'Old Laurentian RFC Colts',
                awayTeam: 'Birmingham Colts',
                date: '2025-07-14',
                time: '11:00',
                venue: 'Home Ground',
                competition: 'Midlands Colts Championship',
                status: 'confirmed'
            }
        ]
    },
    'u16s': {
        teamName: 'U16s',
        lastResult: {
            homeTeam: 'Old Laurentian RFC U16s',
            awayTeam: 'Derby RFC U16s',
            homeScore: 26,
            awayScore: 19,
            date: '2025-06-23',
            venue: 'Home Ground',
            competition: 'County Youth Championship',
            matchReport: 'Thrilling match with late winning try...'
        },
        nextFixtures: [
            {
                homeTeam: 'Old Laurentian RFC U16s',
                awayTeam: 'Leicester U16s',
                date: '2025-07-07',
                time: '10:00',
                venue: 'Home Ground',
                competition: 'County Youth Championship',
                status: 'confirmed'
            },
            {
                homeTeam: 'Nottingham RFC U16s',
                awayTeam: 'Old Laurentian RFC U16s',
                date: '2025-07-14',
                time: '10:00',
                venue: 'Nottingham RFC Ground',
                competition: 'County Youth Championship',
                status: 'confirmed'
            }
        ]
    },
    'u14s': {
        teamName: 'U14s',
        lastResult: {
            homeTeam: 'Old Laurentian RFC U14s',
            awayTeam: 'Birmingham RFC U14s',
            homeScore: 22,
            awayScore: 10,
            date: '2025-06-23',
            venue: 'Home Ground',
            competition: 'County Youth Festival',
            matchReport: 'Great team performance with tries from everyone...'
        },
        nextFixtures: [
            {
                homeTeam: 'Coventry RFC U14s',
                awayTeam: 'Old Laurentian RFC U14s',
                date: '2025-07-07',
                time: '09:30',
                venue: 'Coventry RFC Ground',
                competition: 'County Youth Festival',
                status: 'confirmed'
            },
            {
                homeTeam: 'Old Laurentian RFC U14s',
                awayTeam: 'Worcester RFC U14s',
                date: '2025-07-14',
                time: '09:30',
                venue: 'Home Ground',
                competition: 'County Youth Festival',
                status: 'confirmed'
            }
        ]
    }
};

// Initialize fixtures filtering
function initializeFixturesFiltering() {
    setupTeamFilterEventListeners();
    updateFixturesDisplay('mens-1st'); // Default to Mens 1st XV
}

// Setup team filter event listeners
function setupTeamFilterEventListeners() {
    const filterButtons = document.querySelectorAll('.team-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get team and update fixtures
            const team = this.getAttribute('data-team');
            updateFixturesDisplay(team);
        });
    });
}

// Update fixtures display based on selected team
function updateFixturesDisplay(team) {
    const data = teamFixturesData[team];
    if (!data) return;
    
    const matchGrid = document.getElementById('fixtures-match-grid');
    if (!matchGrid) return;
    
    const lastResult = data.lastResult;
    const nextFixtures = data.nextFixtures;
    
    matchGrid.innerHTML = `
        <!-- Last Result Card -->
        <div class="match-card fade-in result-card-detailed">
            <div class="match-type">Latest Result - ${data.teamName}</div>
            <div class="match-teams">${lastResult.homeTeam} vs ${lastResult.awayTeam}</div>
            <div class="match-result">${lastResult.homeScore} - ${lastResult.awayScore}</div>
            <div class="match-details">
                ${formatMatchDate(lastResult.date)}<br>
                ${lastResult.venue}<br>
                <em>${lastResult.competition}</em>
            </div>
            <a href="#" class="btn btn-secondary" onclick="showMatchReport('${team}', 'last')">Match Report</a>
        </div>
        
        <!-- Next Fixture Card 1 -->
        <div class="match-card fade-in fixture-card-detailed">
            <div class="match-type">Next Fixture - ${data.teamName}</div>
            <div class="match-teams">${nextFixtures[0].homeTeam} vs ${nextFixtures[0].awayTeam}</div>
            <div class="match-time-large">${formatMatchDate(nextFixtures[0].date)}<br>${nextFixtures[0].time}</div>
            <div class="match-details">
                ${nextFixtures[0].venue}<br>
                <em>${nextFixtures[0].competition}</em>
            </div>
            <a href="#" class="btn btn-secondary" onclick="showMatchPreview('${team}', 0)">Match Preview</a>
        </div>
        
        <!-- Next Fixture Card 2 -->
        <div class="match-card fade-in fixture-card-detailed">
            <div class="match-type">Following Fixture - ${data.teamName}</div>
            <div class="match-teams">${nextFixtures[1].homeTeam} vs ${nextFixtures[1].awayTeam}</div>
            <div class="match-time-large">${formatMatchDate(nextFixtures[1].date)}<br>${nextFixtures[1].time}</div>
            <div class="match-details">
                ${nextFixtures[1].venue}<br>
                <em>${nextFixtures[1].competition}</em>
            </div>
            <a href="#" class="btn btn-secondary" onclick="showMatchPreview('${team}', 1)">Match Preview</a>
        </div>
    `;
    
    // Re-initialize fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.match-card').forEach(card => {
        observer.observe(card);
    });
}

// Helper functions
function formatMatchDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

function showMatchReport(team, type) {
    const data = teamFixturesData[team];
    const report = data.lastResult.matchReport;
    alert(`Match Report for ${data.teamName}:\n\n${report}\n\nIn a real implementation, this would open a detailed match report page.`);
}

function showMatchPreview(team, fixtureIndex) {
    const data = teamFixturesData[team];
    const fixture = data.nextFixtures[fixtureIndex];
    alert(`Match Preview:\n${fixture.homeTeam} vs ${fixture.awayTeam}\n${formatMatchDate(fixture.date)} at ${fixture.time}\n\nIn a real implementation, this would show team news, form, and match preview.`);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('fixtures-match-grid')) {
        initializeFixturesFiltering();
    }
});

// Export for external use
window.updateFixturesDisplay = updateFixturesDisplay;
