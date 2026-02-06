// Sync Manager - Download data from Firestore to IndexedDB

const SyncManager = {
    isSyncing: false,
    lastSyncTime: null,

    // Sync all employee data
    async syncAll() {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return;
        }

        const session = getSession();
        console.log('📋 Session data:', session);
        
        if (!session || !session.employeeId || !session.companyId) {
            console.error('❌ No valid session found');
            UIUtils.showToast('Please login again');
            return;
        }

        this.isSyncing = true;
        UIUtils.showLoading('Syncing data...');

        try {
            const companyId = session.companyId;
            const employeeId = session.employeeId;
            
            console.log('🔄 Starting sync for:', { companyId, employeeId });

            // Sync profile
            await this.syncProfile(companyId, employeeId);

            // Sync attendance (all records)
            await this.syncAttendance(companyId, employeeId);

            // Sync deliveries (all records)
            await this.syncDeliveries(companyId, employeeId);

            // Sync advances (all)
            await this.syncAdvances(companyId, employeeId);

            this.lastSyncTime = new Date();
            localStorage.setItem('lastSyncTime', this.lastSyncTime.toISOString());

            UIUtils.hideLoading();
            UIUtils.showToast('Data synced successfully');

        } catch (error) {
            console.error('❌ Sync error:', error);
            UIUtils.hideLoading();
            
            let errorMessage = 'Sync failed. ';
            if (error.code === 'permission-denied') {
                errorMessage += 'Permission denied. Check Firestore rules.';
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

    // Sync profile
    async syncProfile(companyId, employeeId) {
        try {
            const profile = await FirestoreService.getEmployeeProfile(companyId, employeeId);
            if (profile) {
                await employeeDB.put(STORES.PROFILE, profile);
            }
        } catch (error) {
            console.error('Profile sync error:', error);
            throw error;
        }
    },

    // Sync attendance
    async syncAttendance(companyId, employeeId) {
        try {
            const attendance = await FirestoreService.getEmployeeAttendance(companyId, employeeId);
            
            // Clear old data and insert new
            await employeeDB.clear(STORES.ATTENDANCE);
            if (attendance.length > 0) {
                await employeeDB.putMany(STORES.ATTENDANCE, attendance);
            }
        } catch (error) {
            console.error('Attendance sync error:', error);
            throw error;
        }
    },

    // Sync deliveries
    async syncDeliveries(companyId, employeeId) {
        try {
            const deliveries = await FirestoreService.getEmployeeDeliveries(companyId, employeeId);
            
            // Clear old data and insert new
            await employeeDB.clear(STORES.DELIVERIES);
            if (deliveries.length > 0) {
                await employeeDB.putMany(STORES.DELIVERIES, deliveries);
            }
        } catch (error) {
            console.error('Deliveries sync error:', error);
            throw error;
        }
    },

    // Sync advances
    async syncAdvances(companyId, employeeId) {
        try {
            const advances = await FirestoreService.getEmployeeAdvances(companyId, employeeId);
            
            // Clear old data and insert new
            await employeeDB.clear(STORES.ADVANCES);
            if (advances.length > 0) {
                await employeeDB.putMany(STORES.ADVANCES, advances);
            }
        } catch (error) {
            console.error('Advances sync error:', error);
            throw error;
        }
    },

    // Get last sync time
    getLastSyncTime() {
        const lastSync = localStorage.getItem('lastSyncTime');
        if (!lastSync) return 'Never';
        
        const syncDate = new Date(lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now - syncDate) / 60000);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        
        return DateUtils.formatDisplayDate(syncDate);
    }
};
