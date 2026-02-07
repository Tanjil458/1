/**
 * Salary Module - Monthly/Daily aggregation
 */

const SalaryModule = {
	employees: [],
	attendanceRecords: [],
	advances: [],
	productAdvances: [],
	repayments: [],

	async init() {
		this.render();
		this.bindEvents();
		await this.loadData();
		this.renderSalary();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="salary">
				<div class="card">
					<div class="card-header">
						<h3>Salary Report</h3>
					</div>
					<div class="filters" style="margin-bottom: 8px;">
						<div class="filter-group">
							<label for="salaryMonth">Month:</label>
							<input type="month" id="salaryMonth" />
						</div>
					</div>
					<div style="overflow-x:auto;">
						<table class="table" id="salaryTable">
							<thead>
								<tr>
									<th>Employee</th>
									<th>Type</th>
									<th>Days</th>
									<th>Gross Salary</th>
									<th>Cash Adv.</th>
									<th>Product Adv.</th>
									<th>Repayments</th>
									<th>Outstanding</th>
									<th>Net Payable</th>
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
		const salaryMonth = document.getElementById('salaryMonth');
		if (salaryMonth) {
			salaryMonth.addEventListener('change', () => this.renderSalary());
			salaryMonth.value = this.getCurrentMonthValue();
		}
	},

	async loadData() {
		try {
			this.employees = await DB.getAll('employees');
			this.attendanceRecords = await DB.getAll('attendance');
			this.advances = await DB.getAll('advances');
			this.productAdvances = await DB.getAll('productAdvances');
			this.repayments = await DB.getAll('repayments');
		} catch (error) {
			console.error('Failed to load salary data:', error);
		}
	},

	renderSalary() {
		const tbody = document.querySelector('#salaryTable tbody');
		const salaryMonth = document.getElementById('salaryMonth');
		if (!tbody || !salaryMonth) return;

		const monthKey = salaryMonth.value;
		if (!monthKey) return;

		const attendanceByEmployee = {};
		this.attendanceRecords
			.filter(record => record.date?.startsWith(monthKey))
			.forEach(record => {
				const key = String(record.employeeId);
				attendanceByEmployee[key] = (attendanceByEmployee[key] || 0) + 1;
			});

		const cashAdvancesByEmployee = {};
		this.advances
			.filter(adv => adv.date && adv.date.startsWith(monthKey))
			.forEach(adv => {
				const key = String(adv.employeeId);
				const amount = parseFloat(adv.amount) || 0;
				cashAdvancesByEmployee[key] = (cashAdvancesByEmployee[key] || 0) + amount;
			});

		const productAdvancesByEmployee = {};
		this.productAdvances
			.filter(adv => adv.date && adv.date.startsWith(monthKey))
			.forEach(adv => {
				const key = String(adv.employeeId);
				const amount = parseFloat(adv.totalValue) || 0;
				productAdvancesByEmployee[key] = (productAdvancesByEmployee[key] || 0) + amount;
			});

		const repaymentsByEmployee = {};
		this.repayments
			.filter(rep => rep.date && rep.date.startsWith(monthKey))
			.forEach(rep => {
				const key = String(rep.employeeId);
				const amount = parseFloat(rep.amount) || 0;
				repaymentsByEmployee[key] = (repaymentsByEmployee[key] || 0) + amount;
			});

		tbody.innerHTML = '';

		if (!this.employees.length) {
			tbody.innerHTML = `
				<tr>
					<td colspan="9" style="text-align:center; color:#6c757d;">No employees found</td>
				</tr>
			`;
			return;
		}

		this.employees.forEach(emp => {
			const empId = String(emp.id);
			const daysPresent = attendanceByEmployee[empId] || 0;
			const salaryType = (emp.salaryType || 'Daily').toLowerCase();
			const baseSalary = parseFloat(emp.salary) || 0;
			const salaryTotal = salaryType === 'daily' ? baseSalary * daysPresent : baseSalary;
			const cashAdv = cashAdvancesByEmployee[empId] || 0;
			const productAdv = productAdvancesByEmployee[empId] || 0;
			const repayment = repaymentsByEmployee[empId] || 0;
			const rawOutstanding = cashAdv + productAdv - repayment;
			const outstanding = Math.max(rawOutstanding, 0);
			const payable = salaryTotal - outstanding;
			const owes = payable < 0 ? Math.abs(payable) : 0;
			const payableDisplay = payable > 0 ? payable : 0;

			const row = document.createElement('tr');
			row.innerHTML = `
				<td>${emp.name}</td>
				<td>${emp.salaryType || 'Daily'}</td>
				<td>${salaryType === 'daily' ? daysPresent : '—'}</td>
				<td>৳${this.formatCurrency(salaryTotal)}</td>
				<td>৳${this.formatCurrency(cashAdv)}</td>
				<td>৳${this.formatCurrency(productAdv)}</td>
				<td>৳${this.formatCurrency(repayment)}</td>
				<td>৳${this.formatCurrency(outstanding)}</td>
				<td>
					৳${this.formatCurrency(payableDisplay)}
					${owes > 0 ? `<span class="badge badge-danger" style="margin-left:6px;">Owes ৳${this.formatCurrency(owes)}</span>` : ''}
				</td>
			`;
			tbody.appendChild(row);
		});
	},

	formatCurrency(value) {
		const number = parseFloat(value) || 0;
		return Math.round(number).toLocaleString();
	},

	getCurrentMonthValue() {
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		return `${yyyy}-${mm}`;
	},

	refresh() {
		this.loadData().then(() => this.renderSalary());
	},

	destroy() {
		this.employees = [];
		this.attendanceRecords = [];
		this.advances = [];
		this.productAdvances = [];
		this.repayments = [];
	}
};

if (window.App) {
	App.registerModule('salary', SalaryModule);
}
