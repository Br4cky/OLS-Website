// js/shop-data-loader.js - Integration script for shop.html
class ShopDataLoader {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('olrfc_cart')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadShop());
        } else {
            this.loadShop();
        }
        this.initializeCartDisplay();
        this.initializeFilters();
    }

    loadShop() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;

        const products = this.getData('shop');
        
        if (products.length === 0) {
            // Keep existing placeholder products if no admin data
            console.log('No admin products found, keeping placeholder products');
            this.makePlayholdersInteractive();
            return;
        }

        // Replace with admin products
        productsGrid.innerHTML = '';
        
        // Filter active products only
        const activeProducts = products.filter(product => product.status === 'active');
        
        activeProducts.forEach((product, index) => {
            const productCard = this.createProductCard(product, index);
            productsGrid.appendChild(productCard);
        });

        // Update category filter to match admin categories
        this.updateCategoryFilters(activeProducts);
        this.initializeFilters();
    }

    createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.dataset.category = product.category;

        // Determine product badge
        let badge = '';
        if (parseInt(product.stock) === 0) {
            badge = '<div class="product-badge" style="background: #dc3545;">Out of Stock</div>';
        } else if (parseInt(product.stock) < 5) {
            badge = '<div class="product-badge" style="background: #ffc107; color: #000;">Low Stock</div>';
        } else if (this.isNewProduct(product.dateAdded)) {
            badge = '<div class="product-badge">New</div>';
        } else if (this.isPopularProduct(product.name)) {
            badge = '<div class="product-badge">Popular</div>';
        }

        // Handle product images
        const imageDisplay = product.images && product.images.length > 0 
            ? `<img src="${product.images[0].url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<div class="product-placeholder"><span>${product.name}</span></div>`;

        // Format sizes
        const sizesDisplay = product.sizes && product.sizes.length > 0 
            ? product.sizes.map(size => `<span class="size-option">${size}</span>`).join('')
            : '<span class="size-option">One Size</span>';

        // Stock status
        const stockStatus = parseInt(product.stock) === 0 ? 'out-of-stock' : 'in-stock';
        const isOutOfStock = parseInt(product.stock) === 0;

        card.innerHTML = `
            <div class="product-image">
                ${imageDisplay}
                ${badge}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || 'Quality club merchandise'}</p>
                <div class="product-sizes">
                    <span class="size-label">Sizes:</span>
                    ${sizesDisplay}
                </div>
                <div class="product-price">£${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-stock" style="font-size: 0.9rem; color: ${isOutOfStock ? '#dc3545' : '#28a745'}; margin-bottom: 0.5rem;">
                    ${isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)`}
                </div>
                <button class="add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}" 
                        onclick="shopLoader.addToCart('${product.name}', ${product.price}, '${product.category}', ${index})"
                        ${isOutOfStock ? 'disabled' : ''}>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        `;

        return card;
    }

    updateCategoryFilters(products) {
        const categoryBtns = document.querySelector('.shop-categories');
        if (!categoryBtns) return;

        // Get unique categories from products
        const categories = [...new Set(products.map(p => p.category))];
        
        // Map admin categories to display names
        const categoryNames = {
            'jerseys': 'Jerseys',
            'training': 'Training Kit',
            'accessories': 'Accessories',
            'supporters': 'Supporters Gear'
        };

        // Update category buttons
        categoryBtns.innerHTML = `
            <button class="category-btn active" data-category="all">All Items</button>
            ${categories.map(cat => 
                `<button class="category-btn" data-category="${cat}">${categoryNames[cat] || cat}</button>`
            ).join('')}
        `;
    }

    makePlayholdersInteractive() {
        // Make existing placeholder products interactive
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach((btn, index) => {
            const productCard = btn.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent.replace('£', '');
            const productCategory = productCard.dataset.category || 'accessories';
            
            btn.onclick = () => this.addToCart(productName, parseFloat(productPrice), productCategory, index);
        });
    }

    initializeFilters() {
        const filterButtons = document.querySelectorAll('.category-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Filter products
                const filter = button.dataset.category;
                this.filterProducts(filter);
            });
        });
    }

    filterProducts(category) {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
            }
        });
        this.currentFilter = category;
    }

    // CART FUNCTIONALITY
    addToCart(productName, price, category, productIndex) {
        // Check if item already in cart
        const existingItem = this.cart.find(item => item.name === productName);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                name: productName,
                price: price,
                category: category,
                quantity: 1,
                productIndex: productIndex
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showCartNotification(productName);
    }

    removeFromCart(itemName) {
        this.cart = this.cart.filter(item => item.name !== itemName);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateCartQuantity(itemName, newQuantity) {
        const item = this.cart.find(item => item.name === itemName);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(itemName);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    saveCart() {
        localStorage.setItem('olrfc_cart', JSON.stringify(this.cart));
    }

    initializeCartDisplay() {
        this.updateCartDisplay();
    }

    updateCartDisplay() {
        const cartSummary = document.getElementById('cart-summary');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartSummary || !cartItems || !cartTotal) return;

        if (this.cart.length === 0) {
            cartSummary.style.display = 'none';
            return;
        }

        cartSummary.style.display = 'block';
        
        // Update cart items
        cartItems.innerHTML = '';
        let total = 0;
        
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #eee;
            `;
            
            cartItem.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    <small>£${item.price.toFixed(2)} each</small>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <button onclick="shopLoader.updateCartQuantity('${item.name}', ${item.quantity - 1})" 
                            style="background: #dc3545; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button onclick="shopLoader.updateCartQuantity('${item.name}', ${item.quantity + 1})" 
                            style="background: #28a745; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">+</button>
                    <button onclick="shopLoader.removeFromCart('${item.name}')" 
                            style="background: #6c757d; color: white; border: none; border-radius: 3px; padding: 0.2rem 0.5rem; margin-left: 0.5rem; cursor: pointer;">Remove</button>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        cartTotal.textContent = total.toFixed(2);
    }

    showCartNotification(productName) {
        // Create and show a notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-green);
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = `
            <strong>Added to Cart!</strong><br>
            ${productName}
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
    }

    checkout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemsText = this.cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
        
        // In a real shop, this would redirect to a payment processor
        alert(`Checkout Summary:\n\nItems: ${itemsText}\nTotal: £${total.toFixed(2)}\n\nIn a real implementation, this would redirect to a secure payment processor.`);
    }

    // UTILITY FUNCTIONS
    getData(key) {
        try {
            return JSON.parse(localStorage.getItem(`olrfc_${key}`)) || [];
        } catch (e) {
            console.error(`Error loading ${key} data:`, e);
            return [];
        }
    }

    isNewProduct(dateAdded) {
        if (!dateAdded) return false;
        const addedDate = new Date(dateAdded);
        const now = new Date();
        const daysDiff = (now - addedDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // New if added within last 7 days
    }

    isPopularProduct(productName) {
        // Define popular products (you could track this via analytics later)
        const popularItems = ['jersey', 'hoodie', 'scarf'];
        return popularItems.some(item => productName.toLowerCase().includes(item));
    }
}

// Global cart functions (called from HTML)
function clearCart() {
    shopLoader.clearCart();
}

function checkout() {
    shopLoader.checkout();
}

// Initialize shop data loader
const shopLoader = new ShopDataLoader();

// Additional CSS for cart and product enhancements
const additionalStyles = `
<style>
.cart-summary {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    box-shadow: var(--shadow);
    margin-top: 3rem;
    border: 2px solid var(--primary-green);
}

.cart-summary h3 {
    color: var(--primary-green);
    margin-bottom: 1rem;
}

.cart-total {
    text-align: right;
    font-size: 1.2rem;
    margin: 1rem 0;
    padding-top: 1rem;
    border-top: 2px solid var(--primary-green);
}

.cart-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
}

.product-stock {
    font-weight: bold;
}

.add-to-cart-btn.disabled {
    background: #6c757d !important;
    cursor: not-allowed !important;
    opacity: 0.6;
}

.add-to-cart-btn.disabled:hover {
    background: #6c757d !important;
    transform: none !important;
}

.product-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: var(--accent-gold);
    color: var(--primary-green);
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
    z-index: 10;
}

.product-image {
    position: relative;
    overflow: hidden;
}

.fade-in {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.6s ease;
}

@media (max-width: 768px) {
    .cart-actions {
        flex-direction: column;
    }
    
    .cart-item {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 0.5rem;
    }
}
</style>`;

// Add styles to page
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Update category buttons to be more interactive
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .category-btn.active {
            background: var(--primary-green) !important;
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .category-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
});