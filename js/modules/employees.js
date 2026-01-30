/**
 * Employees Module (Bottom Nav - Employee Management)
 */

const EmployeesModule = {
    employees: [],

    init() {
        this.render();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h3>Employee Management</h3>
                <p style="color: var(--muted);">Manage employees, attendance, and salaries</p>
                
                <div class="summary-grid" style="margin-top: 20px;">
                    <div class="summary-card">
                        <div class="summary-label">Total Employees</div>
                        <div class="summary-value" id="totalEmployees">0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Present Today</div>
                        <div class="summary-value" style="color: var(--success);">0</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Pending Salaries</div>
                        <div class="summary-value">৳0</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <div class="filters">
                    <button class="btn btn-primary" onclick="EmployeesModule.addEmployee()">Add Employee</button>
                    <button class="btn btn-secondary" onclick="EmployeesModule.viewList()">View List</button>
                    <button class="btn btn-secondary" onclick="EmployeesModule.markAttendance()">Attendance</button>
                    <button class="btn btn-secondary" onclick="EmployeesModule.salaryReport()">Salary Report</button>
                </div>
            </div>
        `;

        this.loadEmployeeData();
    },

    async loadEmployeeData() {
        try {
            this.employees = await DB.getAll('employees');
            const totalEl = document.getElementById('totalEmployees');
            if (totalEl) {
                totalEl.textContent = this.employees.length;
            }
        } catch (error) {
            console.error('Error loading employee data:', error);
        }
    },

    addEmployee() {
        App.showToast('Add employee feature coming soon');
    },

    viewList() {
        // Navigate to employee listing
        App.navigateTo('employeeListingPage');
    },

    markAttendance() {
        App.navigateTo('attendancePage');
    },

    salaryReport() {
        App.showToast('Salary report coming soon');
    },

    refresh() {
        this.loadEmployeeData();
    },

    destroy() {
        this.employees = [];
    }
};

// Register module
if (window.App) {
    App.registerModule('employees', EmployeesModule);
}

window.EmployeesModule = EmployeesModule;
