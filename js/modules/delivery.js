/**
 * Delivery Calculation Module
 */

const DeliveryModule = {
	products: [],
	areas: [],
	customers: [],
	employees: [],
	editingRecord: null,
	cashNotes: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],

	async init() {
		this.render();
		await this.loadProducts();
		await this.loadCreditSources();
		await this.loadEmployees();
		this.addEmployeeSelectRow();
		this.addProductRow();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="inventory">
			<div class="card">
				<div class="delivery-header">
					<h3>Delivery Calculation</h3>
				</div>
				<div style="overflow-x:auto;">
					<table class="table delivery-table" id="invTable">
						<thead>
							<tr>
								<th class="col-product">Product</th>
								<th class="col-dc col-green">DC</th>
								<th class="col-dp col-green">DP</th>
								<th class="col-rc col-red">RC</th>
								<th class="col-rp col-red">RP</th>
								<th class="col-sold">Sold</th>
								<th class="col-price">Price</th>
								<th class="col-total">Total</th>
							</tr>
						</thead>
						<tbody id="invTableBody"></tbody>
					</table>
				</div>
				<button class="btn btn-primary btn-block" id="addProductBtn">+ Add Product</button>
				<div class="sales-row">Sales: ৳ <span id="salesTotal">0</span></div>
			</div>

			<div class="card">
				<div class="delivery-header">
					<h3>Cash Denominations</h3>
					<div class="total-pill">Cash: ৳ <span id="cashTotal">0</span></div>
				</div>
				<div style="overflow-x:auto;">
					<table class="table" id="cashTable">
						<thead>
							<tr>
								<th>Note</th>
								<th>Qty</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody id="cashTableBody"></tbody>
					</table>
				</div>
			</div>

			<div class="card">
				<div class="delivery-header">
					<h3>Extra Expenses</h3>
					<div class="total-pill">Total: ৳ <span id="expenseTotal">0</span></div>
				</div>
				<div style="overflow-x:auto;">
					<table class="table" id="expenseTable">
						<thead>
							<tr>
								<th>Expense Name</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody id="expenseTableBody"></tbody>
					</table>
				</div>
				<button class="btn btn-secondary btn-block" id="addExpenseBtn">+ Add Expense</button>
			</div>

			<div class="card">
				<div class="delivery-header">
					<h3>Credit (Unpaid)</h3>
					<div class="total-pill">Credit: ৳ <span id="creditTotal">0</span></div>
				</div>
				<div style="overflow-x:auto;">
					<table class="table" id="creditTable">
						<thead>
							<tr>
								<th>Customer</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody id="creditTableBody"></tbody>
					</table>
				</div>
				<button class="btn btn-secondary btn-block" id="addCreditBtn">+ Add Credit</button>
			</div>

			<div class="card">
				<h3>Summary</h3>
				<div class="summary-box">
					<div class="summary-row">
						<span>Sales Total</span>
						<strong>৳ <span id="summarySales">0</span></strong>
					</div>
					<div class="summary-row">
						<span>Cash Total</span>
						<strong>৳ <span id="summaryCash">0</span></strong>
					</div>
					<div class="summary-row">
						<span>Total Expenses</span>
						<strong>৳ <span id="summaryExpense">0</span></strong>
					</div>
					<div class="summary-row">
						<span>Total Credit</span>
						<strong>৳ <span id="summaryCredit">0</span></strong>
					</div>
					<div class="summary-row summary-row-total">
						<span>Net Total</span>
						<strong>৳ <span id="summaryNet">0</span></strong>
					</div>
				</div>
				<div class="form-group" style="margin-top: 12px;">
					<label class="form-label">Delivery By</label>
					<div id="deliveryEmployeeList"></div>
					<button class="btn btn-secondary btn-small" id="addDeliveryEmployeeBtn">+ Add Employee</button>
				</div>
				<button class="btn btn-success btn-block" id="saveCalculationBtn">Save Calculation</button>
			</div>

			<div class="modal" id="expenseModal">
				<div class="modal-content">
					<div class="modal-header">
						<div class="modal-title">Add Expense</div>
						<button class="modal-close" data-close-expense>×</button>
					</div>
					<div class="modal-body">
						<div class="form-group">
							<label class="form-label">Type</label>
							<select id="expenseType" class="form-input">
								<option value="Expense">Expense</option>
								<option value="Credit">Credit</option>
							</select>
						</div>
						<div class="form-group">
							<label class="form-label">Expense Name</label>
							<input type="text" id="expenseName" class="form-input" placeholder="Enter expense name" />
						</div>
						<div class="form-group">
							<label class="form-label">Amount</label>
							<input type="number" id="expenseAmount" class="form-input" min="0" step="0.01" value="0" />
						</div>
					</div>
					<div class="modal-actions">
						<button class="btn btn-secondary" data-close-expense>Cancel</button>
						<button class="btn btn-primary" id="expenseSaveBtn">Save</button>
					</div>
				</div>
			</div>

			<div class="modal" id="creditModal">
				<div class="modal-content">
					<div class="modal-header">
						<div class="modal-title">Add Credit</div>
						<button class="modal-close" data-close-credit>×</button>
					</div>
					<div class="modal-body">
						<div class="form-group">
							<label class="form-label">Area</label>
							<select id="creditAreaSelect" class="form-input">
								<option value="">Select area</option>
							</select>
						</div>
						<div class="form-group credit-customer-group">
							<label class="form-label">Customer Name</label>
							<input type="text" id="creditNameInput" class="form-input" placeholder="Customer" autocomplete="off" />
							<div class="credit-customer-dropdown" id="creditCustomerDropdown"></div>
						</div>
						<div class="form-group">
							<label class="form-label">Amount</label>
							<input type="number" id="creditAmountInput" class="form-input" min="0" step="0.01" value="0" />
						</div>
					</div>
					<div class="modal-actions">
						<button class="btn btn-secondary" data-close-credit>Cancel</button>
						<button class="btn btn-primary" id="creditSaveBtn">Save</button>
					</div>
				</div>
			</div>

			<div class="modal" id="customerModal">
				<div class="modal-content">
					<div class="modal-header">
						<div class="modal-title">Customer Name</div>
						<button class="modal-close" data-close-customer>×</button>
					</div>
					<div class="modal-body">
						<div class="form-group">
							<label class="form-label">Customer</label>
							<input type="text" id="customerNameInput" class="form-input" placeholder="Enter name" list="customerAreaList" />
							<datalist id="customerAreaList"></datalist>
						</div>
					</div>
					<div class="modal-actions">
						<button class="btn btn-secondary" data-close-customer>Cancel</button>
						<button class="btn btn-primary" id="customerSaveBtn">Save</button>
					</div>
				</div>
			</div>

			<!-- Delete Confirmation Popup -->
			<div class="delete-confirm-overlay" id="deleteConfirmPopup">
				<div class="delete-confirm-box" role="dialog" aria-modal="true">
					<div class="delete-confirm-icon">⚠️</div>
					<div class="delete-confirm-title">Delete this item?</div>
					<div class="delete-confirm-text">This action cannot be undone. Are you sure you want to delete this item?</div>
					<div class="delete-confirm-actions">
						<button class="delete-confirm-btn cancel" id="deleteConfirmCancel">Cancel</button>
						<button class="delete-confirm-btn delete" id="deleteConfirmOk">Delete</button>
					</div>
				</div>
			</div>
			</section>
		`;

		this.renderCashTable();
		this.bindEvents();
		this.recalculate();
	},

	bindEvents() {
		const addProductBtn = document.getElementById('addProductBtn');
		if (addProductBtn) {
			addProductBtn.addEventListener('click', () => this.addProductRow());
		}

		const addDeliveryEmployeeBtn = document.getElementById('addDeliveryEmployeeBtn');
		if (addDeliveryEmployeeBtn) {
			addDeliveryEmployeeBtn.addEventListener('click', () => this.addEmployeeSelectRow());
		}

		const addExpenseBtn = document.getElementById('addExpenseBtn');
		if (addExpenseBtn) {
			addExpenseBtn.addEventListener('click', () => this.openExpenseModal());
		}

		const addCreditBtn = document.getElementById('addCreditBtn');
		if (addCreditBtn) {
			addCreditBtn.addEventListener('click', () => this.openCreditModal());
		}

		const expenseSaveBtn = document.getElementById('expenseSaveBtn');
		if (expenseSaveBtn) {
			expenseSaveBtn.addEventListener('click', () => this.saveExpense());
		}

		const creditSaveBtn = document.getElementById('creditSaveBtn');
		if (creditSaveBtn) {
			creditSaveBtn.addEventListener('click', () => this.saveCredit());
		}

		document.querySelectorAll('[data-close-expense]').forEach(btn => {
			btn.addEventListener('click', () => this.closeExpenseModal());
		});

		document.querySelectorAll('[data-close-credit]').forEach(btn => {
			btn.addEventListener('click', () => this.closeCreditModal());
		});

		const creditAreaSelect = document.getElementById('creditAreaSelect');
		if (creditAreaSelect) {
			creditAreaSelect.addEventListener('change', () => this.handleCreditAreaChange());
		}

		const creditNameInput = document.getElementById('creditNameInput');
		if (creditNameInput) {
			creditNameInput.addEventListener('input', () => this.updateCreditCustomerDropdown());
			creditNameInput.addEventListener('focus', () => this.updateCreditCustomerDropdown());
		}

		const saveCalculationBtn = document.getElementById('saveCalculationBtn');
		if (saveCalculationBtn) {
			saveCalculationBtn.addEventListener('click', () => this.handleSave());
		}

		document.querySelectorAll('[data-close-customer]').forEach(btn => {
			btn.addEventListener('click', () => this.closeCustomerModal());
		});

		const customerSaveBtn = document.getElementById('customerSaveBtn');
		if (customerSaveBtn) {
			customerSaveBtn.addEventListener('click', () => this.submitCustomerModal());
		}

		const deleteCancelBtn = document.getElementById('deleteConfirmCancel');
		if (deleteCancelBtn) {
			deleteCancelBtn.addEventListener('click', () => this.closeDeleteConfirm());
		}

		const deleteOkBtn = document.getElementById('deleteConfirmOk');
		if (deleteOkBtn) {
			deleteOkBtn.addEventListener('click', () => this.confirmDeleteAction());
		}
	},

	async loadProducts() {
		try {
			this.products = await DB.getAll('products');
			this.refreshProductSelects();
		} catch (error) {
			console.error('Error loading products:', error);
		}
	},

	async loadCreditSources() {
		try {
			const [areas, customers] = await Promise.all([
				DB.getAll('areas'),
				DB.getAll('customers')
			]);
			this.areas = areas || [];
			this.customers = customers || [];
			this.populateCreditAreas();
			this.populateCustomerAreaList();
		} catch (error) {
			console.error('Error loading credit sources:', error);
		}
	},

	refreshProductSelects() {
		const selects = document.querySelectorAll('.product-select');
		selects.forEach(select => {
			const currentValue = select.value;
			select.innerHTML = '<option value="">Select</option>';
			this.products.forEach(product => {
				const option = document.createElement('option');
				option.value = product.name;
				option.textContent = product.name;
				select.appendChild(option);
			});
			select.value = currentValue;
			select.classList.toggle('selected', !!select.value);
		});
	},

	addProductRow(data = {}) {
		const tbody = document.getElementById('invTableBody');
		if (!tbody) return;

		const row = document.createElement('tr');
		row.className = 'swipeable-row';
		row.innerHTML = `
			<td class="col-product"><select class="product-select"></select></td>
			<td class="col-dc col-green"><input type="number" class="dc-input" min="0" value="${this.toNumberValue(data.dc)}" /></td>
			<td class="col-dp col-green"><input type="number" class="dp-input" min="0" value="${this.toNumberValue(data.dp)}" /></td>
			<td class="col-rc col-red"><input type="number" class="rc-input" min="0" value="${this.toNumberValue(data.rc)}" /></td>
			<td class="col-rp col-red"><input type="number" class="rp-input" min="0" value="${this.toNumberValue(data.rp)}" /></td>
			<td class="col-sold readonly"><input type="text" class="sold-input" value="0" readonly /></td>
			<td class="col-price"><input type="number" class="price-input" min="0" step="0.01" value="${this.toNumberValue(data.price)}" /></td>
			<td class="col-total readonly"><input type="text" class="total-input" value="0" readonly /></td>
		`;

		tbody.appendChild(row);
		this.refreshProductSelects();

		const productSelect = row.querySelector('.product-select');
		productSelect.title = productSelect.value || '';
		if (data.product) {
			productSelect.value = data.product;
			productSelect.title = data.product;
		}
		productSelect.classList.toggle('selected', !!productSelect.value);

		const handleProductChange = () => {
			productSelect.title = productSelect.value || '';
			productSelect.classList.toggle('selected', !!productSelect.value);
			const product = this.getProductByName(productSelect.value);
			if (product) {
				const priceInput = row.querySelector('.price-input');
				if (priceInput) {
					priceInput.value = this.toNumberValue(product.price);
				}
			}
			this.recalculate();
		};

		productSelect.addEventListener('change', handleProductChange);
		productSelect.addEventListener('input', handleProductChange);

		row.querySelectorAll('input').forEach(input => {
			input.addEventListener('input', () => this.recalculate());
		});

		this.attachSwipeToRow(row, () => {
			row.remove();
			this.recalculate();
		});

		this.recalculate();
	},

	renderCashTable() {
		const tbody = document.getElementById('cashTableBody');
		if (!tbody) return;
		tbody.innerHTML = '';

		this.cashNotes.forEach(note => {
			const row = document.createElement('tr');
			row.dataset.note = note;
			row.innerHTML = `
				<td>${note}</td>
				<td><input type="number" class="cash-qty" min="0" value="0" /></td>
				<td class="cash-total">0</td>
			`;
			row.querySelector('.cash-qty').addEventListener('input', () => this.recalculate());
			tbody.appendChild(row);
		});
	},

	openExpenseModal() {
		const modal = document.getElementById('expenseModal');
		const typeInput = document.getElementById('expenseType');
		const nameInput = document.getElementById('expenseName');
		const amountInput = document.getElementById('expenseAmount');
		if (typeInput) typeInput.value = 'Expense';
		if (nameInput) nameInput.value = '';
		if (amountInput) amountInput.value = '0';
		if (modal) modal.classList.add('show');
	},

	closeExpenseModal() {
		const modal = document.getElementById('expenseModal');
		if (modal) modal.classList.remove('show');
	},

	openCreditModal() {
		const modal = document.getElementById('creditModal');
		const nameInput = document.getElementById('creditNameInput');
		const amountInput = document.getElementById('creditAmountInput');
		const areaSelect = document.getElementById('creditAreaSelect');
		if (nameInput) nameInput.value = '';
		if (amountInput) amountInput.value = '0';
		if (areaSelect) areaSelect.value = '';
		this.populateCreditAreas();
		this.clearCreditCustomerDropdown();
		if (modal) modal.classList.add('show');
	},

	closeCreditModal() {
		const modal = document.getElementById('creditModal');
		if (modal) modal.classList.remove('show');
		this.clearCreditCustomerDropdown();
	},

	populateCreditAreas() {
		const areaSelect = document.getElementById('creditAreaSelect');
		if (!areaSelect) return;
		const currentValue = areaSelect.value;
		areaSelect.innerHTML = '<option value="">Select area</option>';
		this.areas.forEach(area => {
			const option = document.createElement('option');
			option.value = area.name;
			option.textContent = area.name;
			areaSelect.appendChild(option);
		});
		areaSelect.value = currentValue;
	},

	populateCustomerAreaList() {
		const dataList = document.getElementById('customerAreaList');
		if (!dataList) return;
		dataList.innerHTML = '';
		const uniqueAreas = new Set();
		this.areas.forEach(area => {
			const name = (area?.name || '').trim();
			if (!name || uniqueAreas.has(name)) return;
			uniqueAreas.add(name);
			const option = document.createElement('option');
			option.value = name;
			dataList.appendChild(option);
		});
	},

	handleCreditAreaChange() {
		const nameInput = document.getElementById('creditNameInput');
		if (nameInput) nameInput.value = '';
		this.updateCreditCustomerDropdown();
	},

	updateCreditCustomerDropdown() {
		const areaSelect = document.getElementById('creditAreaSelect');
		const nameInput = document.getElementById('creditNameInput');
		const dropdown = document.getElementById('creditCustomerDropdown');
		if (!areaSelect || !nameInput || !dropdown) return;

		const area = areaSelect.value;
		const query = nameInput.value.trim().toLowerCase();

		dropdown.innerHTML = '';
		if (!area) {
			const hint = document.createElement('div');
			hint.className = 'credit-customer-hint';
			hint.textContent = 'Select area first';
			dropdown.appendChild(hint);
			dropdown.classList.add('show');
			return;
		}

		const matches = this.customers.filter(customer => {
			const sameArea = customer.area === area;
			const name = (customer.name || '').toLowerCase();
			return sameArea && (query === '' || name.includes(query));
		});

		if (matches.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'credit-customer-hint';
			empty.textContent = 'No customers found';
			dropdown.appendChild(empty);
			dropdown.classList.add('show');
			return;
		}

		matches.forEach(customer => {
			const item = document.createElement('button');
			item.type = 'button';
			item.className = 'credit-customer-item';
			item.textContent = customer.name;
			item.addEventListener('click', () => {
				nameInput.value = customer.name;
				this.clearCreditCustomerDropdown();
			});
			dropdown.appendChild(item);
		});

		dropdown.classList.add('show');
	},

	clearCreditCustomerDropdown() {
		const dropdown = document.getElementById('creditCustomerDropdown');
		if (!dropdown) return;
		dropdown.innerHTML = '';
		dropdown.classList.remove('show');
	},

	saveExpense() {
		const typeInput = document.getElementById('expenseType');
		const nameInput = document.getElementById('expenseName');
		const amountInput = document.getElementById('expenseAmount');
		const type = typeInput ? typeInput.value : 'Expense';
		const name = nameInput ? nameInput.value.trim() : '';
		const amount = amountInput ? parseFloat(amountInput.value) : 0;

		if (!name || !Number.isFinite(amount) || amount <= 0) {
			this.showMessage('Please enter valid expense details', 'warning');
			return;
		}

		this.addExpenseRow({ name, amount, type });
		this.closeExpenseModal();
		this.recalculate();
	},

	saveCredit() {
		const nameInput = document.getElementById('creditNameInput');
		const amountInput = document.getElementById('creditAmountInput');
		const name = nameInput ? nameInput.value.trim() : '';
		const amount = amountInput ? parseFloat(amountInput.value) : 0;

		if (!Number.isFinite(amount) || amount <= 0) {
			this.showMessage('Please enter a valid credit amount', 'warning');
			return;
		}

		this.addCreditRow({ name, amount });
		this.closeCreditModal();
		this.recalculate();
	},

	addExpenseRow(data = {}) {
		const tbody = document.getElementById('expenseTableBody');
		if (!tbody) return;

		const type = data.type || 'Expense';
		const name = data.name || '';
		const displayName = type === 'Expense' ? name : `${type}: ${name}`;

		const row = document.createElement('tr');
		row.className = 'swipeable-row';
		row.dataset.type = type;
		row.dataset.name = name;
		row.innerHTML = `
			<td>${displayName}</td>
			<td><input type="number" class="expense-amount" min="0" step="0.01" value="${this.toNumberValue(data.amount)}" /></td>
		`;

		row.querySelector('.expense-amount').addEventListener('input', () => this.recalculate());

		this.attachSwipeToRow(row, () => {
			row.remove();
			this.recalculate();
		});

		tbody.appendChild(row);
		this.recalculate();
	},

	addCreditRow(data = {}) {
		const tbody = document.getElementById('creditTableBody');
		if (!tbody) return;

		const row = document.createElement('tr');
		row.className = 'swipeable-row';
		row.innerHTML = `
			<td>${data.name || ''}</td>
			<td><input type="number" class="credit-amount" min="0" step="0.01" value="${this.toNumberValue(data.amount)}" /></td>
		`;

		row.querySelector('.credit-amount').addEventListener('input', () => this.recalculate());

		this.attachSwipeToRow(row, () => {
			row.remove();
			this.recalculate();
		});

		tbody.appendChild(row);
		this.recalculate();
	},

	recalculate() {
		let salesTotal = 0;

		document.querySelectorAll('#invTableBody tr').forEach(row => {
			const productName = row.querySelector('.product-select')?.value || '';
			const product = this.getProductByName(productName);
			const pcs = product ? this.toNumberValue(product.pcs) : 0;

			const dc = this.toNumberValue(row.querySelector('.dc-input')?.value);
			const dp = this.toNumberValue(row.querySelector('.dp-input')?.value);
			const rc = this.toNumberValue(row.querySelector('.rc-input')?.value);
			const rp = this.toNumberValue(row.querySelector('.rp-input')?.value);

			const delivery = (dc * pcs) + dp;
			const returns = (rc * pcs) + rp;
			const sold = Math.max(0, delivery - returns);

			const priceInput = row.querySelector('.price-input');
			const priceValueRaw = priceInput ? priceInput.value : '';
			const price = this.parsePrice(priceValueRaw, product);

			const rowTotalRaw = sold * price;
			salesTotal += rowTotalRaw;

			const soldInput = row.querySelector('.sold-input');
			const totalInput = row.querySelector('.total-input');
			if (soldInput) soldInput.value = Math.round(sold).toString();
			if (totalInput) totalInput.value = Math.round(rowTotalRaw).toString();
		});

		let cashTotal = 0;
		document.querySelectorAll('#cashTableBody tr').forEach(row => {
			const note = parseFloat(row.dataset.note || '0');
			const qty = this.toNumberValue(row.querySelector('.cash-qty')?.value);
			const rowTotalRaw = note * qty;
			cashTotal += rowTotalRaw;
			const totalCell = row.querySelector('.cash-total');
			if (totalCell) totalCell.textContent = Math.round(rowTotalRaw).toString();
		});

		let expenseTotal = 0;
		document.querySelectorAll('#expenseTableBody .expense-amount').forEach(input => {
			expenseTotal += this.toNumberValue(input.value);
		});

		let creditTotal = 0;
		document.querySelectorAll('#creditTableBody .credit-amount').forEach(input => {
			creditTotal += this.toNumberValue(input.value);
		});

		const salesRounded = Math.round(salesTotal);
		const cashRounded = Math.round(cashTotal);
		const expenseRounded = Math.round(expenseTotal);
		const netRounded = Math.round(salesTotal - cashTotal - expenseTotal - creditTotal);

		this.updateText('salesTotal', salesRounded);
		this.updateText('cashTotal', cashRounded);
		this.updateText('expenseTotal', expenseRounded);
		this.updateText('creditTotal', Math.round(creditTotal));
		this.updateText('summarySales', salesRounded);
		this.updateText('summaryCash', cashRounded);
		this.updateText('summaryExpense', expenseRounded);
		this.updateText('summaryCredit', Math.round(creditTotal));
		this.updateText('summaryNet', netRounded);
	},

	updateText(id, value) {
		const el = document.getElementById(id);
		if (el) el.textContent = value.toString();
	},

	async loadEmployees() {
		try {
			this.employees = await DB.getAll('employees');
			this.populateEmployeeSelect();
		} catch (error) {
			console.error('Failed to load employees:', error);
		}
	},

	populateEmployeeSelect() {
		const list = document.getElementById('deliveryEmployeeList');
		if (!list) return;
		list.querySelectorAll('select').forEach(select => {
			const currentValue = select.value;
			select.innerHTML = '<option value="">Select employee</option>';
			(this.employees || []).forEach(emp => {
				const option = document.createElement('option');
				option.value = emp.id;
				option.textContent = emp.name;
				select.appendChild(option);
			});
			select.value = currentValue;
		});
	},

	addEmployeeSelectRow(selectedId = '') {
		const list = document.getElementById('deliveryEmployeeList');
		if (!list) return;
		const wrapper = document.createElement('div');
		wrapper.className = 'delivery-employee-row';
		wrapper.innerHTML = `
			<select class="form-input delivery-employee-select">
				<option value="">Select employee</option>
			</select>
		`;
		const select = wrapper.querySelector('select');
		if (select) {
			(this.employees || []).forEach(emp => {
				const option = document.createElement('option');
				option.value = emp.id;
				option.textContent = emp.name;
				select.appendChild(option);
			});
			select.value = selectedId;
		}
		this.addSwipeToRemoveEmployeeRow(wrapper);
		list.appendChild(wrapper);
	},

	addSwipeToRemoveEmployeeRow(row) {
		let startX = 0;
		let currentX = 0;
		let isSwiping = false;
		let hasMoved = false;

		row.addEventListener('touchstart', (e) => {
			const point = e.touches[0];
			startX = point.clientX;
			currentX = startX;
			isSwiping = true;
			hasMoved = false;
		}, { passive: true });

		row.addEventListener('touchmove', (e) => {
			if (!isSwiping) return;
			const point = e.touches[0];
			currentX = point.clientX;
			const diff = startX - currentX;

			if (Math.abs(diff) > 10) {
				hasMoved = true;
				e.preventDefault();
			}

			if (diff > 0 && diff < 150) {
				row.style.transform = `translateX(-${diff}px)`;
				row.style.background = `linear-gradient(90deg, transparent ${100 - diff / 2}%, rgba(220,53,69,0.12) 100%)`;
			}
		}, { passive: false });

		row.addEventListener('touchend', () => {
			if (!isSwiping) return;
			const diff = startX - currentX;
			if (hasMoved && diff > 100) {
				row.style.transform = 'translateX(-40px)';
				this.showDeleteConfirm(() => {
					row.style.transform = 'translateX(-120px)';
					setTimeout(() => row.remove(), 300);
				});
				this.pendingReset = () => {
					row.style.transform = '';
					row.style.background = '';
				};
			} else {
				row.style.transform = '';
				row.style.background = '';
			}
			isSwiping = false;
			hasMoved = false;
		});
	},

	getSelectedEmployees() {
		const selects = Array.from(document.querySelectorAll('.delivery-employee-select'));
		const selected = selects
			.map(select => ({
				id: select.value,
				name: select.selectedOptions?.[0]?.textContent || ''
			}))
			.filter(emp => emp.id);
		const uniqueMap = new Map();
		selected.forEach(emp => uniqueMap.set(String(emp.id), emp));
		return Array.from(uniqueMap.values());
	},

	async upsertAttendance(employeeId, employeeName, dateIso, linkedDeliveryId = null) {
		if (!employeeId || !dateIso) return;
		const dateKey = this.toLocalDateKey(new Date(dateIso));
		try {
			const records = await DB.query('attendance', 'date', dateKey);
			const exists = (records || []).some(rec => String(rec.employeeId) === String(employeeId));
			if (exists) return;
			await DB.add('attendance', {
				employeeId,
				employeeName,
				date: dateKey,
				status: 'present',
				present: true,
				linkedDeliveryId
			});
		} catch (error) {
			console.error('Attendance upsert failed:', error);
		}
	},

	toLocalDateKey(dateObj) {
		const yyyy = dateObj.getFullYear();
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const dd = String(dateObj.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	},

	async handleSave() {
		const productRows = Array.from(document.querySelectorAll('#invTableBody tr'));
		if (productRows.length === 0) {
			this.showMessage('Please add products to calculate', 'warning');
			return;
		}

		const selectedEmployees = this.getSelectedEmployees();
		if (!selectedEmployees.length) {
			this.showMessage('Please select delivery employee', 'warning');
			return;
		}

		const hasProduct = productRows.some(row => (row.querySelector('.product-select')?.value || '') !== '');
		if (!hasProduct) {
			this.showMessage('Please select products', 'warning');
			return;
		}

		const defaultName = this.editingRecord?.name?.split(',')[0]?.trim() || '';
		const customerName = await this.promptCustomerName(defaultName);
		if (!customerName) return;

		const now = new Date();
		const sales = document.getElementById('summarySales')?.textContent || '0';
		const cash = document.getElementById('summaryCash')?.textContent || '0';
		const totalExpense = document.getElementById('summaryExpense')?.textContent || '0';
		const totalCredit = document.getElementById('summaryCredit')?.textContent || '0';
		const net = document.getElementById('summaryNet')?.textContent || '0';

		const calculation = productRows.map(row => {
			const product = row.querySelector('.product-select')?.value || '';
			const dc = this.toNumberValue(row.querySelector('.dc-input')?.value);
			const dp = this.toNumberValue(row.querySelector('.dp-input')?.value);
			const rc = this.toNumberValue(row.querySelector('.rc-input')?.value);
			const rp = this.toNumberValue(row.querySelector('.rp-input')?.value);
			const sold = this.toNumberValue(row.querySelector('.sold-input')?.value);
			const price = this.toNumberValue(row.querySelector('.price-input')?.value);
			const total = this.toNumberValue(row.querySelector('.total-input')?.value);
			return { product, dc, dp, rc, rp, sold, price, total };
		});

		const expenses = Array.from(document.querySelectorAll('#expenseTableBody tr')).map(row => {
			const name = row.dataset.name || row.children[0]?.textContent || '';
			const type = row.dataset.type || 'Expense';
			const amount = this.toNumberValue(row.querySelector('.expense-amount')?.value);
			return { name, amount, type };
		});

		const credit = Array.from(document.querySelectorAll('#creditTableBody tr')).map(row => {
			const name = row.children[0]?.textContent || '';
			const amount = this.toNumberValue(row.querySelector('.credit-amount')?.value);
			return { name, amount };
		});

		const cashDetail = Array.from(document.querySelectorAll('#cashTableBody tr')).map(row => {
			const note = parseFloat(row.dataset.note || '0');
			const qty = this.toNumberValue(row.querySelector('.cash-qty')?.value);
			const total = this.toNumberValue(row.querySelector('.cash-total')?.textContent);
			return { note, qty, total };
		});

		const payload = {
			employeeIds: selectedEmployees.map(emp => emp.id),
			employeeNames: selectedEmployees.map(emp => emp.name),
			employeeId: selectedEmployees[0]?.id || '',
			employeeName: selectedEmployees[0]?.name || '',
			name: `${customerName}, ${this.formatDate(now)}`,
			date: now.toISOString(),
			sales: sales.toString(),
			cash: cash.toString(),
			totalExpense: totalExpense.toString(),
			totalCredit: totalCredit.toString(),
			net: net.toString(),
			calculation,
			expenses,
			credit,
			cashDetail
		};

		try {
			if (this.editingRecord?.id) {
				await DB.update('history', { ...payload, id: this.editingRecord.id });
				for (const emp of selectedEmployees) {
					await this.upsertAttendance(emp.id, emp.name, payload.date, this.editingRecord.id);
				}
				this.showMessage('Calculation Updated Successfully!', 'success');
			} else {
				const historyId = await DB.add('history', payload);
				for (const emp of selectedEmployees) {
					await this.upsertAttendance(emp.id, emp.name, payload.date, historyId);
				}
				await this.addCreditsFromDelivery({
					historyId,
					date: payload.date,
					customerFallback: customerName,
					creditRows: credit
				});
				this.showMessage('Calculation Saved Successfully!', 'success');
			}

			this.editingRecord = null;
			this.resetForm();
		} catch (error) {
			console.error('Save failed:', error);
			this.showMessage('Failed to save calculation', 'error');
		}
	},

	async addCreditsFromDelivery({ historyId, date, customerFallback, creditRows }) {
		if (!Array.isArray(creditRows) || creditRows.length === 0) return;
		const creditDate = date || new Date().toISOString();
		const entries = creditRows
			.filter(row => (parseFloat(row.amount) || 0) > 0)
			.map(row => ({
				customer_name: row.name || customerFallback || 'Unknown',
				customer_phone: '',
				initial_amount: parseFloat(row.amount) || 0,
				balance: parseFloat(row.amount) || 0,
				credit_date: creditDate,
				notes: `From Delivery #${historyId}`,
				payment_history: []
			}));

		if (!entries.length) return;

		for (const entry of entries) {
			try {
				await DB.add('credits', entry);
			} catch (error) {
				console.error('Failed to create credit entry:', error);
			}
		}
	},

	resetForm() {
		const invBody = document.getElementById('invTableBody');
		const expenseBody = document.getElementById('expenseTableBody');
		const creditBody = document.getElementById('creditTableBody');
		if (invBody) invBody.innerHTML = '';
		if (expenseBody) expenseBody.innerHTML = '';
		if (creditBody) creditBody.innerHTML = '';

		document.querySelectorAll('#cashTableBody .cash-qty').forEach(input => {
			input.value = '0';
		});

		this.addProductRow();
		this.recalculate();
	},

	formatDate(dateObj) {
		const dd = String(dateObj.getDate()).padStart(2, '0');
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const yyyy = dateObj.getFullYear();
		return `${dd}/${mm}/${yyyy}`;
	},

	loadForEdit(record) {
		if (!record) return;
		this.editingRecord = record;

		const invBody = document.getElementById('invTableBody');
		const expenseBody = document.getElementById('expenseTableBody');
		const creditBody = document.getElementById('creditTableBody');
		if (invBody) invBody.innerHTML = '';
		if (expenseBody) expenseBody.innerHTML = '';
		if (creditBody) creditBody.innerHTML = '';

		(record.calculation || []).forEach(row => this.addProductRow(row));
		(record.expenses || []).forEach(exp => this.addExpenseRow(exp));
		(record.credit || []).forEach(cr => this.addCreditRow(cr));

		const list = document.getElementById('deliveryEmployeeList');
		if (list) list.innerHTML = '';
		const employeeIds = Array.isArray(record.employeeIds) ? record.employeeIds : (record.employeeId ? [record.employeeId] : []);
		employeeIds.forEach(empId => this.addEmployeeSelectRow(empId));

		const cashDetail = record.cashDetail || [];
		cashDetail.forEach(detail => {
			const row = document.querySelector(`#cashTableBody tr[data-note="${detail.note}"]`);
			if (row) {
				const input = row.querySelector('.cash-qty');
				if (input) input.value = this.toNumberValue(detail.qty);
			}
		});

		this.recalculate();
	},

	openCustomerModal(defaultName = '') {
		const modal = document.getElementById('customerModal');
		const input = document.getElementById('customerNameInput');
		this.populateCustomerAreaList();
		if (input) input.value = defaultName;
		if (modal) modal.classList.add('show');
		if (input) input.focus();
	},

	closeCustomerModal() {
		const modal = document.getElementById('customerModal');
		if (modal) modal.classList.remove('show');
		if (this.customerResolve) {
			this.customerResolve(null);
			this.customerResolve = null;
		}
	},

	submitCustomerModal() {
		const input = document.getElementById('customerNameInput');
		const value = input ? input.value.trim() : '';
		if (!value) {
			this.showMessage('Please enter customer name', 'warning');
			return;
		}
		if (this.customerResolve) {
			this.customerResolve(value);
			this.customerResolve = null;
		}
		const modal = document.getElementById('customerModal');
		if (modal) modal.classList.remove('show');
	},

	promptCustomerName(defaultName = '') {
		return new Promise(resolve => {
			this.customerResolve = resolve;
			this.openCustomerModal(defaultName);
		});
	},

	attachSwipeToRow(row, onDelete) {
		let startX = 0;
		let startY = 0;
		let currentX = 0;
		let swiping = false;

		row.addEventListener('touchstart', (e) => {
			const touch = e.touches[0];
			startX = touch.clientX;
			startY = touch.clientY;
			currentX = 0;
			swiping = true;
		}, { passive: true });

		row.addEventListener('touchmove', (e) => {
			if (!swiping) return;
			const touch = e.touches[0];
			const deltaX = touch.clientX - startX;
			const deltaY = touch.clientY - startY;

			if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
				currentX = deltaX;
				row.style.transform = `translateX(${deltaX}px)`;
			}
		}, { passive: true });

		row.addEventListener('touchend', () => {
			if (!swiping) return;
			swiping = false;
			const threshold = -80;
			if (currentX < threshold) {
				row.style.transform = 'translateX(-40px)';
				this.showDeleteConfirm(() => {
					row.style.transform = 'translateX(-120px)';
					setTimeout(() => onDelete(), 300);
				});
				this.pendingReset = () => {
					row.style.transform = 'translateX(0px)';
				};
			} else {
				row.style.transform = 'translateX(0px)';
			}
		});
	},

	showDeleteConfirm(callback) {
		this.pendingDeleteCallback = callback;
		const modal = document.getElementById('deleteConfirmPopup');
		if (modal) {
			modal.classList.add('show');
		}
	},

	closeDeleteConfirm() {
		const modal = document.getElementById('deleteConfirmPopup');
		if (modal) {
			modal.classList.remove('show');
		}
		if (this.pendingReset) {
			this.pendingReset();
		}
		this.pendingDeleteCallback = null;
		this.pendingReset = null;
	},

	confirmDeleteAction() {
		if (this.pendingDeleteCallback) {
			this.pendingDeleteCallback();
		}
		this.closeDeleteConfirm();
	},

	getProductByName(name) {
		return this.products.find(product => product.name === name);
	},

	toNumberValue(value) {
		if (value === '' || value === null || value === undefined) return 0;
		const num = parseFloat(value);
		return Number.isFinite(num) ? num : 0;
	},

	parsePrice(value, product) {
		if (value === '' || value === null || value === undefined) return 0;
		const num = parseFloat(value);
		if (Number.isFinite(num)) return num;
		return product ? this.toNumberValue(product.price) : 0;
	},

	showMessage(message, type = 'info') {
		if (window.App && typeof App.showToast === 'function') {
			App.showToast(message, type);
		} else {
			alert(message);
		}
	},

	refresh() {
		this.loadProducts();
	},

	destroy() {
		this.products = [];
		this.editingRecord = null;
	}
};

// Register module
if (window.App) {
	App.registerModule('delivery', DeliveryModule);
}

window.DeliveryModule = DeliveryModule;
