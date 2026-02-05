/**
 * Employees Module (Bottom Nav - Employee Management)
 */

const EmployeesModule = {
    employees: [],
    products: [],
    advances: [],
    productAdvances: [],
    repayments: [],
    attendance: [],

    init() {
        this.render();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h3>Employee Management</h3>
                <p style="color: var(--muted);">Manage employees, attendance, and salaries</p>
                
                <div class="summary-grid compact" style="margin-top: 14px;">
                    <div class="summary-card compact">
                        <div class="summary-label">Total Employees</div>
                        <div class="summary-value compact" id="totalEmployees">0</div>
                    </div>
                    <div class="summary-card compact">
                        <div class="summary-label">Present Today</div>
                        <div class="summary-value compact" id="presentToday" style="color: var(--success);">0</div>
                    </div>
                    <div class="summary-card compact">
                        <div class="summary-label">Pending Salaries</div>
                        <div class="summary-value compact" id="pendingSalaries">৳0</div>
                    </div>
                </div>
            </div>

            <div class="card attendance-button-card">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%;">
                    <div>
                        <div style="font-weight:700; font-size:16px;">Attendance Sheet</div>
                        <div id="attendanceButtonSub" style="color:var(--muted); font-size:13px; margin-top:6px;"></div>
                    </div>
                    <div style="margin-left:auto; display:flex; align-items:center;">
                        <button class="btn btn-primary btn-attendance" id="openAttendanceSheet">📅 Open Sheet</button>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Employees</h3>
                    <button class="btn btn-secondary btn-small" onclick="EmployeesModule.viewList()">Open List</button>
                </div>
                <div id="employeeCardList" class="employees-grid"></div>
            </div>

            <div class="modal" id="employeeAdvanceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">Add Advance</div>
                        <button class="modal-close" id="closeEmployeeAdvanceModal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Employee</label>
                            <div id="employeeAdvanceName" class="form-input" style="background:#f8fafc;"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cash Amount (Optional)</label>
                            <input type="number" id="employeeAdvanceCashAmount" class="form-input highlight-input" min="0" step="0.01" placeholder="৳ Amount" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Product Advance</label>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <select id="employeeAdvanceProduct" class="form-input" style="flex:2 1 180px;"></select>
                                <input type="number" id="employeeAdvanceQty" class="form-input" style="flex:1 1 90px;" min="0" step="1" placeholder="Qty" />
                                <input type="number" id="employeeAdvancePrice" class="form-input" style="flex:1 1 110px;" min="0" step="0.01" placeholder="Price" />
                                <input type="number" id="employeeAdvanceTotal" class="form-input" style="flex:1 1 120px;" placeholder="Total" readonly />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" id="employeeAdvanceDate" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Note</label>
                            <input type="text" id="employeeAdvanceNote" class="form-input" placeholder="Optional" />
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="cancelEmployeeAdvance">Cancel</button>
                        <button class="btn btn-primary" id="saveEmployeeAdvance">Save</button>
                    </div>
                </div>
            </div>

            <div class="modal" id="employeeDetailsModal">
                <div class="modal-content" style="max-width: 640px; max-height: 85vh; overflow-y: auto;">
                    <div class="modal-header">
                        <div class="modal-title">Employee Details</div>
                        <button class="modal-close" id="closeEmployeeDetailsModal">×</button>
                    </div>
                    <div class="modal-body" id="employeeDetailsContent"></div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="closeEmployeeDetailsFooter">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Load employees first, then bind quick attendance UI and regular card events
        this.loadEmployeeData().then(() => {
            this.bindQuickAttendanceEvents();
            this.renderQuickAttendance();
            this.bindAttendanceButton();
            this.bindCardEvents();
        });
    },

    async loadEmployeeData() {
        try {
            this.employees = await DB.getAll('employees');
            const totalEl = document.getElementById('totalEmployees');
            if (totalEl) {
                totalEl.textContent = this.employees.length;
            }

            const todayKey = this.getTodayValue();
            const todayAttendance = await DB.query('attendance', 'date', todayKey);
            const presentSet = new Set((todayAttendance || []).map(r => String(r.employeeId)));
            const presentTodayEl = document.getElementById('presentToday');
            if (presentTodayEl) {
                presentTodayEl.textContent = presentSet.size;
            }

            // Preload advances/product advances/repayments/attendance so card can show remaining balance
            this.advances = await DB.getAll('advances') || [];
            this.productAdvances = await DB.getAll('productAdvances') || [];
            this.repayments = await DB.getAll('repayments') || [];
            this.attendance = await DB.getAll('attendance') || [];

            // Calculate pending salaries for current month
            const monthKey = new Date().toISOString().slice(0, 7);
            let pendingTotal = 0;
            this.employees.forEach(emp => {
                const salaryType = (emp.salaryType || 'Daily').toLowerCase();
                const salaryRate = this.parseNumber(emp.salary) || 0;

                const workingDays = (this.attendance || [])
                    .filter(record => String(record.employeeId) === String(emp.id))
                    .filter(record => record.date && record.date.startsWith(monthKey))
                    .filter(record => record.status === 'present' || record.present === true)
                    .length;

                const salaryTotal = salaryType === 'daily' ? (workingDays * salaryRate) : salaryRate;

                const totalCash = (this.advances || [])
                    .filter(r => String(r.employeeId) === String(emp.id))
                    .reduce((sum, row) => sum + this.parseNumber(row.amount), 0);

                const totalProduct = (this.productAdvances || [])
                    .filter(r => String(r.employeeId) === String(emp.id))
                    .reduce((sum, row) => sum + this.parseNumber(row.totalValue), 0);

                const remaining = salaryTotal - (totalCash + totalProduct);
                if (remaining > 0) pendingTotal += remaining;
            });

            const pendingEl = document.getElementById('pendingSalaries');
            if (pendingEl) {
                pendingEl.textContent = `৳${this.formatCurrency(pendingTotal)}`;
            }

            this.renderEmployeeCards(presentSet);
        } catch (error) {
            console.error('Error loading employee data:', error);
        }
    },

    async loadProducts() {
        try {
            this.products = await DB.getAll('products');
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    },

    renderEmployeeCards(presentSet = new Set()) {
        const listEl = document.getElementById('employeeCardList');
        if (!listEl) return;

        if (!this.employees.length) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-text">No employees yet</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = this.employees.map(emp => {
            const isPresent = presentSet.has(String(emp.id));
            const salaryType = emp.salaryType || 'Daily';
            const salaryValue = this.parseNumber(emp.salary) || 0;

            // Calculate advances/repayments for this employee
            const cashRows = (this.advances || []).filter(r => String(r.employeeId) === String(emp.id));
            const productRows = (this.productAdvances || []).filter(r => String(r.employeeId) === String(emp.id));

            const totalCash = cashRows.reduce((sum, row) => sum + this.parseNumber(row.amount), 0);
            const totalProduct = productRows.reduce((sum, row) => sum + this.parseNumber(row.totalValue), 0);

            // Determine salary total for current month (daily uses attendance records)
            const monthKey = new Date().toISOString().slice(0, 7);
            const workingDays = (this.attendance || [])
                .filter(record => String(record.employeeId) === String(emp.id))
                .filter(record => record.date && record.date.startsWith(monthKey))
                .filter(record => record.status === 'present' || record.present === true)
                .length;
            const salaryRate = this.parseNumber(emp.salary) || 0;
            const salaryTotal = (String(salaryType).toLowerCase() === 'daily') ? (workingDays * salaryRate) : salaryRate;

            const remainingBalance = salaryTotal - (totalCash + totalProduct);

            return `
                <div class="employee-card" data-details="${emp.id}">
                    <div class="employee-card-header">
                        <div class="employee-name">${emp.name}</div>
                        <div class="employee-right">
                            <span class="employee-balance">৳${this.formatCurrency(remainingBalance)}</span>
                            <span class="badge ${isPresent ? 'badge-success' : 'badge-warning'}">${isPresent ? 'Present' : 'Absent'}</span>
                        </div>
                    </div>
                    <div class="employee-meta">Role: ${emp.role || '—'}</div>
                    <div class="employee-meta">Salary: ৳${this.formatCurrency(salaryValue)} (${salaryType})</div>
                    <div class="employee-card-actions">
                        <button class="btn btn-primary btn-small" data-advance="${emp.id}">Add Advance</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    bindCardEvents() {
        const listEl = document.getElementById('employeeCardList');
        if (!listEl) return;

        listEl.addEventListener('click', (event) => {
            const advanceBtn = event.target.closest('[data-advance]');
            const card = event.target.closest('.employee-card');
            if (advanceBtn) {
                event.stopPropagation();
                this.openAdvanceModal(advanceBtn.dataset.advance);
                return;
            }
            if (card?.dataset?.details) {
                this.openDetailsModal(card.dataset.details);
            }
        });

        const closeAdvance = document.getElementById('closeEmployeeAdvanceModal');
        const cancelAdvance = document.getElementById('cancelEmployeeAdvance');
        const saveAdvance = document.getElementById('saveEmployeeAdvance');
        const productSelect = document.getElementById('employeeAdvanceProduct');
        const qtyInput = document.getElementById('employeeAdvanceQty');
        const priceInput = document.getElementById('employeeAdvancePrice');
        if (closeAdvance) closeAdvance.addEventListener('click', () => this.closeAdvanceModal());
        if (cancelAdvance) cancelAdvance.addEventListener('click', () => this.closeAdvanceModal());
        if (saveAdvance) saveAdvance.addEventListener('click', () => this.saveEmployeeAdvance());

        if (productSelect) {
            productSelect.addEventListener('change', () => this.handleAdvanceProductChange());
        }
        if (qtyInput) qtyInput.addEventListener('input', () => this.updateAdvanceTotal());
        if (priceInput) priceInput.addEventListener('input', () => this.updateAdvanceTotal());

        const closeDetails = document.getElementById('closeEmployeeDetailsModal');
        const closeDetailsFooter = document.getElementById('closeEmployeeDetailsFooter');
        if (closeDetails) closeDetails.addEventListener('click', () => this.closeDetailsModal());
        if (closeDetailsFooter) closeDetailsFooter.addEventListener('click', () => this.closeDetailsModal());
    },

    bindAttendanceButton() {
        const btn = document.getElementById('openAttendanceSheet');
        const sub = document.getElementById('attendanceButtonSub');
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const yyyy = now.getFullYear();
        const monthKey = `${yyyy}-${mm}`;
        const todayKey = `${yyyy}-${mm}-${dd}`;
        if (sub) {
            const monthName = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
            sub.textContent = `${monthName} • ${dd}/${mm}/${yyyy}`;
        }
        if (btn) {
            btn.addEventListener('click', () => {
                try { sessionStorage.setItem('selectedAttendanceMonth', monthKey); sessionStorage.setItem('selectedAttendanceDate', todayKey); } catch (e) {}
                App.navigateTo('attendancePage');
            });
        }
    },

    bindQuickAttendanceEvents() {
        const monthInput = document.getElementById('quickAttendanceMonth');
        const refreshBtn = document.getElementById('quickAttendanceRefresh');
        const table = document.getElementById('quickAttendanceTable');

        if (monthInput) {
            const now = new Date();
            monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            monthInput.addEventListener('change', () => this.renderQuickAttendance());
        }
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.renderQuickAttendance());

        if (table) {
            table.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (!row) return;
                const date = row.dataset.date;
                if (!date) return;
                // navigate to Attendance page and set a temporary selected date
                try { sessionStorage.setItem('selectedAttendanceDate', date); } catch (e) {}
                App.navigateTo('attendancePage');
            });
        }
    },

    async renderQuickAttendance() {
        const monthInput = document.getElementById('quickAttendanceMonth');
        const table = document.getElementById('quickAttendanceTable');
        if (!monthInput || !table) return;

        const monthKey = monthInput.value || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}`;
        const [yearStr, monthStr] = monthKey.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();

        let attendance = [];
        try {
            attendance = await DB.getAll('attendance') || [];
        } catch (err) {
            console.error('Failed to load attendance records:', err);
            attendance = [];
        }

        const monthRecords = (attendance || []).filter(r => r.date && r.date.startsWith(monthKey));
        const attendanceByDate = {};
        monthRecords.forEach(r => {
            attendanceByDate[r.date] = attendanceByDate[r.date] || [];
            attendanceByDate[r.date].push(r);
        });

        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        for (let d = 1; d <= daysInMonth; d++) {
            const dd = String(d).padStart(2, '0');
            const dateKey = `${yearStr}-${String(month).padStart(2,'0')}-${dd}`;
            const dateObj = new Date(dateKey);
            const dayShort = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
            const presentCount = (attendanceByDate[dateKey] || []).length;
            const tr = document.createElement('tr');
            tr.dataset.date = dateKey;
            // highlight Friday row
            if (dateObj.getDay() === 5) tr.classList.add('row-friday');
            // highlight today row
            const todayKey = new Date().toISOString().slice(0,10);
            if (dateKey === todayKey) tr.classList.add('row-today');

            // format date as dd/mm/yyyy
            const mm = String(month).padStart(2,'0');
            const dateDisplay = `${dd}/${mm}/${yearStr}`;

            tr.innerHTML = `
                <td>${dateDisplay}</td>
                <td>${dayShort}</td>
                <td class="present-count">${presentCount} / ${this.employees.length}</td>
            `;
            tbody.appendChild(tr);
        }

        // update header label
        const label = document.getElementById('quickAttendanceMonthLabel');
        if (label) {
            const monthName = new Date(year, month-1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
            label.textContent = monthName;
        }
    },

    getEmployeeById(employeeId) {
        return this.employees.find(emp => String(emp.id) === String(employeeId));
    },

    openAdvanceModal(employeeId) {
        const modal = document.getElementById('employeeAdvanceModal');
        if (!modal) return;
        const employee = this.getEmployeeById(employeeId);
        const nameEl = document.getElementById('employeeAdvanceName');
        const productEl = document.getElementById('employeeAdvanceProduct');
        const qtyEl = document.getElementById('employeeAdvanceQty');
        const priceEl = document.getElementById('employeeAdvancePrice');
        const totalEl = document.getElementById('employeeAdvanceTotal');
        const cashAmountEl = document.getElementById('employeeAdvanceCashAmount');
        const dateEl = document.getElementById('employeeAdvanceDate');
        const noteEl = document.getElementById('employeeAdvanceNote');

        if (nameEl) nameEl.textContent = employee?.name || '—';
        if (productEl) productEl.value = '';
        if (qtyEl) qtyEl.value = '';
        if (priceEl) priceEl.value = '';
        if (totalEl) totalEl.value = '';
        if (cashAmountEl) cashAmountEl.value = '';
        if (dateEl) dateEl.value = this.getTodayValue();
        if (noteEl) noteEl.value = '';

        modal.dataset.employeeId = employeeId;
        this.loadProducts().then(() => {
            this.populateAdvanceProductSelect();
            modal.classList.add('show');
        });
    },

    closeAdvanceModal() {
        const modal = document.getElementById('employeeAdvanceModal');
        if (modal) modal.classList.remove('show');
    },

    async saveEmployeeAdvance() {
        const modal = document.getElementById('employeeAdvanceModal');
        if (!modal) return;
        const employeeId = modal.dataset.employeeId;
        const productName = document.getElementById('employeeAdvanceProduct')?.value || '';
        const quantity = parseFloat(document.getElementById('employeeAdvanceQty')?.value || '0') || 0;
        const unitPrice = parseFloat(document.getElementById('employeeAdvancePrice')?.value || '0') || 0;
        const totalValue = quantity * unitPrice;
        const cashAmount = parseFloat(document.getElementById('employeeAdvanceCashAmount')?.value || '0') || 0;
        const date = document.getElementById('employeeAdvanceDate')?.value || '';
        const note = document.getElementById('employeeAdvanceNote')?.value.trim() || '';
        const employee = this.getEmployeeById(employeeId);

        const hasProductAdvance = !!productName && quantity > 0 && unitPrice > 0;
        const hasCashAdvance = cashAmount > 0;

        if (!employeeId || !date || (!hasProductAdvance && !hasCashAdvance)) {
            App.showToast('Please add product advance or cash amount', 'warning');
            return;
        }

        try {
            if (hasProductAdvance) {
                await DB.add('productAdvances', {
                    employeeId,
                    employeeName: employee?.name || '',
                    productName,
                    quantity,
                    unitPrice,
                    totalValue,
                    date,
                    note,
                    type: 'product'
                });
            }

            if (hasCashAdvance) {
                await DB.add('advances', {
                    employeeId,
                    employeeName: employee?.name || '',
                    amount: cashAmount,
                    date,
                    note,
                    type: 'cash'
                });
            }

            App.showToast('Advance saved', 'success');
            this.closeAdvanceModal();
            await this.loadEmployeeData();
        } catch (error) {
            console.error('Failed to save advance:', error);
            App.showToast('Failed to save advance', 'error');
        }
    },

    populateAdvanceProductSelect() {
        const select = document.getElementById('employeeAdvanceProduct');
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select product</option>';
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            option.dataset.price = product.price;
            select.appendChild(option);
        });
        select.value = currentValue;
    },

    handleAdvanceProductChange() {
        const select = document.getElementById('employeeAdvanceProduct');
        const priceEl = document.getElementById('employeeAdvancePrice');
        if (!select || !priceEl) return;
        const selected = this.products.find(prod => prod.name === select.value);
        if (selected) {
            priceEl.value = selected.price || 0;
        }
        this.updateAdvanceTotal();
    },

    updateAdvanceTotal() {
        const qty = parseFloat(document.getElementById('employeeAdvanceQty')?.value || '0') || 0;
        const price = parseFloat(document.getElementById('employeeAdvancePrice')?.value || '0') || 0;
        const totalEl = document.getElementById('employeeAdvanceTotal');
        if (totalEl) totalEl.value = (qty * price).toFixed(2);
    },

    async openDetailsModal(employeeId) {
        const modal = document.getElementById('employeeDetailsModal');
        const content = document.getElementById('employeeDetailsContent');
        if (!modal || !content) return;

        const employee = this.getEmployeeById(employeeId);
        if (!employee) return;

        // Store employee ID and data for month filtering
        this.currentEmployeeId = employeeId;
        this.currentEmployee = employee;

        const [cashAdvances, productAdvances, repayments, attendance] = await Promise.all([
            DB.getAll('advances'),
            DB.getAll('productAdvances'),
            DB.getAll('repayments'),
            DB.getAll('attendance')
        ]);

        // Store data for re-rendering
        this.currentEmployeeData = {
            cashAdvances,
            productAdvances,
            repayments,
            attendance
        };

        // Render with current month initially
        this.renderEmployeeDetails();
        modal.classList.add('show');
    },

    renderEmployeeDetails() {
        const content = document.getElementById('employeeDetailsContent');
        if (!content || !this.currentEmployee || !this.currentEmployeeData) return;

        const employee = this.currentEmployee;
        const employeeId = this.currentEmployeeId;
        const { cashAdvances, productAdvances, repayments, attendance } = this.currentEmployeeData;

        // Get selected month or default to current
        const monthInput = document.getElementById('employeeDetailsMonth');
        const monthKey = monthInput ? monthInput.value : new Date().toISOString().slice(0, 7);

        // Filter data by selected month
        const cashRows = (cashAdvances || [])
            .filter(row => String(row.employeeId) === String(employeeId))
            .filter(row => row.date && row.date.startsWith(monthKey));
        const productRows = (productAdvances || [])
            .filter(row => String(row.employeeId) === String(employeeId))
            .filter(row => row.date && row.date.startsWith(monthKey));
        const repaymentRows = (repayments || [])
            .filter(row => String(row.employeeId) === String(employeeId))
            .filter(row => row.date && row.date.startsWith(monthKey));

        const totalCash = cashRows.reduce((sum, row) => sum + this.parseNumber(row.amount), 0);
        const totalProduct = productRows.reduce((sum, row) => sum + this.parseNumber(row.totalValue), 0);
        const totalRepayment = repaymentRows.reduce((sum, row) => sum + this.parseNumber(row.amount), 0);

        const salaryType = (employee.salaryType || 'Daily').toLowerCase();
        const salaryRate = this.parseNumber(employee.salary);
        const workingDays = (attendance || [])
            .filter(record => String(record.employeeId) === String(employeeId))
            .filter(record => record.date && record.date.startsWith(monthKey))
            .filter(record => record.status === 'present' || record.present === true)
            .length;
        const salaryTotal = salaryType === 'daily' ? workingDays * salaryRate : salaryRate;
        const remainingBalance = salaryTotal - (totalCash + totalProduct);

        const recentCombined = [
            ...cashRows.map(row => ({
                date: row.date,
                type: 'Cash',
                product: '—',
                qty: '—',
                amount: parseFloat(row.amount) || 0
            })),
            ...productRows.map(row => ({
                date: row.date,
                type: 'Product',
                product: row.productName || '—',
                qty: row.quantity || 0,
                amount: parseFloat(row.totalValue) || 0
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get month name for display
        const [year, month] = monthKey.split('-');
        const monthName = new Date(year, month - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

        content.innerHTML = `
            <div style="text-align:center; margin-bottom: 12px;">
                <div style="font-size: 18px; font-weight: 700;">${employee.name} <span style="font-size: 12px; font-weight: 400; color:#6b7280;">(${employee.role || '—'})</span></div>
                <div style="font-size: 12px; color:#6b7280; margin-top: 4px;">${employee.mobile || '—'}</div>
                <div style="margin-top: 8px;">
                    <input type="month" id="employeeDetailsMonth" class="form-input" value="${monthKey}" style="display: inline-block; width: auto; padding: 4px 8px; font-size: 13px;" />
                </div>
            </div>

            <h4 style="margin: 6px 0;">${monthName} - Advances</h4>
            ${recentCombined.length ? `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentCombined.map(row => `
                            <tr>
                                <td>${this.formatDate(row.date)}</td>
                                <td>${row.type}</td>
                                <td>${row.product}</td>
                                <td>${row.qty}</td>
                                <td>৳${this.formatCurrency(row.amount)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="4" style="text-align:right; font-weight:700;">Total</td>
                            <td style="font-weight:700;">৳${this.formatCurrency(totalCash + totalProduct)}</td>
                        </tr>
                    </tbody>
                </table>
            ` : `<p style="text-align:center; color:#6c757d;">No advances for this month</p>`}

            <div class="summary-box" style="margin-top: 12px;">
                <div class="summary-row">
                    <span>Salary</span>
                    <strong>
                        ${salaryType === 'daily'
                            ? `${workingDays} × ৳${this.formatCurrency(salaryRate)} = ৳${this.formatCurrency(salaryTotal)}`
                            : `৳${this.formatCurrency(salaryTotal)} (${employee.salaryType || 'Monthly'})`}
                    </strong>
                </div>
                <div class="summary-row"><span>Total Advance</span><strong>৳${this.formatCurrency(totalCash + totalProduct)}</strong></div>
                <div class="summary-row summary-row-total"><span>Remaining Balance</span><strong>৳${this.formatCurrency(remainingBalance)}</strong></div>
            </div>
        `;

        // Bind month change event
        const monthInputAfterRender = document.getElementById('employeeDetailsMonth');
        if (monthInputAfterRender) {
            monthInputAfterRender.removeEventListener('change', this.boundRenderDetails);
            this.boundRenderDetails = () => this.renderEmployeeDetails();
            monthInputAfterRender.addEventListener('change', this.boundRenderDetails);
        }
    },

    renderDetailsTable(rows, headers, rowMapper) {
        if (!rows.length) {
            return `<p style="text-align:center; color:#6c757d;">No records</p>`;
        }
        return `
            <table class="table">
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => {
                        const cells = rowMapper(row);
                        return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    closeDetailsModal() {
        const modal = document.getElementById('employeeDetailsModal');
        if (modal) modal.classList.remove('show');
        
        // Clear stored data
        this.currentEmployeeId = null;
        this.currentEmployee = null;
        this.currentEmployeeData = null;
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

    formatCurrency(value) {
        const number = parseFloat(value) || 0;
        return Math.round(number).toLocaleString();
    },

    parseNumber(value) {
        if (value === null || value === undefined) return 0;
        const normalized = String(value).replace(/,/g, '').trim();
        const number = parseFloat(normalized);
        return Number.isNaN(number) ? 0 : number;
    },

    getTodayValue() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },

    addEmployee() {
        App.showToast('Add employee feature coming soon');
    },

    viewList() {
        // Navigate to employee listing
        App.navigateTo('employeeListingPage');
    },

    markAttendance() {
        App.navigateTo('attendancePage');
    },

    salaryReport() {
        App.navigateTo('salaryPage');
    },

    manageAdvances() {
        App.navigateTo('advancesPage');
    },

    refresh() {
        this.loadEmployeeData();
    },

    destroy() {
        this.employees = [];
    }
};

// Register module
if (window.App) {
    App.registerModule('employees', EmployeesModule);
}

window.EmployeesModule = EmployeesModule;
