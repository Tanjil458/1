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
    async getAll(storeName) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getById(storeName, id) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async add(storeName, data) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add({
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                synced: false
            });
            request.onsuccess = async () => {
                const id = request.result;
                
                // Trigger cloud sync
                if (window.SyncModule?.syncEnabled) {
                    setTimeout(() => {
                        window.SyncModule.pushToCloud(storeName, { ...data, id });
                        // Update sync indicator
                        window.SyncModule.checkSyncStatus();
                    }, 100);
                } else if (window.SyncModule) {
                    // Update indicator even when not syncing
                    setTimeout(() => window.SyncModule.checkSyncStatus(), 100);
                }
                
                resolve(id);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async update(storeName, data) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({
                ...data,
                updatedAt: new Date().toISOString(),
                synced: false
            });
            request.onsuccess = async () => {
                // Trigger cloud sync
                if (window.SyncModule?.syncEnabled) {
                    setTimeout(() => {
                        window.SyncModule.pushToCloud(storeName, data);
                        // Update sync indicator
                        window.SyncModule.checkSyncStatus();
                    }, 100);
                } else if (window.SyncModule) {
                    // Update indicator even when not syncing
                    setTimeout(() => window.SyncModule.checkSyncStatus(), 100);
                }
                
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = async () => {
                // Trigger cloud sync (delete from cloud)
                if (window.SyncModule?.syncEnabled) {
                    setTimeout(() => {
                        window.SyncModule.deleteFromCloud(storeName, id);
                        // Update sync indicator
                        window.SyncModule.checkSyncStatus();
                    }, 100);
                } else if (window.SyncModule) {
                    // Update indicator even when not syncing
                    setTimeout(() => window.SyncModule.checkSyncStatus(), 100);
                }
                
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async put(storeName, data) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async query(storeName, indexName, value) {
        if (!this.instance) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
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
