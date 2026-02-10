// Dashboard Page

const Dashboard = {
    async render() {
        try {
            const session = getSession();
            if (!session || !session.employeeId || !session.companyId) {
                return `<div class="empty-state"><div class="empty-title">Session incomplete</div></div>`;
            }
            
            const employeeId = session.employeeId;
            const companyId = session.companyId;
            console.log('📊 Dashboard: Loading data for employee:', employeeId);

            // Get data directly from Firestore (removed deliveries as not needed)
            const [attendance, advances] = await Promise.all([
                DirectFirestore.getEmployeeAttendance(companyId, employeeId),
                DirectFirestore.getEmployeeAdvances(companyId, employeeId)
            ]);

            console.log('📊 Data loaded:', { attendance: attendance.length, advances: advances.length });

            // Calculate stats
            const currentMonth = DateUtils.getMonthStart();
            const monthAttendance = attendance.filter(a => a.date && a.date >= currentMonth);
            const totalAdvances = advances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
            const pendingAdvances = advances
                .filter(adv => adv.status === 'pending')
                .reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
            
            // Calculate remaining salary (salary - advances)
            let monthlySalary = 0;
            const salaryType = (session.salaryType || 'Daily').toLowerCase();
            const salaryRate = parseFloat(session.salary) || 0;
            
            if (salaryType === 'daily' && salaryRate > 0) {
                monthlySalary = salaryRate * monthAttendance.length;
            } else if (salaryType === 'monthly' && salaryRate > 0) {
                monthlySalary = salaryRate;
            }
            
            const remainingSalary = monthlySalary - totalAdvances;

        return `
            <h2 class="section-title">Welcome, ${session.name}!</h2>

            <!-- Main Salary Card - Full Width -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.6;"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                
                <div style="position: relative; z-index: 2;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 8px; margin-right: 12px;">
                            <span style="font-size: 24px;">💰</span>
                        </div>
                        <h3 style="color: white; font-size: 18px; font-weight: 600; margin: 0; opacity: 0.9;">Remaining Salary</h3>
                    </div>
                    
                    <div style="color: white; font-size: 36px; font-weight: 700; margin: 12px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ৳${MoneyUtils.formatMoney(Math.max(0, remainingSalary))}
                    </div>
                    
                    ${remainingSalary < 0 ? `
                        <div style="margin-top: 12px; padding: 12px; background: rgba(251, 191, 36, 0.2); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; backdrop-filter: blur(10px);">
                            <div style="color: #fbbf24; font-size: 13px; font-weight: 500;">
                                ⚠️ You've taken ৳${MoneyUtils.formatMoney(Math.abs(remainingSalary))} more than your current salary. This will be adjusted next month.
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-label">Present Days</div>
                    <div class="stat-value">${monthAttendance.length}</div>
                    <div class="stat-subtitle">this month</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-label">Advances Taken</div>
                    <div class="stat-value">৳${MoneyUtils.formatMoney(totalAdvances)}</div>
                    <div class="stat-subtitle">pending: ৳${MoneyUtils.formatMoney(pendingAdvances)}</div>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Recent Attendance</h3>
                ${this.renderRecentAttendance(attendance.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5))}
            </div>

            <div class="section">
                <p class="text-muted text-center">📡 Live data from admin panel</p>
                
                ${attendance.length === 0 && advances.length === 0 ? `
                    <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <div style="font-size: 13px; color: #856404; line-height: 1.6;">
                            <strong>⚠️ No Data Found</strong><br>
                            This means admin hasn't created any attendance or advance records yet.<br>
                            <strong>Action Required:</strong> Ask the admin to:
                            <ol style="margin: 8px 0; padding-left: 20px;">
                                <li>Mark your attendance in the admin app</li>
                                <li>Add any advance payments if needed</li>
                                <li>Sync data to the cloud</li>
                            </ol>
                            Data will appear here automatically once admin syncs.
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
                    <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">🔄 Refresh</button>
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
                    <div class="empty-text">Ask admin to add your attendance records</div>
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
    }
};
