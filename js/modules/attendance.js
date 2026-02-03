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
		await this.renderAttendance();
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
					<div class="filters" style="margin-bottom: 8px;">
						<div class="filter-group">
							<label for="attendanceDate">Date:</label>
							<input type="date" id="attendanceDate" />
						</div>
					</div>
					<div style="overflow-x:auto;">
						<table class="table" id="attendanceTable">
							<thead>
								<tr>
									<th>Employee</th>
									<th>Status</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody></tbody>
						</table>
					</div>
				</div>
			</section>
		`;
	},

	bindEvents() {
		const attendanceDate = document.getElementById('attendanceDate');
		if (attendanceDate) {
			attendanceDate.addEventListener('change', () => this.renderAttendance());
			attendanceDate.value = this.getTodayValue();
		}
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

	async toggleAttendance(employeeId, isPresent, recordId, dateKey) {
		if (!employeeId || !dateKey) return;
		try {
			if (isPresent && recordId) {
				await DB.delete('attendance', recordId);
				App.showToast('Marked absent', 'success');
			} else if (!isPresent) {
				const employee = this.employees.find(emp => String(emp.id) === String(employeeId));
				await DB.add('attendance', {
					employeeId,
					employeeName: employee?.name || '',
					date: dateKey,
					status: 'present',
					present: true,
					linkedDeliveryId: null
				});
				App.showToast('Marked present', 'success');
			}
			await this.renderAttendance();
		} catch (error) {
			console.error('Failed to update attendance:', error);
			App.showToast('Failed to update attendance', 'error');
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
