/**
 * Cloud Sync Module - Firebase Integration
 * Handles synchronization between local IndexedDB and Firebase Firestore
 */

const SyncModule = {
    currentUser: null,
    syncEnabled: false,
    lastSyncTime: {},
    autoSyncInterval: null,
    realtimeListeners: {},
    syncStatusCheckInterval: null,

    /**
     * Initialize sync module and listen to auth state changes
     */
    async init() {
        if (typeof window.firebase === 'undefined' || !window.FirebaseAuth) {
            console.warn('⚠️ Firebase not available, sync disabled');
            return;
        }

        // Listen to auth state changes
        window.FirebaseAuth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('✅ User logged in:', user.email);
                this.syncEnabled = true;
                
                // Pull data from cloud when user logs in
                await this.pullFromCloud();
                
                // Start auto-sync
                this.startAutoSync();
                
                // Setup real-time listeners for all stores
                this.setupAllRealtimeSync();
                
                // Start checking sync status
                this.startSyncStatusCheck();
                
                if (window.App) {
                    App.showToast(`Signed in as ${user.email}`, 'success');
                }
            } else {
                console.log('❌ User logged out');
                this.syncEnabled = false;
                
                // Stop auto-sync
                this.stopAutoSync();
                
                // Remove all real-time listeners
                this.removeAllRealtimeListeners();
                
                // Stop sync status check
                this.stopSyncStatusCheck();
                
                // Reset sync indicator
                this.updateSyncIndicator('disabled');
            }
        });
    },

    /**
     * Check sync status and update UI indicator
     */
    async checkSyncStatus() {
        if (!this.syncEnabled || !this.currentUser) {
            this.updateSyncIndicator('disabled');
            return { hasUnsyncedData: false, count: 0 };
        }

        try {
            const stores = Object.values(DB.stores);
            let unsyncedCount = 0;

            for (const storeName of stores) {
                try {
                    const allData = await DB.getAll(storeName);
                    const unsynced = allData.filter(item => !item.synced);
                    unsyncedCount += unsynced.length;
                } catch (error) {
                    console.error(`Error checking ${storeName}:`, error);
                }
            }

            if (unsyncedCount > 0) {
                this.updateSyncIndicator('pending', unsyncedCount);
                return { hasUnsyncedData: true, count: unsyncedCount };
            } else {
                this.updateSyncIndicator('synced');
                return { hasUnsyncedData: false, count: 0 };
            }
        } catch (error) {
            console.error('Error checking sync status:', error);
            this.updateSyncIndicator('error');
            return { hasUnsyncedData: false, count: 0 };
        }
    },

    /**
     * Update sync button visual indicator
     */
    updateSyncIndicator(status, count = 0) {
        const syncBtn = document.getElementById('syncBtn');
        const syncIcon = document.getElementById('syncIcon');
        
        if (!syncBtn || !syncIcon) return;

        // Remove all status classes
        syncBtn.classList.remove('sync-synced', 'sync-pending', 'sync-syncing', 'sync-disabled', 'sync-error');

        // Add appropriate class
        switch (status) {
            case 'synced':
                syncBtn.classList.add('sync-synced');
                syncBtn.title = 'All data synced';
                break;
            case 'pending':
                syncBtn.classList.add('sync-pending');
                syncBtn.title = `${count} item${count !== 1 ? 's' : ''} pending sync`;
                break;
            case 'syncing':
                syncBtn.classList.add('sync-syncing');
                syncBtn.title = 'Syncing...';
                break;
            case 'error':
                syncBtn.classList.add('sync-error');
                syncBtn.title = 'Sync error - click to retry';
                break;
            case 'disabled':
            default:
                syncBtn.classList.add('sync-disabled');
                syncBtn.title = 'Sign in to sync';
                break;
        }
    },

    /**
     * Start periodic sync status check
     */
    startSyncStatusCheck() {
        // Initial check
        this.checkSyncStatus();
        
        // Check every 10 seconds
        this.syncStatusCheckInterval = setInterval(() => {
            this.checkSyncStatus();
        }, 10000);
    },

    /**
     * Stop sync status check
     */
    stopSyncStatusCheck() {
        if (this.syncStatusCheckInterval) {
            clearInterval(this.syncStatusCheckInterval);
            this.syncStatusCheckInterval = null;
        }
    },

    /**
     * Sign up new user with email and password
     */
    async signUp(email, password) {
        try {
            const userCredential = await window.FirebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('✅ User created:', userCredential.user.uid);
            
            if (window.App) {
                App.showToast('Account created successfully!', 'success');
            }
            
            return userCredential.user;
        } catch (error) {
            console.error('❌ Sign up error:', error);
            
            let errorMessage = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already in use';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }
            
            if (window.App) {
                App.showToast(errorMessage, 'error');
            }
            throw error;
        }
    },

    /**
     * Sign in existing user
     */
    async signIn(email, password) {
        try {
            const userCredential = await window.FirebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('✅ User signed in:', userCredential.user.uid);
            
            if (window.App) {
                App.showToast('Signed in successfully!', 'success');
            }
            
            return userCredential.user;
        } catch (error) {
            console.error('❌ Sign in error:', error);
            
            let errorMessage = 'Failed to sign in';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'User not found';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            
            if (window.App) {
                App.showToast(errorMessage, 'error');
            }
            throw error;
        }
    },

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await window.FirebaseAuth.signOut();
            console.log('✅ User signed out');
            
            if (window.App) {
                App.showToast('Signed out successfully', 'success');
            }
        } catch (error) {
            console.error('❌ Sign out error:', error);
            
            if (window.App) {
                App.showToast('Failed to sign out', 'error');
            }
        }
    },

    /**
     * Push single item to cloud
     */
    async pushToCloud(storeName, data) {
        if (!this.syncEnabled || !this.currentUser) {
            console.warn('⚠️ Sync disabled or user not logged in');
            return;
        }

        try {
            const userId = this.currentUser.uid;
            // Use full userId as companyId (this is what employees use to login)
            const companyId = userId;
            
            // Shared stores that employees need to access (use companyId path)
            const sharedStores = ['attendance', 'employees', 'delivery', 'credits', 'advances', 'stock'];
            
            let docRef;
            if (sharedStores.includes(storeName)) {
                // Write to companyId path so employees can read it
                docRef = FirebaseDB.collection('users')
                    .doc(companyId)
                    .collection(storeName)
                    .doc(String(data.id));
                console.log(`🔗 Writing ${storeName} to shared path: users/${companyId}/${storeName}`);
            } else {
                // Write private admin data using full userId
                docRef = FirebaseDB.collection('users')
                    .doc(userId)
                    .collection(storeName)
                    .doc(String(data.id));
            }

            await docRef.set({
                ...data,
                syncedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId,
                companyId: companyId
            }, { merge: true });

            console.log(`✅ Pushed ${storeName}/${data.id} to cloud`);
            
            // Extra logging for attendance and advances to help debug
            if (storeName === 'attendance') {
                console.log(`📊 Attendance Details:`, {
                    id: data.id,
                    employeeId: data.employeeId,
                    employeeIdType: typeof data.employeeId,
                    date: data.date,
                    path: `users/${companyId}/attendance/${data.id}`
                });
            }
            
            if (storeName === 'advances') {
                console.log(`💰 Advance Details:`, {
                    id: data.id,
                    employeeId: data.employeeId,
                    employeeIdType: typeof data.employeeId,
                    amount: data.amount,
                    date: data.date,
                    reason: data.reason || data.note,
                    status: data.status,
                    path: `users/${companyId}/advances/${data.id}`
                });
            }
        } catch (error) {
            console.error(`❌ Failed to push ${storeName}/${data.id}:`, error);
            
            // Log specific error details
            if (error.code === 'permission-denied') {
                console.error('🔥 FIRESTORE PERMISSION DENIED!');
                console.error('📝 Fix: Go to Firebase Console → Firestore Database → Rules');
                console.error('📝 Replace rules with:');
                console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
                `);
            }
            
            throw error;
        }
    },

    /**
     * Delete item from cloud
     */
    async deleteFromCloud(storeName, id) {
        if (!this.syncEnabled || !this.currentUser) {
            return;
        }

        try {
            const userId = this.currentUser.uid;
            const companyId = userId;
            
            const sharedStores = ['attendance', 'employees', 'delivery', 'credits', 'advances', 'stock'];
            
            let docRef;
            if (sharedStores.includes(storeName)) {
                docRef = FirebaseDB.collection('users')
                    .doc(companyId)
                    .collection(storeName)
                    .doc(String(id));
            } else {
                docRef = FirebaseDB.collection('users')
                    .doc(userId)
                    .collection(storeName)
                    .doc(String(id));
            }

            await docRef.delete();
            console.log(`✅ Deleted ${storeName}/${id} from cloud`);
        } catch (error) {
            console.error(`❌ Failed to delete ${storeName}/${id}:`, error);
        }
    },

    /**
     * Pull all data from cloud and merge with local
     */
    async pullFromCloud() {
        if (!this.currentUser) {
            console.warn('⚠️ No user logged in, cannot pull from cloud');
            return;
        }

        try {
            const userId = this.currentUser.uid;
            const companyId = userId;
            const stores = Object.values(DB.stores);
            const sharedStores = ['attendance', 'employees', 'delivery', 'credits', 'advances', 'stock'];
            let totalSynced = 0;

            for (const storeName of stores) {
                try {
                    let snapshot;
                    
                    if (sharedStores.includes(storeName)) {
                        // Read from companyId path
                        snapshot = await FirebaseDB.collection('users')
                            .doc(companyId)
                            .collection(storeName)
                            .get();
                        console.log(`📖 Reading ${storeName} from shared path: users/${companyId}/${storeName}`);
                    } else {
                        // Read from private userId path
                        snapshot = await FirebaseDB.collection('users')
                            .doc(userId)
                            .collection(storeName)
                            .get();
                    }

                    for (const doc of snapshot.docs) {
                        const cloudData = doc.data();
                        
                        // Remove Firebase-specific fields before saving to IndexedDB
                        const { syncedAt, userId: uid, companyId: cid, ...cleanData } = cloudData;
                        
                        // Get local data
                        const localData = await DB.getById(storeName, cleanData.id);

                        // If local doesn't exist or cloud is newer, update local
                        if (!localData || this.isCloudNewer(cloudData, localData)) {
                            await DB.update(storeName, { ...cleanData, synced: true });
                            totalSynced++;
                        }
                    }

                    console.log(`✅ Pulled ${storeName}: ${snapshot.size} items`);
                } catch (storeError) {
                    console.error(`❌ Failed to pull ${storeName}:`, storeError);
                    // Continue with other stores even if one fails
                }
            }

            if (window.App && totalSynced > 0) {
                App.showToast(`Synced ${totalSynced} items from cloud`, 'success');
            } else if (window.App && totalSynced === 0) {
                App.showToast('Cloud sync complete - no new data', 'info');
            }
            
            console.log(`✅ Total items synced: ${totalSynced}`);
        } catch (error) {
            console.error('❌ Failed to pull from cloud:', error);
            console.error('Error details:', error.code, error.message);
            
            let errorMessage = 'Sync failed';
            
            // Provide specific error messages
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied - Check Firestore rules';
                console.error('🔥 Firestore Rules Error: Make sure you have set the security rules in Firebase Console');
            } else if (error.code === 'unavailable') {
                errorMessage = 'Firebase unavailable - Check connection';
            } else if (error.message) {
                errorMessage = `Sync error: ${error.message}`;
            }
            
            if (window.App) {
                App.showToast(errorMessage, 'error');
            }
            
            throw error;
        }
    },

    /**
     * Check if cloud data is newer than local data
     */
    isCloudNewer(cloudData, localData) {
        const cloudTime = cloudData.updatedAt || cloudData.createdAt || '';
        const localTime = localData.updatedAt || localData.createdAt || '';
        return cloudTime > localTime;
    },

    /**
     * Start automatic sync every 5 minutes
     */
    startAutoSync() {
        if (this.autoSyncInterval) {
            return; // Already running
        }

        // Sync every 5 minutes
        this.autoSyncInterval = setInterval(() => {
            this.syncUnsyncedData();
        }, 5 * 60 * 1000);

        console.log('🔄 Auto-sync started (every 5 minutes)');
    },

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            console.log('⏸️ Auto-sync stopped');
        }
    },

    /**
     * Sync all unsynced data to cloud
     */
    async syncUnsyncedData() {
        if (!this.syncEnabled || !this.currentUser) {
            return;
        }

        try {
            const stores = Object.values(DB.stores);
            let totalSynced = 0;

            for (const storeName of stores) {
                try {
                    const allData = await DB.getAll(storeName);
                    const unsyncedData = allData.filter(item => !item.synced);

                    for (const data of unsyncedData) {
                        await this.pushToCloud(storeName, data);
                        // Mark as synced in local DB
                        await DB.update(storeName, { ...data, synced: true });
                        totalSynced++;
                    }

                    if (unsyncedData.length > 0) {
                        console.log(`✅ Synced ${unsyncedData.length} items from ${storeName}`);
                    }
                } catch (storeError) {
                    console.error(`❌ Failed to sync ${storeName}:`, storeError);
                }
            }

            if (totalSynced > 0) {
                console.log(`✅ Auto-sync completed: ${totalSynced} items`);
            }
            
            // Update sync status indicator
            this.checkSyncStatus();
        } catch (error) {
            console.error('❌ Auto-sync failed:', error);
        }
    },

    /**
     * Setup real-time sync for a specific store
     */
    setupRealtimeSync(storeName) {
        if (!this.currentUser) {
            return null;
        }

        const userId = this.currentUser.uid;
        const companyId = userId;
        const sharedStores = ['attendance', 'employees', 'delivery', 'credits', 'advances', 'stock'];
        
        // Unsubscribe existing listener if any
        if (this.realtimeListeners[storeName]) {
            this.realtimeListeners[storeName]();
        }

        // Setup new listener
        let collectionRef;
        if (sharedStores.includes(storeName)) {
            collectionRef = FirebaseDB.collection('users')
                .doc(companyId)
                .collection(storeName);
        } else {
            collectionRef = FirebaseDB.collection('users')
                .doc(userId)
                .collection(storeName);
        }

        const unsubscribe = collectionRef.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    const data = change.doc.data();
                    const { syncedAt, userId: uid, companyId: cid, ...cleanData } = data;

                    if (change.type === 'added' || change.type === 'modified') {
                        // Check if this change came from another device
                        const localData = await DB.getById(storeName, cleanData.id);
                        
                        if (!localData || this.isCloudNewer(data, localData)) {
                            await DB.update(storeName, { ...cleanData, synced: true });
                            console.log(`🔄 Real-time update: ${storeName}/${cleanData.id}`);
                            
                            // Refresh current module if needed
                            if (window.App && window.App.currentModule) {
                                const currentModuleName = window.App.currentModule;
                                const module = window.App.modules[currentModuleName];
                                
                                if (module && typeof module.refresh === 'function') {
                                    module.refresh();
                                }
                            }
                        }
                    } else if (change.type === 'removed') {
                        await DB.delete(storeName, cleanData.id);
                        console.log(`🔄 Real-time delete: ${storeName}/${cleanData.id}`);
                    }
                });
            }, (error) => {
                console.error(`❌ Real-time sync error for ${storeName}:`, error);
            });

        this.realtimeListeners[storeName] = unsubscribe;
        console.log(`👂 Listening for real-time updates: ${storeName}`);
        
        return unsubscribe;
    },

    /**
     * Setup real-time sync for all stores
     */
    setupAllRealtimeSync() {
        const stores = Object.values(DB.stores);
        stores.forEach(storeName => {
            this.setupRealtimeSync(storeName);
        });
    },

    /**
     * Remove all real-time listeners
     */
    removeAllRealtimeListeners() {
        Object.values(this.realtimeListeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.realtimeListeners = {};
        console.log('👂 All real-time listeners removed');
    },

    /**
     * Force full sync (push all local data to cloud)
     */
    async forceFullSync() {
        if (!this.syncEnabled || !this.currentUser) {
            if (window.App) {
                App.showToast('Please sign in to sync', 'warning');
            }
            return;
        }

        try {
            if (window.App) {
                App.showToast('Syncing data...', 'info');
            }

            const stores = Object.values(DB.stores);
            let totalPushed = 0;
            let errors = [];

            for (const storeName of stores) {
                try {
                    const allData = await DB.getAll(storeName);
                    
                    // Only sync items that haven't been synced yet (more efficient)
                    const unsyncedData = allData.filter(item => !item.synced);
                    
                    for (const data of unsyncedData) {
                        try {
                            await this.pushToCloud(storeName, data);
                            await DB.update(storeName, { ...data, synced: true });
                            totalPushed++;
                        } catch (itemError) {
                            console.error(`❌ Failed to sync ${storeName}/${data.id}:`, itemError);
                            console.error('Failed item data:', JSON.stringify(data, null, 2));
                            console.error('Error code:', itemError.code);
                            console.error('Error message:', itemError.message);
                            errors.push({ 
                                store: storeName, 
                                id: data.id, 
                                error: itemError.message || itemError.code || 'Unknown error',
                                data: data 
                            });
                        }
                    }
                } catch (storeError) {
                    console.error(`❌ Failed to sync ${storeName}:`, storeError);
                    errors.push(storeName);
                }
            }

            // Also pull from cloud to ensure we have latest
            await this.pullFromCloud();

            if (window.App) {
                if (errors.length > 0) {
                    const errorDetails = errors.map(e => `${e.store}/${e.id}: ${e.error}`).join('\n');
                    console.error('📋 SYNC ERROR DETAILS:\n' + errorDetails);
                    App.showToast(`Partially synced: ${totalPushed} items (${errors.length} errors) - Check console for details`, 'warning');
                } else if (totalPushed > 0) {
                    App.showToast(`Sync complete! ${totalPushed} items uploaded`, 'success');
                } else {
                    App.showToast('Already synced - everything is up to date', 'success');
                }
            }
            
            console.log(`✅ Full sync completed: ${totalPushed} items pushed`);
            if (errors.length > 0) {
                console.error('⚠️ SYNC ERRORS SUMMARY:');
                errors.forEach(err => {
                    console.error(`  - ${err.store}/${err.id}: ${err.error}`);
                });
            }
        } catch (error) {
            console.error('❌ Force sync failed:', error);
            console.error('Error details:', error.code, error.message);
            
            let errorMessage = 'Sync failed';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied - Check Firestore rules in Firebase Console';
            } else if (error.message && error.message.includes('Missing or insufficient permissions')) {
                errorMessage = 'Permission denied - Firestore rules need to be updated';
            } else if (error.message) {
                errorMessage = `Sync error: ${error.message}`;
            }
            
            if (window.App) {
                App.showToast(errorMessage, 'error');
            }
        } finally {
            // Update sync status after sync attempt
            this.checkSyncStatus();
        }
    }
};

// Initialize sync module when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => SyncModule.init(), 1000);
    });
} else {
    setTimeout(() => SyncModule.init(), 1000);
}

// Export globally
window.SyncModule = SyncModule;
