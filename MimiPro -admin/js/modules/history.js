/**
 * History Module - Daily Report
 */

const HistoryModule = {
	history: [],
	deleteTargetId: null,

	async init() {
		this.render();
		this.bindEvents();
		this.initializeHistoryFilters();
		await this.renderHistory();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="history">
				<div class="card">
					<div class="card-header">
						<h3>History - Daily Report</h3>
					</div>
					<div class="filters">
						<div class="filter-group">
							<label for="filterYear">Year:</label>
							<select id="filterYear">
								<option value="">All</option>
							</select>
						</div>
						<div class="filter-group">
							<label for="filterMonth">Month:</label>
							<select id="filterMonth">
								<option value="">All</option>
								<option value="01">January</option>
								<option value="02">February</option>
								<option value="03">March</option>
								<option value="04">April</option>
								<option value="05">May</option>
								<option value="06">June</option>
								<option value="07">July</option>
								<option value="08">August</option>
								<option value="09">September</option>
								<option value="10">October</option>
								<option value="11">November</option>
								<option value="12">December</option>
							</select>
						</div>
						<div class="filter-group">
							<label for="filterDate">Date:</label>
							<input type="date" id="filterDate" />
						</div>
					</div>
					<button class="btn btn-secondary btn-small" id="resetFiltersBtn">Reset Filters</button>
				</div>

				<div class="card">
					<div style="overflow-x:auto;">
						<table class="table" id="historyTable">
							<thead>
								<tr>
									<th>Date</th>
									<th>Customer</th>
									<th>Sales</th>
									<th>View</th>
									<th>Edit</th>
								</tr>
							</thead>
							<tbody></tbody>
						</table>
					</div>
				</div>

				<div class="modal" id="viewModal">
					<div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
						<div id="viewContent"></div>
						<div class="modal-actions">
							<button class="btn btn-primary" id="printBtn">🖨️ Print</button>
							<button class="btn btn-secondary" id="closeViewBtn">Close</button>
						</div>
					</div>
				</div>

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
	},

	bindEvents() {
		const filterYear = document.getElementById('filterYear');
		const filterMonth = document.getElementById('filterMonth');
		const filterDate = document.getElementById('filterDate');
		const resetFiltersBtn = document.getElementById('resetFiltersBtn');
		const printBtn = document.getElementById('printBtn');
		const closeViewBtn = document.getElementById('closeViewBtn');
		const deleteCancel = document.getElementById('deleteConfirmCancel');
		const deleteOk = document.getElementById('deleteConfirmOk');

		if (filterYear) filterYear.addEventListener('change', () => this.renderHistory());
		if (filterMonth) filterMonth.addEventListener('change', () => this.renderHistory());
		if (filterDate) filterDate.addEventListener('change', () => this.renderHistory());
		if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', () => this.clearFilters());
		if (printBtn) printBtn.addEventListener('click', () => this.printDocument());
		if (closeViewBtn) closeViewBtn.addEventListener('click', () => this.closeViewModal());
		if (deleteCancel) deleteCancel.addEventListener('click', () => this.closeDeleteConfirm());
		if (deleteOk) deleteOk.addEventListener('click', () => this.confirmDelete());
	},

	initializeHistoryFilters() {
		const filterDate = document.getElementById('filterDate');
		if (filterDate) {
			const today = new Date();
			const yyyy = today.getFullYear();
			const mm = String(today.getMonth() + 1).padStart(2, '0');
			const dd = String(today.getDate()).padStart(2, '0');
			filterDate.value = `${yyyy}-${mm}-${dd}`;
		}
	},

	async renderHistory() {
		const tableBody = document.querySelector('#historyTable tbody');
		if (!tableBody) return;

		this.history = await DB.getAll('history');

		const filterYear = document.getElementById('filterYear')?.value || '';
		const filterMonth = document.getElementById('filterMonth')?.value || '';
		const filterDate = document.getElementById('filterDate')?.value || '';

		const dailyData = {};

		this.history.forEach((record, index) => {
			const dateObj = new Date(record.date);
			const dateKey = this.toLocalDateKey(dateObj);
			const year = dateKey.slice(0, 4);
			const month = dateKey.slice(5, 7);

			if (filterYear && year !== filterYear) return;
			if (filterMonth && month !== filterMonth) return;
			if (filterDate && dateKey !== filterDate) return;

			if (!dailyData[dateKey]) {
				dailyData[dateKey] = {
					date: dateObj,
					dateFormatted: this.formatDate(dateObj),
					records: []
				};
			}

			dailyData[dateKey].records.push({ index, data: record });
		});

		const sortedKeys = Object.keys(dailyData).sort((a, b) => b.localeCompare(a));

		tableBody.innerHTML = '';

		if (sortedKeys.length === 0) {
			tableBody.innerHTML = `
				<tr>
					<td colspan="5" style="text-align:center; color:#6c757d;">No records found</td>
				</tr>
			`;
			this.updateFilterYears();
			return;
		}

		sortedKeys.forEach(key => {
			const group = dailyData[key];
			group.records.forEach((recordItem, idx) => {
				const row = document.createElement('tr');
				const customerName = (recordItem.data.name || '').split(', ')[0] || '';
				const salesValue = Math.round(parseFloat(recordItem.data.sales || '0'));

				row.innerHTML = `
					<td>${idx === 0 ? group.dateFormatted : ''}</td>
					<td>${customerName}</td>
					<td>৳${salesValue}</td>
					<td><button class="btn btn-primary btn-small" data-view="${recordItem.index}">View</button></td>
					<td><button class="btn btn-secondary btn-small" data-edit="${recordItem.index}">Edit</button></td>
				`;

				this.attachSwipeDelete(row, recordItem.data.id);
				tableBody.appendChild(row);
			});
		});

		tableBody.querySelectorAll('[data-view]').forEach(btn => {
			btn.addEventListener('click', () => this.viewCalculation(parseInt(btn.dataset.view, 10)));
		});

		tableBody.querySelectorAll('[data-edit]').forEach(btn => {
			btn.addEventListener('click', () => this.loadCalculationForEdit(parseInt(btn.dataset.edit, 10)));
		});

		this.updateFilterYears();
	},

	updateFilterYears() {
		const filterYear = document.getElementById('filterYear');
		if (!filterYear) return;

		const currentValue = filterYear.value;
		const years = new Set();

		this.history.forEach(record => {
			const dateObj = new Date(record.date);
			years.add(dateObj.getFullYear().toString());
		});

		const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
		filterYear.innerHTML = '<option value="">All</option>';
		sortedYears.forEach(year => {
			const option = document.createElement('option');
			option.value = year;
			option.textContent = year;
			filterYear.appendChild(option);
		});

		if (currentValue && sortedYears.includes(currentValue)) {
			filterYear.value = currentValue;
		}
	},

	clearFilters() {
		const filterYear = document.getElementById('filterYear');
		const filterMonth = document.getElementById('filterMonth');
		const filterDate = document.getElementById('filterDate');
		if (filterYear) filterYear.value = '';
		if (filterMonth) filterMonth.value = '';
		if (filterDate) filterDate.value = '';
		this.renderHistory();
	},

	toLocalDateKey(dateObj) {
		const yyyy = dateObj.getFullYear();
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const dd = String(dateObj.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	},

	formatDate(dateObj) {
		const dd = String(dateObj.getDate()).padStart(2, '0');
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const yyyy = dateObj.getFullYear();
		return `${dd}/${mm}/${yyyy}`;
	},









	viewCalculation(index) {
		const record = this.history[index];
		if (!record) return;

		this.ensureViewModal();

		const customerName = (record.name || '').split(', ')[0] || '';
		const dateText = this.formatDate(new Date(record.date));

		const calculationRows = (record.calculation || []).map(item => `
			<tr>
				<td class="col-product">${item.product || ''}</td>
				<td class="col-num">${item.dc ?? ''}</td>
				<td class="col-num">${item.dp ?? ''}</td>
				<td class="col-num">${item.rc ?? ''}</td>
				<td class="col-num">${item.rp ?? ''}</td>
				<td class="col-num">${item.sold ?? ''}</td>
				<td class="col-num">৳${item.price ?? ''}</td>
				<td class="col-total">৳${item.total ?? ''}</td>
			</tr>
		`).join('');

		const cashRows = (record.cashDetail || []).filter(row => (row.qty || 0) > 0);
		const cashTable = cashRows.length
			? cashRows.map(row => `
				<tr>
					<td class="col-product">${row.note}</td>
					<td class="col-num">${row.qty}</td>
					<td class="col-num">৳${row.total}</td>
				</tr>
			`).join('')
			: `
				<tr>
					<td class="col-product" colspan="3" style="text-align:center; color:#6c757d;">No cash</td>
				</tr>
			`;

		const creditRows = (record.credit || []).map(credit => ({
			...credit,
			type: credit.type || 'বাকি ---'
		}));
		const expensesRows = [
			...(record.expenses || []),
			...creditRows
		];
		const expensesTable = expensesRows.length
			? `
				<table class="print-table">
					<thead>
						<tr>
							<th class="col-product">Expense Name</th>
							<th class="col-num">Amount (৳)</th>
						</tr>
					</thead>
					<tbody>
						${expensesRows.map(exp => {
							const displayName = exp.type && exp.type !== 'Expense' ? `${exp.type}: ${exp.name || ''}` : (exp.name || '');
							return `
								<tr>
									<td style="text-align:left">${displayName}</td>
									<td class="col-num">৳${exp.amount ?? ''}</td>
								</tr>
							`;
						}).join('')}
					</tbody>
				</table>
			`
			: `<p style="text-align:center; color:#6c757d;">No expenses</p>`;

		const salesTotal = Math.round(parseFloat(record.sales || '0'));
		const cashTotal = Math.round(parseFloat(record.cash || '0'));
		const expenseTotal = Math.round(parseFloat(record.totalExpense || '0'));
		const creditTotal = Math.round(parseFloat(record.totalCredit || '0'));
		const netTotal = Math.round(parseFloat(record.net || '0'));

		const viewContent = document.getElementById('viewContent');
		const viewModal = document.getElementById('viewModal');
		if (!viewContent || !viewModal) return;

		viewContent.innerHTML = `
			<div class="print-document">
				<div class="print-header">
					<h2>মেসাস বৃষ্টি সাজঘর </h2>
					<p> ${customerName}, ${dateText}</p>
				</div>

				<h3>Products & Sales</h3>
				<table class="print-table">
					<colgroup>
						<col style="width: 38%;" />
						<col style="width: 7%;" />
						<col style="width: 7%;" />
						<col style="width: 7%;" />
						<col style="width: 7%;" />
						<col style="width: 8%;" />
						<col style="width: 12%;" />
						<col style="width: 14%;" />
					</colgroup>
					<thead>
						<tr>
							<th class="col-product">Product Name</th>
							<th class="col-num">DC</th>
							<th class="col-num">DP</th>
							<th class="col-num">RC</th>
							<th class="col-num">RP</th>
							<th class="col-num">Sold</th>
							<th class="col-num">Price</th>
							<th class="col-num">Total</th>
						</tr>
					</thead>
					<tbody>
						${calculationRows}
					</tbody>
				</table>

					<div class="print-three-column">
					<div class="print-section-third">
						<h3>Cash Denominations</h3>
						<table class="print-table">
							<thead>
								<tr>
										<th class="col-product">Note (৳)</th>
									<th class="col-num">Qty</th>
										<th class="col-num">Total (৳)</th>
								</tr>
							</thead>
							<tbody>
								${cashTable}
							</tbody>
						</table>
					</div>
					<div class="print-section-third">
						<h3>Extra Expenses</h3>
						${expensesTable}
					</div>
					<div class="print-section-third">
						<h3>Summary</h3>
						<table class="print-summary-table">
							<tbody>
								<tr>
										<td>Sales Total:</td>
										<td class="col-num">৳${salesTotal}</td>
								</tr>
								<tr>
										<td>Cash Received:</td>
										<td class="col-num">৳${cashTotal}</td>
								</tr>
								<tr>
										<td>বাকি:</td>
										<td class="col-num">৳${creditTotal}</td>
								</tr>
								<tr>
										<td>Total Expenses:</td>
										<td class="col-num">৳${expenseTotal}</td>
								</tr>
								<tr>
										<td>NET TOTAL:</td>
										<td class="col-num">৳${netTotal}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		`;

		viewModal.classList.add('show');
	},

	ensureViewModal() {
		if (document.getElementById('viewModal')) return;

		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.id = 'viewModal';
		modal.innerHTML = `
			<div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
				<div id="viewContent"></div>
				<div class="modal-actions">
					<button class="btn btn-primary" id="printBtn">🖨️ Print</button>
					<button class="btn btn-secondary" id="closeViewBtn">Close</button>
				</div>
			</div>
		`;
		document.body.appendChild(modal);

		const printBtn = modal.querySelector('#printBtn');
		const closeViewBtn = modal.querySelector('#closeViewBtn');
		if (printBtn) printBtn.addEventListener('click', () => this.printDocument());
		if (closeViewBtn) closeViewBtn.addEventListener('click', () => this.closeViewModal());
	},

	closeViewModal() {
		const viewModal = document.getElementById('viewModal');
		if (viewModal) viewModal.classList.remove('show');
	},

	printDocument() {
		if (window.AndroidPrint && typeof window.AndroidPrint.print === 'function') {
			window.AndroidPrint.print();
		} else {
			alert('Printing is not supported on this device.');
		}
	},

	loadCalculationForEdit(index) {
		const record = this.history[index];
		if (!record) return;
		if (window.DeliveryModule) {
			window.DeliveryModule.editingRecord = record;
		}
		if (window.App) {
			window.App.navigateTo('deliveryPage');
		}
		setTimeout(() => {
			if (window.DeliveryModule && window.DeliveryModule.loadForEdit) {
				window.DeliveryModule.loadForEdit(record);
			}
		}, 150);
	},

	attachSwipeDelete(row, recordId) {
		let startX = 0;
		let currentX = 0;
		let swiped = false;

		const onTouchStart = (e) => {
			startX = e.touches[0].clientX;
			currentX = startX;
			row.style.transition = 'none';
		};

		const onTouchMove = (e) => {
			currentX = e.touches[0].clientX;
			const diff = currentX - startX;
			if (diff < 0) {
				row.style.transform = `translateX(${diff}px)`;
				row.style.background = 'rgba(220, 38, 38, 0.08)';
			}
		};

		const onTouchEnd = () => {
			const diff = currentX - startX;
			row.style.transition = 'transform 0.2s ease';
			if (diff < -100) {
				row.style.transform = 'translateX(-120px)';
				swiped = true;
				this.showDeleteConfirm(recordId, row);
			} else {
				row.style.transform = 'translateX(0)';
				row.style.background = '';
				swiped = false;
			}
		};

		row.addEventListener('touchstart', onTouchStart, { passive: true });
		row.addEventListener('touchmove', onTouchMove, { passive: true });
		row.addEventListener('touchend', onTouchEnd);

		row.addEventListener('click', (e) => {
			if (swiped) {
				e.preventDefault();
				e.stopPropagation();
			}
		});
	},

	showDeleteConfirm(recordId, row) {
		this.deleteTargetId = recordId;
		const modal = document.getElementById('deleteConfirmPopup');
		if (modal) modal.classList.add('show');
		if (row) row.style.transform = 'translateX(0)';
	},

	closeDeleteConfirm() {
		const modal = document.getElementById('deleteConfirmPopup');
		if (modal) modal.classList.remove('show');
		this.deleteTargetId = null;
	},

	async confirmDelete() {
		if (!this.deleteTargetId) return;
		try {
			await DB.delete('history', this.deleteTargetId);
			this.closeDeleteConfirm();
			await this.renderHistory();
		} catch (error) {
			console.error('Delete failed:', error);
			this.closeDeleteConfirm();
		}
	},

	refresh() {
		this.renderHistory();
	},

	destroy() {
		// Cleanup if needed
	}
};

if (window.App) {
	App.registerModule('history', HistoryModule);
}
