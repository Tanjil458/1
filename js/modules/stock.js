/**
 * Stock Module (Bottom Nav - Stock Management)
 */

const StockModule = {
    products: [],

    init() {
        this.render();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h3>Stock Management</h3>
                <p style="color: var(--muted);">Manage inventory and stock levels</p>
                
                <div class="summary-grid" style="margin-top: 20px;">
                    <div class="summary-card">
                        <div class="summary-label">Total Products</div>
                        <div class="summary-value" id="totalProducts">0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Low Stock</div>
                        <div class="summary-value" style="color: var(--danger);">0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Value</div>
                        <div class="summary-value">৳0</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <div class="filters">
                    <button class="btn btn-primary" onclick="StockModule.addStock()">Add Stock</button>
                    <button class="btn btn-secondary" onclick="StockModule.viewProducts()">View Products</button>
                    <button class="btn btn-secondary" onclick="StockModule.stockReport()">Stock Report</button>
                </div>
            </div>
        `;

        this.loadStockData();
    },

    async loadStockData() {
        try {
            this.products = await DB.getAll('products');
            const totalEl = document.getElementById('totalProducts');
            if (totalEl) {
                totalEl.textContent = this.products.length;
            }
        } catch (error) {
            console.error('Error loading stock data:', error);
        }
    },

    addStock() {
        App.showToast('Add stock feature coming soon');
    },

    viewProducts() {
        // Navigate to product listing
        App.navigateTo('productListingPage');
    },

    stockReport() {
        App.showToast('Stock report coming soon');
    },

    refresh() {
        this.loadStockData();
    },

    destroy() {
        this.products = [];
    }
};

// Register module
if (window.App) {
    App.registerModule('stock', StockModule);
}

window.StockModule = StockModule;
