// Deliveries Page

const Deliveries = {
    startDate: DateUtils.getDateDaysAgo(7), // Last 7 days (was getMonthStart)
    endDate: DateUtils.getToday(), // Today (was getMonthEnd)

    async render() {
        try {
            const session = getSession();
            if (!session || !session.employeeId) {
                return `<div class="empty-state"><div class="empty-title">No session found</div></div>`;
            }
            
            const employeeId = session.employeeId;
            const isDSR = session.role === 'DSR';
            
            console.log('🚚 Deliveries: Loading data for employee:', employeeId);
            console.log('🚚 DSR Mode:', isDSR);

            // Get deliveries data
            // For DSR: show ALL deliveries (no employeeId filter)
            // For regular employee: show only their deliveries
            const allDeliveries = await employeeDB.getAll(STORES.DELIVERIES);
            const employeeDeliveries = isDSR 
                ? allDeliveries 
                : allDeliveries.filter(d => d.employeeId === employeeId);
                
            console.log('🚚 Loaded', employeeDeliveries.length, 'delivery records');

            // Filter by date range
            const filteredDeliveries = employeeDeliveries.filter(del =>
                del.date && del.date >= this.startDate && del.date <= this.endDate
            );

            // Sort by date descending
            filteredDeliveries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            // Calculate total
            const totalAmount = filteredDeliveries.reduce((sum, del) => sum + (parseFloat(del.amount) || 0), 0);

            const pageTitle = isDSR ? 'All Deliveries (DSR)' : 'My Deliveries';

        return `
            <h2 class="section-title">${pageTitle}</h2>

            <div class="date-filter">
                <input type="date" class="date-input" id="startDate" value="${this.startDate}">
                <input type="date" class="date-input" id="endDate" value="${this.endDate}">
                <button class="filter-btn" id="filterBtn">Filter</button>
            </div>

            <div class="summary-card">
                <div class="summary-row">
                    <span class="summary-label">Total Deliveries</span>
                    <span class="summary-value">${filteredDeliveries.length}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Amount</span>
                    <span class="summary-value">${MoneyUtils.formatMoney(totalAmount)}</span>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Delivery Records</h3>
                ${this.renderDeliveriesList(filteredDeliveries, isDSR)}
            </div>
        `;
        } catch (error) {
            console.error('❌ Deliveries render error:', error);
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Error loading deliveries</div>
                    <div class="empty-text">${error.message}</div>
                    <button class="btn btn-primary" onclick="EmployeeSyncService.syncNow()">🔄 Try Syncing</button>
                </div>
            `;
        }
    },

    renderDeliveriesList(deliveries, isDSR) {
        if (deliveries.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🚚</div>
                    <div class="empty-title">No deliveries</div>
                    <div class="empty-text">No deliveries found for this period</div>
                </div>
            `;
        }

        return `
            <div class="list-container">
                ${deliveries.map(del => `
                    <div class="list-item">
                        <div class="item-left">
                            <div class="item-title">${del.customerName || 'N/A'}</div>
                            <div class="item-subtitle">
                                ${DateUtils.formatDisplayDate(del.date)}
                                ${del.area ? `• ${del.area}` : ''}
                                ${isDSR && del.employeeName ? `• ${del.employeeName}` : ''}
                            </div>
                        </div>
                        <div class="item-right">
                            <div class="item-value">${MoneyUtils.formatMoney(del.amount)}</div>
                            ${del.products ? `<div class="item-meta">${del.products.length} items</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    attachEventListeners() {
        const filterBtn = document.getElementById('filterBtn');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.startDate = startDateInput.value;
                this.endDate = endDateInput.value;
                App.navigateTo('deliveries');
            });
        }
    }
};
