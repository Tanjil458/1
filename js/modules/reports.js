/**
 * Reports Module - Monthly Delivery Report
 */

const ReportsModule = {
	historyCache: [],

	async init() {
		this.render();
		await this.renderMonthlyReport();
	},

	render() {
		const content = document.getElementById('pageContent');
		if (!content) return;

		content.innerHTML = `
			<section class="page active" id="monthly">
				<div class="card">
					<div class="card-header">
						<h3>Monthly Delivery Report</h3>
					</div>
					<div id="monthlyContent" style="margin-top: 16px;"></div>
				</div>
			</section>
		`;
	},

	async renderMonthlyReport() {
		const monthlyContent = document.getElementById('monthlyContent');
		if (!monthlyContent) return;

		const history = await DB.getAll('history');
		this.historyCache = history;

		if (window.App?.modules?.history) {
			window.App.modules.history.history = history;
		}

		if (!history.length) {
			monthlyContent.innerHTML = `
				<p style="text-align:center; color:#6c757d;">No delivery records found</p>
			`;
			return;
		}

		const monthlyGroups = {};
		const yearlyTotals = {};

		history.forEach((record, index) => {
			const dateObj = new Date(record.date);
			const monthKey = dateObj.toISOString().slice(0, 7);
			const yearKey = dateObj.getFullYear().toString();
			const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
			const salesValue = parseFloat(record.sales) || 0;

			if (!monthlyGroups[monthKey]) {
				monthlyGroups[monthKey] = {
					monthName,
					date: dateObj,
					deliveries: [],
					totalSales: 0
				};
			}

			monthlyGroups[monthKey].deliveries.push({ index, data: record });
			monthlyGroups[monthKey].totalSales += salesValue;

			yearlyTotals[yearKey] = (yearlyTotals[yearKey] || 0) + salesValue;
		});

		const sortedMonthKeys = Object.keys(monthlyGroups).sort((a, b) => b.localeCompare(a));
		const sortedYearKeys = Object.keys(yearlyTotals).sort((a, b) => b.localeCompare(a));
		const currentMonthKey = new Date().toISOString().slice(0, 7);

		const yearlySection = `
			<div class="month-section">
				<div class="month-header">
					<span>Yearly Sales</span>
				</div>
				<div class="month-content">
					<div style="overflow-x: auto;">
						<table class="table">
							<thead>
								<tr>
									<th>Year</th>
									<th>Total Sales (৳)</th>
								</tr>
							</thead>
							<tbody>
								${sortedYearKeys.map(year => `
									<tr>
										<td>${year}</td>
										<td>৳${Math.round(yearlyTotals[year])}</td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		`;

		const monthSections = sortedMonthKeys.map(monthKey => {
			const group = monthlyGroups[monthKey];
			const isCurrent = monthKey === currentMonthKey;
			const toggleIcon = isCurrent ? '▲' : '▼';
			const collapsedClass = isCurrent ? '' : 'collapsed';
			const deliveryCount = group.deliveries.length;

			return `
				<div class="month-section">
					<div class="month-header" onclick="toggleMonth(this)">
						<span>${group.monthName} (${deliveryCount} deliveries)</span>
						<span class="month-toggle">${toggleIcon}</span>
					</div>
					<div class="month-content ${collapsedClass}">
						<div style="overflow-x: auto;">
							<table class="table">
								<thead>
									<tr>
										<th>Customer</th>
										<th>Date</th>
										<th>Sales (৳)</th>
										<th>Net (৳)</th>
										<th style="width: 40px;">View</th>
									</tr>
								</thead>
								<tbody>
									${group.deliveries.map(item => `
										<tr>
											<td>${(item.data.name || '').split(',')[0] || ''}</td>
											<td>${this.formatDate(new Date(item.data.date))}</td>
											<td>৳${Math.round(parseFloat(item.data.sales) || 0)}</td>
											<td>৳${Math.round(parseFloat(item.data.net) || 0)}</td>
											<td style="text-align:center; width: 40px;">
												<button class="btn btn-ghost btn-small icon-only" aria-label="View" title="View" onclick="viewCalculation(${item.index})">
													<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
														<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
														<circle cx="12" cy="12" r="3" />
													</svg>
												</button>
											</td>
										</tr>
									`).join('')}
								</tbody>
							</table>
						</div>
						<div class="month-summary">Monthly Sales: ৳${Math.round(group.totalSales)}</div>
					</div>
				</div>
			`;
		}).join('');

		monthlyContent.innerHTML = `${yearlySection}${monthSections}`;
	},

	refresh() {
		this.renderMonthlyReport();
	},

	formatDate(dateObj) {
		const dd = String(dateObj.getDate()).padStart(2, '0');
		const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
		const yyyy = dateObj.getFullYear();
		return `${dd}/${mm}/${yyyy}`;
	},

	destroy() {
		// Cleanup if needed
	}
};

window.toggleMonth = (element) => {
	if (!element) return;
	const content = element.nextElementSibling;
	const toggle = element.querySelector('.month-toggle');
	if (!content || !toggle) return;
	content.classList.toggle('collapsed');
	toggle.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
};

window.viewCalculation = (index) => {
	const historyModule = window.App?.modules?.history;
	if (historyModule) {
		historyModule.viewCalculation(index);
	}
};

if (window.App) {
	App.registerModule('reports', ReportsModule);
}
