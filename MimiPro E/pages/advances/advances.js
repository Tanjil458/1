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

            // Get current month key (or use selected month if re-rendering)
            const monthInput = document.getElementById('advancesMonth');
            let monthKey = monthInput ? monthInput.value : null;
            if (!monthKey) {
                const now = new Date();
                monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

            // Get advances data
            const allAdvances = (await employeeDB.getAll(STORES.ADVANCES)).filter(adv => String(adv.employeeId) === String(employeeId));
            console.log('💰 Loaded', allAdvances.length, 'advance records from local DB');
            
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
            } else {
                console.warn('⚠️ No advances found in local DB for this employee');
                console.warn('💡 Possible reasons:');
                console.warn('   1. Admin has not created any advances yet');
                console.warn('   2. Admin has not synced data to Firestore');
                console.warn('   3. EmployeeId mismatch between admin and employee app');
                console.warn('   4. Employee app has not synced yet');
                console.warn('📌 Action: Click "Sync Now" button or ask admin to create advances and sync');
            }

            // Sort by date descending
            allAdvances.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            // Calculate totals for current month (filter by monthKey)
            const monthAdvances = allAdvances.filter(adv => adv.date && adv.date.startsWith(monthKey));
            const totalAdvances = monthAdvances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);

            // Get employee salary (assumed monthly for now)
            const monthlySalary = parseFloat(session.salary) || 9999;
            const remainingBalance = monthlySalary - totalAdvances;

        return `
            <div style="background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px;">
                <div style="text-align: center; margin-bottom: 16px;">
                    <h3 style="font-size: 18px; font-weight: 700; color: #2c3e50;">Employee Details</h3>
                    <div style="font-size: 14px; font-weight: 600; color: #2c3e50; margin-top: 4px;">${session.name} <span style="font-size: 12px; font-weight: 400; color: #6b7280;">(${employeeId})</span></div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${session.phone || '—'}</div>
                    <div style="margin-top: 12px;">
                        <input type="month" id="advancesMonth" class="form-input" value="${monthKey}" style="display: inline-block; width: auto; padding: 6px 12px; font-size: 14px; border: 1px solid #e1e8ed; border-radius: 8px;" />
                    </div>
                </div>

                <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #2c3e50;">${monthName} - Advances</h4>
                ${this.renderAdvancesTable(allAdvances, monthKey)}

                <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #e9ecef;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #2c3e50;">💰 Salary Calculation for ${monthName}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-size: 14px; color: #6b7280;">Monthly Salary</span>
                        <strong style="font-size: 14px; color: #2c3e50;">৳${MoneyUtils.formatMoney(monthlySalary)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-size: 14px; color: #dc3545;">Total Advances (This Month)</span>
                        <strong style="font-size: 14px; color: #dc3545;">- ৳${MoneyUtils.formatMoney(totalAdvances)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; font-size: 17px; font-weight: 700; background: ${remainingBalance < 0 ? '#fff5f5' : '#f0fdf4'}; margin: 8px -16px 0; padding-left: 16px; padding-right: 16px; border-radius: 8px;">
                        <span style="color: ${remainingBalance < 0 ? '#dc3545' : '#28a745'};">Expected Payment</span>
                        <strong style="color: ${remainingBalance < 0 ? '#dc3545' : '#28a745'};">৳${MoneyUtils.formatMoney(remainingBalance)}</strong>
                    </div>
                    ${remainingBalance < 0 ? `
                        <div style="margin-top: 8px; padding: 8px 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                            <small style="color: #856404;">⚠️ Note: You have taken more advances than your monthly salary. The excess will be deducted from next month.</small>
                        </div>
                    ` : ''}
                    ${totalAdvances === 0 ? `
                        <div style="margin-top: 8px; padding: 8px 12px; background: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                            <small style="color: #0c5460;">ℹ️ No advances taken this month. You will receive your full salary.</small>
                        </div>
                    ` : ''}
                </div>
            </div>

            <p style="text-align: center; color: var(--muted); font-size: 11px; margin-top: 8px;">
                📡 Live data from admin panel
            </p>
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

    renderAdvancesTable(advances, monthKey) {
        // Filter advances by selected month
        const monthAdvances = advances.filter(adv => adv.date && adv.date.startsWith(monthKey));
        
        if (monthAdvances.length === 0) {
            return `<p style="text-align: center; color: #6c757d; padding: 20px 0; font-size: 13px;">No advances for this month</p>`;
        }

        return `
            <table class="table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead style="background: #f8f9fa;">
                    <tr>
                        <th style="padding: 10px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Date</th>
                        <th style="padding: 10px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Type</th>
                        <th style="padding: 10px 8px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Product</th>
                        <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Qty</th>
                        <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthAdvances.map(adv => {
                        const date = DateUtils.formatDisplayDate(adv.date);
                        const type = adv.type === 'product' ? 'Product' : 'Cash';
                        const product = adv.productName || '—';
                        const qty = adv.quantity || '—';
                        const amount = MoneyUtils.formatMoney(adv.amount || adv.totalValue || 0);
                        
                        return `
                            <tr>
                                <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5;">${date}</td>
                                <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5;">${type}</td>
                                <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5;">${product}</td>
                                <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5; text-align: center;">${qty}</td>
                                <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5; text-align: right;">৳${amount}</td>
                            </tr>
                        `;
                    }).join('')}
                    <tr>
                        <td colspan="4" style="padding: 10px 8px; text-align: right; font-weight: 700; border-top: 2px solid #dee2e6;">Total</td>
                        <td style="padding: 10px 8px; text-align: right; font-weight: 700; border-top: 2px solid #dee2e6;">৳${MoneyUtils.formatMoney(monthAdvances.reduce((sum, adv) => sum + (parseFloat(adv.amount || adv.totalValue) || 0), 0))}</td>
                    </tr>
                </tbody>
            </table>
        `;
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
        const monthInput = document.getElementById('advancesMonth');
        if (monthInput) {
            monthInput.addEventListener('change', async () => {
                // Re-render the entire page with the new month
                const pageContent = document.getElementById('pageContent');
                if (pageContent) {
                    const html = await this.render();
                    pageContent.innerHTML = html;
                    this.attachEventListeners(); // Re-attach event listeners
                }
            });
        }
    }
};
