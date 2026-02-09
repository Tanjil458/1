// IndexedDB Manager for Employee App

const DB_NAME = 'MimiProEmployee';
const DB_VERSION = 2; // bumped to create new stores during upgrade

const STORES = {
    ATTENDANCE: 'attendance',
    DELIVERIES: 'deliveries',
    ADVANCES: 'advances',
    PRODUCT_ADVANCES: 'productAdvances',
    REPAYMENTS: 'repayments',
    PROFILE: 'profile'
};

class EmployeeDB {
    constructor() {
        this.db = null;
        this.isInitializing = false;
    }

    // Initialize database
    async init() {
        // Prevent multiple simultaneous initializations
        if (this.isInitializing) {
            return this.waitForInit();
        }

        if (this.db) {
            return this.db; // Already initialized
        }

        this.isInitializing = true;

        const openOnce = (allowRetry = true) => {
            return new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    this.isInitializing = false;
                    return reject(new Error('IndexedDB not supported in this environment'));
                }

                let request;
                try {
                    request = indexedDB.open(DB_NAME, DB_VERSION);
                } catch (err) {
                    this.isInitializing = false;
                    return reject(err);
                }

                request.onerror = async () => {
                    const err = request.error;
                    console.error('IndexedDB open error:', err);

                    // If the backing store is corrupted or we get an UnknownError, attempt to delete DB and retry once
                    const message = err && err.message ? err.message : '';
                    const isBackingStore = /backing store/i.test(message) || err.name === 'UnknownError';

                    if (isBackingStore && allowRetry) {
                        console.warn('Detected backing-store/internal error; attempting to delete corrupted IndexedDB and retry');
                        try {
                            const delReq = indexedDB.deleteDatabase(DB_NAME);
                            delReq.onerror = () => {
                                this.isInitializing = false;
                                reject(delReq.error || err);
                            };
                            delReq.onsuccess = async () => {
                                console.info('Deleted corrupted IndexedDB; retrying open');
                                // small delay before retry
                                await new Promise(r => setTimeout(r, 200));
                                openOnce(false).then(resolve).catch(reject);
                            };
                        } catch (e) {
                            this.isInitializing = false;
                            reject(e);
                        }
                        return;
                    }

                    this.isInitializing = false;
                    reject(err);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.isInitializing = false;

                    // Handle version change / external closing
                    this.db.onversionchange = () => {
                        console.warn('⚠️ IndexedDB version change - closing connection');
                        try { this.db.close(); } catch(e){}
                        this.db = null;
                    };

                    request.result.onclose = () => {
                        // Some browsers might expose onclose; make sure to clear ref
                        console.warn('⚠️ IndexedDB connection closed');
                        this.db = null;
                    };

                    resolve(this.db);
                };

                request.onblocked = () => {
                    console.warn('IndexedDB open blocked by another tab/process');
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create object stores
                    if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
                        const attendanceStore = db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id', autoIncrement: true });
                        attendanceStore.createIndex('date', 'date', { unique: false });
                        attendanceStore.createIndex('employeeId', 'employeeId', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(STORES.DELIVERIES)) {
                        const deliveryStore = db.createObjectStore(STORES.DELIVERIES, { keyPath: 'id', autoIncrement: true });
                        deliveryStore.createIndex('date', 'date', { unique: false });
                        deliveryStore.createIndex('employeeId', 'employeeId', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(STORES.ADVANCES)) {
                        const advanceStore = db.createObjectStore(STORES.ADVANCES, { keyPath: 'id', autoIncrement: true });
                        advanceStore.createIndex('date', 'date', { unique: false });
                        advanceStore.createIndex('employeeId', 'employeeId', { unique: false });
                    }

                    // productAdvances store (admin app tracks product advances separately)
                    if (!db.objectStoreNames.contains(STORES.PRODUCT_ADVANCES)) {
                        const pStore = db.createObjectStore(STORES.PRODUCT_ADVANCES, { keyPath: 'id', autoIncrement: true });
                        pStore.createIndex('date', 'date', { unique: false });
                        pStore.createIndex('employeeId', 'employeeId', { unique: false });
                    }

                    // repayments store
                    if (!db.objectStoreNames.contains(STORES.REPAYMENTS)) {
                        const rStore = db.createObjectStore(STORES.REPAYMENTS, { keyPath: 'id', autoIncrement: true });
                        rStore.createIndex('date', 'date', { unique: false });
                        rStore.createIndex('employeeId', 'employeeId', { unique: false });
                    }
                    if (!db.objectStoreNames.contains(STORES.PROFILE)) {
                        db.createObjectStore(STORES.PROFILE, { keyPath: 'employeeId' });
                    }
                };
            });
        };

        try {
            return await openOnce(true);
        } catch (error) {
            this.isInitializing = false;
            throw error;
        }
    }

    // Wait for initialization to complete
    async waitForInit() {
        let attempts = 0;
        while (this.isInitializing && attempts < 50) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        if (this.db) return this.db;
        return this.init();
    }

    // Ensure DB is ready before transactions
    async ensureDB() {
        if (!this.db) {
            console.log('📂 Reinitializing IndexedDB...');
            await this.init();
        }
        return this.db;
    }

    // Get all records from a store
    async getAll(storeName) {
        try {
            await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error in getAll:', error);
            throw error;
        }
    }

    // Get records by index
    async getByIndex(storeName, indexName, value) {
        try {
            await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error in getByIndex:', error);
            throw error;
        }
    }

    // Add or update record
    async put(storeName, data) {
        try {
            await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error in put:', error);
            throw error;
        }
    }

    // Add multiple records
    async putMany(storeName, dataArray) {
        try {
            await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);

                dataArray.forEach(data => store.put(data));

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('❌ Error in putMany:', error);
            throw error;
        }
    }

    // Clear store
    async clear(storeName) {
        try {
            await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error in clear:', error);
            throw error;
        }
    }

    // Delete record
    async delete(storeName, key) {
        try {
            await this.ensureDB();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Error in delete:', error);
            throw error;
        }
    }
}

// Create global instance
const employeeDB = new EmployeeDB();

// Export STORES globally so other modules can use it
window.STORES = STORES;

// Initialize on load (with error handling)
employeeDB.init().catch(error => {
    console.error('❌ Database initialization error:', error);
    console.warn('⚠️ App will attempt to reinitialize DB on first use');
}).then(() => {
    console.log('✅ Employee IndexedDB initialized successfully');
});
