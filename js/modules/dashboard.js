/**
 * Dashboard Module
 */

const DashboardModule = {
    init() {
        this.render();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h2>Dashboard</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-label">Today's Sales</div>
                        <div class="summary-value">৳0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Products</div>
                        <div class="summary-value">0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Active Employees</div>
                        <div class="summary-value">0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Pending Credits</div>
                        <div class="summary-value">৳0</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <div class="filters">
                    <button class="btn btn-primary">New Delivery</button>
                    <button class="btn btn-secondary">Add Product</button>
                    <button class="btn btn-secondary">Mark Attendance</button>
                </div>
            </div>

            <div class="card">
                <h3>Recent Activity</h3>
                <p style="color: var(--muted); text-align: center; padding: 20px;">
                    No recent activity
                </p>
            </div>
        `;
    },

    refresh() {
        this.render();
    },

    destroy() {
        // Cleanup if needed
    }
};

// Register module
if (window.App) {
    App.registerModule('dashboard', DashboardModule);
}
