// Profile Page

const Profile = {
    async render() {
        const session = getSession();

        // Try to get profile from IndexedDB
        let profile = null;
        try {
            const profiles = await employeeDB.getAll(STORES.PROFILE);
            profile = profiles.find(p => p.employeeId === session.employeeId);
        } catch (error) {
            console.error('Error loading profile:', error);
        }

        // Fallback to session data
        const profileData = profile || session;

        return `
            <h2 class="section-title">My Profile</h2>

            <div class="profile-header">
                <div class="profile-avatar">
                    ${(profileData.name || 'E').charAt(0).toUpperCase()}
                </div>
                <div class="profile-name">${profileData.name || 'Employee'}</div>
                <div class="profile-id">ID: ${profileData.employeeId}</div>
            </div>

            <div class="list-container">
                <div class="info-row">
                    <span class="info-label">Phone</span>
                    <span class="info-value">${profileData.phone || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Role</span>
                    <span class="info-value">${profileData.role || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Monthly Salary</span>
                    <span class="info-value">${MoneyUtils.formatMoney(profileData.salary)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value">
                        <span class="badge badge-success">ACTIVE</span>
                    </span>
                </div>
            </div>

            <div class="section">
                <h3 class="section-title">App Information</h3>
                <div class="list-container">
                    <div class="info-row">
                        <span class="info-label">App Version</span>
                        <span class="info-value">1.0.0</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Last Synced</span>
                        <span class="info-value">${EmployeeSyncService.getLastSyncTime()}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <button class="btn btn-primary" style="width: 100%;" id="changePasswordBtn">
                    Change Password
                </button>
            </div>

            <div class="section">
                <button class="btn btn-secondary" style="width: 100%; color: var(--error);" id="logoutBtnProfile">
                    Logout
                </button>
            </div>
        `;
    },

    attachEventListeners() {
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const logoutBtn = document.getElementById('logoutBtnProfile');

        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                UIUtils.showToast('Please contact your supervisor to change your password');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                UIUtils.confirm('Are you sure you want to logout?', () => {
                    logout();
                });
            });
        }
    }
};
