/**
 * MimiPro State Management
 */

const State = {
    data: {
        user: null,
        settings: {},
        cache: {}
    },

    listeners: {},

    init() {
        this.loadFromStorage();
    },

    // Get state value
    get(key) {
        return this.data[key];
    },

    // Set state value
    set(key, value) {
        const oldValue = this.data[key];
        this.data[key] = value;
        
        // Trigger listeners
        this.notify(key, value, oldValue);
        
        // Auto-save to storage
        this.saveToStorage();
    },

    // Update nested state
    update(key, updates) {
        const current = this.data[key] || {};
        this.set(key, { ...current, ...updates });
    },

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        };
    },

    // Notify listeners
    notify(key, newValue, oldValue) {
        const callbacks = this.listeners[key] || [];
        callbacks.forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error(`Error in state listener for ${key}:`, error);
            }
        });
    },

    // Load from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('mimipro_state');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.data = { ...this.data, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    },

    // Save to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('mimipro_state', JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    },

    // Clear state
    clear() {
        this.data = {
            user: null,
            settings: {},
            cache: {}
        };
        this.saveToStorage();
    },

    // Cache helpers
    setCache(key, value, ttl = 300000) { // 5 min default
        this.data.cache[key] = {
            value,
            expires: Date.now() + ttl
        };
        this.saveToStorage();
    },

    getCache(key) {
        const cached = this.data.cache[key];
        if (!cached) return null;
        
        if (Date.now() > cached.expires) {
            delete this.data.cache[key];
            this.saveToStorage();
            return null;
        }
        
        return cached.value;
    },

    clearCache() {
        this.data.cache = {};
        this.saveToStorage();
    }
};

// Initialize
State.init();

// Export to window
window.State = State;
