// Advances Page

const Advances = {
    async render() {
        try {
            const session = getSession();
            if (!session || !session.employeeId) {
                return `<div class="empty-state"><div class="empty-title">No session found</div></div>`;
            }
            
            const employeeId = session.employeeId;
            console.log('💰 Advances: Loading data for employee:', employeeId);
            console.log('💰 Employee ID type:', typeof employeeId);

            // Get advances data
            const allAdvances = (await employeeDB.getAll(STORES.ADVANCES)).filter(adv => String(adv.employeeId) === String(employeeId));
            console.log('💰 Loaded', allAdvances.length, 'advance records');
            
            // Log sample for debugging
            if (allAdvances.length > 0) {
                console.log('💰 Sample advance:', {
                    id: allAdvances[0].id,
                    employeeId: allAdvances[0].employeeId,
                    employeeIdType: typeof allAdvances[0].employeeId,
                    amount: allAdvances[0].amount,
                    date: allAdvances[0].date,
                    reason: allAdvances[0].reason
                });
            }

            // Get attendance data to calculate days worked
            const allAttendance = (await employeeDB.getAll(STORES.ATTENDANCE)).filter(att => String(att.employeeId) === String(employeeId));
            const daysWorked = allAttendance.length;
            console.log('📅 Days worked:', daysWorked);

            // Sort by date descending
           allAdvances.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            // Calculate totals
            const totalAdvances = allAdvances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
            const paidAdvances = allAdvances
                .filter(adv => adv.status === 'paid')
                .reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
            const pendingAdvances = allAdvances
                .filter(adv => adv.status === 'pending')
                .reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);

        return `
            <h2 class="section-title">My Advances</h2>

            <div class="summary-card">
                <div class="summary-row">
                    <span class="summary-label">Total Advances</span>
                    <span class="summary-value">${MoneyUtils.formatMoney(totalAdvances)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Paid</span>
                    <span class="summary-value text-success">${MoneyUtils.formatMoney(paidAdvances)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Pending</span>
                    <span class="summary-value text-warning">${MoneyUtils.formatMoney(pendingAdvances)}</span>
                </div>
                <div class="summary-row summary-row-separator">
                    <span class="summary-label">Days Worked (Total)</span>
                    <span class="summary-value text-primary">${daysWorked}</span>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Advance History</h3>
                ${this.renderAdvancesList(allAdvances)}
            </div>
        `;
        } catch (error) {
            console.error('❌ Advances render error:', error);
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Error loading advances</div>
                    <div class="empty-text">${error.message}</div>
                    <button class="btn btn-primary" onclick="SyncManager.syncAll()" style="margin-top: 20px;">🔄 Try Syncing</button>
                </div>
            `;
        }
    },

    renderAdvancesList(advances) {
        if (advances.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <div class="empty-title">No advances</div>
                    <div class="empty-text">You haven't received any advances yet</div>
                </div>
            `;
        }

        return `
            <div class="list-container">
                ${advances.map(adv => {
                    const status = adv.status || 'pending';
                    let badgeClass = 'badge-info';
                    if (status === 'paid') badgeClass = 'badge-success';
                    if (status === 'pending') badgeClass = 'badge-warning';
                    
                    return `
                        <div class="list-item">
                            <div class="item-left">
                                <div class="item-title">${DateUtils.formatDisplayDate(adv.date)}</div>
                                <div class="item-subtitle">
                                    ${adv.reason || 'No reason provided'}
                                </div>
                            </div>
                            <div class="item-right">
                                <div class="item-value">${MoneyUtils.formatMoney(adv.amount)}</div>
                                <div class="item-meta">
                                    <span class="badge ${badgeClass}">${status.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    attachEventListeners() {
        // No interactive elements in this page
    }
};
