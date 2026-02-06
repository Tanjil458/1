// Attendance Page - View Only (Employee App) - Connected to Firestore
// Shows real-time attendance marked by admin

const Attendance = {
    employeeId: null,
    employeeName: null,
    companyId: null,

    async render() {
        try {
            const session = getSession();
            if (!session || !session.employeeId) {
                console.error('❌ No session or employeeId found');
                return `<div class="empty-state"><div class="empty-title">No session found</div></div>`;
            }
            
            this.employeeId = String(session.employeeId); // Ensure it's a string
            this.employeeName = session.name || 'Employee';
            this.companyId = session.companyId;

            console.log('✅ Attendance page initialized:', {
                employeeId: this.employeeId,
                employeeName: this.employeeName,
                companyId: this.companyId
            });

            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            return `
                <section class="page active" id="attendance">
                    <div class="card">
                        <div class="card-header">
                            <h3>My Attendance</h3>
                            <div style="font-size: 13px; color: var(--muted); margin-top: 4px;">
                                Employee ID: ${this.employeeId}
                            </div>
                        </div>
                        <div class="filters" style="margin-bottom: 8px; display:flex; gap:12px; align-items:center;">
                            <div class="filter-group" style="display:flex; gap:8px; align-items:center;">
                                <button class="btn btn-secondary btn-small" id="attendancePrevMonth">‹</button>
                                <label for="attendanceMonth">Month:</label>
                                <input type="month" id="attendanceMonth" value="${monthKey}" />
                                <button class="btn btn-secondary btn-small" id="attendanceNextMonth">›</button>
                            </div>
                            <div style="margin-left:auto;">
                                <button class="btn btn-secondary btn-small" id="attendanceRefresh">🔄 Refresh</button>
                            </div>
                        </div>
                        <div style="overflow:auto;">
                            <table class="table attendance-month-table" id="attendanceMonthTable">
                                <thead>
                                    <tr>
                                        <th style="min-width:90px;">Date</th>
                                        <th style="min-width:70px;">Day</th>
                                        <th style="min-width:150px;">${this.employeeName}</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card" style="margin-top:12px;">
                        <div class="card-header">
                            <h4>Monthly Summary</h4>
                        </div>
                        <div style="overflow:auto;">
                            <table class="table attendance-summary-table" id="attendanceSummaryTable">
                                <thead>
                                    <tr>
                                        <th style="min-width:200px;">Description</th>
                                        <th style="min-width:120px; text-align:right;">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Days Present</td>
                                        <td style="text-align:right; font-weight:700; color: var(--success);" id="presentCount">0</td>
                                    </tr>
                                    <tr>
                                        <td>Days Absent</td>
                                        <td style="text-align:right; font-weight:700; color: var(--error);" id="absentCount">0</td>
                                    </tr>
                                    <tr>
                                        <td>Total Days in Month</td>
                                        <td style="text-align:right; font-weight:700;" id="totalCount">0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <p style="text-align: center; color: var(--muted); font-size: 12px; margin-top: 12px;">
                        📡 Live data from admin panel
                    </p>
                </section>
            `;
        } catch (error) {
            console.error('❌ Attendance render error:', error);
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-title">Error loading attendance</div>
                    <div class="empty-text">${error.message}</div>
                </div>
            `;
        }
    },

    async attachEventListeners() {
        const monthInput = document.getElementById('attendanceMonth');
        const refreshBtn = document.getElementById('attendanceRefresh');
        const prevBtn = document.getElementById('attendancePrevMonth');
        const nextBtn = document.getElementById('attendanceNextMonth');

        // Render initial month data
        if (monthInput && monthInput.value) {
            await this.renderAttendanceMonth(monthInput.value);
        }

        if (monthInput) {
            monthInput.addEventListener('change', (e) => {
                this.renderAttendanceMonth(e.target.value);
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (monthInput) {
                    this.renderAttendanceMonth(monthInput.value);
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (monthInput) {
                    const [y, m] = monthInput.value.split('-').map(Number);
                    const d = new Date(y, m - 2, 1);
                    const newValue = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthInput.value = newValue;
                    this.renderAttendanceMonth(newValue);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (monthInput) {
                    const [y, m] = monthInput.value.split('-').map(Number);
                    const d = new Date(y, m, 1);
                    const newValue = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthInput.value = newValue;
                    this.renderAttendanceMonth(newValue);
                }
            });
        }
    },

    async renderAttendanceMonth(monthKey) {
        const table = document.getElementById('attendanceMonthTable');
        if (!table || !monthKey || !this.employeeId) return;

        const [yearStr, monthStr] = monthKey.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();
        const todayKey = new Date().toISOString().slice(0, 10);

        try {
            console.log('📅 Rendering attendance for month:', monthKey, 'Employee:', this.employeeId);
            
            // Load attendance from Firestore (real-time data from admin)
            const attendanceRecords = await this.getAttendanceFromFirestore(monthKey);
            
            console.log('📊 Total records fetched:', attendanceRecords.length);
            console.log('📋 Records:', attendanceRecords);
            
            const attendanceMap = {};
            attendanceRecords.forEach(r => {
                if (r.date) {
                    attendanceMap[r.date] = r;
                }
            });

            console.log('🗺️ Attendance map:', attendanceMap);

            // Render calendar
            const tbody = table.querySelector('tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            for (let d = 1; d <= daysInMonth; d++) {
                const dd = String(d).padStart(2, '0');
                const dateKey = `${yearStr}-${String(month).padStart(2, '0')}-${dd}`;
                const dateObj = new Date(dateKey);
                const dayShort = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                const dateDisplay = `${dd}/${String(month).padStart(2, '0')}/${yearStr}`;
                
                const record = attendanceMap[dateKey];
                const isPresent = !!record;
                
                console.log(`${dateKey}: ${isPresent ? '✓ Present' : '✗ Absent'}`, record);
                
                const tr = document.createElement('tr');
                if (dateObj.getDay() === 5) {
                    tr.classList.add('row-friday');
                }
                if (dateKey === todayKey) {
                    tr.classList.add('row-today');
                }
                
                const cellHTML = `
                    <td>${dateDisplay}</td>
                    <td>${dayShort}</td>
                    <td class="attendance-cell">
                        <button class="attendance-toggle ${isPresent ? 'present' : ''}" style="border: 1px solid #ddd; padding: 8px 12px; border-radius: 4px; cursor: default; background: ${isPresent ? '#d4edda' : '#f8f9fa'}; color: ${isPresent ? '#155724' : '#6c757d'};">
                            ${isPresent ? '✔ Present' : '✗ Absent'}
                        </button>
                    </td>
                `;
                tr.innerHTML = cellHTML;
                tbody.appendChild(tr);
            }

            // Update summary
            this.updateSummary(attendanceRecords, daysInMonth);

        } catch (error) {
            console.error('❌ Error rendering attendance:', error);
            UIUtils.showToast('Error loading attendance', 'error');
        }
    },

    async getAttendanceFromFirestore(monthKey) {
        try {
            const session = getSession();
            
            if (!session || !session.companyId) {
                console.warn('⚠️ No company ID in session');
                return [];
            }

            console.log('📡 Employee requesting attendance from Firestore:', {
                companyId: session.companyId,
                employeeId: this.employeeId,
                employeeIdType: typeof this.employeeId,
                monthKey: monthKey
            });

            // Use the existing FirestoreService from firestore.js
            if (typeof FirestoreService !== 'undefined' && FirestoreService.getEmployeeAttendance) {
                const records = await FirestoreService.getEmployeeAttendance(session.companyId, this.employeeId);
                console.log(`✅ Employee attendance page received: ${records.length} records`);
                
                // Log sample record for debugging
                if (records.length > 0) {
                    console.log('📋 Sample attendance record:', {
                        id: records[0].id,
                        employeeId: records[0].employeeId,
                        employeeIdType: typeof records[0].employeeId,
                        date: records[0].date,
                        status: records[0].status
                    });
                }
                
                return records;
            } else {
                console.error('❌ FirestoreService not available');
                return [];
            }

        } catch (error) {
            console.error('❌ Error fetching attendance from Firestore:', error);
            return [];
        }
    },

    async getAttendanceFromLocal(monthKey) {
        try {
            const allAttendance = await employeeDB.getAll(STORES.ATTENDANCE);
            return allAttendance.filter(r => 
                String(r.employeeId) === String(this.employeeId) && 
                r.date && 
                r.date.startsWith(monthKey)
            );
        } catch (error) {
            console.error('❌ Local DB error:', error);
            return [];
        }
    },

    updateSummary(attendanceRecords, daysInMonth) {
        const presentCount = attendanceRecords.length;
        const absentCount = daysInMonth - presentCount;

        const presentEl = document.getElementById('presentCount');
        const absentEl = document.getElementById('absentCount');
        const totalEl = document.getElementById('totalCount');

        if (presentEl) presentEl.textContent = presentCount;
        if (absentEl) absentEl.textContent = absentCount;
        if (totalEl) totalEl.textContent = daysInMonth;
    }
};
