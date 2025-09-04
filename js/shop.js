// Club Shop JavaScript - Cart and Filter Functionality

let cart = [];
let cartTotal = 0;

// Initialize shop when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeShop();
    updateCartDisplay();
});

function initializeShop() {
    // Category filter functionality
    const categoryBtns = document.querySelectorAll('.category-btn');
    const productCards = document.querySelectorAll('.product-card');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter products
            const category = this.getAttribute('data-category');
            filterProducts(category, productCards);
        });
    });

    // Size selection functionality
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(size => {
        size.addEventListener('click', function() {
            // Remove selected class from siblings
            const siblings = this.parentNode.querySelectorAll('.size-option');
            siblings.forEach(s => s.classList.remove('selected'));
            
            // Add selected class to clicked size
            this.classList.add('selected');
        });
    });

    // Add to cart functionality
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            addToCart(productCard);
        });
    });

    // Fade in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    productCards.forEach(card => {
        observer.observe(card);
    });
}

function filterProducts(category, productCards) {
    productCards.forEach(card => {
        const productCategory = card.getAttribute('data-category');
        
        if (category === 'all' || productCategory === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.classList.remove('hidden');
                card.classList.add('visible');
            }, 10);
        } else {
            card.classList.add('hidden');
            card.classList.remove('visible');
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

function addToCart(productCard) {
    const name = productCard.querySelector('.product-name').textContent;
    const price = parseFloat(productCard.querySelector('.product-price').textContent.replace('£', ''));
    const selectedSize = productCard.querySelector('.size-option.selected');
    
    // Check if size is required and selected
    const sizeOptions = productCard.querySelectorAll('.size-option');
    if (sizeOptions.length > 1 && !selectedSize) {
        alert('Please select a size before adding to cart');
        return;
    }
    
    const size = selectedSize ? selectedSize.textContent : 'One Size';
    
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.name === name && item.size === size);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            size: size,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showAddToCartConfirmation(name, size);
}

function updateCartDisplay() {
    const cartSummary = document.getElementById('cart-summary');
    const cartItems = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartSummary.style.display = 'none';
        return;
    }
    
    cartSummary.style.display = 'block';
    
    // Clear existing items
    cartItems.innerHTML = '';
    cartTotal = 0;
    
    // Add each cart item
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        cartTotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>Size: ${item.size} | Qty: ${item.quantity}</small>
            </div>
            <div>
                £${itemTotal.toFixed(2)}
                <button onclick="removeFromCart(${index})" style="margin-left: 10px; background: var(--primary-maroon); color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer;">×</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotalElement.textContent = cartTotal.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Simple checkout simulation
    let orderSummary = 'Order Summary:\n\n';
    cart.forEach(item => {
        orderSummary += `${item.name} (${item.size}) x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}\n`;
    });
    orderSummary += `\nTotal: £${cartTotal.toFixed(2)}`;
    orderSummary += '\n\nThis is a demo shop. In a real implementation, this would redirect to a secure payment processor.';
    
    alert(orderSummary);
    
    // Clear cart after "purchase"
    clearCart();
}

function showAddToCartConfirmation(itemName, size) {
    // Create and show a temporary confirmation message
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-green);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
    `;
    confirmation.innerHTML = `
        <strong>Added to Cart!</strong><br>
        ${itemName} (${size})
    `;
    
    document.body.appendChild(confirmation);
    
    // Remove confirmation after 3 seconds
    setTimeout(() => {
        confirmation.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(confirmation);
        }, 300);
    }, 3000);
}

// Add CSS animations for confirmations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
