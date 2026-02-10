// App Core

const App = {
    currentPage: 'dashboard',
    pages: {
        dashboard: Dashboard,
        attendance: Attendance,
        advances: Advances,
        deliveries: Deliveries,
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

        // Debug logging for sync troubleshooting
        console.log('🔑 Employee Session Debug:');
        console.log('  - Company ID:', session.companyId);
        console.log('  - Employee ID:', session.employeeId);
        console.log('  - Employee Role:', session.role);
        console.log('  - Employee Name:', session.name);

        // Add conditional navigation for DSR role
        this.setupConditionalNavigation(session);

        // Initialize UI
        this.initNavigation();
        this.initSideNav();
        this.initLogoutButton();
        this.initPullToRefresh();

        // Navigate to initial page
        await this.navigateTo('dashboard');
    },

    setupConditionalNavigation(session) {
        // Show deliveries navigation only for DSR role
        if (session && session.role === 'DSR') {
            console.log('🚚 DSR role detected - adding deliveries navigation');
            
            // Add to side navigation
            const sideNav = document.querySelector('.side-links');
            const deliveriesSideLink = document.createElement('a');
            deliveriesSideLink.className = 'side-link';
            deliveriesSideLink.href = '#deliveries';
            deliveriesSideLink.innerHTML = '<span class="side-icon">🚚</span><span class="side-text">Deliveries</span>';
            
            // Insert before profile link
            const profileLink = sideNav.querySelector('a[href="#profile"]');
            sideNav.insertBefore(deliveriesSideLink, profileLink);
            
            // Add to bottom navigation
            const bottomNav = document.querySelector('.bottom-nav');
            const deliveriesBtn = document.createElement('button');
            deliveriesBtn.className = 'nav-btn';
            deliveriesBtn.setAttribute('data-page', 'deliveries');
            deliveriesBtn.setAttribute('aria-label', 'Deliveries');
            deliveriesBtn.innerHTML = `
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Deliveries icon">
                    <title>Deliveries</title>
                    <path d="M1 3h15v13H1zM16 8h7v13H8z"></path>
                </svg>
                <span class="nav-label">Deliveries</span>
            `;
            
            // Insert before profile button
            const profileBtn = bottomNav.querySelector('.nav-btn[data-page="profile"]');
            bottomNav.insertBefore(deliveriesBtn, profileBtn);
        } else {
            console.log('ℹ️ Non-DSR role - deliveries navigation hidden');
        }
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

    initPullToRefresh() {
        const container = document.getElementById('pageContent');
        const indicator = document.getElementById('pullToRefresh');
        if (!container || !indicator) {
            return;
        }

        const textEl = indicator.querySelector('.pull-text');
        const threshold = 70;
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        let canPull = false;

        const setState = (state) => {
            const show = state !== 'hidden';
            indicator.classList.toggle('show', show);
            indicator.classList.toggle('refreshing', state === 'refreshing');

            if (textEl) {
                if (state === 'release') {
                    textEl.textContent = 'Release to refresh';
                } else if (state === 'refreshing') {
                    textEl.textContent = 'Refreshing...';
                } else {
                    textEl.textContent = 'Pull to refresh';
                }
            }
        };

        container.addEventListener('touchstart', (event) => {
            if (container.scrollTop === 0 && !this.isRefreshing) {
                startY = event.touches[0].clientY;
                currentY = startY;
                canPull = true;
            } else {
                canPull = false;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (event) => {
            if (!canPull) {
                return;
            }

            currentY = event.touches[0].clientY;
            const delta = currentY - startY;

            if (delta <= 0) {
                setState('hidden');
                return;
            }

            pulling = true;
            event.preventDefault();
            setState(delta >= threshold ? 'release' : 'pull');
        }, { passive: false });

        container.addEventListener('touchend', async () => {
            if (!canPull) {
                return;
            }

            const delta = currentY - startY;
            if (pulling && delta >= threshold) {
                await this.refreshCurrentPage();
            }

            setState('hidden');
            pulling = false;
            canPull = false;
        });

        this.pullToRefresh = { setState };
    },

    async refreshCurrentPage() {
        if (this.isRefreshing) {
            return;
        }

        this.isRefreshing = true;
        if (this.pullToRefresh?.setState) {
            this.pullToRefresh.setState('refreshing');
        }

        try {
            await this.navigateTo(this.currentPage);
        } finally {
            this.isRefreshing = false;
            if (this.pullToRefresh?.setState) {
                this.pullToRefresh.setState('hidden');
            }
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

            pageContent.scrollTop = 0;

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
