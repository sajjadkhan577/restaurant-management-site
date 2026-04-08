// Authentication Management
const Auth = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')),

    init() {
        this.updateProfileLinks();
        this.initFormListeners();
    },

    updateProfileLinks() {
        const profileLinks = document.querySelectorAll('a[href="signin.html"], a[href="profile.html"]');
        profileLinks.forEach(link => {
            if (this.currentUser) {
                link.href = 'profile.html';
                link.title = `Profile (${this.currentUser.name})`;
            } else {
                link.href = 'signin.html';
                link.title = 'Sign In';
            }
        });
    },

    initFormListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                this.login({ name: email.split('@')[0], email });
            });
        }

        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                this.login({ name, email });
            });
        }
    },

    login(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showToast(`Welcome, ${user.name} 🥂`);
        
        // Redirect back to return URL or default to index
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        setTimeout(() => {
            if (redirect === 'checkout') {
                window.location.href = 'menu.html?showCheckout=true';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateProfileLinks();
        showToast("Signed out successfully");
    },

    updateUser(updates) {
        if (!this.currentUser) return;
        this.currentUser = { ...this.currentUser, ...updates };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.syncUI();
    },

    syncUI() {
        if (!this.currentUser) return;
        
        // Update all name displays
        document.querySelectorAll('.user-name-display').forEach(el => {
            el.textContent = this.currentUser.name;
        });
        
        // Update all profile images
        document.querySelectorAll('.user-avatar-display').forEach(el => {
            el.src = this.currentUser.image || el.src;
        });
    }
};

// Cart System (Updated for Quantities & Dynamic Drawer)
const Cart = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    
    init() {
        this.initDrawer();
        this.updateUI();
        
        // Cart Toggle Logic
        document.querySelectorAll('[data-id="cart-toggle"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDrawer();
            });
        });
        
        document.querySelectorAll('[data-id="cart-close"]').forEach(btn => {
            btn.addEventListener('click', () => this.toggleDrawer(false));
        });

        // Initialize Checkout Modal components
        Checkout.init();

        // Check if we should auto-show checkout (after redirect from login)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('showCheckout') === 'true') {
            setTimeout(() => this.toggleDrawer(true), 500);
            setTimeout(() => Checkout.show(), 1000);
        }
    },

    initDrawer() {
        if (!document.getElementById('cart-drawer')) {
            const drawer = document.createElement('aside');
            drawer.id = 'cart-drawer';
            drawer.className = 'fixed right-0 top-0 h-full w-[90%] md:w-96 z-[100] rounded-l-3xl bg-surface-container-high/90 backdrop-blur-2xl shadow-[-20px_0px_60px_rgba(0,0,0,0.5)] flex flex-col p-8 gap-6 translate-x-full transition-transform duration-300 hidden border-l border-white/5';
            drawer.style.display = 'none';
            drawer.innerHTML = `
                <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                    <div>
                        <h2 class="text-xl font-extrabold text-white font-headline uppercase tracking-widest leading-tight">Your <br/><span class="text-primary italic">Selection</span></h2>
                        <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">Gourmet Curation</p>
                    </div>
                    <button class="material-symbols-outlined text-white hover:rotate-90 transition-transform p-2 bg-white/5 rounded-full" data-id="cart-close">close</button>
                </div>
                <div class="flex flex-col gap-4 overflow-y-auto flex-grow cart-items-list pr-2 custom-scrollbar">
                    <!-- Dynamic Items -->
                </div>
                <div class="mt-auto space-y-6 pt-6 border-t border-white/5">
                    <div class="flex justify-between items-end px-2">
                        <div class="flex flex-col">
                            <span class="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">Total Investment</span>
                            <span class="text-primary text-3xl font-black cart-total-price font-headline">$0.00</span>
                        </div>
                    </div>
                    <button onclick="placeOrder()" class="w-full py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-[0.2em] text-xs rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30">
                        Confirm Order Flow
                    </button>
                </div>
            `;
            document.body.appendChild(drawer);
        }
    },
    
    toggleDrawer(show) {
        const drawer = document.getElementById('cart-drawer');
        if (!drawer) return;
        
        if (show === undefined) {
            show = drawer.classList.contains('translate-x-full');
        }
        if (show) {
            drawer.style.display = 'flex';
            drawer.classList.remove('hidden');
            void drawer.offsetWidth;
            setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
        } else {
            drawer.classList.add('translate-x-full');
            setTimeout(() => {
                drawer.classList.add('hidden');
                if(drawer.classList.contains('translate-x-full')) drawer.style.display = 'none';
            }, 300);
        }
    },
    
    addItem(product) {
        const existingItem = this.items.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            this.items.push({ ...product, quantity: 1, id: Date.now() });
        }
        this.save();
        this.updateUI();
        showToast(`${product.name} added 💎`);
        playSound('add');
    },

    updateQuantity(id, delta) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.save();
                this.updateUI();
            }
        }
    },
    
    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
        this.updateUI();
        showToast(`Selection refined`);
    },
    
    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    },
    
    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },
    
    updateUI() {
        const cartContainers = document.querySelectorAll('.cart-items-list');
        const cartTotalElements = document.querySelectorAll('.cart-total-price');
        const cartCountElements = document.querySelectorAll('.cart-count, .cart-badge');
        
        const total = this.getTotal();
        
        cartTotalElements.forEach(el => el.textContent = `$${total.toFixed(2)}`);
        cartCountElements.forEach(el => {
            el.textContent = this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            if (this.items.length > 0) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
        
        cartContainers.forEach(container => {
            if (this.items.length === 0) {
                container.innerHTML = `<div class="text-center py-20 opacity-20"><span class="material-symbols-outlined text-6xl mb-4">shopping_bag</span><p class="text-xs uppercase tracking-widest font-bold">Your gallery is empty</p></div>`;
                return;
            }
            container.innerHTML = this.items.map(item => `
                <div class="flex gap-5 items-center group p-5 bg-white/[0.03] hover:bg-white/[0.08] rounded-3xl transition-all border border-white/5">
                    <div class="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl">
                        <img class="w-full h-full object-cover transition-transform group-hover:scale-110" src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-bold text-white truncate mb-1 font-headline">${item.name}</h4>
                        <p class="text-primary text-xs font-black mb-3">$${item.price.toFixed(2)}</p>
                        <div class="flex items-center gap-4">
                             <div class="flex items-center bg-black/40 rounded-full px-2 py-1 gap-3 border border-white/10">
                                 <button onclick="Cart.updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">-</button>
                                 <span class="text-xs font-bold text-white w-4 text-center">${item.quantity || 1}</span>
                                 <button onclick="Cart.updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">+</button>
                             </div>
                        </div>
                    </div>
                    <button onclick="Cart.removeItem(${item.id})" class="text-neutral-600 hover:text-primary transition-colors p-2">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            `).join('');
        });
    }
};

// Item Details Modal System
const ItemDetails = {
    init() {
        if (!document.getElementById('item-detail-modal')) {
            const modal = document.createElement('div');
            modal.id = 'item-detail-modal';
            modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="bg-surface-container-high w-[90%] max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl transform scale-90 transition-all duration-300 modal-container border border-white/10">
                    <div class="relative h-72">
                        <img id="modal-image" class="w-full h-full object-cover" src="" alt="">
                        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent"></div>
                        <button class="absolute top-6 right-6 w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full text-white flex items-center justify-center hover:rotate-90 transition-all border border-white/10" onclick="ItemDetails.hide()">
                             <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="p-10 space-y-8 -mt-10 relative z-10">
                        <div class="flex justify-between items-start">
                            <div class="space-y-1">
                                <p id="modal-type" class="text-primary text-[10px] uppercase tracking-[0.3em] font-black"></p>
                                <h2 id="modal-title" class="text-4xl font-headline font-extrabold tracking-tighter text-white"></h2>
                            </div>
                            <span id="modal-price" class="text-3xl font-headline font-black text-primary">$0</span>
                        </div>
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.25em]">The Composition</h4>
                            <p id="modal-description" class="text-on-surface-variant text-base leading-relaxed font-body"></p>
                        </div>
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.25em]">Provenance</h4>
                            <p id="modal-ingredients" class="text-neutral-400 text-xs italic leading-relaxed"></p>
                        </div>
                        <button id="modal-add-btn" class="w-full py-5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                            Add to Order
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hide();
            });
        }
    },
    
    show(item) {
        this.init(); // Ensure init if called before DOMContentLoaded
        const modal = document.getElementById('item-detail-modal');
        const container = modal.querySelector('.modal-container');
        document.getElementById('modal-image').src = item.image;
        document.getElementById('modal-title').textContent = item.name;
        document.getElementById('modal-type').textContent = item.type || 'Signature Dish';
        document.getElementById('modal-price').textContent = `$${item.price.toFixed(0)}`;
        document.getElementById('modal-description').textContent = item.description || "A selection featuring peak seasonal ingredients.";
        document.getElementById('modal-ingredients').textContent = item.ingredients || "Premium Ingredients, Selected Heirloom Greens, Artisanal Spices.";
        
        document.getElementById('modal-add-btn').onclick = () => {
            Cart.addItem(item);
            this.hide();
        };
        
        modal.style.display = 'flex';
        void modal.offsetWidth; // Force reflow
        modal.classList.remove('opacity-0', 'pointer-events-none');
        container.classList.remove('scale-90');
        container.classList.add('scale-100');
    },
    
    hide() {
        const modal = document.getElementById('item-detail-modal');
        const container = modal.querySelector('.modal-container');
        modal.classList.add('opacity-0', 'pointer-events-none');
        container.classList.remove('scale-100');
        container.classList.add('scale-90');
        setTimeout(() => { if (modal.classList.contains('opacity-0')) modal.style.display = 'none'; }, 300);
    }
};

