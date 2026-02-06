/**
 * Settings Module - Account & Sync Management
 */

const SettingsModule = {
    init() {
        this.render();
        this.bindEvents();
    },

    render() {
        const content = document.getElementById('pageContent');
        if (!content) return;

        const auth = window.FirebaseAuth || null;
        const user = auth ? auth.currentUser : null;
        const isFirebaseAvailable = typeof window.firebase !== 'undefined' && !!auth;

        content.innerHTML = `
            <section class="page active" id="settings-page">
                <style>
                    .settings-header {
                        margin-bottom: 24px;
                        padding-bottom: 16px;
                        border-bottom: 2px solid #e0e0e0;
                    }
                    
                    .settings-header h2 {
                        margin: 0 0 4px 0;
                        font-size: 24px;
                        font-weight: 600;
                        color: #1a202c;
                    }
                    
                    .settings-header p {
                        margin: 0;
                        font-size: 14px;
                        color: #718096;
                    }

                    .account-section {
                        background: #fff;
                        border-radius: 12px;
                        padding: 24px;
                        margin-bottom: 20px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }

                    .account-header {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 16px;
                    }

                    .account-icon {
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                    }

                    .account-title {
                        flex: 1;
                    }

                    .account-title h3 {
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #2d3748;
                    }

                    .account-title p {
                        margin: 4px 0 0 0;
                        font-size: 14px;
                        color: #718096;
                    }
                    
                    .user-info {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    
                    .user-info h3 {
                        margin: 0 0 12px 0;
                        font-size: 16px;
                    }
                    
                    .user-info p {
                        margin: 6px 0;
                        font-size: 14px;
                        opacity: 0.95;
                    }
                    
                    .settings-form {
                        margin-bottom: 20px;
                    }
                    
                    .form-group {
                        margin-bottom: 16px;
                    }
                    
                    .form-label {
                        display: block;
                        margin-bottom: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #2d3748;
                    }
                    
                    .form-input {
                        width: 100%;
                        padding: 10px 14px;
                        border: 2px solid #e2e8f0;
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.2s;
                    }
                    
                    .form-input:focus {
                        outline: none;
                        border-color: #667eea;
                    }
                    
                    .btn-group {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    
                    .btn {
                        padding: 12px 20px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    
                    .btn-primary {
                        background: #667eea;
                        color: white;
                    }
                    
                    .btn-primary:hover {
                        background: #5568d3;
                    }
                    
                    .btn-secondary {
                        background: white;
                        color: #667eea;
                        border: 2px solid #667eea;
                    }
                    
                    .btn-secondary:hover {
                        background: #f7fafc;
                    }
                    
                    .btn-danger {
                        background: #fff;
                        color: #e53e3e;
                        border: 2px solid #fc8181;
                    }
                    
                    .btn-danger:hover {
                        background: #fff5f5;
                    }
                    
                    .info-card {
                        background: #f7fafc;
                        padding: 16px;
                        border-radius: 6px;
                        margin-top: 20px;
                    }
                    
                    .info-card h4 {
                        margin: 0 0 12px 0;
                        font-size: 14px;
                        font-weight: 600;
                        color: #2d3748;
                    }
                    
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 14px;
                        color: #4a5568;
                    }
                    
                    .warning-box {
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 12px;
                        margin-bottom: 20px;
                        border-radius: 4px;
                        color: #856404;
                        font-size: 14px;
                    }
                </style>
                
                <div class="settings-header">
                    <h2>⚙️ Settings</h2>
                    <p>Account & Sync</p>
                </div>
                
                ${!isFirebaseAvailable ? `
                    <div class="warning-box">
                        <strong>⚠️ Firebase not configured</strong><br>
                        Cloud sync is disabled.
                    </div>
                ` : ''}
                
                <!-- Account Section -->
                <div class="account-section">
                    ${user ? `
                        <!-- Signed In State -->
                        <div class="account-header">
                            <div class="account-icon">👤</div>
                            <div class="account-title">
                                <h3>${user.displayName || 'User'}</h3>
                                <p>${user.email}</p>
                            </div>
                        </div>
                        
                        <div class="user-info">
                            <h3>✅ Account Active</h3>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>User ID:</strong> ${user.uid.substring(0, 10)}...</p>
                            ${user.displayName ? `<p><strong>Username:</strong> ${user.displayName}</p>` : ''}
                        </div>
                        
                        <div class="btn-group">
                            <button class="btn btn-primary" id="syncNowBtn">
                                🔄 Sync Now
                            </button>
                            <button class="btn btn-danger" id="signOutBtn">
                                🚪 Sign Out
                            </button>
                        </div>
                    ` : `
                        <!-- Not Signed In State -->
                        <div class="account-header">
                            <div class="account-icon">🔒</div>
                            <div class="account-title">
                                <h3>Not Signed In</h3>
                                <p>Sign in to sync your data across devices</p>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" id="openAuthModalBtn" style="width: 100%; margin-top: 12px;">
                            🔑 Sign In / Create Account
                        </button>
                    `}
                </div>
                
                <!-- App Information -->
                <div class="account-section">
                    <div class="info-card">
                        <h4>📱 App Information</h4>
                        <div class="info-row">
                            <span>Version</span>
                            <strong>1.0.0</strong>
                        </div>
                        <div class="info-row">
                            <span>Storage</span>
                            <strong>IndexedDB + Firestore</strong>
                        </div>
                        <div class="info-row">
                            <span>Offline Mode</span>
                            <strong>✅ Enabled</strong>
                        </div>
                    </div>
                </div>

                <!-- Auth Modal -->
                <div class="modal" id="authModal">
                    <div class="modal-content" style="max-width: 440px;">
                        <div class="modal-header">
                            <h3 class="modal-title" id="authModalTitle">🔑 Sign In</h3>
                            <button class="modal-close" id="closeAuthModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="auth-tabs">
                                <button class="auth-tab active" id="signInTab">Sign In</button>
                                <button class="auth-tab" id="signUpTab">Create Account</button>
                            </div>
                            
                            <form class="auth-form" id="authForm">
                                <div class="form-group" id="usernameGroup" style="display: none;">
                                    <label class="form-label">Username</label>
                                    <input 
                                        type="text" 
                                        id="authUsername" 
                                        class="form-input" 
                                        placeholder="Your display name"
                                    />
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input 
                                        type="email" 
                                        id="authEmail" 
                                        class="form-input" 
                                        placeholder="your@email.com"
                                        autocomplete="email"
                                        required
                                    />
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Password</label>
                                    <input 
                                        type="password" 
                                        id="authPassword" 
                                        class="form-input" 
                                        placeholder="Minimum 6 characters"
                                        autocomplete="current-password"
                                        required
                                    />
                                </div>
                                
                                <button type="submit" class="btn btn-primary" id="authSubmitBtn" style="width: 100%;">
                                    🔑 Sign In
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <style>
                    .auth-tabs {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #e2e8f0;
                    }

                    .auth-tab {
                        flex: 1;
                        padding: 10px 16px;
                        border: none;
                        background: transparent;
                        color: #718096;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                        margin-bottom: -2px;
                        transition: all 0.2s;
                    }

                    .auth-tab.active {
                        color: #667eea;
                        border-bottom-color: #667eea;
                    }

                    .auth-form {
                        margin-top: 20px;
                    }
                </style>
            </section>
        `;
    },

    bindEvents() {
        const openAuthModalBtn = document.getElementById('openAuthModalBtn');
        const closeAuthModal = document.getElementById('closeAuthModal');
        const authModal = document.getElementById('authModal');
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        const authForm = document.getElementById('authForm');
        const signOutBtn = document.getElementById('signOutBtn');
        const syncNowBtn = document.getElementById('syncNowBtn');

        // Open auth modal
        if (openAuthModalBtn) {
            openAuthModalBtn.addEventListener('click', () => {
                this.openAuthModal();
            });
        }

        // Close auth modal
        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => {
                this.closeAuthModal();
            });
        }

        // Close modal on backdrop click
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    this.closeAuthModal();
                }
            });
        }

        // Tab switching
        if (signInTab) {
            signInTab.addEventListener('click', () => {
                this.switchToSignIn();
            });
        }

        if (signUpTab) {
            signUpTab.addEventListener('click', () => {
                this.switchToSignUp();
            });
        }

        // Form submission
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const isSignUp = signUpTab.classList.contains('active');
                if (isSignUp) {
                    this.handleSignUp();
                } else {
                    this.handleSignIn();
                }
            });
        }
        
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }
        
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', () => this.handleSyncNow());
        }
    },

    openAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('show');
            // Focus on email input
            setTimeout(() => {
                const emailInput = document.getElementById('authEmail');
                if (emailInput) emailInput.focus();
            }, 100);
        }
    },

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('show');
            // Clear form
            const authForm = document.getElementById('authForm');
            if (authForm) authForm.reset();
        }
    },

    switchToSignIn() {
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        const usernameGroup = document.getElementById('usernameGroup');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const authModalTitle = document.getElementById('authModalTitle');

        signInTab.classList.add('active');
        signUpTab.classList.remove('active');
        usernameGroup.style.display = 'none';
        authSubmitBtn.innerHTML = '🔑 Sign In';
        authModalTitle.innerHTML = '🔑 Sign In';
    },

    switchToSignUp() {
        const signInTab = document.getElementById('signInTab');
        const signUpTab = document.getElementById('signUpTab');
        const usernameGroup = document.getElementById('usernameGroup');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const authModalTitle = document.getElementById('authModalTitle');

        signInTab.classList.remove('active');
        signUpTab.classList.add('active');
        usernameGroup.style.display = 'block';
        authSubmitBtn.innerHTML = '✨ Create Account';
        authModalTitle.innerHTML = '✨ Create Account';
    },

    async handleSignIn() {
        if (!window.SyncModule || !window.FirebaseAuth) {
            App.showToast('Firebase not available in WebView', 'warning');
            return;
        }
        const emailInput = document.getElementById('authEmail');
        const passwordInput = document.getElementById('authPassword');
        
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;

        if (!email || !password) {
            App.showToast('Please enter email and password', 'warning');
            return;
        }

        if (!this.isValidEmail(email)) {
            App.showToast('Please enter a valid email address', 'warning');
            return;
        }

        try {
            await SyncModule.signIn(email, password);
            this.closeAuthModal();
            
            // Refresh the settings page
            setTimeout(() => {
                this.render();
                this.bindEvents();
            }, 500);
        } catch (error) {
            // Error already handled in SyncModule
        }
    },

    async handleSignUp() {
        if (!window.SyncModule || !window.FirebaseAuth) {
            App.showToast('Firebase not available in WebView', 'warning');
            return;
        }
        const emailInput = document.getElementById('authEmail');
        const passwordInput = document.getElementById('authPassword');
        const usernameInput = document.getElementById('authUsername');
        
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        const username = usernameInput?.value.trim();

        if (!email || !password) {
            App.showToast('Please enter email and password', 'warning');
            return;
        }

        if (!this.isValidEmail(email)) {
            App.showToast('Please enter a valid email address', 'warning');
            return;
        }

        if (password.length < 6) {
            App.showToast('Password must be at least 6 characters', 'warning');
            return;
        }

        try {
            await SyncModule.signUp(email, password);
            
            // Update display name if provided
            if (username && window.FirebaseAuth.currentUser) {
                try {
                    await window.FirebaseAuth.currentUser.updateProfile({
                        displayName: username
                    });
                } catch (err) {
                    console.warn('Failed to update display name:', err);
                }
            }

            this.closeAuthModal();
            
            // Refresh the settings page
            setTimeout(() => {
                this.render();
                this.bindEvents();
            }, 500);
        } catch (error) {
            // Error already handled in SyncModule
        }
    },

    async handleSignOut() {
        if (!window.SyncModule || !window.FirebaseAuth) {
            App.showToast('Firebase not available in WebView', 'warning');
            return;
        }
        if (!confirm('Are you sure you want to sign out? Your local data will remain on this device.')) {
            return;
        }

        try {
            await SyncModule.signOut();
            
            // Refresh the settings page
            setTimeout(() => {
                this.render();
                this.bindEvents();
            }, 500);
        } catch (error) {
            // Error already handled in SyncModule
        }
    },

    async handleSyncNow() {
        if (!window.SyncModule || !window.FirebaseAuth) {
            App.showToast('Firebase not available in WebView', 'warning');
            return;
        }
        const syncBtn = document.getElementById('syncNowBtn');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<span>⏳</span><span>Syncing...</span>';
        }

        try {
            await SyncModule.forceFullSync();
        } finally {
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<span>🔄</span><span>Sync Now</span>';
            }
        }
    },

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    refresh() {
        this.render();
        this.bindEvents();
    },

    destroy() {
        // Cleanup if needed
    }
};

// Register module
if (window.App) {
    App.registerModule('settings', SettingsModule);
}

window.SettingsModule = SettingsModule;
