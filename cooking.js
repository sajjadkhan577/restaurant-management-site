// Simulation for Order Tracking and Cooking
const Simulation = {
    steps: [
        { name: 'received', label: 'Order Received 🧾' },
        { name: 'preparing', label: 'Preparing 👨‍🍳' },
        { name: 'cooking', label: 'Cooking 🔥' },
        { name: 'ready', label: 'Ready ✅' },
        { name: 'delivery', label: 'Out for Delivery 🚚' }
    ],
    
    currentStepIndex: 0,
    interval: null,
    
    start() {
        const orderString = localStorage.getItem('currentOrder');
        if (!orderString) {
            console.log("No active order found.");
            // Optional: Redirect to menu if no order
            return;
        }
        const order = JSON.parse(orderString);
        
        this.populateOrderDetails(order);
        this.updateUI();
        this.runSimulation();
    },
    
    populateOrderDetails(order) {
        // Update Order Name/Headline
        const nameEl = document.getElementById('order-name');
        if (nameEl && order.items && order.items.length > 0) {
            nameEl.textContent = order.items[0].name + (order.items.length > 1 ? ` & ${order.items.length - 1} more` : "");
        }
        
        const subtitleEl = document.getElementById('order-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = `Order #${order.id} for ${order.customer.name} is being prepared for ${order.customer.address}.`;
        }
        
        const descEl = document.getElementById('order-description');
        if (descEl) {
            descEl.textContent = "Our master chef is currently focusing on the " + (order.items[0].name) + " to ensure peak flavor profile.";
        }
        
        // Update Items List (especially for track.html)
        const itemsList = document.getElementById('order-items-list');
        if (itemsList && order.items) {
            itemsList.innerHTML = order.items.map(item => `
                <div class="flex justify-between items-center group p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden shadow-lg">
                            <img alt="${item.name}" class="w-full h-full object-cover" src="${item.image}"/>
                        </div>
                        <div>
                            <p class="text-white text-sm font-bold truncate max-w-[150px]">${item.name}</p>
                            <p class="text-primary text-[10px] font-bold uppercase tracking-widest">Quantity: ${item.quantity || 1}</p>
                        </div>
                    </div>
                    <span class="text-yellow-500 text-sm font-bold">$${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
            `).join('');
        }
        
        // Update Totals
        const total = order.total || order.items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
        document.querySelectorAll('.cart-total-price').forEach(el => el.textContent = `$${total.toFixed(2)}`);
    },
    
    runSimulation() {
        if (this.interval) clearInterval(this.interval);
        
        // Initial Notification
        this.triggerStepAnimation();
        
        this.interval = setInterval(() => {
            if (this.currentStepIndex < this.steps.length - 1) {
                this.currentStepIndex++;
                this.updateUI();
                this.triggerStepAnimation();
            } else {
                clearInterval(this.interval);
                showToast("Order is now on its way! 🚚");
            }
        }, 4000); // 4 seconds per step for immersion
    },
    
    triggerStepAnimation() {
        const currentStep = this.steps[this.currentStepIndex];
        showToast(`Status: ${currentStep.label}`);
        
        if (currentStep.name === 'cooking') {
            const orderString = localStorage.getItem('currentOrder');
            const order = orderString ? JSON.parse(orderString) : null;
            const foodType = (order && order.items && order.items.length > 0) ? (order.items[0].type || 'pizza') : 'pizza';
            this.showCookingAnimation(foodType);
        } else if (currentStep.name === 'ready') {
             const liveView = document.getElementById('live-view-container');
             if (liveView) {
                 liveView.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full bg-black/40 backdrop-blur-xl rounded-[2rem] p-10 text-center space-y-4">
                        <div class="w-20 h-20 bg-tertiary/20 rounded-full flex items-center justify-center text-tertiary">
                            <span class="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white italic">Curated & Ready</h3>
                        <p class="text-sm text-neutral-400">Your selection has passed final inspection and is being packaged for the journey.</p>
                    </div>
                 `;
             }
        }
    },
    
    showCookingAnimation(type) {
        const liveView = document.getElementById('live-view-container');
        if (!liveView) return;
        
        const typeKey = type.toLowerCase();
        let animationHtml = '';
        let message = '';
        let colorClass = 'text-primary';

        if (typeKey.includes('pizza')) {
            animationHtml = '<div class="oven-animation"></div>';
            message = 'Hearth fired to 450°C. Sourdough blistering... 🔥';
            colorClass = 'text-primary';
        } else if (typeKey.includes('burg') || typeKey.includes('wagyu')) {
            animationHtml = '<div class="sizzle-animation"></div>';
            message = 'Wagyu fat rendering. Sizzling on the custom grill... 🍔';
            colorClass = 'text-secondary';
        } else if (typeKey.includes('bbq') || typeKey.includes('brisket')) {
            animationHtml = '<div class="sizzle-animation scale-150 opacity-50"></div>';
            message = 'Hickory smoke infusion in progress. Patience is flavor... 🍖';
            colorClass = 'text-orange-500';
        } else if (typeKey.includes('coffee') || typeKey.includes('drink')) {
            animationHtml = '<div class="coffee-stream"></div>';
            message = 'Artisanal extraction at optimal pressure... ☕';
            colorClass = 'text-tertiary';
        } else {
            animationHtml = '<div class="oven-animation"></div>';
            message = 'Precision preparation of your signature selection...';
        }
        
        liveView.innerHTML = `
            <div class="cooking-container bg-surface-container relative overflow-hidden flex flex-col items-center justify-center h-full">
                <div class="absolute inset-0 opacity-10 blur-3xl bg-gradient-to-br from-primary to-secondary"></div>
                ${animationHtml}
                <p class="mt-8 ${colorClass} font-manrope font-bold text-lg tracking-tight px-10 text-center animate-pulse z-10">${message}</p>
            </div>
        `;
    },
    
    updateUI() {
        const containers = document.querySelectorAll('.steps-container');
        const progressLines = document.querySelectorAll('.progress-line-active');
        
        progressLines.forEach(line => {
            const progressPercent = (this.currentStepIndex / (this.steps.length - 1)) * 100;
            line.style.width = `${progressPercent}%`;
        });
        
        containers.forEach(container => {
            const steps = container.querySelectorAll('.step-item');
            steps.forEach((step, idx) => {
                step.classList.remove('step-done', 'step-active');
                
                if (idx < this.currentStepIndex) {
                    step.classList.add('step-done');
                } else if (idx === this.currentStepIndex) {
                    step.classList.add('step-active');
                }
            });
        });
        
        // Update estimated time
        const timeElements = document.querySelectorAll('.est-time');
        const remainingSteps = (this.steps.length - 1 - this.currentStepIndex);
        const minsRemaining = remainingSteps * 3; // Synthetic "minutes"
        timeElements.forEach(el => {
            if (el.tagName === 'SPAN') {
                el.innerHTML = `${minsRemaining} <span class="text-xl font-normal text-on-surface">mins</span>`;
            } else {
                el.textContent = `${minsRemaining} mins`;
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const isLive = window.location.pathname.includes('live.html');
    const isTrack = window.location.pathname.includes('track.html');
    if (isLive || isTrack) {
        Simulation.start();
    }
});
