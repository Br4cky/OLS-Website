// Old Laurentian RFC - Animations

document.addEventListener('DOMContentLoaded', function() {
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Stats counter animation
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const text = stat.textContent;
            const target = parseInt(text.replace(/[^\d]/g, ''));
            const increment = target / 50;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                const suffix = text.includes('+') ? '+' : '';
                stat.textContent = Math.floor(current) + suffix;
            }, 30);
        });
    };

    // Trigger stats animation when stats section is visible
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statsObserver.observe(statsSection);
    }

    // Add stagger animation to grid items
    const addStaggerAnimation = (selector, delay = 100) => {
        const items = document.querySelectorAll(selector);
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * delay}ms`;
        });
    };

    // Apply stagger to news cards and match cards
    addStaggerAnimation('.news-card');
    addStaggerAnimation('.match-card');

    // Add hover effects to cards
    const addCardHoverEffects = () => {
        const cards = document.querySelectorAll('.news-card, .match-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    };

    addCardHoverEffects();

    // Loading animation for images
    const handleImageLoading = () => {
        const images = document.querySelectorAll('img:not(.logo img)');
        images.forEach(img => {
            img.addEventListener('load', function() {
                this.style.opacity = '1';
                this.style.transform = 'scale(1)';
            });
            
            // Set initial state
            img.style.opacity = '0';
            img.style.transform = 'scale(0.9)';
            img.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
    };

    handleImageLoading();
});
