// Old Laurentian RFC - Main JavaScript

const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
const header = document.querySelector('.header');
const navLinks = document.querySelectorAll('.nav-link');

// Mobile menu toggle
if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Close mobile menu if open
            if (nav) {
                nav.classList.remove('active');
            }
            
            // Update active nav link
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// Header background change on scroll
window.addEventListener('scroll', function() {
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(46, 80, 22, 0.95)';
        } else {
            header.style.background = 'linear-gradient(135deg, #2e5016, #8b1538)';
        }
    }
});

// Update active navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    if (nav && !nav.contains(event.target) && !menuToggle.contains(event.target)) {
        nav.classList.remove('active');
    }
});

// Utility functions
const utils = {
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    isInViewport: function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

window.OLRFCUtils = utils;
