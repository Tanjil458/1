/**
 * MimiPro App - Main application controller
 */

const App = {
    state: {
        currentPage: 'dashboardPage',
        currentModule: null,
        isOnline: navigator.onLine,
        sideNavOpen: false
    },

    modules: {},

    init() {
        console.log('🚀 MimiPro App initializing...');
        
        this.applyTheme(); // Apply saved theme
        this.setupNavigation();
        this.setupEventListeners();
        this.loadModules();
        this.showPage(this.state.currentPage);
        
        // Wait for Firebase to be ready before syncing
        if (window.FirebaseInitialized) {
            this.onFirebaseReady();
        } else {
            window.addEventListener('firebaseReady', () => this.onFirebaseReady());
        }
        
        console.log('✅ App ready');
    },

    onFirebaseReady() {
        console.log('📡 Firebase is ready, enabling sync features...');
        
        // Initialize sync status indicator after SyncModule loads
        setTimeout(() => {
            if (window.SyncModule) {
                window.SyncModule.checkSyncStatus();
            }
        }, 1000);
    },

    setupNavigation() {
        // Menu button to open sidebar
        const menuBtn = document.getElementById('menuBtn');
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sideNavOverlay');

        if (menuBtn && sideNav && overlay) {
            menuBtn.addEventListener('click', () => {
                sideNav.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            overlay.addEventListener('click', () => this.closeSideNav());
        }

        // Sync button in header
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', async () => {
                if (!window.SyncModule) {
                    this.showToast('Sync module not loaded', 'error');
                    return;
                }

                if (!window.SyncModule.syncEnabled) {
                    this.showToast('Please sign in to sync', 'warning');
                    // Navigate to settings
                    this.navigateTo('settingsPage');
                    return;
                }

                // Show loading state
                const syncIcon = document.getElementById('syncIcon');
                syncBtn.disabled = true;
                window.SyncModule.updateSyncIndicator('syncing');
                syncIcon.classList.add('spinning');
                
                try {
                    await window.SyncModule.forceFullSync();
                } catch (error) {
                    console.error('Sync error:', error);
                } finally {
                    syncBtn.disabled = false;
                    syncIcon.classList.remove('spinning');
                    // Status will be updated by forceFullSync's finally block
                }
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                console.log('Notifications clicked');
                // TODO: Implement notifications functionality
                this.showToast('Notifications feature coming soon', 'info');
            });
        }

        // Bottom navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // Side navigation
        const sideLinks = document.querySelectorAll('.side-link');
        sideLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = e.currentTarget.getAttribute('href');
                if (href) {
                    this.handleSideNavClick(href);
                }
            });
        });
    },

    setupEventListeners() {
        // Online/Offline status
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.showToast('Back online', 'success');
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.showToast('You are offline', 'warning');
        });

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.state.currentModule) {
                this.refreshCurrentPage();
            }
        });
    },

    loadModules() {
        // Modules will auto-register themselves when loaded
        console.log('📦 Loading modules...');
    },

    registerModule(name, module) {
        this.modules[name] = module;
        console.log(`✓ Module registered: ${name}`);
    },

    navigateTo(page) {
        if (this.state.currentPage === page) return;

        // Deactivate current page
        if (this.state.currentModule && this.state.currentModule.destroy) {
            this.state.currentModule.destroy();
        }

        this.state.currentPage = page;
        this.showPage(page);
    },

    showPage(page) {
        // Update bottom navigation active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Update side navigation active state
        this.updateSideNavActiveState(page);

        // Get module name from page
        const moduleName = this.getModuleNameFromPage(page);
        const module = this.modules[moduleName];

        // Load module if exists
        if (module) {
            this.state.currentModule = module;
            if (module.init) {
                module.init();
            }
        } else {
            console.warn(`Module not found: ${moduleName}`);
            this.showDefaultContent(page);
        }
    },

    updateSideNavActiveState(page) {
        // Map pages to side nav hrefs
        const pageToSideNav = {
            'employeeListingPage': '#employee-listing',
            'advancesPage': '#advances',
            'productListingPage': '#product-listing',
            'historyPage': '#history',
            'settingsPage': '#settings',
            'customerListingPage': '#customer-listing',
            'areaListingPage': '#area-listing'
        };

        // Remove all active states from side nav
        document.querySelectorAll('.side-link').forEach(link => {
            link.classList.remove('active');
        });

        // Set active state for matching side nav link
        const targetHref = pageToSideNav[page];
        if (targetHref) {
            const link = document.querySelector(`.side-link[href="${targetHref}"]`);
            if (link) {
                link.classList.add('active');
            }
        }
    },

    getModuleNameFromPage(page) {
        // Convert 'dashboardPage' to 'dashboard'
        return page.replace('Page', '');
    },

    handleSideNavClick(href) {
        const action = href.replace('#', '');
        
        // Close side nav on mobile
        this.closeSideNav();

        // Handle different side nav actions
        switch (action) {
            case 'employee-listing':
                this.navigateTo('employeeListingPage');
                break;
            case 'advances':
                this.navigateTo('advancesPage');
                break;
            case 'product-listing':
                this.navigateTo('productListingPage');
                break;
            case 'area-listing':
                this.navigateTo('areaListingPage');
                break;
            case 'customer-listing':
                this.navigateTo('customerListingPage');
                break;
            case 'history':
                this.navigateTo('historyPage');
                break;
            case 'settings':
                this.navigateTo('settingsPage');
                break;
            default:
                console.log(`Side nav action: ${action}`);
        }
    },

    showDefaultContent(page) {
        const content = document.querySelector('.page-content');
        if (content) {
            content.innerHTML = `
                <div class="card">
                    <h2>${this.formatPageTitle(page)}</h2>
                    <p>Module loading...</p>
                </div>
            `;
        }
    },

    formatPageTitle(page) {
        return page
            .replace('Page', '')
            .replace(/([A-Z])/g, ' $1')
            .trim();
    },

    refreshCurrentPage() {
        if (this.state.currentModule && this.state.currentModule.refresh) {
            this.state.currentModule.refresh();
        }
    },

    closeSideNav() {
        const sideNav = document.querySelector('.side-nav');
        const overlay = document.querySelector('.side-nav-overlay');
        
        if (sideNav) {
            sideNav.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        document.body.style.overflow = '';
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        }, 2500);    },

    // Theme management
    applyTheme() {
        const isDark = localStorage.getItem('darkTheme') === 'true';
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }    },

    showModal(title, content, actions = []) {
        // TODO: Implement modal system
        console.log('Modal:', title, content);
    },

    confirm(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }
};

// Catch all errors and display them on screen for mobile debugging
window.addEventListener('error', (e) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:60px;left:10px;right:10px;background:#ff4444;color:white;padding:12px;border-radius:8px;z-index:99999;font-size:12px;word-break:break-all;';
    errorDiv.innerHTML = `<strong>ERROR:</strong><br>${e.message}<br><small>${e.filename}:${e.lineno}</small>`;
    document.body.appendChild(errorDiv);
    console.error('Global error caught:', e);
});

window.addEventListener('unhandledrejection', (e) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:60px;left:10px;right:10px;background:#ff6600;color:white;padding:12px;border-radius:8px;z-index:99999;font-size:12px;word-break:break-all;';
    errorDiv.innerHTML = `<strong>PROMISE ERROR:</strong><br>${e.reason}`;
    document.body.appendChild(errorDiv);
    console.error('Unhandled promise rejection:', e);
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export to window
window.App = App;
