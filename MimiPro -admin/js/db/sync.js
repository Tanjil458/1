/**
 * Cloud Sync Module - Backup & Restore Model
 * 
 * This implements a backup+restore sync model (NOT real-time)
 * Sync happens:
 * - On app launch
 * - On manual "Sync Now" button click
 * - Owner device only
 * 
 * Firestore Structure:
 * /users/{ownerId}/  (ownerId = admin's Firebase Auth UID)
 *   /employees/{employeeId}
 *   /attendance/{attendanceId}
 *   /advances/{advanceId}
 *   /delivery/{deliveryId}
 *   ... etc
 * 
 * Note: "users" collection is used for compatibility with existing data.
 * Each user document represents an owner/company.
 * 
 * Key Features:
 * - Bidirectional sync (upload changed, download newer)
 * - Conflict resolution (cloud newer wins)
 * - Soft deletes (deleted: true flag)
 * - No real-time listeners
 * - Source of truth: Firestore = backup, IndexedDB = primary
 */

const SyncModule = {
    currentUser: null,
    syncEnabled: false,
    isSyncing: false,
    lastSyncTime: null,

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
                
                // Pull data from cloud when user logs in (app launch sync)
                await this.syncNow();
                
                if (window.App) {
                    App.showToast(`Signed in as ${user.email}`, 'success');
                }
            } else {
                console.log('❌ User logged out');
                this.syncEnabled = false;
                
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
                    const allData = await DB.getAll(storeName, true); // Include deleted
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
     * Main sync function - called manually
     * Implements backup + restore model
     */
    async syncNow() {
        if (!this.syncEnabled || !this.currentUser) {
            if (window.App) {
                App.showToast('Please sign in to sync', 'warning');
            }
            return;
        }

        if (this.isSyncing) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.isSyncing = true;
        this.updateSyncIndicator('syncing');

        try {
            console.log('🔄 Starting backup & restore sync...');
            
            if (window.App) {
                App.showToast('Syncing data...', 'info');
            }

            const ownerId = this.currentUser.uid;
            console.log('🔑 Admin Firebase Auth UID:', ownerId);
            
            // Step 1: Upload local changes to cloud (backup)
            await this.uploadLocalChanges(ownerId);
            
            // Step 2: Download cloud data and merge (restore)
            await this.downloadAndMerge(ownerId);
            
            this.lastSyncTime = new Date();
            localStorage.setItem('lastSyncTime', this.lastSyncTime.toISOString());
            
            console.log('✅ Sync completed successfully');
            
            if (window.App) {
                App.showToast('Sync complete!', 'success');
            }
            
            // Update sync status after completion
            await this.checkSyncStatus();
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            console.error('Error details:', error.code, error.message);
            
            let errorMessage = 'Sync failed';
            
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
            
            this.updateSyncIndicator('error');
            
        } finally {
            this.isSyncing = false;
        }
    },

    /**
     * Upload local changes to Firestore (Backup)
     * Only uploads records where local.updatedAt > cloud.updatedAt
     */
    async uploadLocalChanges(ownerId) {
        console.log('⬆️ Uploading local changes...');
        
        const stores = Object.values(DB.stores);
        let uploadCount = 0;
        let errors = [];

        for (const storeName of stores) {
            try {
                // Get all unsynced items (including deleted ones)
                const allData = await DB.getAll(storeName, true);
                const unsyncedData = allData.filter(item => !item.synced);

                for (const localItem of unsyncedData) {
                    try {
                        // Check if cloud has newer version
                        const cloudItem = await this.getFromCloud(ownerId, storeName, localItem.id);
                        
                        // Upload if: 
                        // 1. Item doesn't exist in cloud, OR
                        // 2. Local is newer than cloud
                        if (!cloudItem || this.isLocalNewer(localItem, cloudItem)) {
                            await this.pushToCloud(ownerId, storeName, localItem);
                            
                            // Mark as synced in local DB
                            await DB.update(storeName, { ...localItem, synced: true });
                            uploadCount++;
                            
                            console.log(`✅ Uploaded ${storeName}/${localItem.id}`);
                        } else {
                            console.log(`⏭️ Skipped ${storeName}/${localItem.id} - cloud is newer`);
                        }
                    } catch (itemError) {
                        console.error(`❌ Failed to upload ${storeName}/${localItem.id}:`, itemError);
                        errors.push({
                            store: storeName,
                            id: localItem.id,
                            error: itemError.message || 'Unknown error'
                        });
                    }
                }
            } catch (storeError) {
                console.error(`❌ Failed to process ${storeName}:`, storeError);
            }
        }

        console.log(`⬆️ Upload complete: ${uploadCount} items uploaded`);
        
        if (errors.length > 0) {
            console.error('⚠️ Upload errors:', errors);
        }
    },

    /**
     * Download data from Firestore and merge with local (Restore)
     */
    async downloadAndMerge(ownerId) {
        console.log('⬇️ Downloading from cloud...');
        
        const stores = Object.values(DB.stores);
        let downloadCount = 0;

        for (const storeName of stores) {
            try {
                // Download all items from this collection
                const cloudItems = await this.getAllFromCloud(ownerId, storeName);
                
                for (const cloudItem of cloudItems) {
                    try {
                        const localItem = await DB.getById(storeName, cloudItem.id);
                        
                        // Download if:
                        // 1. Item doesn't exist locally, OR
                        // 2. Cloud is newer than local
                        if (!localItem || this.isCloudNewer(cloudItem, localItem)) {
                            // Merge with synced flag
                            await DB.update(storeName, { ...cloudItem, synced: true });
                            downloadCount++;
                            console.log(`✅ Downloaded ${storeName}/${cloudItem.id}`);
                        }
                    } catch (itemError) {
                        console.error(`❌ Failed to merge ${storeName}/${cloudItem.id}:`, itemError);
                    }
                }
                
                console.log(`⬇️ Downloaded ${cloudItems.length} items from ${storeName}`);
                
            } catch (storeError) {
                console.error(`❌ Failed to download ${storeName}:`, storeError);
            }
        }

        console.log(`⬇️ Download complete: ${downloadCount} items merged`);
    },

    /**
     * Push single item to cloud
     */
    async pushToCloud(ownerId, storeName, data) {
        try {
            // Determine collection path based on store type
            const collectionPath = this.getCollectionPath(ownerId, storeName);
            
            const docRef = FirebaseDB.collection('users')
                .doc(ownerId)
                .collection(collectionPath)
                .doc(String(data.id));

            // Prepare data for Firestore
            const firestoreData = {
                ...data,
                ownerId: ownerId,
                employeeId: data.employeeId ? String(data.employeeId) : null,
                updatedAt: data.updatedAt || new Date().toISOString(),
                createdAt: data.createdAt || new Date().toISOString(),
                deleted: data.deleted || false,
                syncVersion: data.syncVersion || 1,
                syncedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await docRef.set(firestoreData, { merge: true });
            
            console.log(`✅ Pushed ${storeName}/${data.id} to cloud`);
            
        } catch (error) {
            console.error(`❌ Failed to push ${storeName}/${data.id}:`, error);
            throw error;
        }
    },

    /**
     * Get single item from cloud
     */
    async getFromCloud(ownerId, storeName, id) {
        try {
            const collectionPath = this.getCollectionPath(ownerId, storeName);
            
            const docRef = FirebaseDB.collection('users')
                .doc(ownerId)
                .collection(collectionPath)
                .doc(String(id));

            const doc = await docRef.get();
            
            if (!doc.exists) {
                return null;
            }
            
            const data = doc.data();
            // Remove Firestore-specific fields
            const { syncedAt, ...cleanData } = data;
            
            return cleanData;
            
        } catch (error) {
            console.error(`❌ Failed to get ${storeName}/${id} from cloud:`, error);
            throw error;
        }
    },

    /**
     * Get all items from a cloud collection
     */
    async getAllFromCloud(ownerId, storeName) {
        try {
            const collectionPath = this.getCollectionPath(ownerId, storeName);
            
            const snapshot = await FirebaseDB.collection('users')
                .doc(ownerId)
                .collection(collectionPath)
                .get();
            
            const items = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const { syncedAt, ...cleanData } = data;
                items.push(cleanData);
            });
            
            return items;
            
        } catch (error) {
            console.error(`❌ Failed to get all from ${storeName}:`, error);
            throw error;
        }
    },

    /**
     * Get collection path for a store
     * Maps local store names to Firestore collection names
     */
    getCollectionPath(ownerId, storeName) {
        // Map store names to Firestore collections
        const collectionMap = {
            'employees': 'employees',
            'attendance': 'attendance',
            'advances': 'advances',
            'productAdvances': 'productAdvances',
            'repayments': 'repayments',
            'salaryReports': 'salaryReports',
            'deliveries': 'delivery',
            'delivery': 'delivery',
            'stock': 'stock',
            'credits': 'credits',
            'creditPayments': 'creditPayments',
            'products': 'products',
            'customers': 'customers',
            'history': 'history',
            'expenses': 'expenses',
            'areas': 'areas'
        };
        
        return collectionMap[storeName] || storeName;
    },

    /**
     * Check if local data is newer than cloud data
     */
    isLocalNewer(localData, cloudData) {
        const localTime = localData.updatedAt || localData.createdAt || '';
        const cloudTime = cloudData.updatedAt || cloudData.createdAt || '';
        return localTime > cloudTime;
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
     * Get last sync time formatted
     */
    getLastSyncTime() {
        if (!this.lastSyncTime) {
            const stored = localStorage.getItem('lastSyncTime');
            if (stored) {
                this.lastSyncTime = new Date(stored);
            }
        }
        
        if (!this.lastSyncTime) {
            return 'Never';
        }
        
        const now = new Date();
        const diffMs = now - this.lastSyncTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        
        return this.lastSyncTime.toLocaleDateString();
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