// Checkout System
const Checkout = {
    init() {
        if (!document.getElementById('checkout-modal')) {
            const modal = document.createElement('div');
            modal.id = 'checkout-modal';
            modal.className = 'fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl opacity-0 pointer-events-none transition-all duration-300';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="bg-surface-container w-[90%] max-w-md rounded-[3rem] p-12 space-y-10 shadow-2xl border border-white/5 transform scale-95 transition-all duration-300 checkout-container">
                    <div class="text-center space-y-2">
                        <h2 class="text-3xl font-headline font-extrabold text-white tracking-tighter italic">Refining Your <span class="text-primary font-normal">Details</span></h2>
                        <p class="text-[10px] text-neutral-500 uppercase tracking-[0.3em] font-bold">Delivery Provenance</p>
                    </div>
                    <form id="checkout-form" class="space-y-8">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">The Connoisseur's Name</label>
                            <input type="text" id="order-name-input" required class="w-full bg-white/[0.03] border border-white/10 rounded-full px-8 py-5 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] transition-all text-sm outline-none" placeholder="Enter Full Name">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">Secure Contact</label>
                            <input type="tel" id="order-phone-input" required class="w-full bg-white/[0.03] border border-white/10 rounded-full px-8 py-5 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] transition-all text-sm outline-none" placeholder="+1 (555) 000-0000">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">Mailing Estate</label>
                            <textarea id="order-address-input" required class="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-5 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] transition-all h-32 resize-none text-sm outline-none" placeholder="124 Park Avenue, NYC"></textarea>
                        </div>
                        <div class="pt-4">
                            <button type="submit" class="w-full py-6 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                                Finalize Order Protocol
                            </button>
                        </div>
                        <button type="button" onclick="Checkout.hide()" class="w-full text-[10px] text-neutral-600 uppercase tracking-[0.2em] font-black hover:text-white transition-colors">Abort Selection</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#checkout-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.finalize();
            });
        }
    },

    show() {
        if (!Auth.currentUser) {
            showToast("Please sign in to proceed 🥂");
            setTimeout(() => {
                window.location.href = 'signin.html?redirect=checkout';
            }, 1000);
            return;
        }

        if (Cart.items.length === 0) {
            showToast("Your selection is empty");
            return;
        }
        const modal = document.getElementById('checkout-modal');
        const container = modal.querySelector('.checkout-container');
        modal.style.display = 'flex';
        void modal.offsetWidth; // force reflow
        modal.classList.remove('opacity-0', 'pointer-events-none');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
        
        // Auto-fill if user info exists
        if (Auth.currentUser) {
            const nameInput = document.getElementById('order-name-input');
            if (nameInput) nameInput.value = Auth.currentUser.name;
        }
    },

    hide() {
        const modal = document.getElementById('checkout-modal');
        const container = modal.querySelector('.checkout-container');
        modal.classList.add('opacity-0', 'pointer-events-none');
        container.classList.remove('scale-100');
        container.classList.add('scale-95');
        setTimeout(() => { if (modal.classList.contains('opacity-0')) modal.style.display = 'none'; }, 300);
    },

    finalize() {
        const name = document.getElementById('order-name-input').value;
        const phone = document.getElementById('order-phone-input').value;
        const address = document.getElementById('order-address-input').value;

        if (name.length < 3) { showToast("Name too short"); return; }
        if (phone.length < 10) { showToast("Invalid contact"); return; }
        if (address.length < 10) { showToast("Estate details incomplete"); return; }

        const orderData = {
            id: 'GE-' + Math.floor(Math.random() * 9000 + 1000),
            items: [...Cart.items],
            total: Cart.getTotal(),
            customer: { name, phone, address },
            status: 'received',
            startTime: Date.now()
        };

        localStorage.setItem('currentOrder', JSON.stringify(orderData));
        Cart.items = [];
        Cart.save();
        Cart.updateUI();

        playSound('order');
        showToast("Protocol Engaged. Live tracking active.");
        this.hide();

        setTimeout(() => {
            window.location.href = 'live.html';
        }, 1500);
    }
};

