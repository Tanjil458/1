// Dashboard Page

const Dashboard = {
    async render() {
        try {
            const session = getSession();
            if (!session || !session.employeeId) {
                return `<div class="empty-state"><div class="empty-title">No session found</div></div>`;
            }
            
            const employeeId = session.employeeId;
            console.log('📊 Dashboard: Loading data for employee:', employeeId);

            // Get all data from IndexedDB
            const attendance = (await employeeDB.getAll(STORES.ATTENDANCE)).filter(a => a.employeeId === employeeId);
            const deliveries = (await employeeDB.getAll(STORES.DELIVERIES)).filter(d => d.employeeId === employeeId);
            const advances = (await employeeDB.getAll(STORES.ADVANCES)).filter(adv => adv.employeeId === employeeId);

            console.log('📊 Data loaded:', { attendance: attendance.length, deliveries: deliveries.length, advances: advances.length });

            // Calculate stats
            const currentMonth = DateUtils.getMonthStart();
            const monthAttendance = attendance.filter(a => a.date && a.date >= currentMonth);
            const monthDeliveries = deliveries.filter(d => d.date && d.date >= currentMonth);
            const totalAdvances = advances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
            const pendingAdvances = advances
                .filter(adv => adv.status === 'pending')
                .reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
            const totalDaysWorked = attendance.length; // Total days worked (all time)

        return `
            <h2 class="section-title">Welcome, ${session.name}!</h2>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-label">This Month</div>
                    <div class="stat-value">${monthAttendance.length}</div>
                    <div class="stat-subtitle">days present</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-label">Total Days Worked</div>
                    <div class="stat-value">${totalDaysWorked}</div>
                    <div class="stat-subtitle">all time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🚚</div>
                    <div class="stat-label">Deliveries</div>
                    <div class="stat-value">${monthDeliveries.length}</div>
                    <div class="stat-subtitle">this month</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-label">Advances Taken</div>
                    <div class="stat-value">${MoneyUtils.formatMoney(totalAdvances)}</div>
                    <div class="stat-subtitle">pending: ${MoneyUtils.formatMoney(pendingAdvances)}</div>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Recent Attendance</h3>
                ${this.renderRecentAttendance(attendance.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5))}
            </div>

            <div class="section">
                <h3 class="section-title">Recent Deliveries</h3>
                ${this.renderRecentDeliveries(deliveries.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5))}
            </div>

            <div class="section">
                <p class="text-muted text-center">Last synced: ${EmployeeSyncService.getLastSyncTime()}</p>
                <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="EmployeeSyncService.syncNow()">🔄 Sync Now</button>
                
                ${attendance.length === 0 && advances.length === 0 ? `
                    <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <div style="font-size: 13px; color: #856404; line-height: 1.6;">
                            <strong>⚠️ No Data Found</strong><br>
                            If you've clicked "Sync Now" and still see no data, it means:<br>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>Admin hasn't created any attendance or advance records yet, OR</li>
                                <li>Admin hasn't synced their data to the cloud</li>
                            </ul>
                            <strong>Action Required:</strong> Ask the admin to:
                            <ol style="margin: 8px 0; padding-left: 20px;">
                                <li>Mark your attendance in the admin app</li>
                                <li>Click the "🔄 Sync Now" button in the admin app</li>
                                <li>Then click "🔄 Sync Now" here again</li>
                            </ol>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        } catch (error) {
            console.error('❌ Dashboard render error:', error);
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Error loading dashboard</div>
                    <div class="empty-text">${error.message}</div>
                    <button class="btn btn-primary" onclick="SyncManager.syncAll()" style="margin-top: 20px;">🔄 Try Syncing</button>
                </div>
            `;
        }
    },

    renderRecentAttendance(attendance) {
        if (!attendance || attendance.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <div class="empty-title">No attendance records</div>
                    <div class="empty-text">Click "Sync Now" to load your attendance data</div>
                </div>
            `;
        }

        return `
            <div class="list-container">
                ${attendance.map(att => `
                    <div class="list-item">
                        <div class="item-left">
                            <div class="item-title">${DateUtils.formatDisplayDate(att.date)}</div>
                            <div class="item-subtitle">${att.status || 'Present'}</div>
                        </div>
                        <div class="item-right">
                            <span class="badge ${att.status === 'present' ? 'badge-success' : 'badge-warning'}">✓</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderRecentDeliveries(deliveries) {
        if (!deliveries || deliveries.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🚚</div>
                    <div class="empty-title">No deliveries</div>
                    <div class="empty-text">Click "Sync Now" to load your delivery data</div>
                </div>
            `;
        }

        return `
            <div class="list-container">
                ${deliveries.map(del => `
                    <div class="list-item">
                        <div class="item-left">
                            <div class="item-title">${del.customerName || 'N/A'}</div>
                            <div class="item-subtitle">${DateUtils.formatDisplayDate(del.date)}</div>
                        </div>
                        <div class="item-right">
                            <div class="item-value">${MoneyUtils.formatMoney(del.amount || 0)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
