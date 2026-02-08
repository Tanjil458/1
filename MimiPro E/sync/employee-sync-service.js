/**
 * Employee Sync Service - Read-Only Download with Filtering
 * 
 * Key Rules:
 * - NEVER writes to Firestore (read-only)
 * - Only downloads data filtered by employeeId
 * - Merges data instead of clearing entire store
 * - Respects deleted flag (filters out deleted:true)
 * - Syncs on app launch and manual "Sync Now"
 */

const EmployeeSyncService = {
    isSyncing: false,
    lastSyncTime: null,

    /**
     * Main sync function - Download only
     * Filters all data by current employee's ID
     */
    async syncNow() {
        const session = getSession();
        
        if (!session || !session.employeeId || !session.companyId) {
            console.error('❌ No valid session found');
            UIUtils.showToast('Please login again');
            return;
        }

        if (this.isSyncing) {
            console.log('⚠️ Sync already in progress');
            return;
        }

        this.isSyncing = true;
        UIUtils.showLoading('Syncing data...');

        try {
            console.log('🔄 Starting employee sync (read-only)...');
            
            const companyId = session.companyId;
            const employeeId = session.employeeId;
            
            console.log('📋 Sync params:', { companyId, employeeId });

            // Ensure database is initialized
            await employeeDB.ensureDB();

            // Download and merge each data type
            const syncResults = {
                profile: await this.syncEmployeeProfile(companyId, employeeId),
                attendance: await this.syncAttendance(companyId, employeeId),
                deliveries: await this.syncDeliveries(companyId, employeeId),
                advances: await this.syncAdvances(companyId, employeeId)
            };

            this.lastSyncTime = new Date();
            localStorage.setItem('lastSyncTime', this.lastSyncTime.toISOString());

            // Calculate total synced items (including profile) - safeguard against undefined
            const totalSynced = (syncResults.profile || 0) + (syncResults.attendance || 0) + (syncResults.deliveries || 0) + (syncResults.advances || 0);
            
            console.log('✅ Employee sync completed successfully');
            console.log('📊 Sync Summary:', syncResults);
            
            UIUtils.hideLoading();
            
            // Show detailed sync message (profile not shown to keep message simple)
            if (totalSynced === 0) {
                UIUtils.showToast('⚠️ Sync complete - No new data found. Ask admin to sync data first.', 'warning');
            } else {
                UIUtils.showToast(`✅ Synced ${totalSynced} records (Attendance: ${syncResults.attendance}, Advances: ${syncResults.advances}, Deliveries: ${syncResults.deliveries})`, 'success');
            }

        } catch (error) {
            console.error('❌ Employee sync error:', error);
            
            UIUtils.hideLoading();
            
            let errorMessage = 'Sync failed. ';
            if (error.code === 'permission-denied') {
                errorMessage += 'Permission denied. Contact admin.';
            } else if (error.code === 'unavailable') {
                errorMessage += 'Network error. Check internet connection.';
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please try again.';
            }
            
            UIUtils.showToast(errorMessage);
            
        } finally {
            this.isSyncing = false;
        }
    },

    /**
     * Sync employee profile (filtered by employeeId)
     * @returns {number} 1 if profile synced, 0 otherwise
     */
    async syncEmployeeProfile(companyId, employeeId) {
        try {
            console.log('📥 Syncing employee profile...');
            
            // Query Firestore for this employee's profile
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('employees')
                .where('employeeId', '==', String(employeeId)) // Fixed: was 'id', should be 'employeeId'
                .where('deleted', '==', false) // Filter out deleted
                .get();
            
            if (snapshot.empty) {
                console.warn('⚠️ Employee profile not found in Firestore');
                return 0;
            }
            
            const doc = snapshot.docs[0];
            const profile = { ...doc.data() };
            
            // Verify this is actually for the logged-in employee (security check)
            if (String(profile.employeeId) !== String(employeeId)) {
                console.error('❌ Security violation: Profile employeeId mismatch');
                return 0;
            }
            
            // Update session with latest role (in case it changed)
            const session = getSession();
            if (session && profile.role && profile.role !== session.role) {
                console.log('🔄 Updating session role from', session.role, 'to', profile.role);
                session.role = profile.role;
                localStorage.setItem('employeeSession', JSON.stringify(session));
            }
            
            // Merge into local DB
            await employeeDB.put(STORES.PROFILE, profile);
            console.log('✅ Profile synced');
            return 1;
            
        } catch (error) {
            console.error('❌ Profile sync error:', error);
            return 0;
        }
    },

    /**
     * Sync attendance records (filtered by employeeId)
     * @returns {number} Number of attendance records found in cloud
     */
    async syncAttendance(companyId, employeeId) {
        try {
            console.log('📥 Syncing attendance...');
            console.log('📋 Query params:', { 
                companyId, 
                employeeId: String(employeeId),
                employeeIdType: typeof employeeId
            });
            
            // Query Firestore for this employee's attendance
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('attendance')
                .where('employeeId', '==', String(employeeId))
                .where('deleted', '==', false) // Filter out deleted
                .get();
            
            const cloudRecords = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Double-check filtering (security verification)
                if (String(data.employeeId) === String(employeeId)) {
                    cloudRecords.push(data);
                } else {
                    console.warn('⚠️ Filtered out record with wrong employeeId:', data.id);
                }
            });
            
            console.log(`✅ Found ${cloudRecords.length} attendance records in cloud`);
            
            if (cloudRecords.length === 0) {
                console.warn('⚠️ No attendance records found for this employee. Admin may need to sync first.');
            }
            
            // Merge strategy: Update existing or insert new
            await this.mergeRecords(STORES.ATTENDANCE, cloudRecords);
            
            console.log(`✅ Attendance synced (${cloudRecords.length} records)`);
            
            return cloudRecords.length;
            
        } catch (error) {
            console.error('❌ Attendance sync error:', error);
            return 0;
        }
    },

    /**
     * Sync delivery records (DSR sees all, others see only their own)
     * @returns {number} Number of delivery records found in cloud
     */
    async syncDeliveries(companyId, employeeId) {
        try {
            console.log('📥 Syncing deliveries...');
            
            const session = getSession();
            const isDSR = session && session.role === 'DSR';
            
            console.log('🚚 Delivery sync mode:', isDSR ? 'DSR (ALL deliveries)' : 'Regular (filtered by employeeId)');
            
            let snapshot;
            
            if (isDSR) {
                // DSR sees ALL deliveries (not filtered by employeeId)
                snapshot = await firestoreDB.collection('users')
                    .doc(companyId)
                    .collection('delivery')
                    .where('deleted', '==', false) // Filter out deleted
                    .orderBy('date', 'desc')
                    .limit(100) // Get reasonable amount
                    .get();
            } else {
                // Regular employee sees only their own deliveries
                snapshot = await firestoreDB.collection('users')
                    .doc(companyId)
                    .collection('delivery')
                    .where('employeeId', '==', String(employeeId))
                    .where('deleted', '==', false) // Filter out deleted
                    .get();
            }
            
            const cloudRecords = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // For DSR, include all records
                // For regular employee, double-check filtering (security verification)
                if (isDSR || String(data.employeeId) === String(employeeId)) {
                    cloudRecords.push(data);
                } else {
                    console.warn('⚠️ Filtered out delivery with wrong employeeId:', data.id);
                }
            });
            
            console.log(`✅ Found ${cloudRecords.length} delivery records in cloud`);
            
            if (cloudRecords.length === 0 && !isDSR) {
                console.warn('⚠️ No delivery records found for this employee. Admin may need to sync first.');
            }
            
            // Merge strategy: Update existing or insert new
            await this.mergeRecords(STORES.DELIVERIES, cloudRecords);
            
            console.log(`✅ Deliveries synced (${cloudRecords.length} records)`);
            
            return cloudRecords.length;
            
        } catch (error) {
            console.error('❌ Deliveries sync error:', error);
            return 0;
        }
    },

    /**
     * Sync advance records (filtered by employeeId)
     * @returns {number} Number of advance records found in cloud
     */
    async syncAdvances(companyId, employeeId) {
        try {
            console.log('📥 Syncing advances...');
            console.log('📋 Query params:', { 
                companyId, 
                employeeId: String(employeeId),
                employeeIdType: typeof employeeId
            });
            
            // Query Firestore for this employee's advances
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('advances')
                .where('employeeId', '==', String(employeeId))
                .where('deleted', '==', false) // Filter out deleted
                .get();
            
            const cloudRecords = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Double-check filtering (security verification)
                if (String(data.employeeId) === String(employeeId)) {
                    cloudRecords.push(data);
                } else {
                    console.warn('⚠️ Filtered out advance with wrong employeeId:', data.id);
                }
            });
            
            console.log(`✅ Found ${cloudRecords.length} advance records in cloud`);
            
            if (cloudRecords.length === 0) {
                console.warn('⚠️ No advance records found for this employee. Admin may need to sync first.');
            }
            
            // Merge strategy: Update existing or insert new
            await this.mergeRecords(STORES.ADVANCES, cloudRecords);
            
            console.log(`✅ Advances synced (${cloudRecords.length} records)`);
            
            return cloudRecords.length;
            
        } catch (error) {
            console.error('❌ Advances sync error:', error);
            return 0;
        }
    },

    /**
     * Merge cloud records with local data (instead of clearing entire store)
     * This preserves local data integrity and avoids data loss
     */
    async mergeRecords(storeName, cloudRecords) {
        try {
            // Get existing local records
            const localRecords = await employeeDB.getAll(storeName);
            const localMap = new Map(localRecords.map(r => [r.id, r]));
            
            let insertCount = 0;
            let updateCount = 0;
            let skipCount = 0;
            
            // Process each cloud record
            for (const cloudRecord of cloudRecords) {
                const localRecord = localMap.get(cloudRecord.id);
                
                if (!localRecord) {
                    // New record - insert
                    await employeeDB.put(storeName, cloudRecord);
                    insertCount++;
                } else {
                    // Check if cloud is newer
                    const cloudTime = cloudRecord.updatedAt || cloudRecord.createdAt || '';
                    const localTime = localRecord.updatedAt || localRecord.createdAt || '';
                    
                    if (cloudTime > localTime) {
                        // Cloud is newer - update
                        await employeeDB.put(storeName, cloudRecord);
                        updateCount++;
                    } else {
                        // Local is same or newer - skip
                        skipCount++;
                    }
                }
            }
            
            // Handle deletions: Remove local records that don't exist in cloud anymore
            // (This handles deleted:true items that were filtered out in the query)
            const cloudIds = new Set(cloudRecords.map(r => r.id));
            const session = getSession();
            let deleteCount = 0;
            
            for (const localRecord of localRecords) {
                // Only delete if:
                // 1. Not in cloud anymore
                // 2. Belongs to this employee (safety check)
                if (!cloudIds.has(localRecord.id) && 
                    String(localRecord.employeeId) === String(session.employeeId)) {
                    await employeeDB.delete(storeName, localRecord.id);
                    deleteCount++;
                }
            }
            
            console.log(`📊 Merge stats for ${storeName}:`, {
                inserted: insertCount,
                updated: updateCount,
                deleted: deleteCount,
                skipped: skipCount,
                total: cloudRecords.length
            });
            
        } catch (error) {
            console.error(`❌ Failed to merge ${storeName}:`, error);
            throw error;
        }
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
        if (diffMins < 60) return `${diffMins} minutes ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        
        return DateUtils.formatDisplayDate(this.lastSyncTime);
    }
};

// Make available globally
window.EmployeeSyncService = EmployeeSyncService;

// Sync on app launch (with delay to ensure auth is ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const session = getSession();
            if (session && session.employeeId && session.companyId) {
                EmployeeSyncService.syncNow();
            }
        }, 2000);
    });
} else {
    setTimeout(() => {
        const session = getSession();
        if (session && session.employeeId && session.companyId) {
            EmployeeSyncService.syncNow();
        }
    }, 2000);
}
