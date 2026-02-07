/**
 * Employee Listing Module (Side Nav)
 */

const EmployeeListingModule = {
    employees: [],
    editIndex: -1,
    pendingDeleteId: null,

    init() {
        this.render();
        this.loadEmployees();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <h3 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 16px;">Employee List</h3>
                <table id="empTable" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Name</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Role</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Salary</th>
                            <th style="background: #f8f9fa; padding: 8px 4px; text-align: center; font-weight: 600; color: #495057; border-bottom: 2px solid #e9ecef;">Edit</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <button class="fab" onclick="EmployeeListingModule.openModal()">+</button>

            <!-- Employee Modal -->
            <div class="modal" id="employeeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="empModalTitle">Add Employee</h3>
                        <button class="modal-close" onclick="EmployeeListingModule.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Employee Name</label>
                            <input id="empName" type="text" placeholder="Enter employee name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mobile Number</label>
                            <input id="empMobile" type="tel" placeholder="01XXXXXXXXX">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select id="empRole" style="width: 100%; padding: 12px; border: 1px solid #e1e8ed; border-radius: 8px; font-size: 14px; color: #2c3e50; background: white;">
                                <option value="">Select role</option>
                                <option value="DSR">DSR</option>
                                <option value="DRIVER">DRIVER</option>
                                <option value="HELPER">HELPER</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Salary Amount</label>
                            <input id="empSalary" type="number" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Salary Type</label>
                            <select id="empSalaryType" style="width: 100%; padding: 12px; border: 1px solid #e1e8ed; border-radius: 8px; font-size: 14px; color: #2c3e50; background: white;">
                                <option value="Daily">Daily</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Login Password (for Employee App)</label>
                            <input id="empPassword" type="password" placeholder="Set password for employee">
                            <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block;">Employee will use this to login to the Employee App</small>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="EmployeeListingModule.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="EmployeeListingModule.saveEmployee()">Save</button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Popup -->
            <div class="delete-confirm-overlay" id="empDeleteConfirmModal">
                <div class="delete-confirm-box" role="dialog" aria-modal="true">
                    <div class="delete-confirm-icon">⚠️</div>
                    <div class="delete-confirm-title">Delete this employee?</div>
                    <div class="delete-confirm-text">This action cannot be undone. Are you sure you want to delete this employee?</div>
                    <div class="delete-confirm-actions">
                        <button class="delete-confirm-btn cancel" onclick="EmployeeListingModule.closeDeleteConfirm()">Cancel</button>
                        <button class="delete-confirm-btn delete" onclick="EmployeeListingModule.confirmDelete()">Delete</button>
                    </div>
                </div>
            </div>
        `;

        this.attachSwipeEvents();
    },

    async loadEmployees() {
        try {
            console.log('📥 Loading employees from DB...');
            this.employees = await DB.getAll('employees');
            console.log(`✅ Loaded ${this.employees.length} employees:`, this.employees);
            this.renderTable();
        } catch (error) {
            console.error('❌ Error loading employees:', error);
        }
    },

    renderTable() {
        const tbody = document.querySelector('#empTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.employees.forEach((emp, i) => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'touch-action: pan-y; transition: transform 0.2s;';
            tr.innerHTML = `
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">${emp.name}</td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">${emp.role}</td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">৳${emp.salary} <small>(${emp.salaryType})</small></td>
                <td style="padding: 8px 4px; border-bottom: 1px solid #f1f3f5; text-align: center;">
                    <button class="btn btn-primary btn-small" onclick="EmployeeListingModule.editEmployee(${i})" style="background: #5B5FED; color: #fff; padding: 6px 12px; font-size: 12px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                        Edit
                    </button>
                </td>
            `;

            this.addSwipeToDelete(tr, emp.id);
            tbody.appendChild(tr);
        });
    },

    openModal() {
        const modal = document.getElementById('employeeModal');
        if (!modal) return;

        document.getElementById('empModalTitle').textContent = 'Add Employee';
        document.getElementById('empName').value = '';
        document.getElementById('empMobile').value = '';
        document.getElementById('empRole').value = '';
        document.getElementById('empSalary').value = '';
        document.getElementById('empSalaryType').value = 'Daily';
        document.getElementById('empPassword').value = '';
        this.editIndex = -1;

        modal.classList.add('show');
    },

    closeModal() {
        const modal = document.getElementById('employeeModal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    editEmployee(index) {
        this.editIndex = index;
        const emp = this.employees[index];

        document.getElementById('empModalTitle').textContent = 'Edit Employee';
        document.getElementById('empName').value = emp.name;
        document.getElementById('empMobile').value = emp.mobile || emp.phone || '';
        document.getElementById('empRole').value = emp.role;
        document.getElementById('empSalary').value = emp.salary;
        document.getElementById('empSalaryType').value = emp.salaryType;
        document.getElementById('empPassword').value = '';
        document.getElementById('empPassword').placeholder = 'Leave blank to keep current password';

        document.getElementById('employeeModal').classList.add('show');
    },

    async saveEmployee() {
        console.log('💾 Save employee clicked');
        const name = document.getElementById('empName').value.trim();
        const mobile = document.getElementById('empMobile').value.trim();
        const role = document.getElementById('empRole').value;
        const salary = parseFloat(document.getElementById('empSalary').value);
        const salaryType = document.getElementById('empSalaryType').value;
        const loginPassword = document.getElementById('empPassword').value.trim();

        console.log('📝 Employee data:', { name, mobile, role, salary, salaryType });

        if (!name || !mobile || !role || !salary) {
            console.warn('⚠️ Validation failed');
            App.showToast('Please fill all fields', 'warning');
            return;
        }

        if (!loginPassword && this.editIndex === -1) {
            App.showToast('Please set a password for employee login', 'warning');
            return;
        }

        try {
            // Get current user ID from Firebase Auth
            let userId;
            
            if (window.FirebaseAuth && window.FirebaseAuth.currentUser) {
                userId = window.FirebaseAuth.currentUser.uid;
            } else if (window.FirebaseSync && window.FirebaseSync.currentUser) {
                userId = window.FirebaseSync.currentUser.uid;
            } else {
                // User not signed in - check if working offline
                const localUserId = localStorage.getItem('localUserId');
                if (localUserId) {
                    userId = localUserId;
                } else {
                    // Generate a local user ID for offline use
                    userId = 'local_' + Date.now();
                    localStorage.setItem('localUserId', userId);
                    console.warn('⚠️ No Firebase user signed in. Using local user ID for offline mode.');
                    App.showToast('Working in offline mode. Sign in to sync with cloud.', 'warning', 4000);
                }
            }

            // Generate employee ID
            let employeeId;
            if (this.editIndex === -1) {
                const count = this.employees.length + 1;
                employeeId = `EMP${String(count).padStart(3, '0')}`;
            } else {
                employeeId = this.employees[this.editIndex].employeeId;
            }

            // Hash password if provided (SHA-256)
            let passwordHash;
            if (loginPassword) {
                const encoder = new TextEncoder();
                const data = encoder.encode(loginPassword);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            const employeeData = {
                userId: userId,
                employeeId: employeeId,
                name: name,
                phone: mobile,
                mobile: mobile,
                role: role,
                salary: salary,
                salaryType: salaryType,
                status: 'active',
                active: true
            };

            // Add password hash if provided
            if (passwordHash) {
                employeeData.passwordHash = passwordHash;
            }

            console.log('✅ Validation passed, saving:', employeeData);

            if (this.editIndex === -1) {
                console.log('➕ Adding new employee to DB...');
                const id = await DB.add('employees', employeeData);
                console.log('✅ Employee added with ID:', id);
                
                // Show credentials to admin
                const companyId = userId.substring(0, 8).toUpperCase();
                App.showToast(
                    `Employee Added!\n\nCompany ID: ${companyId}\nEmployee ID: ${employeeId}\nPassword: ${loginPassword}\n\nGive these credentials to the employee.`,
                    'success',
                    8000
                );
            } else {
                employeeData.id = this.employees[this.editIndex].id;
                console.log('✏️ Updating employee with ID:', employeeData.id);
                await DB.update('employees', employeeData);
                console.log('✅ Employee updated');
                App.showToast('Employee updated successfully', 'success');
            }

            this.closeModal();
            console.log('🔄 Reloading employees...');
            await this.loadEmployees();
            console.log('✅ Employees reloaded');
        } catch (error) {
            console.error('❌ Error saving employee:', error);
            App.showToast('Error saving employee: ' + error.message, 'error');
        }
    },

    addSwipeToDelete(row, employeeId) {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        let hasMoved = false;

        row.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            const point = e.touches[0];
            startX = point.clientX;
            currentX = startX;
            isSwiping = true;
            hasMoved = false;
        }, { passive: false });

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
                row.style.background = `linear-gradient(90deg, transparent ${100 - diff / 2}%, rgba(220,53,69,0.1) 100%)`;
            }
        }, { passive: false });

        row.addEventListener('touchend', () => {
            if (!isSwiping) return;
            const diff = startX - currentX;

            if (hasMoved && diff > 100) {
                this.showDeleteConfirm(employeeId);
                row.style.transform = '';
                row.style.background = '';
            } else {
                row.style.transform = '';
                row.style.background = '';
            }

            isSwiping = false;
            hasMoved = false;
        });
    },

    attachSwipeEvents() {
        // Will be called after table render
    },

    showDeleteConfirm(employeeId) {
        this.pendingDeleteId = employeeId;
        const modal = document.getElementById('empDeleteConfirmModal');
        if (modal) {
            modal.classList.add('show');
        }
    },

    closeDeleteConfirm() {
        const modal = document.getElementById('empDeleteConfirmModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.pendingDeleteId = null;
    },

    async confirmDelete() {
        if (!this.pendingDeleteId) return;

        try {
            await DB.delete('employees', this.pendingDeleteId);
            App.showToast('Employee deleted', 'success');
            this.closeDeleteConfirm();
            await this.loadEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            App.showToast('Error deleting employee', 'error');
        }
    },

    refresh() {
        this.loadEmployees();
    },

    destroy() {
        this.employees = [];
        this.editIndex = -1;
        this.pendingDeleteId = null;
    }
};

// Register module
if (window.App) {
    App.registerModule('employeeListing', EmployeeListingModule);
}

window.EmployeeListingModule = EmployeeListingModule;
