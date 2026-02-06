/**
 * Advances Module - Cash/Product advances & repayments
 */

const AdvancesModule = {
	employees: [],
	cashAdvances: [],
	productAdvances: [],	repayments: [],

	async init() {
		this.render();
		this.bindEvents();
		await this.loadEmployees();
		await this.loadData();
		this.populateEmployeeSelects();
		this.initializeFilters();
		this.renderLists();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="advances">
				<div class="card">
					<div class="card-header">
						<h3>Advances & Repayments</h3>
					</div>
					<div class="filters">
						<div class="filter-group">
							<label for="advanceMonthFilter">Month</label>
							<input type="month" id="advanceMonthFilter" />
						</div>
						<div class="filter-group">
							<label for="advanceEmployeeFilter">Employee</label>
							<select id="advanceEmployeeFilter" class="form-input">
								<option value="">All Employees</option>
							</select>
						</div>
					</div>
				</div>

				<div class="card">
					<h3>Cash Advance</h3>
					<div class="form-group">
						<label class="form-label">Employee</label>
						<select id="cashAdvanceEmployee" class="form-input"></select>
					</div>
					<div class="form-group">
						<label class="form-label">Amount</label>
						<input type="number" id="cashAdvanceAmount" class="form-input" min="0" step="0.01" />
					</div>
					<div class="form-group">
						<label class="form-label">Date</label>
						<input type="date" id="cashAdvanceDate" class="form-input" />
					</div>
					<div class="form-group">
						<label class="form-label">Note</label>
						<input type="text" id="cashAdvanceNote" class="form-input" placeholder="Optional" />
					</div>
					<button class="btn btn-primary" id="saveCashAdvanceBtn">Save Cash Advance</button>
				</div>

				<div class="card">
					<h3>Product Advance</h3>
					<div class="form-group">
						<label class="form-label">Employee</label>
						<select id="productAdvanceEmployee" class="form-input"></select>
					</div>
					<div class="form-group">
						<label class="form-label">Product Name</label>
						<input type="text" id="productAdvanceName" class="form-input" placeholder="Rice / Oil / Goods" />
					</div>
					<div class="form-group">
						<label class="form-label">Quantity</label>
						<input type="number" id="productAdvanceQty" class="form-input" min="0" step="0.01" />
					</div>
					<div class="form-group">
						<label class="form-label">Unit Price</label>
						<input type="number" id="productAdvancePrice" class="form-input" min="0" step="0.01" />
					</div>
					<div class="form-group">
						<label class="form-label">Total Value</label>
						<input type="number" id="productAdvanceTotal" class="form-input" readonly />
					</div>
					<div class="form-group">
						<label class="form-label">Date</label>
						<input type="date" id="productAdvanceDate" class="form-input" />
					</div>
					<button class="btn btn-primary" id="saveProductAdvanceBtn">Save Product Advance</button>
				</div>

				<div class="card">
					<h3>Repayment</h3>
					<div class="form-group">
						<label class="form-label">Employee</label>
						<select id="repaymentEmployee" class="form-input"></select>
					</div>
					<div class="form-group">
						<label class="form-label">Amount</label>
						<input type="number" id="repaymentAmount" class="form-input" min="0" step="0.01" />
					</div>
					<div class="form-group">
						<label class="form-label">Method</label>
						<select id="repaymentMethod" class="form-input">
							<option value="cash">Cash</option>
							<option value="product-return">Product Return</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">Date</label>
						<input type="date" id="repaymentDate" class="form-input" />
					</div>
					<div class="form-group">
						<label class="form-label">Note</label>
						<input type="text" id="repaymentNote" class="form-input" placeholder="Optional" />
					</div>
					<button class="btn btn-primary" id="saveRepaymentBtn">Save Repayment</button>
				</div>

				<div class="card">
					<h3>Summary</h3>
					<div class="summary-box">
						<div class="summary-row">
							<span>Total Cash Advance</span>
							<strong>৳ <span id="summaryCashAdvance">0</span></strong>
						</div>
						<div class="summary-row">
							<span>Total Product Advance</span>
							<strong>৳ <span id="summaryProductAdvance">0</span></strong>
						</div>
						<div class="summary-row">
							<span>Total Repayments</span>
							<strong>৳ <span id="summaryRepayment">0</span></strong>
						</div>
						<div class="summary-row summary-row-total">
							<span>Outstanding</span>
							<strong>৳ <span id="summaryOutstanding">0</span></strong>
						</div>
					</div>
				</div>

				<div class="card">
					<h3>Cash Advances</h3>
					<div style="overflow-x:auto;">
						<table class="table" id="cashAdvanceTable">
							<thead>
								<tr>
									<th>Date</th>
									<th>Employee</th>
									<th>Amount</th>
									<th>Note</th>
								</tr>
							</thead>
							<tbody></tbody>
						</table>
					</div>
				</div>

				<div class="card">
					<h3>Product Advances</h3>
					<div style="overflow-x:auto;">
						<table class="table" id="productAdvanceTable">
							<thead>
								<tr>
									<th>Date</th>
									<th>Employee</th>
									<th>Product</th>
									<th>Qty</th>
									<th>Unit</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody></tbody>
						</table>
					</div>
				</div>

				<div class="card">
					<h3>Repayments</h3>
					<div style="overflow-x:auto;">
						<table class="table" id="repaymentTable">
							<thead>
								<tr>
									<th>Date</th>
									<th>Employee</th>
									<th>Amount</th>
									<th>Method</th>
									<th>Note</th>
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
		const monthFilter = document.getElementById('advanceMonthFilter');
		const employeeFilter = document.getElementById('advanceEmployeeFilter');
		const saveCashBtn = document.getElementById('saveCashAdvanceBtn');
		const saveProductBtn = document.getElementById('saveProductAdvanceBtn');
		const saveRepaymentBtn = document.getElementById('saveRepaymentBtn');
		const productQty = document.getElementById('productAdvanceQty');
		const productPrice = document.getElementById('productAdvancePrice');

		if (monthFilter) monthFilter.addEventListener('change', () => this.renderLists());
		if (employeeFilter) employeeFilter.addEventListener('change', () => this.renderLists());
		if (saveCashBtn) saveCashBtn.addEventListener('click', () => this.saveCashAdvance());
		if (saveProductBtn) saveProductBtn.addEventListener('click', () => this.saveProductAdvance());
		if (saveRepaymentBtn) saveRepaymentBtn.addEventListener('click', () => this.saveRepayment());

		const updateProductTotal = () => this.updateProductTotal();
		if (productQty) productQty.addEventListener('input', updateProductTotal);
		if (productPrice) productPrice.addEventListener('input', updateProductTotal);
	},

	async loadEmployees() {
		try {
			this.employees = await DB.getAll('employees');
		} catch (error) {
			console.error('Failed to load employees:', error);
			this.employees = [];
		}
	},

	async loadData() {
		try {
			const [cashAdvances, productAdvances, repayments] = await Promise.all([
				DB.getAll('advances'),
				DB.getAll('productAdvances'),
				DB.getAll('repayments')
			]);
			this.cashAdvances = cashAdvances || [];
			this.productAdvances = productAdvances || [];
			this.repayments = repayments || [];
		} catch (error) {
			console.error('Failed to load advances data:', error);
		}
	},

	populateEmployeeSelects() {
		const selects = [
			document.getElementById('advanceEmployeeFilter'),
			document.getElementById('cashAdvanceEmployee'),
			document.getElementById('productAdvanceEmployee'),
			document.getElementById('repaymentEmployee')
		].filter(Boolean);

		selects.forEach(select => {
			const keepAll = select.id === 'advanceEmployeeFilter';
			const currentValue = select.value;
			select.innerHTML = keepAll ? '<option value="">All Employees</option>' : '<option value="">Select employee</option>';
			this.employees.forEach(emp => {
				const option = document.createElement('option');
				option.value = emp.id;
				option.textContent = emp.name;
				select.appendChild(option);
			});
			select.value = currentValue;
		});
	},

	initializeFilters() {
		const monthFilter = document.getElementById('advanceMonthFilter');
		if (monthFilter) monthFilter.value = this.getCurrentMonthValue();

		const cashDate = document.getElementById('cashAdvanceDate');
		const productDate = document.getElementById('productAdvanceDate');
		const repaymentDate = document.getElementById('repaymentDate');
		const today = this.getTodayValue();
		if (cashDate) cashDate.value = today;
		if (productDate) productDate.value = today;
		if (repaymentDate) repaymentDate.value = today;
	},

	updateProductTotal() {
		const qty = parseFloat(document.getElementById('productAdvanceQty')?.value || '0') || 0;
		const price = parseFloat(document.getElementById('productAdvancePrice')?.value || '0') || 0;
		const totalInput = document.getElementById('productAdvanceTotal');
		if (totalInput) totalInput.value = (qty * price).toFixed(2);
	},

	async saveCashAdvance() {
		const employeeId = document.getElementById('cashAdvanceEmployee')?.value || '';
		const amount = parseFloat(document.getElementById('cashAdvanceAmount')?.value || '0') || 0;
		const date = document.getElementById('cashAdvanceDate')?.value || '';
		const note = document.getElementById('cashAdvanceNote')?.value.trim() || '';

		if (!employeeId || !amount || !date) {
			App.showToast('Please fill employee, amount and date', 'warning');
			return;
		}

		const employee = this.employees.find(emp => String(emp.id) === String(employeeId));
		await DB.add('advances', {
			employeeId: String(employeeId), // Always store as string for Firestore compatibility
			employeeName: employee?.name || '',
			amount,
			date,
			note,
			reason: note, // Add reason field for employee app display
			status: 'pending', // Default status
			type: 'cash'
		});

		App.showToast('Cash advance saved', 'success');
		document.getElementById('cashAdvanceAmount').value = '';
		document.getElementById('cashAdvanceNote').value = '';
		await this.loadData();
		this.renderLists();
	},

	async saveProductAdvance() {
		const employeeId = document.getElementById('productAdvanceEmployee')?.value || '';
		const productName = document.getElementById('productAdvanceName')?.value.trim() || '';
		const quantity = parseFloat(document.getElementById('productAdvanceQty')?.value || '0') || 0;
		const unitPrice = parseFloat(document.getElementById('productAdvancePrice')?.value || '0') || 0;
		const totalValue = quantity * unitPrice;
		const date = document.getElementById('productAdvanceDate')?.value || '';

		if (!employeeId || !productName || !quantity || !unitPrice || !date) {
			App.showToast('Please fill all product advance fields', 'warning');
			return;
		}

		const employee = this.employees.find(emp => String(emp.id) === String(employeeId));
		
		// Store product advance as a regular advance with amount=totalValue
		await DB.add('advances', {
			employeeId: String(employeeId), // Always store as string for Firestore compatibility
			employeeName: employee?.name || '',
			amount: totalValue, // Store total value as amount for employee app
			date,
			reason: `Product: ${productName} (${quantity} × ৳${unitPrice})`, // Detailed reason
			status: 'pending', // Default status
			type: 'product',
			// Keep product details for admin view
			productName,
			quantity,
			unitPrice
		});
		
		// Also save to productAdvances for admin tracking
		await DB.add('productAdvances', {
			employeeId: String(employeeId),
			employeeName: employee?.name || '',
			productName,
			quantity,
			unitPrice,
			totalValue,
			date,
			type: 'product'
		});

		App.showToast('Product advance saved', 'success');
		document.getElementById('productAdvanceName').value = '';
		document.getElementById('productAdvanceQty').value = '';
		document.getElementById('productAdvancePrice').value = '';
		document.getElementById('productAdvanceTotal').value = '';
		await this.loadData();
		this.renderLists();
	},

	async saveRepayment() {
		const employeeId = document.getElementById('repaymentEmployee')?.value || '';
		const amount = parseFloat(document.getElementById('repaymentAmount')?.value || '0') || 0;
		const method = document.getElementById('repaymentMethod')?.value || 'cash';
		const date = document.getElementById('repaymentDate')?.value || '';
		const note = document.getElementById('repaymentNote')?.value.trim() || '';

		if (!employeeId || !amount || !date) {
			App.showToast('Please fill employee, amount and date', 'warning');
			return;
		}

		const employee = this.employees.find(emp => String(emp.id) === String(employeeId));
		await DB.add('repayments', {
			employeeId: String(employeeId), // Always store as string for Firestore compatibility
			employeeName: employee?.name || '',
			amount,
			date,
			method,
			note
		});

		App.showToast('Repayment saved', 'success');
		document.getElementById('repaymentAmount').value = '';
		document.getElementById('repaymentNote').value = '';
		await this.loadData();
		this.renderLists();
	},

	renderLists() {
		const monthFilter = document.getElementById('advanceMonthFilter')?.value || '';
		const employeeFilter = document.getElementById('advanceEmployeeFilter')?.value || '';

		const filterBy = (item) => {
			const monthKey = item.date ? item.date.slice(0, 7) : '';
			const matchMonth = !monthFilter || monthKey === monthFilter;
			const matchEmployee = !employeeFilter || String(item.employeeId) === String(employeeFilter);
			return matchMonth && matchEmployee;
		};

		const cashRows = this.cashAdvances.filter(filterBy);
		const productRows = this.productAdvances.filter(filterBy);
		const repaymentRows = this.repayments.filter(filterBy);

		this.renderTableRows('cashAdvanceTable', cashRows, 4, (row) => `
			<tr>
				<td>${this.formatDate(row.date)}</td>
				<td>${row.employeeName || this.getEmployeeName(row.employeeId)}</td>
				<td>৳${this.formatCurrency(row.amount)}</td>
				<td>${row.note || '—'}</td>
			</tr>
		`);

		this.renderTableRows('productAdvanceTable', productRows, 6, (row) => `
			<tr>
				<td>${this.formatDate(row.date)}</td>
				<td>${row.employeeName || this.getEmployeeName(row.employeeId)}</td>
				<td>${row.productName || '—'}</td>
				<td>${row.quantity || 0}</td>
				<td>৳${this.formatCurrency(row.unitPrice)}</td>
				<td>৳${this.formatCurrency(row.totalValue)}</td>
			</tr>
		`);

		this.renderTableRows('repaymentTable', repaymentRows, 5, (row) => `
			<tr>
				<td>${this.formatDate(row.date)}</td>
				<td>${row.employeeName || this.getEmployeeName(row.employeeId)}</td>
				<td>৳${this.formatCurrency(row.amount)}</td>
				<td>${row.method || 'cash'}</td>
				<td>${row.note || '—'}</td>
			</tr>
		`);

		const totalCash = cashRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
		const totalProduct = productRows.reduce((sum, row) => sum + (parseFloat(row.totalValue) || 0), 0);
		const totalRepayment = repaymentRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
		const outstanding = Math.max(totalCash + totalProduct - totalRepayment, 0);

		const summaryCash = document.getElementById('summaryCashAdvance');
		const summaryProduct = document.getElementById('summaryProductAdvance');
		const summaryRepayment = document.getElementById('summaryRepayment');
		const summaryOutstanding = document.getElementById('summaryOutstanding');
		if (summaryCash) summaryCash.textContent = this.formatCurrency(totalCash);
		if (summaryProduct) summaryProduct.textContent = this.formatCurrency(totalProduct);
		if (summaryRepayment) summaryRepayment.textContent = this.formatCurrency(totalRepayment);
		if (summaryOutstanding) summaryOutstanding.textContent = this.formatCurrency(outstanding);
	},

	renderTableRows(tableId, rows, colCount, rowRenderer) {
		const tbody = document.querySelector(`#${tableId} tbody`);
		if (!tbody) return;
		if (!rows.length) {
			tbody.innerHTML = `
				<tr>
					<td colspan="${colCount}" style="text-align:center; color:#6c757d;">No records</td>
				</tr>
			`;
			return;
		}
		tbody.innerHTML = rows.map(rowRenderer).join('');
	},

	getEmployeeName(employeeId) {
		const emp = this.employees.find(e => String(e.id) === String(employeeId));
		return emp?.name || '—';
	},

	formatDate(dateValue) {
		if (!dateValue) return '—';
		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) return dateValue;
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, '0');
		const dd = String(date.getDate()).padStart(2, '0');
		return `${dd}/${mm}/${yyyy}`;
	},

	formatCurrency(value) {
		const number = parseFloat(value) || 0;
		return Math.round(number).toLocaleString();
	},

	getTodayValue() {
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		const dd = String(now.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	},

	getCurrentMonthValue() {
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		return `${yyyy}-${mm}`;
	},

	refresh() {
		this.loadData().then(() => this.renderLists());
	},

	destroy() {
		this.employees = [];
		this.cashAdvances = [];
		this.productAdvances = [];
		this.repayments = [];
	}
};

if (window.App) {
	App.registerModule('advances', AdvancesModule);
}
