// Router - Simple hash-based routing

const Router = {
    routes: {},

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // Handle initial route
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        
        // Navigate to the page
        if (App && App.navigateTo) {
            App.navigateTo(hash);
        }
    },

    navigateTo(route) {
        window.location.hash = route;
    }
};

// Initialize router if on home page
if (window.location.pathname.includes('home.html')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Router.init());
    } else {
        Router.init();
    }
}