// Override legacy placeOrder
function placeOrder() {
    Checkout.show();
}

// Toast Notification System
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-4 pointer-events-none';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'bg-surface-container-highest/90 backdrop-blur-2xl border border-white/10 px-8 py-3 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl opacity-0 translate-y-4 transition-all duration-500 flex items-center gap-4';
    toast.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#f2ca50]"></span> ${message}`;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100', 'translate-y-0');
    });
    
    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-4');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Sound Management
const sounds = {
    add: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    order: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

function playSound(type) {
    if (!sounds[type]) return;
    const audio = new Audio(sounds[type]);
    audio.volume = 0.4;
    audio.play().catch(e => console.debug('Audio play failed:', e));
}

// Navigation Highlights
function initNavigation() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('nav a, aside a');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === path) {
            link.classList.remove('text-gray-400', 'text-neutral-500');
            link.classList.add('text-primary', 'font-black');
            if (link.closest('#mobile-nav')) {
                link.classList.add('scale-110');
            }
        }
    });
}

// Booking System
const Booking = {
    init() {
        if (!document.getElementById('booking-modal')) {
            const modal = document.createElement('div');
            modal.id = 'booking-modal';
            modal.className = 'fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-xl opacity-0 pointer-events-none transition-all duration-300';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="bg-surface-container w-[95%] max-w-lg rounded-[3rem] p-10 md:p-12 space-y-8 shadow-2xl border border-white/5 transform scale-95 transition-all duration-300 booking-container">
                    <div class="text-center space-y-2">
                        <h2 class="text-3xl font-headline font-extrabold text-white tracking-tighter italic">Reserve Your <span class="text-primary font-normal">Table</span></h2>
                        <p class="text-[10px] text-neutral-500 uppercase tracking-[0.3em] font-bold">The Gastronomic Experience</p>
                    </div>
                    <form id="booking-form" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="col-span-2 space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">Full Name</label>
                            <input type="text" id="book-name" required class="w-full bg-white/[0.03] border border-white/10 rounded-full px-8 py-4 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] outline-none text-sm" placeholder="The Connoisseur">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">Date</label>
                            <input type="date" id="book-date" required class="w-full bg-white/[0.03] border border-white/10 rounded-full px-8 py-4 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] outline-none text-sm">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">Time</label>
                            <input type="time" id="book-time" required class="w-full bg-white/[0.03] border border-white/10 rounded-full px-8 py-4 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] outline-none text-sm">
                        </div>
                        <div class="col-span-2 space-y-2">
                            <label class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-6">Guests</label>
                            <select id="book-guests" required class="w-full bg-white/[0.03] border border-white/10 rounded-full px-8 py-4 text-white focus:ring-2 focus:ring-primary focus:bg-white/[0.07] outline-none text-sm appearance-none">
                                <option value="1">1 Person</option>
                                <option value="2">2 People</option>
                                <option value="4">4 People</option>
                                <option value="6">6+ People</option>
                            </select>
                        </div>
                        <div class="col-span-2 pt-4">
                            <button type="submit" class="w-full py-5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                                Confirm Reservation
                            </button>
                        </div>
                        <button type="button" onclick="Booking.hide()" class="col-span-2 text-[10px] text-neutral-600 uppercase tracking-[0.2em] font-black hover:text-white transition-colors">Discard</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('booking-form').addEventListener('submit', (e) => {
                e.preventDefault();
                showToast("Reservation Confirmed 🕯️");
                this.hide();
            });
        }
        
        // Link all booking buttons with robust selection
        const linkBookingButtons = () => {
            document.querySelectorAll('button').forEach(btn => {
                const text = btn.innerText.toLowerCase();
                if (text.includes('book a table') && !btn.dataset.bookingLinked) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.show();
                    });
                    btn.dataset.bookingLinked = 'true';
                    // Ensure visibility/cursor
                    btn.style.cursor = 'pointer';
                }
            });
        };

        linkBookingButtons();
        // Check again after a short delay for dynamic content
        setTimeout(linkBookingButtons, 1000);
        
        // Global listener as fallback
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn && btn.innerText.toLowerCase().includes('book a table')) {
                e.preventDefault();
                this.show();
            }
        });
    },

    show() {
        const modal = document.getElementById('booking-modal');
        if (!modal) { this.init(); return this.show(); }
        const container = modal.querySelector('.booking-container');
        modal.style.display = 'flex';
        void modal.offsetWidth; // Force reflow
        modal.classList.remove('opacity-0', 'pointer-events-none');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
        
        if (Auth.currentUser) {
            document.getElementById('book-name').value = Auth.currentUser.name;
        }
    },

    hide() {
        const modal = document.getElementById('booking-modal');
        const container = modal.querySelector('.booking-container');
        modal.classList.add('opacity-0', 'pointer-events-none');
        container.classList.remove('scale-100');
        container.classList.add('scale-95');
        setTimeout(() => { if (modal.classList.contains('opacity-0')) modal.style.display = 'none'; }, 300);
    }
};

