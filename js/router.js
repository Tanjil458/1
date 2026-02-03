/**
 * MimiPro Router - Simple SPA routing
 */

const Router = {
    routes: {},
    currentRoute: null,

    init() {
        // Define all routes
        this.routes = {
            'dashboardPage': {
                module: 'dashboard',
                title: 'Dashboard'
            },
            'deliveryPage': {
                module: 'delivery',
                title: 'Delivery'
            },
            'historyPage': {
                module: 'history',
                title: 'History'
            },
            'stockPage': {
                module: 'stock',
                title: 'Stock'
            },
            'employeesPage': {
                module: 'employees',
                title: 'Employees'
            },
            'attendancePage': {
                module: 'attendance',
                title: 'Attendance'
            },
            'salaryPage': {
                module: 'salary',
                title: 'Salary'
            },
            'advancesPage': {
                module: 'advances',
                title: 'Advances'
            },
            'creditsPage': {
                module: 'credits',
                title: 'Credits'
            },
            'reportsPage': {
                module: 'reports',
                title: 'Monthly'
            },
            'settingsPage': {
                module: 'settings',
                title: 'Settings'
            },
            'productListingPage': {
                module: 'productListing',
                title: 'Product Listing'
            },
            'employeeListingPage': {
                module: 'employeeListing',
                title: 'Employee Listing'
            },
            'areaListingPage': {
                module: 'areaListing',
                title: 'Area Listing'
            },
            'customerListingPage': {
                module: 'customerListing',
                title: 'Customer Listing'
            }
        };

        // Listen to hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial route
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboardPage';
        const route = this.routes[hash];

        if (route) {
            this.currentRoute = hash;
            this.loadRoute(hash, route);
        } else {
            console.warn(`Route not found: ${hash}`);
            this.navigateTo('dashboardPage');
        }
    },

    loadRoute(routeName, route) {
        // Update document title
        document.title = `${route.title} - MimiPro`;

        // Trigger navigation in App
        if (window.App) {
            window.App.navigateTo(routeName);
        }
    },

    navigateTo(routeName) {
        if (this.routes[routeName]) {
            window.location.hash = routeName;
        } else {
            console.error(`Invalid route: ${routeName}`);
        }
    },

    getModuleName(routeName) {
        const route = this.routes[routeName];
        return route ? route.module : null;
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    back() {
        window.history.back();
    }
};

// Export to window
window.Router = Router;

// Auto-init if App exists
if (window.App) {
    Router.init();
}
