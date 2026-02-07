/**
 * Credits Module - Customer Credit Management
 */

const CreditsModule = {
	credits: [],
	customers: [],
	areas: [],
	customerMap: {},
	paymentTarget: null,
	pendingDeleteId: null,

	async init() {
		this.render();
		this.bindEvents();
		await this.loadAreas();
		await this.loadCustomers();
		this.initializeMonthFilter();
		await this.renderCredits();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="credits">
				<div class="card">
					<div class="card-header">
						<h3>Customer Credits</h3>
						<button class="btn btn-primary btn-small" id="addCreditBtn">+ Add Credit</button>
					</div>
						<div class="credit-filter-bar">
							<div class="filter-group">
								<label for="creditMonthFilter">Month</label>
								<input type="month" id="creditMonthFilter" />
							</div>
							<div class="filter-pill">Monthly View</div>
						</div>
					<div style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">
						Total Outstanding: <span id="totalCredits">৳0</span>
					</div>
						<div id="creditsList" class="credits-grid"></div>
				</div>

				<div class="modal" id="creditModal">
					<div class="modal-content">
						<div class="modal-header">
							<div class="modal-title">Add Credit</div>
							<button class="modal-close" id="cancelCreditBtn">×</button>
						</div>
						<div class="modal-body">
							<div class="form-group">
								<label class="form-label">Customer Name</label>
									<select id="creditCustomer" class="form-input">
										<option value="">Select customer</option>
									</select>
							</div>
							<div class="form-group">
								<label class="form-label">Phone</label>
									<input type="text" id="creditPhone" class="form-input" placeholder="Phone" readonly />
							</div>
								<div class="form-group">
									<label class="form-label">Area/Route</label>
									<select id="creditArea" class="form-input">
										<option value="">Select area</option>
									</select>
								</div>
							<div class="form-group">
								<label class="form-label">Amount</label>
								<input type="number" id="creditAmount" class="form-input" min="0" step="0.01" />
							</div>
							<div class="form-group">
								<label class="form-label">Date</label>
								<input type="date" id="creditDate" class="form-input" />
							</div>
							<div class="form-group">
								<label class="form-label">Notes</label>
								<textarea id="creditNotes" class="form-input" rows="3" placeholder="Notes"></textarea>
							</div>
						</div>
						<div class="modal-actions">
							<button class="btn btn-secondary" id="cancelCreditBtnFooter">Cancel</button>
							<button class="btn btn-primary" id="saveCreditBtn">Save</button>
						</div>
					</div>
				</div>

				<div class="modal" id="paymentModal">
					<div class="modal-content">
						<div class="modal-header">
							<div class="modal-title">Record Payment</div>
							<button class="modal-close" id="cancelPaymentBtn">×</button>
						</div>
						<div class="modal-body">
							<div class="payment-inline">
								<span class="payment-inline-label">Customer:</span>
								<span class="payment-inline-value" id="paymentCustomer"></span>
								<span class="payment-inline-label">Current Balance:</span>
								<span class="payment-inline-value" id="paymentBalance"></span>
							</div>
							<div class="form-group">
								<label class="form-label">Payment Amount</label>
								<input type="number" id="paymentAmount" class="form-input payment-amount" min="0" step="0.01" />
							</div>
							<div class="form-group">
								<label class="form-label">Payment Date</label>
								<input type="date" id="paymentDate" class="form-input" />
							</div>
						</div>
						<div class="modal-actions">
							<button class="btn btn-secondary" id="cancelPaymentBtnFooter">Cancel</button>
							<button class="btn btn-primary" id="savePaymentBtn">Save</button>
						</div>
					</div>
				</div>

				<div class="modal" id="creditDetailsModal">
					<div class="modal-content">
						<div class="modal-header">
							<div class="modal-title">Credit Details</div>
							<button class="modal-close" id="closeDetailsBtn">×</button>
						</div>
						<div class="modal-body" id="creditDetailsContent"></div>
						<div class="modal-actions">
							<button class="btn btn-secondary" id="closeDetailsBtnFooter">Close</button>
						</div>
					</div>
				</div>

				<div class="delete-confirm-overlay" id="creditDeleteConfirmModal">
					<div class="delete-confirm-box" role="dialog" aria-modal="true">
						<div class="delete-confirm-icon">⚠️</div>
						<div class="delete-confirm-title">Delete this credit?</div>
						<div class="delete-confirm-text">This action cannot be undone. Are you sure you want to delete this credit?</div>
						<div class="delete-confirm-actions">
							<button class="delete-confirm-btn cancel" id="creditDeleteCancel">Cancel</button>
							<button class="delete-confirm-btn delete" id="creditDeleteOk">Delete</button>
						</div>
					</div>
				</div>
			</section>
		`;
	},

	bindEvents() {
		const addCreditBtn = document.getElementById('addCreditBtn');
		const saveCreditBtn = document.getElementById('saveCreditBtn');
		const cancelCreditBtn = document.getElementById('cancelCreditBtn');
		const cancelCreditBtnFooter = document.getElementById('cancelCreditBtnFooter');
		const creditCustomerSelect = document.getElementById('creditCustomer');
		const creditAreaSelect = document.getElementById('creditArea');
		const creditMonthFilter = document.getElementById('creditMonthFilter');

		const savePaymentBtn = document.getElementById('savePaymentBtn');
		const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
		const cancelPaymentBtnFooter = document.getElementById('cancelPaymentBtnFooter');
		const closeDetailsBtn = document.getElementById('closeDetailsBtn');
		const closeDetailsBtnFooter = document.getElementById('closeDetailsBtnFooter');
		const creditDeleteCancel = document.getElementById('creditDeleteCancel');
		const creditDeleteOk = document.getElementById('creditDeleteOk');

		if (addCreditBtn) addCreditBtn.addEventListener('click', () => this.openCreditModal());
		if (saveCreditBtn) saveCreditBtn.addEventListener('click', () => this.saveCredit());
		if (cancelCreditBtn) cancelCreditBtn.addEventListener('click', () => this.closeCreditModal());
		if (cancelCreditBtnFooter) cancelCreditBtnFooter.addEventListener('click', () => this.closeCreditModal());
		if (creditCustomerSelect) creditCustomerSelect.addEventListener('change', () => this.handleCustomerSelect());
		if (creditAreaSelect) creditAreaSelect.addEventListener('change', () => this.handleAreaSelect());
		if (creditMonthFilter) creditMonthFilter.addEventListener('change', () => this.renderCredits());

		if (savePaymentBtn) savePaymentBtn.addEventListener('click', () => this.savePayment());
		if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', () => this.closePaymentModal());
		if (cancelPaymentBtnFooter) cancelPaymentBtnFooter.addEventListener('click', () => this.closePaymentModal());
		if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', () => this.closeDetailsModal());
		if (closeDetailsBtnFooter) closeDetailsBtnFooter.addEventListener('click', () => this.closeDetailsModal());
		if (creditDeleteCancel) creditDeleteCancel.addEventListener('click', () => this.closeDeleteConfirm());
		if (creditDeleteOk) creditDeleteOk.addEventListener('click', () => this.confirmDelete());
	},

	async loadCustomers() {
		try {
			this.customers = await DB.getAll('customers');
			this.customerMap = this.buildCustomerMap(this.customers);
			this.populateCustomerSelect();
		} catch (error) {
			console.error('Failed to load customers:', error);
		}
	},

	async loadAreas() {
		try {
			this.areas = await DB.getAll('areas');
			this.populateAreaSelect();
		} catch (error) {
			console.error('Failed to load areas:', error);
		}
	},

	populateCustomerSelect(areaFilter = '') {
		const select = document.getElementById('creditCustomer');
		if (!select) return;
		const currentValue = select.value;
		select.innerHTML = '<option value="">Select customer</option>';
		this.customers
			.filter(customer => !areaFilter || customer.area === areaFilter)
			.forEach(customer => {
			const option = document.createElement('option');
			option.value = customer.name;
			option.textContent = customer.name;
			select.appendChild(option);
		});
		select.value = currentValue;
	},

	populateAreaSelect() {
		const select = document.getElementById('creditArea');
		if (!select) return;
		const currentValue = select.value;
		select.innerHTML = '<option value="">Select area</option>';
		this.areas.forEach(area => {
			const option = document.createElement('option');
			option.value = area.name;
			option.textContent = area.name;
			select.appendChild(option);
		});
		select.value = currentValue;
	},

	handleCustomerSelect() {
		const select = document.getElementById('creditCustomer');
		const phoneInput = document.getElementById('creditPhone');
		const areaSelect = document.getElementById('creditArea');
		if (!select) return;
		const name = select.value;
		const info = this.getCustomerInfo({ customer_name: name, customer_phone: '' });
		if (phoneInput) phoneInput.value = info.phone === '—' ? '' : info.phone;
		if (areaSelect && info.area !== '—') {
			areaSelect.value = info.area;
		}
	},

	handleAreaSelect() {
		const areaSelect = document.getElementById('creditArea');
		const phoneInput = document.getElementById('creditPhone');
		if (!areaSelect) return;
		const area = areaSelect.value;
		this.populateCustomerSelect(area);
		if (phoneInput) phoneInput.value = '';
	},

	async renderCredits() {
		const listContainer = document.getElementById('creditsList');
		const totalCreditsEl = document.getElementById('totalCredits');
		const creditMonthFilter = document.getElementById('creditMonthFilter');
		if (!listContainer) return;

		listContainer.innerHTML = this.getLoadingSkeleton();

		this.credits = await DB.getAll('credits');
		if (!this.customers.length) {
			this.customers = await DB.getAll('customers');
		}
		this.customerMap = this.buildCustomerMap(this.customers);

		let totalOutstanding = 0;
		listContainer.innerHTML = '';

		if (!this.credits.length) {
			listContainer.innerHTML = `
				<div class="credits-empty">
					<div class="credits-empty-icon">🧾</div>
					<div class="credits-empty-text">No credits yet</div>
				</div>
			`;
			if (totalCreditsEl) totalCreditsEl.textContent = '৳0';
			return;
		}

		const filterValue = creditMonthFilter?.value || '';
		const filteredCredits = filterValue
			? this.credits
				.map((credit, index) => ({ credit, index }))
				.filter(item => {
					if (!item.credit.credit_date) return false;
					const monthKey = new Date(item.credit.credit_date).toISOString().slice(0, 7);
					return monthKey === filterValue;
				})
			: this.credits.map((credit, index) => ({ credit, index }));

		filteredCredits.sort((a, b) => {
			const aPaid = (parseFloat(a.credit.balance) || 0) === 0;
			const bPaid = (parseFloat(b.credit.balance) || 0) === 0;
			if (aPaid === bPaid) return 0;
			return aPaid ? 1 : -1;
		});

		if (!filteredCredits.length) {
			listContainer.innerHTML = `
				<div class="credits-empty">
					<div class="credits-empty-icon">🧾</div>
					<div class="credits-empty-text">No credits yet</div>
				</div>
			`;
			if (totalCreditsEl) totalCreditsEl.textContent = '৳0';
			return;
		}

		filteredCredits.forEach(({ credit, index }) => {
			const balance = parseFloat(credit.balance) || 0;
			totalOutstanding += balance;

			const status = balance > 0 ? 'Pending' : 'Paid';
			const badgeClass = balance > 0 ? 'badge-warning' : 'badge-success';

			const customerInfo = this.getCustomerInfo(credit);
			const lastPayment = this.getLastPaymentDate(credit);
			const creditDate = credit.credit_date ? this.formatDate(new Date(credit.credit_date)) : '—';
			const areaLabel = customerInfo.area;
			const notesText = credit.notes ? credit.notes.trim() : '';

			const card = document.createElement('div');
			card.className = `credit-card ${status === 'Pending' ? 'is-pending' : 'is-paid'}`;
			card.dataset.index = index;
			const customerName = credit.customer_name || '—';
			const customerPhone = customerInfo.phone || '—';

			card.innerHTML = `
				<div class="credit-header">
					<div class="credit-name">${customerName}, ${areaLabel}</div>
					<span class="status-chip ${status === 'Pending' ? 'status-pending' : 'status-paid'}">${status}</span>
				</div>
				<div class="credit-phone-row">
					<div class="credit-phone">${customerPhone}</div>
					<button class="copy-btn icon-only" type="button" aria-label="Copy phone number" data-copy="${customerPhone === '—' ? '' : customerPhone}">
						📋
					</button>
				</div>
				<div class="credit-info">
					<div class="credit-balance">Balance: ৳${this.formatCurrency(credit.balance)}</div>
					${notesText ? `<div class="credit-notes">Notes: ${notesText}</div>` : ''}
				</div>
				<div class="credit-actions">
					${balance > 0 ? `<button class="btn btn-primary btn-small" data-pay="${index}">Record Payment</button>` : ''}
					<button class="btn btn-secondary btn-small" data-view="${index}">View Details</button>
				</div>
			`;

			this.addSwipeToDelete(card, credit.id);
			listContainer.appendChild(card);
		});

		if (totalCreditsEl) totalCreditsEl.textContent = `৳${this.formatCurrency(totalOutstanding)}`;

		listContainer.querySelectorAll('[data-pay]').forEach(btn => {
			btn.addEventListener('click', () => this.openPaymentModal(parseInt(btn.dataset.pay, 10)));
		});

		listContainer.querySelectorAll('[data-view]').forEach(btn => {
			btn.addEventListener('click', () => this.openDetailsModal(parseInt(btn.dataset.view, 10)));
		});

		listContainer.querySelectorAll('[data-copy]').forEach(btn => {
			btn.addEventListener('click', () => this.copyPhone(btn.dataset.copy || ''));
		});

		listContainer.querySelectorAll('.credit-card').forEach(card => {
			card.addEventListener('click', (event) => {
				if (event.target.closest('button')) return;
				const index = parseInt(card.dataset.index, 10);
				this.openDetailsModal(index);
			});
		});

		const pendingId = (window.App && window.App.pendingCreditId) ? window.App.pendingCreditId : window.pendingCreditId;
		if (pendingId !== undefined && pendingId !== null && pendingId !== '') {
			if (window.App) {
				window.App.pendingCreditId = null;
			}
			window.pendingCreditId = null;
			this.openDetailsById(pendingId);
		}
	},

	openDetailsById(creditId) {
		const index = this.credits.findIndex(credit => String(credit.id) === String(creditId));
		if (index >= 0) {
			this.openDetailsModal(index);
		}
	},

	initializeMonthFilter() {
		const creditMonthFilter = document.getElementById('creditMonthFilter');
		if (!creditMonthFilter) return;
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		creditMonthFilter.value = `${yyyy}-${mm}`;
	},

	openCreditModal() {
		const modal = document.getElementById('creditModal');
		const nameInput = document.getElementById('creditCustomer');
		const phoneInput = document.getElementById('creditPhone');
		const areaInput = document.getElementById('creditArea');
		const amountInput = document.getElementById('creditAmount');
		const dateInput = document.getElementById('creditDate');
		const notesInput = document.getElementById('creditNotes');

		this.populateCustomerSelect();
		this.populateAreaSelect();

		if (nameInput) nameInput.value = '';
		if (phoneInput) phoneInput.value = '';
		if (areaInput) areaInput.value = '';
		if (amountInput) amountInput.value = '';
		if (notesInput) notesInput.value = '';
		if (dateInput) dateInput.value = this.getTodayValue();

		if (modal) modal.classList.add('show');
	},

	closeCreditModal() {
		const modal = document.getElementById('creditModal');
		if (modal) modal.classList.remove('show');
	},

	async saveCredit() {
		const name = document.getElementById('creditCustomer')?.value.trim() || '';
		const phone = document.getElementById('creditPhone')?.value.trim() || '';
		const area = document.getElementById('creditArea')?.value.trim() || '';
		const amountValue = parseFloat(document.getElementById('creditAmount')?.value || '0');
		const dateValue = document.getElementById('creditDate')?.value || '';
		const notes = document.getElementById('creditNotes')?.value.trim() || '';

		if (!name) {
			App?.showToast?.('Please enter customer name', 'warning');
			return;
		}
		if (!phone) {
			App?.showToast?.('Please enter phone number', 'warning');
			return;
		}
		if (!area) {
			App?.showToast?.('Please select area', 'warning');
			return;
		}
		if (!amountValue || amountValue <= 0) {
			App?.showToast?.('Please enter valid amount', 'warning');
			return;
		}
		if (!dateValue) {
			App?.showToast?.('Please select a date', 'warning');
			return;
		}

		const payload = {
			customer_name: name,
			customer_phone: phone,
			area,
			initial_amount: amountValue,
			balance: amountValue,
			credit_date: new Date(dateValue).toISOString(),
			notes,
			payment_history: []
		};

		try {
			await DB.add('credits', payload);
			this.closeCreditModal();
			await this.renderCredits();
			App?.showToast?.('Credit added successfully', 'success');
		} catch (error) {
			console.error('Save credit failed:', error);
			App?.showToast?.('Failed to add credit', 'error');
		}
	},

	openDetailsModal(index) {
		const credit = this.credits[index];
		if (!credit) return;
		const modal = document.getElementById('creditDetailsModal');
		const content = document.getElementById('creditDetailsContent');
		if (!modal || !content) return;

		const customerInfo = this.getCustomerInfo(credit);
		const creditDate = credit.credit_date ? this.formatDate(new Date(credit.credit_date)) : '—';
		const areaLabel = customerInfo.area;
		const initialAmount = parseFloat(credit.initial_amount) || 0;
		const balanceAmount = parseFloat(credit.balance) || 0;
		const paidAmount = Math.max(initialAmount - balanceAmount, 0);
		const historyRows = this.renderPaymentHistory(credit);

		content.innerHTML = `
			<div class="credit-detail-hero compact">
				<div class="credit-detail-value">${credit.customer_name || ''}, ${areaLabel}</div>
				<div class="credit-detail-value">${customerInfo.phone}</div>
				<div class="credit-detail-value">${creditDate}</div>
			</div>
			<div class="detail-row"><span>Initial Amount</span><strong>৳${this.formatCurrency(initialAmount)}</strong></div>
			<div class="detail-row"><span>Paid Amount</span><strong>৳${this.formatCurrency(paidAmount)}</strong></div>
			<div class="detail-row"><span>Remaining Amount</span><strong>৳${this.formatCurrency(balanceAmount)}</strong></div>
			<div class="detail-section-title">Credit History</div>
			<div class="detail-history">
				${historyRows}
			</div>
		`;

		modal.classList.add('show');
	},

	closeDetailsModal() {
		const modal = document.getElementById('creditDetailsModal');
		if (modal) modal.classList.remove('show');
	},

	openPaymentModal(index) {
		const credit = this.credits[index];
		if (!credit) return;

		this.paymentTarget = credit;
		const modal = document.getElementById('paymentModal');
		const customerInput = document.getElementById('paymentCustomer');
		const balanceInput = document.getElementById('paymentBalance');
		const amountInput = document.getElementById('paymentAmount');
		const dateInput = document.getElementById('paymentDate');

		if (customerInput) customerInput.textContent = credit.customer_name || '';
		if (balanceInput) balanceInput.textContent = `৳${this.formatCurrency(credit.balance)}`;
		if (amountInput) amountInput.value = '';
		if (dateInput) dateInput.value = this.getTodayValue();

		if (modal) modal.classList.add('show');
	},

	closePaymentModal() {
		const modal = document.getElementById('paymentModal');
		if (modal) modal.classList.remove('show');
		this.paymentTarget = null;
	},

	async savePayment() {
		if (!this.paymentTarget) return;

		const amountValue = parseFloat(document.getElementById('paymentAmount')?.value || '0');
		const dateValue = document.getElementById('paymentDate')?.value || '';
		const currentBalance = parseFloat(this.paymentTarget.balance) || 0;

		if (!amountValue || amountValue <= 0) {
			App?.showToast?.('Please enter valid amount', 'warning');
			return;
		}
		if (!dateValue) {
			App?.showToast?.('Please select a date', 'warning');
			return;
		}
		if (amountValue > currentBalance) {
			App?.showToast?.('Payment exceeds balance', 'warning');
			return;
		}

		const updatedBalance = currentBalance - amountValue;
		const paymentHistory = Array.isArray(this.paymentTarget.payment_history)
			? [...this.paymentTarget.payment_history]
			: [];

		paymentHistory.push({
			amount: amountValue,
			date: new Date(dateValue).toISOString()
		});

		const updatedRecord = {
			...this.paymentTarget,
			balance: updatedBalance,
			payment_history: paymentHistory
		};

		try {
			await DB.update('credits', updatedRecord);
			this.closePaymentModal();
			await this.renderCredits();
			App?.showToast?.('Payment recorded', 'success');
		} catch (error) {
			console.error('Payment failed:', error);
			App?.showToast?.('Failed to record payment', 'error');
		}
	},

	addSwipeToDelete(card, creditId) {
		let startX = 0;
		let currentX = 0;
		let isSwiping = false;
		let hasMoved = false;

		card.addEventListener('touchstart', (e) => {
			if (e.target.closest('button')) return;
			const point = e.touches[0];
			startX = point.clientX;
			currentX = startX;
			isSwiping = true;
			hasMoved = false;
		}, { passive: true });

		card.addEventListener('touchmove', (e) => {
			if (!isSwiping) return;
			const point = e.touches[0];
			currentX = point.clientX;
			const diff = startX - currentX;

			if (Math.abs(diff) > 10) {
				hasMoved = true;
			}

			if (diff > 0 && diff < 150) {
				card.style.transform = `translateX(-${diff}px)`;
				card.style.background = `linear-gradient(90deg, transparent ${100 - diff / 2}%, rgba(220,53,69,0.12) 100%)`;
			}
		}, { passive: true });

		card.addEventListener('touchend', () => {
			if (!isSwiping) return;
			const diff = startX - currentX;
			if (hasMoved && diff > 100) {
				this.showDeleteConfirm(creditId);
			}
			card.style.transform = '';
			card.style.background = '';
			isSwiping = false;
			hasMoved = false;
		});
	},

	showDeleteConfirm(creditId) {
		this.pendingDeleteId = creditId;
		const modal = document.getElementById('creditDeleteConfirmModal');
		if (modal) modal.classList.add('show');
	},

	closeDeleteConfirm() {
		const modal = document.getElementById('creditDeleteConfirmModal');
		if (modal) modal.classList.remove('show');
		this.pendingDeleteId = null;
	},

	async confirmDelete() {
		if (!this.pendingDeleteId) return;
		try {
			await DB.delete('credits', this.pendingDeleteId);
			this.closeDeleteConfirm();
			await this.renderCredits();
			App?.showToast?.('Credit deleted', 'success');
		} catch (error) {
			console.error('Delete failed:', error);
			App?.showToast?.('Failed to delete credit', 'error');
			this.closeDeleteConfirm();
		}
	},

	formatCurrency(value) {
		const number = parseFloat(value) || 0;
		return Math.round(number).toLocaleString();
	},

	formatDate(dateObj) {
		const dd = String(dateObj.getDate()).padStart(2, '0');
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const yyyy = dateObj.getFullYear();
		return `${dd}/${mm}/${yyyy}`;
	},

	buildCustomerMap(customers) {
		const map = {};
		(customers || []).forEach(customer => {
			const key = (customer.name || '').trim().toLowerCase();
			if (!key) return;
			map[key] = customer;
		});
		return map;
	},

	getCustomerInfo(credit) {
		const key = (credit.customer_name || '').trim().toLowerCase();
		const match = this.customerMap[key];
		const phone = match?.mobile || credit.customer_phone || '—';
		const area = match?.area || credit.area || credit.route || credit.area_name || '—';
		return { phone, area };
	},

	getLastPaymentDate(credit) {
		const history = Array.isArray(credit.payment_history) ? credit.payment_history : [];
		if (!history.length) return '—';
		const last = history[history.length - 1];
		if (!last?.date) return '—';
		return this.formatDate(new Date(last.date));
	},

	renderPaymentHistory(credit) {
		const history = Array.isArray(credit.payment_history) ? credit.payment_history : [];
		if (!history.length) {
			return `<div class="detail-history-empty">No credit history</div>`;
		}
		return `
			<div class="detail-history-list">
				${history.map(entry => {
					const dateText = entry.date ? this.formatDate(new Date(entry.date)) : '—';
					const amountText = this.formatCurrency(entry.amount);
					return `
						<div class="detail-history-row">
							<span>${dateText}</span>
							<strong>৳${amountText}</strong>
						</div>
					`;
				}).join('')}
			</div>
		`;
	},

	copyPhone(phone) {
		if (!phone) {
			App?.showToast?.('No phone number', 'warning');
			return;
		}
		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(phone)
				.then(() => App?.showToast?.('Copied', 'success'))
				.catch(() => this.fallbackCopy(phone));
			return;
		}
		this.fallbackCopy(phone);
	},

	fallbackCopy(text) {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand('copy');
			App?.showToast?.('Copied', 'success');
		} catch (error) {
			App?.showToast?.('Copy failed', 'error');
		} finally {
			textarea.remove();
		}
	},

	getLoadingSkeleton() {
		return `
			<div class="credit-card skeleton-card"></div>
			<div class="credit-card skeleton-card"></div>
			<div class="credit-card skeleton-card"></div>
		`;
	},

	getTodayValue() {
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		const dd = String(now.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	},

	refresh() {
		this.renderCredits();
	},

	destroy() {
		// Cleanup if needed
	}
};

if (window.App) {
	App.registerModule('credits', CreditsModule);
}
