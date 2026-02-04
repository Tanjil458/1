/**
 * Dashboard Module
 */

const DashboardModule = {
    init() {
        this.render();
        this.loadDashboardData();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card dashboard-header">
                <div>
                    <h2>Dashboard</h2>
                    <p class="dashboard-sub">Business overview and daily performance</p>
                </div>
                <div class="dashboard-date" id="dashboardDate"></div>
            </div>

            <div class="summary-grid">
                <div class="summary-card kpi-card">
                    <div class="summary-label">Today's Sales</div>
                    <div class="summary-value" id="todaySales">৳0</div>
                    <div class="kpi-sub">Net: <span id="todayNet">৳0</span></div>
                </div>
                <div class="summary-card kpi-card">
                    <div class="summary-label">Today's Cash</div>
                    <div class="summary-value" id="todayCash">৳0</div>
                    <div class="kpi-sub">Credit: <span id="todayCredit">৳0</span></div>
                </div>
                <div class="summary-card kpi-card">
                    <div class="summary-label">Month Sales</div>
                    <div class="summary-value" id="monthSales">৳0</div>
                    <div class="kpi-sub">Net: <span id="monthNet">৳0</span></div>
                </div>
                <div class="summary-card kpi-card">
                    <div class="summary-label">Pending Credits</div>
                    <div class="summary-value" id="pendingCreditTotal">৳0</div>
                    <div class="kpi-sub"><span id="pendingCreditCount">0</span> customers</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Quick Actions</h3>
                </div>
                <div class="filters">
                    <button class="btn btn-primary" onclick="App.navigateTo('deliveryPage')">New Delivery</button>
                    <button class="btn btn-secondary" onclick="App.navigateTo('productListingPage')">Add Product</button>
                    <button class="btn btn-secondary" onclick="App.navigateTo('attendancePage')">Attendance</button>
                    <button class="btn btn-secondary" onclick="App.navigateTo('creditsPage')">Credits</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Business Overview</h3>
                </div>
                <div class="summary-grid compact">
                    <div class="summary-card compact">
                        <div class="summary-label">Products</div>
                        <div class="summary-value compact" id="totalProducts">0</div>
                    </div>
                    <div class="summary-card compact">
                        <div class="summary-label">Employees</div>
                        <div class="summary-value compact" id="totalEmployees">0</div>
                    </div>
                    <div class="summary-card compact">
                        <div class="summary-label">Customers</div>
                        <div class="summary-value compact" id="totalCustomers">0</div>
                    </div>
                    <div class="summary-card compact">
                        <div class="summary-label">Areas</div>
                        <div class="summary-value compact" id="totalAreas">0</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Recent Deliveries</h3>
                </div>
                <div style="overflow:auto;">
                    <table class="table dashboard-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Sales</th>
                                <th>Net</th>
                                <th style="width: 40px;">Edit</th>
                            </tr>
                        </thead>
                        <tbody id="recentDeliveryBody"></tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Pending Credits (Top 5)</h3>
                </div>
                <div style="overflow:auto;">
                    <table class="table dashboard-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Balance</th>
                                <th>Since</th>
                            </tr>
                        </thead>
                        <tbody id="pendingCreditBody"></tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async loadDashboardData() {
        try {
            const [history, products, employees, customers, areas, credits, attendance] = await Promise.all([
                DB.getAll('history'),
                DB.getAll('products'),
                DB.getAll('employees'),
                DB.getAll('customers'),
                DB.getAll('areas'),
                DB.getAll('credits'),
                DB.getAll('attendance')
            ]);

            const todayKey = new Date().toISOString().slice(0, 10);
            const monthKey = new Date().toISOString().slice(0, 7);

            const todayRecords = (history || []).filter(r => (r.date || '').startsWith(todayKey));
            const monthRecords = (history || []).filter(r => (r.date || '').startsWith(monthKey));

            const sumField = (rows, field) => rows.reduce((sum, row) => sum + this.parseNumber(row[field]), 0);

            const todaySales = sumField(todayRecords, 'sales');
            const todayCash = sumField(todayRecords, 'cash');
            const todayCredit = sumField(todayRecords, 'totalCredit');
            const todayNet = sumField(todayRecords, 'net');

            const monthSales = sumField(monthRecords, 'sales');
            const monthNet = sumField(monthRecords, 'net');

            const pendingCredits = (credits || []).filter(c => (this.parseNumber(c.balance) || 0) > 0);
            const pendingCreditTotal = pendingCredits.reduce((sum, c) => sum + this.parseNumber(c.balance), 0);

            this.setText('todaySales', `৳${this.formatCurrency(todaySales)}`);
            this.setText('todayCash', `৳${this.formatCurrency(todayCash)}`);
            this.setText('todayCredit', `৳${this.formatCurrency(todayCredit)}`);
            this.setText('todayNet', `৳${this.formatCurrency(todayNet)}`);
            this.setText('monthSales', `৳${this.formatCurrency(monthSales)}`);
            this.setText('monthNet', `৳${this.formatCurrency(monthNet)}`);
            this.setText('pendingCreditTotal', `৳${this.formatCurrency(pendingCreditTotal)}`);
            this.setText('pendingCreditCount', pendingCredits.length.toString());

            this.setText('totalProducts', (products || []).length.toString());
            this.setText('totalEmployees', (employees || []).length.toString());
            this.setText('totalCustomers', (customers || []).length.toString());
            this.setText('totalAreas', (areas || []).length.toString());

            const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            this.setText('dashboardDate', dateLabel);

            this.renderRecentDeliveries(history || []);
            this.renderPendingCredits(pendingCredits);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    },

    renderRecentDeliveries(history) {
        const tbody = document.getElementById('recentDeliveryBody');
        if (!tbody) return;

        this.historyCache = history || [];
        const rows = (history || [])
            .slice()
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 5);

        if (!rows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color: var(--muted);">No deliveries yet</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map((row, index) => {
            const customer = (row.name || '').split(',')[0] || '—';
            const date = this.formatDate(row.date);
            const sales = this.formatCurrency(this.parseNumber(row.sales));
            const net = this.formatCurrency(this.parseNumber(row.net));
            const canEdit = index < 3;
            return `
                <tr>
                    <td>${date}</td>
                    <td>${customer}</td>
                    <td>৳${sales}</td>
                    <td>৳${net}</td>
                    <td style="text-align:center; width: 40px;">
                        ${canEdit ? `
                            <button class="btn btn-ghost btn-small icon-only" aria-label="Edit" title="Edit" data-edit-id="${row.id}">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = btn.dataset.editId;
                const record = this.historyCache.find(item => String(item.id) === String(recordId));
                this.loadDeliveryForEdit(record);
            });
        });
    },

    loadDeliveryForEdit(record) {
        if (!record) return;
        if (window.DeliveryModule) {
            window.DeliveryModule.editingRecord = record;
        }
        if (window.App) {
            window.App.navigateTo('deliveryPage');
        }
        setTimeout(() => {
            if (window.DeliveryModule && window.DeliveryModule.loadForEdit) {
                window.DeliveryModule.loadForEdit(record);
            }
        }, 150);
    },

    renderPendingCredits(credits) {
        const tbody = document.getElementById('pendingCreditBody');
        if (!tbody) return;

        const rows = (credits || [])
            .slice()
            .sort((a, b) => this.parseNumber(b.balance) - this.parseNumber(a.balance))
            .slice(0, 5);

        if (!rows.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; color: var(--muted);">No pending credits</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const name = row.customer_name || row.name || '—';
            const balance = this.formatCurrency(this.parseNumber(row.balance));
            const since = this.formatDate(row.credit_date || row.createdAt);
            return `
                <tr>
                    <td>${name}</td>
                    <td>৳${balance}</td>
                    <td>${since}</td>
                </tr>
            `;
        }).join('');
    },

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    parseNumber(value) {
        if (value === null || value === undefined) return 0;
        const normalized = String(value).replace(/,/g, '').trim();
        const number = parseFloat(normalized);
        return Number.isNaN(number) ? 0 : number;
    },

    formatCurrency(value) {
        const number = parseFloat(value) || 0;
        return Math.round(number).toLocaleString();
    },

    formatDate(dateValue) {
        if (!dateValue) return '—';
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return dateValue;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy}`;
    },

    refresh() {
        this.render();
        this.loadDashboardData();
    },

    destroy() {
        // Cleanup if needed
    }
};

// Register module
if (window.App) {
    App.registerModule('dashboard', DashboardModule);
}