// Profile Management System
const ProfileEditor = {
    init() {
        const nameContainer = document.querySelector('.name-edit-container');
        const avatarEl = document.querySelector('.editable-avatar');
        
        if (nameContainer) {
            const editBtn = nameContainer.querySelector('.edit-name-btn');
            const saveBtn = nameContainer.querySelector('.save-name-btn');
            const cancelBtn = nameContainer.querySelector('.cancel-name-btn');
            const input = nameContainer.querySelector('.name-input');
            const display = nameContainer.querySelector('.name-display');

            if (editBtn) {
                editBtn.addEventListener('click', () => this.toggleEdit(true));
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.toggleEdit(false));
            }
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const newName = input.value.trim();
                    if (newName) {
                        Auth.updateUser({ name: newName });
                        showToast("Identity Refined");
                        this.toggleEdit(false);
                    }
                });
            }
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveBtn.click();
                    if (e.key === 'Escape') cancelBtn.click();
                });
            }
        }
        
        if (avatarEl) {
            avatarEl.style.cursor = 'pointer';
            avatarEl.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            Auth.updateUser({ image: event.target.result });
                            showToast("Portrait Refined");
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            });
        }

        this.initCategoryLinks();
    },

    toggleEdit(show) {
        const container = document.querySelector('.name-edit-container');
        if (!container) return;

        const viewMode = container.querySelector('.view-mode');
        const editMode = container.querySelector('.edit-mode');
        const input = container.querySelector('.name-input');
        const display = container.querySelector('.name-display');

        if (show) {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            input.value = display.innerText;
            input.focus();
        } else {
            viewMode.classList.remove('hidden');
            editMode.classList.add('hidden');
        }
    },

    initCategoryLinks() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        const sidebarLinks = document.querySelectorAll('aside nav a');
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === path) {
                link.classList.remove('text-neutral-500');
                link.classList.add('text-[#d4af37]', 'font-bold', 'border-l-4', 'border-[#f2ca50]', 'bg-[#201f1f]');
                const icon = link.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            }
        });
    }
};

// Add standard containment check for buttons
if (!window.NodeList.prototype.contains) {
    // Just a placeholder, using custom logic
}

// Optimization for finding buttons by text
function findButtonsByText(text) {
    return Array.from(document.querySelectorAll('button')).filter(btn => btn.innerText.includes(text));
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    Cart.init();
    ItemDetails.init();
    Checkout.init();
    Booking.init();
    ProfileEditor.init();
    initNavigation();
    Auth.syncUI();
});
