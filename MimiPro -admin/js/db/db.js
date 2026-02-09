/**
 * MimiPro - IndexedDB Setup
 */

const DB = {
    name: 'MimiProDB',
    version: 8,
    instance: null,

    stores: {
        products: 'products',
        history: 'history',
        customers: 'customers',
        deliveries: 'deliveries',
        employees: 'employees',
        attendance: 'attendance',
        stock: 'stock',
        credits: 'credits',
        creditPayments: 'creditPayments',
        advances: 'advances',
        productAdvances: 'productAdvances',
        repayments: 'repayments',
        salaryReports: 'salaryReports',
        expenses: 'expenses',
        areas: 'areas'
    },

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.instance = request.result;
                
                // Handle version change (e.g., when another tab opens with newer version)
                this.instance.onversionchange = () => {
                    console.warn('⚠️ Database version changed, closing connection');
                    this.instance.close();
                    this.instance = null;
                };
                
                // Handle unexpected connection close
                this.instance.onclose = () => {
                    console.warn('⚠️ Database connection closed unexpectedly');
                    this.instance = null;
                };
                
                console.log('✅ Database initialized');
                resolve(this.instance);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                // Products store
                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    productStore.createIndex('name', 'name', { unique: false });
                    productStore.createIndex('active', 'active', { unique: false });
                }

                // Deliveries store
                if (!db.objectStoreNames.contains('deliveries')) {
                    const deliveryStore = db.createObjectStore('deliveries', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    deliveryStore.createIndex('date', 'date', { unique: false });
                    deliveryStore.createIndex('deliverymanId', 'deliverymanId', { unique: false });
                    deliveryStore.createIndex('synced', 'synced', { unique: false });
                }

                // History store (Delivery Calculation)
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    historyStore.createIndex('date', 'date', { unique: false });
                }

                // Customers store
                if (!db.objectStoreNames.contains('customers')) {
                    const customerStore = db.createObjectStore('customers', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    customerStore.createIndex('name', 'name', { unique: false });
                    customerStore.createIndex('area', 'area', { unique: false });
                }

                // Employees store
                if (!db.objectStoreNames.contains('employees')) {
                    const employeeStore = db.createObjectStore('employees', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    employeeStore.createIndex('name', 'name', { unique: false });
                    employeeStore.createIndex('active', 'active', { unique: false });
                }

                // Stock store
                if (!db.objectStoreNames.contains('stock')) {
                    const stockStore = db.createObjectStore('stock', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    stockStore.createIndex('productName', 'productName', { unique: false });
                }

                // Credits store
                if (!db.objectStoreNames.contains('credits')) {
                    const creditStore = db.createObjectStore('credits', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    creditStore.createIndex('date', 'date', { unique: false });
                }

                // Credit Payments store
                if (!db.objectStoreNames.contains('creditPayments')) {
                    const paymentStore = db.createObjectStore('creditPayments', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    paymentStore.createIndex('creditId', 'creditId', { unique: false });
                    paymentStore.createIndex('date', 'date', { unique: false });
                }

                // Attendance store
                if (!db.objectStoreNames.contains('attendance')) {
                    const attendanceStore = db.createObjectStore('attendance', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    attendanceStore.createIndex('employeeId', 'employeeId', { unique: false });
                    attendanceStore.createIndex('date', 'date', { unique: false });
                }

                // Advances store
                if (!db.objectStoreNames.contains('advances')) {
                    const advanceStore = db.createObjectStore('advances', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    advanceStore.createIndex('employeeId', 'employeeId', { unique: false });
                    advanceStore.createIndex('date', 'date', { unique: false });
                }

                // Product Advances store
                if (!db.objectStoreNames.contains('productAdvances')) {
                    const productAdvanceStore = db.createObjectStore('productAdvances', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    productAdvanceStore.createIndex('employeeId', 'employeeId', { unique: false });
                    productAdvanceStore.createIndex('date', 'date', { unique: false });
                    productAdvanceStore.createIndex('productName', 'productName', { unique: false });
                }

                // Repayments store
                if (!db.objectStoreNames.contains('repayments')) {
                    const repaymentStore = db.createObjectStore('repayments', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    repaymentStore.createIndex('employeeId', 'employeeId', { unique: false });
                    repaymentStore.createIndex('date', 'date', { unique: false });
                    repaymentStore.createIndex('method', 'method', { unique: false });
                }

                // Salary Reports store
                if (!db.objectStoreNames.contains('salaryReports')) {
                    const salaryStore = db.createObjectStore('salaryReports', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    salaryStore.createIndex('month', 'month', { unique: false });
                    salaryStore.createIndex('employeeId', 'employeeId', { unique: false });
                }

                // Areas store
                if (!db.objectStoreNames.contains('areas')) {
                    const areaStore = db.createObjectStore('areas', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    areaStore.createIndex('name', 'name', { unique: false });
                    areaStore.createIndex('active', 'active', { unique: false });
                }

                // Expenses store
                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    expenseStore.createIndex('date', 'date', { unique: false });
                    expenseStore.createIndex('category', 'category', { unique: false });
                    expenseStore.createIndex('synced', 'synced', { unique: false });
                }

                console.log('📦 Database schema created');
            };
        });
    },

    // Generic CRUD operations
    async ensureConnection() {
        // If no instance or instance is not valid, reinitialize
        if (!this.instance || (this.instance && !this.instance.objectStoreNames)) {
            console.log('🔄 Reinitializing database connection...');
            await this.init();
        }
        return this.instance;
    },

    async getAll(storeName, includeDeleted = false) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => {
                    const results = request.result;
                    // Filter out deleted records unless explicitly requested
                    const filtered = includeDeleted ? results : results.filter(item => !item.deleted);
                    resolve(filtered);
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    },

    async getById(storeName, id) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    },

    async add(storeName, data) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const now = new Date().toISOString();
                const request = store.add({
                    ...data,
                    createdAt: now,
                    updatedAt: now,
                    synced: false,
                    deleted: false,
                    syncVersion: 1
                });
                request.onsuccess = async () => {
                    const id = request.result;
                    
                    // Update sync indicator
                    if (window.SyncModule) {
                        setTimeout(() => window.SyncModule.checkSyncStatus(), 100);
                    }
                    
                    resolve(id);
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    },

    async update(storeName, data) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put({
                    ...data,
                    updatedAt: new Date().toISOString(),
                    synced: false,
                    deleted: data.deleted || false,
                    syncVersion: (data.syncVersion || 0) + 1
                });
                request.onsuccess = async () => {
                    // Update sync indicator
                    if (window.SyncModule) {
                        setTimeout(() => window.SyncModule.checkSyncStatus(), 100);
                    }
                    
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    },

    async delete(storeName, id) {
        await this.ensureConnection();
        // Implement soft delete - mark as deleted instead of hard delete
        const existing = await this.getById(storeName, id);
        if (!existing) {
            return Promise.resolve();
        }
        
        return this.update(storeName, {
            ...existing,
            deleted: true,
            updatedAt: new Date().toISOString(),
            synced: false,
            syncVersion: (existing.syncVersion || 0) + 1
        });
    },

    async clear(storeName) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    },

    async put(storeName, data) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    },

    async query(storeName, indexName, value) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.instance.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    }
};

// Initialize on load and make it available globally
let dbReady = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await DB.init();
        dbReady = true;
        console.log('✅ DB ready for use');
    });
} else {
    DB.init().then(() => {
        dbReady = true;
        console.log('✅ DB ready for use');
    });
}

window.DB = DB;
