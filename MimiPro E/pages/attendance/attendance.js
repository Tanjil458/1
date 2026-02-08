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
                <div style="background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px;">
                    <div style="text-align: center; margin-bottom: 16px;">
                        <h3 style="font-size: 18px; font-weight: 700; color: #2c3e50;">Attendance</h3>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px;">
                            <button class="btn btn-secondary btn-small" id="attendancePrevMonth">‹</button>
                            <span style="font-size: 14px; font-weight: 500;">Month</span>
                            <input type="month" id="attendanceMonth" value="${monthKey}" class="form-input" style="display: inline-block; width: auto; padding: 6px 12px; font-size: 14px; border: 1px solid #e1e8ed; border-radius: 8px;" />
                            <button class="btn btn-secondary btn-small" id="attendanceNextMonth">›</button>
                        </div>
                        <div style="margin-top: 8px;">
                            <span style="font-size: 12px; color: #6b7280; font-style: italic;">Click a cell to toggle presence (removal requires confirmation)</span>
                        </div>
                    </div>

                    <div style="overflow-x: auto; overflow-y: auto; max-height: 500px;">
                        <table class="table" id="attendanceMonthTable" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 1;">
                                <tr>
                                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Date</th>
                                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Day</th>
                                    <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">${this.employeeName}</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>

                    <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #e9ecef;">
                        <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #2c3e50;">📅 Monthly Attendance Summary</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                            <div style="text-align: center; padding: 12px; background: #d4edda; border-radius: 8px; border: 1px solid #c3e6cb;">
                                <div style="font-size: 12px; color: #155724; margin-bottom: 4px; font-weight: 600;">Days Present</div>
                                <div style="font-size: 24px; font-weight: 700; color: #28a745;" id="presentCount">0</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: #f8d7da; border-radius: 8px; border: 1px solid #f5c6cb;">
                                <div style="font-size: 12px; color: #721c24; margin-bottom: 4px; font-weight: 600;">Days Absent</div>
                                <div style="font-size: 24px; font-weight: 700; color: #dc3545;" id="absentCount">0</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: #d1ecf1; border-radius: 8px; border: 1px solid #bee5eb;">
                                <div style="font-size: 12px; color: #0c5460; margin-bottom: 4px; font-weight: 600;">Total Days</div>
                                <div style="font-size: 24px; font-weight: 700; color: #17a2b8;" id="totalCount">0</div>
                            </div>
                        </div>
                        <div style="margin-top: 12px; padding: 12px; background: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                            <div style="font-size: 13px; color: #0c5460; line-height: 1.5;">
                                <strong>💡 Attendance Impact:</strong><br>
                                • Each day present contributes to your monthly salary<br>
                                • Days absent may reduce your earnings<br>
                                • Check with admin for salary calculation details
                            </div>
                        </div>
                    </div>
                </div>

                <p style="text-align: center; color: var(--muted); font-size: 11px; margin-top: 8px;">
                    📡 Live data from admin panel
                </p>
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
                    tr.style.background = '#fff8e1';
                }
                if (dateKey === todayKey) {
                    tr.classList.add('row-today');
                    tr.style.background = '#e3f2fd';
                }
                
                const cellHTML = `
                    <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5; text-align: center; font-size: 12px;">${dateDisplay}</td>
                    <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5; text-align: center; font-size: 12px;">${dayShort}</td>
                    <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f5; text-align: center;">
                        <button class="attendance-toggle ${isPresent ? 'present' : ''}" style="border: 1px solid ${isPresent ? '#28a745' : '#ddd'}; padding: 6px 12px; border-radius: 6px; cursor: default; background: ${isPresent ? '#d4edda' : '#f8f9fa'}; color: ${isPresent ? '#155724' : '#6c757d'}; font-size: 12px; font-weight: 500;">
                            ${isPresent ? '✔' : ''}
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
                } else {
                    console.warn('⚠️ No attendance records found in Firestore.');
                    console.warn('💡 Possible reasons:');
                    console.warn('   1. Admin has not marked any attendance yet');
                    console.warn('   2. Admin has not synced data to Firestore');
                    console.warn('   3. EmployeeId mismatch between admin and employee app');
                    console.warn('📌 Action: Ask admin to mark attendance and click "Sync Now" in admin app');
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
