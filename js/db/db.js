/**
 * MimiPro - IndexedDB Setup
 */

const DB = {
    name: 'MimiProDB',
    version: 4,
    instance: null,

    stores: {
        products: 'products',
        deliveries: 'deliveries',
        employees: 'employees',
        attendance: 'attendance',
        stock: 'stock',
        credits: 'credits',
        creditPayments: 'creditPayments',
        advances: 'advances',
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

                // Areas store
                if (!db.objectStoreNames.contains('areas')) {
                    const areaStore = db.createObjectStore('areas', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    areaStore.createIndex('name', 'name', { unique: false });
                    areaStore.createIndex('active', 'active', { unique: false });
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
            request.onsuccess = () => resolve(request.result);
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
            request.onsuccess = () => resolve(request.result);
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
            request.onsuccess = () => resolve();
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
