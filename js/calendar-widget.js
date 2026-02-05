// ============================================================================
// 📅 OLS RUGBY CALENDAR WIDGET
// Custom calendar with Month/Week/List views + Day click popups
// ============================================================================

class CalendarWidget {
    constructor(containerId, dataFetcher) {
        this.container = document.getElementById(containerId);
        this.dataFetcher = dataFetcher;
        this.currentView = 'month'; // month, week, list
        this.currentDate = new Date();
        this.allEvents = [];
        this.filteredEvents = [];
        this.currentFilter = 'all';
        
        this.init();
    }

    async init() {
        console.log('📅 Initializing Calendar Widget...');
        
        // Load events
        this.allEvents = await this.dataFetcher.getAllEvents();
        this.filteredEvents = [...this.allEvents];
        
        // Render UI
        this.render();
        
        console.log('✅ Calendar Widget initialized');
    }

    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    render() {
        this.container.innerHTML = `
            <div class="calendar-widget">
                <!-- Header with view toggle -->
                <div class="calendar-header">
                    <div class="calendar-nav">
                        <button class="calendar-nav-btn" onclick="calendarWidget.previousPeriod()">
                            ← Previous
                        </button>
                        <h3 class="calendar-title">${this.getTitle()}</h3>
                        <button class="calendar-nav-btn" onclick="calendarWidget.nextPeriod()">
                            Next →
                        </button>
                    </div>
                    
                    <div class="calendar-view-toggle">
                        <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" 
                                onclick="calendarWidget.switchView('month')">
                            Month
                        </button>
                        <button class="view-btn ${this.currentView === 'week' ? 'active' : ''}" 
                                onclick="calendarWidget.switchView('week')">
                            Week
                        </button>
                        <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" 
                                onclick="calendarWidget.switchView('list')">
                            List
                        </button>
                    </div>
                    
                    <button class="calendar-today-btn" onclick="calendarWidget.goToToday()">
                        Today
                    </button>
                </div>

                <!-- Calendar body -->
                <div class="calendar-body">
                    ${this.renderCurrentView()}
                </div>
            </div>

            <!-- Day popup modal (hidden by default) -->
            <div id="day-popup-modal" class="day-popup-modal" style="display: none;">
                <div class="day-popup-content">
                    <div class="day-popup-header">
                        <h3 id="day-popup-title">Events</h3>
                        <button class="day-popup-close" onclick="calendarWidget.closePopup()">×</button>
                    </div>
                    <div class="day-popup-body" id="day-popup-body">
                        <!-- Events populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'month':
                return this.renderMonthView();
            case 'week':
                return this.renderWeekView();
            case 'list':
                return this.renderListView();
            default:
                return this.renderMonthView();
        }
    }

    // ========================================================================
    // MONTH VIEW
    // ========================================================================
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        
        // Get days from previous month to fill grid
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = startDayOfWeek;
        
        let html = `
            <div class="calendar-month">
                <!-- Weekday headers -->
                <div class="calendar-weekdays">
                    <div class="calendar-weekday">Sun</div>
                    <div class="calendar-weekday">Mon</div>
                    <div class="calendar-weekday">Tue</div>
                    <div class="calendar-weekday">Wed</div>
                    <div class="calendar-weekday">Thu</div>
                    <div class="calendar-weekday">Fri</div>
                    <div class="calendar-weekday">Sat</div>
                </div>
                
                <!-- Days grid -->
                <div class="calendar-days">
        `;
        
        // Previous month days
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        // Current month days
        const today = new Date().toDateString();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toDateString();
            const isToday = dateStr === today;
            const eventsOnDay = this.dataFetcher.getEventsForDate(this.filteredEvents, date);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${eventsOnDay.length > 0 ? 'has-events' : ''}"
                     onclick="calendarWidget.showDayPopup('${date.toISOString()}')">
                    <div class="day-number">${day}</div>
                    ${eventsOnDay.length > 0 ? `
                        <div class="day-events-indicator">
                            ${eventsOnDay.slice(0, 3).map(e => `
                                <div class="event-bar" style="background: ${e.color}" title="${e.title}">
                                    <span class="event-bar-text">${this.abbreviateTitle(e.title)}</span>
                                </div>
                            `).join('')}
                            ${eventsOnDay.length > 3 ? `<span class="more-events">+${eventsOnDay.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Next month days to fill grid
        const totalCells = prevMonthDays + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    // ========================================================================
    // WEEK VIEW
    // ========================================================================
    renderWeekView() {
    const startOfWeek = this.getStartOfWeek(this.currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
    }
    
    const today = new Date().toDateString();
    
    let html = `
        <div class="calendar-week">
            <div class="week-days">
    `;
    
    for (const day of days) {
        const dateStr = day.toDateString();
        const isToday = dateStr === today;
        const eventsOnDay = this.dataFetcher.getEventsForDate(this.filteredEvents, day);
        
        html += `
            <div class="week-day ${isToday ? 'today' : ''}">
                <div class="week-day-header" onclick="calendarWidget.showDayPopup('${day.toISOString()}')">
                    <div class="week-day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="week-day-number ${isToday ? 'today-number' : ''}">${day.getDate()}</div>
                </div>
                <div class="week-day-events">
                    ${eventsOnDay.length > 0 ? eventsOnDay.map((event, index) => {
                        // Store event in window for onclick access
                        const eventKey = `weekEvent_${day.getTime()}_${index}`;
                        if (typeof window !== 'undefined') {
                            window[eventKey] = event;
                        }
                        
                        return `
                            <div class="week-event" 
                                 style="border-left: 4px solid ${event.color}"
                                 onclick="event.stopPropagation(); 
         if(typeof showEventModal === 'function') { 
             showEventModal(window['${eventKey}']); 
         } else { 
             calendarWidget.showDayPopup('${day.toISOString()}'); 
         }">
                                <div class="week-event-time">${this.formatEventTime(event)}</div>
                                <div class="week-event-title">${event.title}</div>
                            </div>
                        `;
                    }).join('') : '<div class="no-events">No events</div>'}
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

    // ========================================================================
    // LIST VIEW
    // ========================================================================
    renderListView() {
    const startDate = new Date(this.currentDate);
    startDate.setDate(1); // First of month
    
    const endDate = new Date(this.currentDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last of month
    
    const events = this.dataFetcher.getEventsInRange(this.filteredEvents, startDate, endDate);
    
    if (events.length === 0) {
        return `
            <div class="calendar-list">
                <div class="no-events-message">
                    <p>No events scheduled for this month</p>
                </div>
            </div>
        `;
    }
    
    // Group by date
    const groupedEvents = {};
    events.forEach(event => {
        const dateKey = new Date(event.start).toDateString();
        if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = [];
        }
        groupedEvents[dateKey].push(event);
    });
    
    let html = `
        <div class="calendar-list">
            <div class="list-month-header">
                <h3>${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            </div>
    `;
    
    for (const [dateKey, dayEvents] of Object.entries(groupedEvents)) {
        const date = new Date(dateKey);
        html += `
            <div class="list-date-group">
                <div class="list-date-header">
                    <h4>${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                </div>
                <div class="list-events">
                    ${dayEvents.map((event, index) => {
                        // Store event in window for onclick access
                        const eventKey = `listEvent_${dateKey}_${index}`;
                        if (typeof window !== 'undefined') {
                            window[eventKey] = event;
                        }
                        
                        return `
                            <div class="list-event" 
                                 style="border-left: 4px solid ${event.color}"
                                 onclick="if(typeof showEventModal === 'function') { 
             showEventModal(window['${eventKey}']); 
         } else { 
             calendarWidget.showDayPopup('${new Date(event.start).toISOString()}'); 
         }">
                                <div class="list-event-time">${this.formatEventTime(event)}</div>
                                <div class="list-event-details">
                                    <div class="list-event-title">${event.title}</div>
                                    <div class="list-event-type">${event.type}</div>
                                    ${event.location ? `<div class="list-event-location">📍 ${event.location}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    return html;
}
    // ========================================================================
    // DAY POPUP
    // ========================================================================
    showDayPopup(dateISO) {
        const date = new Date(dateISO);
        const events = this.dataFetcher.getEventsForDate(this.filteredEvents, date);
        
        // Sort events by time
        events.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        const modal = document.getElementById('day-popup-modal');
        const title = document.getElementById('day-popup-title');
        const body = document.getElementById('day-popup-body');
        
        title.textContent = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
        
        if (events.length === 0) {
            body.innerHTML = '<p class="no-events-popup">No events on this day</p>';
        } else {
            body.innerHTML = events.map(event => `
                <div class="popup-event" style="border-left: 4px solid ${event.color}">
                    <div class="popup-event-header">
                        <div class="popup-event-time">${this.formatEventTime(event)}</div>
                        <div class="popup-event-type" style="color: ${event.color}">${event.type}</div>
                    </div>
                    <h4 class="popup-event-title">${event.title}</h4>
                    
                    ${event.fixture ? `
                        <!-- 🎯 OLS 129: Fixture-specific info (now works for Google Calendar fixtures too) -->
                        <div class="popup-event-details">
                            <p><strong>📍 Location:</strong> ${event.location}</p>
                            ${event.fixture.competition ? `<p><strong>🏆 Competition:</strong> ${event.fixture.competition}</p>` : ''}
                            ${event.fixture.ourScore && event.fixture.theirScore ? 
                                `<p><strong>⚽ Score:</strong> ${event.fixture.teamName || 'OLS'} ${event.fixture.ourScore} - ${event.fixture.theirScore} ${event.fixture.opponent || ''}</p>` 
                                : ''}
                        </div>
                    ` : `
                        <!-- Google Calendar event -->
                        <div class="popup-event-details">
                            ${event.description ? `<p>${event.description}</p>` : ''}
                            ${event.location ? `<p><strong>📍</strong> ${event.location}</p>` : ''}
                        </div>
                    `}
                    
                    <button class="popup-view-details-btn" onclick="window.location.href='pages/events.html?event=${event.id}'">
                        View Full Details →
                    </button>
                </div>
            `).join('');
        }
        
        modal.style.display = 'flex';
    }

    closePopup() {
        document.getElementById('day-popup-modal').style.display = 'none';
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================
    previousPeriod() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else if (this.currentView === 'list') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        }
        this.render();
    }

    nextPeriod() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else if (this.currentView === 'list') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    switchView(view) {
        this.currentView = view;
        this.render();
    }

    // ========================================================================
    // FILTERING
    // ========================================================================
    filterByType(type) {
        this.currentFilter = type;
        if (type === 'all') {
            this.filteredEvents = [...this.allEvents];
        } else {
            this.filteredEvents = this.dataFetcher.getEventsByType(this.allEvents, type);
        }
        this.render();
    }

    // ========================================================================
    // HELPERS
    // ========================================================================
    getTitle() {
        if (this.currentView === 'month') {
            return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (this.currentView === 'week') {
            const startOfWeek = this.getStartOfWeek(this.currentDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    formatTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    // Format time display - shows range for private/free-busy events
    formatEventTime(event) {
        if (event.allDay) {
            return 'All Day';
        }
        
        const startTime = this.formatTime(event.start);
        
        // Private events show start AND end time
        if (event.isPrivate && event.end) {
            const endTime = this.formatTime(event.end);
            return `${startTime} - ${endTime}`;
        }
        
        return startTime;
    }

    abbreviateTitle(title) {
        // 🎯 OLS 129: Remove team name prefixes to save space (handles any team, not just OLS)
        let abbreviated = title.replace(/^[\w\s']+ (vs|at) /i, '');
        
        // Truncate to fit in bar (approximately 15 characters)
        if (abbreviated.length > 15) {
            abbreviated = abbreviated.substring(0, 12) + '...';
        }
        
        return abbreviated;
    }
}

// ============================================================================
// GLOBAL INSTANCE (for onclick handlers)
// ============================================================================
window.calendarWidget = null;

console.log('✅ CalendarWidget loaded');