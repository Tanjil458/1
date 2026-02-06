/**
 * Attendance Module - Derived from deliveries
 */

const AttendanceModule = {
	employees: [],
	attendanceRecords: [],

	async init() {
		this.render();
		this.bindEvents();
		await this.loadEmployees();
		await this.renderAttendanceMonth();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="attendance">
				<div class="card">
					<div class="card-header">
						<h3>Attendance</h3>
					</div>
					<div class="filters" style="margin-bottom: 8px; display:flex; gap:12px; align-items:center;">
						<div class="filter-group" style="display:flex; gap:8px; align-items:center;">
							<button class="btn btn-secondary btn-small" id="attendancePrevMonth">‹</button>
							<label for="attendanceMonth">Month:</label>
							<input type="month" id="attendanceMonth" />
							<button class="btn btn-secondary btn-small" id="attendanceNextMonth">›</button>
						</div>
						<div style="margin-left:auto; display:flex; gap:8px; align-items:center;">
							<button class="btn btn-secondary btn-small" id="attendanceRefresh">Refresh</button>
							<div style="font-size:13px; color:var(--muted);">Click a cell to toggle presence (removal requires confirmation)</div>
						</div>
					</div>
					<div style="overflow:auto;">
						<table class="table attendance-month-table" id="attendanceMonthTable">
							<thead>
								<tr>
									<th style="min-width:90px;">Date</th>
									<th style="min-width:70px;">Day</th>
									<!-- employee headers inserted dynamically -->
								</tr>
							</thead>
							<tbody></tbody>
						</table>
					</div>

			<div class="card" style="margin-top:12px;">
				<div class="card-header">
					<h4>Monthly Summary</h4>
				</div>
				<div style="overflow:auto;">
					<table class="table attendance-summary-table" id="attendanceSummaryTable">
						<thead>
							<tr>
								<th style="min-width:200px;">Employee</th>
								<th style="min-width:120px; text-align:right;">Working Days</th>
							</tr>
						</thead>
						<tbody></tbody>
					</table>
				</div>
			</section>
		`;
	},

	bindEvents() {
		const monthInput = document.getElementById('attendanceMonth');
		const refreshBtn = document.getElementById('attendanceRefresh');
		const table = document.getElementById('attendanceMonthTable');

		if (monthInput) {
			const now = new Date();
			monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
			monthInput.addEventListener('change', () => this.renderAttendanceMonth());
		}
		if (refreshBtn) refreshBtn.addEventListener('click', () => this.renderAttendanceMonth());

		if (table) {
			table.addEventListener('click', (e) => {
			const btn = e.target.closest('.attendance-toggle');
			if (!btn) return;
			const employeeId = btn.dataset.emp;
			const date = btn.dataset.date;
			const recordId = btn.dataset.record ? parseInt(btn.dataset.record, 10) : null;
			const isPresent = btn.classList.contains('present');
			this.toggleAttendance(employeeId, date, recordId, isPresent);
		});

		// Prev / Next month buttons
		const prevBtn = document.getElementById('attendancePrevMonth');
		const nextBtn = document.getElementById('attendanceNextMonth');
		if (prevBtn) prevBtn.addEventListener('click', () => {
			const [y, m] = (monthInput.value || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`).split('-').map(Number);
			const d = new Date(y, m-1, 1);
			d.setMonth(d.getMonth() - 1);
			monthInput.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
			this.renderAttendanceMonth();
		});
		if (nextBtn) nextBtn.addEventListener('click', () => {
			const [y, m] = (monthInput.value || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`).split('-').map(Number);
			const d = new Date(y, m-1, 1);
			d.setMonth(d.getMonth() + 1);
			monthInput.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
			this.renderAttendanceMonth();
		});

		// Check for a requested month issued by the Attendance button
		try {
			const requestedMonth = sessionStorage.getItem('selectedAttendanceMonth');
			if (requestedMonth) {
				monthInput.value = requestedMonth;
				try { sessionStorage.removeItem('selectedAttendanceMonth'); } catch (e) {}
			}
		} catch (e) {}

		// bind remove-confirm modal buttons (modal injected during render)
		const removeCancel = document.getElementById('attendanceRemoveCancel');
		const removeConfirm = document.getElementById('attendanceRemoveConfirm');
		if (removeCancel) removeCancel.addEventListener('click', () => this.closeRemoveConfirm());
		if (removeConfirm) removeConfirm.addEventListener('click', () => this.confirmRemoveAttendance());
		}
	},

	renderAttendanceMonth() {
		const table = document.getElementById('attendanceMonthTable');
		const monthInput = document.getElementById('attendanceMonth');
		if (!table || !monthInput) return;

		const monthKey = monthInput.value || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
		const [yearStr, monthStr] = monthKey.split('-');
		const year = parseInt(yearStr, 10);
		const month = parseInt(monthStr, 10);
		const daysInMonth = new Date(year, month, 0).getDate();
		const todayKey = new Date().toISOString().slice(0,10); // yyyy-mm-dd format for 'today' comparisons

		// load attendance and employees
		DB.getAll('attendance').then(attendance => {
			const monthRecords = (attendance || []).filter(r => r.date && r.date.startsWith(monthKey));
			const attendanceByDate = {};
			monthRecords.forEach(r => {
				attendanceByDate[r.date] = attendanceByDate[r.date] || {};
				attendanceByDate[r.date][String(r.employeeId)] = r;
			});

			// build header
			const thead = table.querySelector('thead');
			thead.innerHTML = `
				<tr>
					<th style="min-width:90px;">Date</th>
					<th style="min-width:70px;">Day</th>
					${this.employees.map(emp => `<th data-emp="${emp.id}" title="${emp.name}">${emp.name}</th>`).join('')}
				</tr>
			`;
			const tbody = table.querySelector('tbody');
			if (!tbody) return;
		tbody.innerHTML = '';
		// inject remove-confirm modal for attendance deletion confirmation
		const contentEl = document.getElementById('pageContent');
		if (contentEl && !document.getElementById('attendanceRemoveConfirmModal')) {
			contentEl.insertAdjacentHTML('beforeend', `
				<div class="delete-confirm-overlay" id="attendanceRemoveConfirmModal">
					<div class="delete-confirm-box" role="dialog" aria-modal="true">
						<div class="delete-confirm-icon">⚠️</div>
						<div class="delete-confirm-title" id="attendanceRemoveTitle">Remove attendance?</div>
						<div class="delete-confirm-text" id="attendanceRemoveText">Removing an attendance entry reduces the recorded earnings of that day for the employee. This action cannot be undone. Are you sure you want to remove this attendance?</div>
						<div class="delete-confirm-actions">
							<button class="delete-confirm-btn cancel" id="attendanceRemoveCancel">Cancel</button>
							<button class="delete-confirm-btn delete" id="attendanceRemoveConfirm">Remove</button>
						</div>
					</div>
				</div>
			`);
			// attach handlers immediately so the modal works if opened right away
			const removeCancel = document.getElementById('attendanceRemoveCancel');
			const removeConfirm = document.getElementById('attendanceRemoveConfirm');
			if (removeCancel) removeCancel.addEventListener('click', () => this.closeRemoveConfirm());
			if (removeConfirm) removeConfirm.addEventListener('click', () => this.confirmRemoveAttendance());
		}
			for (let d = 1; d <= daysInMonth; d++) {
				const dd = String(d).padStart(2, '0');
				const dateKey = `${yearStr}-${String(month).padStart(2, '0')}-${dd}`;
				const dateObj = new Date(dateKey);
				const dayShort = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
				const tr = document.createElement('tr');
				if (dateObj.getDay() === 5) {
					tr.classList.add('row-friday');
				}
				if (dateKey === todayKey) {
					tr.classList.add('row-today');
				}
				// format date for display dd/mm/yyyy
				const dateDisplay = `${dd}/${String(month).padStart(2,'0')}/${yearStr}`;
				tr.innerHTML = `
					<td>${dateDisplay}</td>
					<td>${dayShort}</td>
					${this.employees.map(emp => {
						const rec = (attendanceByDate[dateKey] || {})[String(emp.id)];
						const present = !!rec;
						const recordId = rec?.id || '';
						return `<td class="attendance-cell"><button class="attendance-toggle ${present ? 'present' : ''}" data-date="${dateKey}" data-emp="${emp.id}" data-record="${recordId}" aria-label="Toggle attendance">${present ? '✔' : ''}</button></td>`;
					}).join('')}
				`;
				tbody.appendChild(tr);
			}

			// if a date was passed via sessionStorage, highlight and scroll into view
			try {
				const sel = sessionStorage.getItem('selectedAttendanceDate');
				if (sel) {
					const row = tbody.querySelector(`[data-date="${sel}"]`);
					if (row) {
						row.classList.add('row-selected');
						row.scrollIntoView({ block: 'center' });
					}
					sessionStorage.removeItem('selectedAttendanceDate');
				}
			} catch (e) {}

		// Render summary table with working days per employee
		try {
			const summaryTbody = document.querySelector('#attendanceSummaryTable tbody');
			if (summaryTbody) {
				const totals = {};
				this.employees.forEach(emp => totals[emp.id] = 0);
				Object.keys(attendanceByDate).forEach(date => {
					Object.keys(attendanceByDate[date] || {}).forEach(empId => {
						totals[empId] = (totals[empId] || 0) + 1;
					});
				});
				summaryTbody.innerHTML = this.employees.map(emp => `
					<tr>
						<td>${emp.name}</td>
						<td style="text-align:right; font-weight:700;">${totals[emp.id] || 0}</td>
					</tr>
				`).join('');
			}
		} catch (err) {
			console.error('Failed to render attendance summary:', err);
		}
		});
	},

	async loadEmployees() {
		try {
			this.employees = await DB.getAll('employees');
		} catch (error) {
			console.error('Failed to load employees:', error);
		}
	},

	async renderAttendance() {
		const tbody = document.querySelector('#attendanceTable tbody');
		const attendanceDate = document.getElementById('attendanceDate');
		if (!tbody || !attendanceDate) return;

		const dateKey = attendanceDate.value;
		if (!dateKey) return;

		try {
			this.attendanceRecords = await DB.query('attendance', 'date', dateKey);
		} catch (error) {
			console.error('Failed to load attendance:', error);
			this.attendanceRecords = [];
		}

		const presentSet = new Set((this.attendanceRecords || []).map(r => String(r.employeeId)));
		const recordMap = new Map((this.attendanceRecords || []).map(r => [String(r.employeeId), r]));
		tbody.innerHTML = '';

		if (!this.employees.length) {
			tbody.innerHTML = `
				<tr>
					<td colspan="2" style="text-align:center; color:#6c757d;">No employees found</td>
				</tr>
			`;
			return;
		}

		this.employees.forEach(emp => {
			const isPresent = presentSet.has(String(emp.id));
			const row = document.createElement('tr');
			const record = recordMap.get(String(emp.id));
			row.innerHTML = `
				<td>${emp.name}</td>
				<td><span class="badge ${isPresent ? 'badge-success' : 'badge-warning'}">${isPresent ? 'Present' : 'Absent'}</span></td>
				<td>
					<button class="btn ${isPresent ? 'btn-secondary' : 'btn-primary'} btn-small" data-emp="${emp.id}" data-present="${isPresent}" data-record="${record?.id || ''}">
						${isPresent ? 'Mark Absent' : 'Mark Present'}
					</button>
				</td>
			`;
			tbody.appendChild(row);
		});

		tbody.querySelectorAll('[data-emp]').forEach(btn => {
			btn.addEventListener('click', () => {
				const employeeId = btn.dataset.emp;
				const isPresent = btn.dataset.present === 'true';
				const recordId = btn.dataset.record ? parseInt(btn.dataset.record, 10) : null;
				this.toggleAttendance(employeeId, isPresent, recordId, dateKey);
			});
		});
	},

	async toggleAttendance(employeeId, dateKey, recordId, isPresent) {
		if (!employeeId || !dateKey) return;
		try {
			// when attempting to remove an existing attendance entry, show a warning confirmation
			if (isPresent && recordId) {
				this.showRemoveConfirm(dateKey, employeeId, recordId);
				return;
			} else if (!isPresent) {
				const employee = this.employees.find(emp => String(emp.id) === String(employeeId));
				await DB.add('attendance', {
					employeeId: String(employeeId),  // Always store as string for consistency
					employeeName: employee?.name || '',
					date: dateKey,
					status: 'present',
					present: true,
					linkedDeliveryId: null
				});
				App.showToast('Marked present', 'success');
			}
			await this.renderAttendanceMonth();
		} catch (error) {
			console.error('Failed to update attendance:', error);
			App.showToast('Failed to update attendance', 'error');
		}
	},

	showRemoveConfirm(date, employeeId, recordId) {
		this.removePending = { date, employeeId, recordId };
		const modal = document.getElementById('attendanceRemoveConfirmModal');
		if (modal) {
			const title = document.getElementById('attendanceRemoveTitle');
			const text = document.getElementById('attendanceRemoveText');
			const employee = this.employees.find(e => String(e.id) === String(employeeId));
			const name = employee?.name || 'Employee';
			const dd = date.split('-').slice(2,3)[0] || '';
			const mm = date.split('-').slice(1,2)[0] || '';
			const yyyy = date.split('-').slice(0,1)[0] || '';
			if (title) title.textContent = `Remove attendance for ${name}?`;
			if (text) text.textContent = `This will remove the present entry for ${name} on ${dd}/${mm}/${yyyy}. Removing attendance reduces their earnings for that day and cannot be undone.`;
			modal.classList.add('show');
		}
	},

	closeRemoveConfirm() {
		const modal = document.getElementById('attendanceRemoveConfirmModal');
		if (modal) modal.classList.remove('show');
		this.removePending = null;
	},

	async confirmRemoveAttendance() {
		if (!this.removePending) return;
		const { recordId } = this.removePending;
		if (!recordId) {
			this.closeRemoveConfirm();
			return;
		}
		try {
			await DB.delete('attendance', recordId);
			App.showToast('Attendance removed', 'success');
			this.closeRemoveConfirm();
			await this.renderAttendanceMonth();
		} catch (err) {
			console.error('Failed to remove attendance:', err);
			App.showToast('Failed to remove attendance', 'error');
		}
	},



	getTodayValue() {
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		const dd = String(now.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	},

	refresh() {
		this.loadEmployees();
		this.renderAttendance();
	},

	destroy() {
		this.employees = [];
		this.attendanceRecords = [];
	}
};

if (window.App) {
	App.registerModule('attendance', AttendanceModule);
}
