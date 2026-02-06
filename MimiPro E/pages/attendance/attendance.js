// Attendance Page

const Attendance = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),

    async render() {
        try {
            const session = getSession();
            if (!session || !session.employeeId) {
                return `<div class="empty-state"><div class="empty-title">No session found</div></div>`;
            }
            
            const employeeId = session.employeeId;
            console.log('📅 Attendance: Loading data for employee:', employeeId);

            // Get attendance data
            const allAttendance = (await employeeDB.getAll(STORES.ATTENDANCE)).filter(a => a.employeeId === employeeId);
            console.log('📅 Loaded', allAttendance.length, 'attendance records');

            // Filter by current month
            const monthStart = new Date(this.currentYear, this.currentMonth, 1);
            const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);
            const startDate = DateUtils.formatDate(monthStart);
            const endDate = DateUtils.formatDate(monthEnd);

            const monthAttendance = allAttendance.filter(att => 
                att.date && att.date >= startDate && att.date <= endDate
            );

            // Sort by date descending
            monthAttendance.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        return `
            <h2 class="section-title">My Attendance</h2>

            <div class="date-filter">
                <button class="btn-secondary" id="prevMonth">◀ Previous</button>
                <div style="flex: 1; text-align: center; padding: 0.625rem; font-weight: 600;">
                    ${DateUtils.getMonthName(this.currentMonth)} ${this.currentYear}
                </div>
                <button class="btn-secondary" id="nextMonth">Next ▶</button>
            </div>

            <div class="summary-card">
                <div class="summary-row">
                    <span class="summary-label">Total Days</span>
                    <span class="summary-value">${monthAttendance.length}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Present</span>
                    <span class="summary-value text-success">
                        ${monthAttendance.filter(a => a.status === 'present' || !a.status).length}
                    </span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Absent</span>
                    <span class="summary-value text-error">
                        ${monthAttendance.filter(a => a.status === 'absent').length}
                    </span>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">Attendance Records</h3>
                ${this.renderAttendanceList(monthAttendance)}
            </div>
        `;
        } catch (error) {
            console.error('❌ Attendance render error:', error);
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Error loading attendance</div>
                    <div class="empty-text">${error.message}</div>
                    <button class="btn btn-primary" onclick="SyncManager.syncAll()" style="margin-top: 20px;">🔄 Try Syncing</button>
                </div>
            `;
        }
    },

    renderAttendanceList(attendance) {
        if (attendance.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <div class="empty-title">No attendance records</div>
                    <div class="empty-text">No attendance found for this month</div>
                </div>
            `;
        }

        return `
            <div class="list-container">
                ${attendance.map(att => {
                    const status = att.status || 'present';
                    const badgeClass = status === 'present' ? 'badge-success' : 'badge-error';
                    const icon = status === 'present' ? '✓' : '✗';
                    
                    return `
                        <div class="list-item">
                            <div class="item-left">
                                <div class="item-title">${DateUtils.formatDisplayDate(att.date)}</div>
                                <div class="item-subtitle">${DateUtils.getDayName(new Date(att.date).getDay())}</div>
                            </div>
                            <div class="item-right">
                                <span class="badge ${badgeClass}">${icon} ${status.toUpperCase()}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    attachEventListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                App.navigateTo('attendance');
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                App.navigateTo('attendance');
            });
        }
    }
};
