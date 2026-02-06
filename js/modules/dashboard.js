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
                <button class="btn btn-secondary" onclick="DashboardModule.showCredentialsModal()" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; font-weight: 600;">
                    🔑 Employee Login Credentials
                </button>
            </div>

            <div class="card" id="credentialsCard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: none;">
                <div class="card-header" style="border-bottom-color: rgba(255,255,255,0.2);">
                    <h3 style="color: white;">🔑 Employee Login Credentials</h3>
                </div>
                <div style="padding: 20px;">
                    <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Your Company ID</div>
                        <div id="dashboardCompanyId" style="font-size: 18px; font-weight: bold; font-family: monospace; word-break: break-all; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px;">
                            Loading...
                        </div>
                        <button onclick="DashboardModule.copyCompanyId()" style="margin-top: 10px; background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 5px; font-weight: 600; cursor: pointer;">
                            📋 Copy Company ID
                        </button>
                    </div>
                    <div id="employeeCredentialsList" style="max-height: 300px; overflow-y: auto;">
                        <div style="text-align: center; padding: 20px; opacity: 0.7;">Loading employees...</div>
                    </div>
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
                    <h3>Pending Credits</h3>
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
            // Load Company ID first
            this.loadCompanyIdAndEmployees();

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

            const dateLabel = this.formatDate(new Date());
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
            .sort((a, b) => this.parseNumber(b.balance) - this.parseNumber(a.balance));

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
                <tr data-credit-id="${row.id}">
                    <td>${name}</td>
                    <td>৳${balance}</td>
                    <td>${since}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('[data-credit-id]').forEach(row => {
            row.addEventListener('click', () => {
                const creditId = row.dataset.creditId;
                if (!creditId) return;
                if (window.App) {
                    window.App.pendingCreditId = creditId;
                    window.App.navigateTo('creditsPage');
                }
            });
        });
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

    async loadCompanyIdAndEmployees() {
        const companyIdEl = document.getElementById('dashboardCompanyId');
        const credentialsListEl = document.getElementById('employeeCredentialsList');
        
        if (!companyIdEl || !credentialsListEl) return;

        try {
            // Get Company ID from Firebase Auth or localStorage
            let userId = null;
            let userEmail = 'Not signed in';
            
            if (window.FirebaseAuth && window.FirebaseAuth.currentUser) {
                userId = window.FirebaseAuth.currentUser.uid;
                userEmail = window.FirebaseAuth.currentUser.email;
            } else if (window.FirebaseSync && window.FirebaseSync.currentUser) {
                userId = window.FirebaseSync.currentUser.uid;
                userEmail = window.FirebaseSync.currentUser.email;
            } else {
                userId = localStorage.getItem('localUserId');
                userEmail = 'Offline mode';
            }

            if (userId) {
                companyIdEl.innerHTML = `
                    <div style="font-size: 20px; margin-bottom: 5px;">${userId}</div>
                    <div style="font-size: 12px; opacity: 0.7;">Signed in: ${userEmail}</div>
                `;
                this.currentCompanyId = userId;
            } else {
                companyIdEl.textContent = 'No user signed in';
            }

            // Load employees
            const employees = await DB.getAll('employees');
            const activeEmployees = (employees || [])
                .filter(emp => emp.status === 'active')
                .sort((a, b) => (a.employeeId || '').localeCompare(b.employeeId || ''));

            if (!activeEmployees.length) {
                credentialsListEl.innerHTML = `
                    <div style="text-align: center; padding: 20px; opacity: 0.7;">
                        No employees yet. Add employees to see their credentials here.
                    </div>
                    <button onclick="App.navigateTo('employeeListingPage')" style="width: 100%; background: white; color: #667eea; border: none; padding: 12px; border-radius: 5px; font-weight: 600; cursor: pointer;">
                        ➕ Add Employee
                    </button>
                `;
                return;
            }

            credentialsListEl.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                    <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">⚠️ Important:</div>
                    <div style="font-size: 13px; line-height: 1.5;">
                        Passwords are only shown when creating an employee. They cannot be retrieved later for security. 
                        If an employee forgets their password, create a new employee account.
                    </div>
                </div>
                ${activeEmployees.map(emp => `
                    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; font-size: 16px; margin-bottom: 3px;">
                                    ${emp.name || 'Unnamed Employee'}
                                </div>
                                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">
                                    ${emp.role || 'No role'} • ${emp.phone || emp.mobile || 'No phone'}
                                </div>
                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <div style="background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; font-size: 12px;">
                                        <span style="opacity: 0.7;">Employee ID:</span> 
                                        <strong>${emp.employeeId || 'N/A'}</strong>
                                    </div>
                                    <div style="background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; font-size: 12px;">
                                        <span style="opacity: 0.7;">Password:</span> 
                                        <strong>Set when created (not stored)</strong>
                                    </div>
                                </div>
                            </div>
                            <button onclick="DashboardModule.copyEmployeeId('${emp.employeeId}')" style="background: rgba(255,255,255,0.2); border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; color: white; font-size: 12px; white-space: nowrap;">
                                📋 Copy ID
                            </button>
                        </div>
                    </div>
                `).join('')}
                <button onclick="App.navigateTo('employeeListingPage')" style="width: 100%; background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px; border-radius: 5px; font-weight: 600; cursor: pointer; margin-top: 10px;">
                    ➕ Add New Employee
                </button>
            `;
        } catch (error) {
            console.error('Error loading employee credentials:', error);
            credentialsListEl.innerHTML = `
                <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.7);">
                    Error loading employees: ${error.message}
                </div>
            `;
        }
    },

    copyCompanyId() {
        if (!this.currentCompanyId) {
            alert('No Company ID available');
            return;
        }
        
        navigator.clipboard.writeText(this.currentCompanyId).then(() => {
            if (window.App) {
                App.showToast('✅ Company ID copied to clipboard!', 'success');
            } else {
                alert('✅ Company ID copied!');
            }
        }).catch(err => {
            alert('❌ Failed to copy: ' + err);
        });
    },

    copyEmployeeId(employeeId) {
        if (!employeeId) return;
        
        navigator.clipboard.writeText(employeeId).then(() => {
            if (window.App) {
                App.showToast(`✅ Employee ID "${employeeId}" copied!`, 'success');
            } else {
                alert(`✅ Employee ID "${employeeId}" copied!`);
            }
        }).catch(err => {
            alert('❌ Failed to copy: ' + err);
        });
    },

    scrollToCredentials() {
        const credentialsCard = document.getElementById('employeeCredentialsList');
        if (credentialsCard) {
            // Toggle visibility
            if (credentialsCard.style.display === 'none') {
                credentialsCard.style.display = 'block';
                setTimeout(() => {
                    credentialsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                credentialsCard.style.display = 'none';
            }
        }
    },

    showCredentialsModal() {
        const credentialsCard = document.getElementById('credentialsCard');
        if (credentialsCard) {
            // Toggle visibility
            if (credentialsCard.style.display === 'none') {
                credentialsCard.style.display = 'block';
                // Reload credentials data
                this.loadCompanyIdAndEmployees();
                setTimeout(() => {
                    credentialsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                credentialsCard.style.display = 'none';
            }
        }
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
