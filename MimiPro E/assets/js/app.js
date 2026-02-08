// App Core

const App = {
    currentPage: 'dashboard',
    pages: {
        dashboard: Dashboard,
        attendance: Attendance,
        advances: Advances,
        profile: Profile
    },

    async init() {
        // Check authentication
        requireAuth();

        // Update employee name in header
        const session = getSession();
        const employeeNameEl = document.getElementById('employeeName');
        if (employeeNameEl) {
            employeeNameEl.textContent = session.name || 'Employee';
        }

        // Initialize UI
        this.initNavigation();
        this.initSideNav();
        this.initSyncButton();
        this.initLogoutButton();

        // Navigate to initial page
        await this.navigateTo('dashboard');

        // Auto-sync on first load with a delay to ensure DB is ready
        setTimeout(async () => {
            console.log('⏱️ Waiting for IndexedDB to be fully ready...');
            // Give IndexedDB time to fully initialize
            await new Promise(r => setTimeout(r, 500));
            console.log('🔄 Starting auto-sync...');
            EmployeeSyncService.syncNow();
        }, 1500);
    },

    initNavigation() {
        // Bottom nav buttons
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });

        // Side nav links
        const sideLinks = document.querySelectorAll('.side-link[href^="#"]');
        sideLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.navigateTo(page);
                this.closeSideNav();
            });
        });
    },

    initSideNav() {
        const menuBtn = document.getElementById('menuBtn');
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sideNavOverlay');

        menuBtn.addEventListener('click', () => {
            this.openSideNav();
        });

        overlay.addEventListener('click', () => {
            this.closeSideNav();
        });
    },

    openSideNav() {
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sideNavOverlay');
        sideNav.classList.add('show');
        overlay.classList.add('show');
    },

    closeSideNav() {
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sideNavOverlay');
        sideNav.classList.remove('show');
        overlay.classList.remove('show');
    },

    initSyncButton() {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                EmployeeSyncService.syncNow();
            });
        }
    },

    initLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                UIUtils.confirm('Are you sure you want to logout?', () => {
                    logout();
                });
            });
        }
    },

    async navigateTo(pageName) {
        if (!this.pages[pageName]) {
            console.error('Page not found:', pageName);
            return;
        }

        this.currentPage = pageName;

        // Update bottom nav
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            if (btn.dataset.page === pageName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update side nav
        const sideLinks = document.querySelectorAll('.side-link');
        sideLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${pageName}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Render page
        const page = this.pages[pageName];
        const pageContent = document.getElementById('pageContent');
        
        try {
            const html = await page.render();
            pageContent.innerHTML = `
                <section class="page active" id="${pageName}-page">
                    ${html}
                </section>
            `;

            // Attach page-specific event listeners
            if (page.attachEventListeners) {
                page.attachEventListeners();
            }

        } catch (error) {
            console.error('Page render error:', error);
            pageContent.innerHTML = `
                <section class="page active">
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <div class="empty-title">Error Loading Page</div>
                        <div class="empty-text">Please try again</div>
                    </div>
                </section>
            `;
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
