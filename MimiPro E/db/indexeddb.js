// IndexedDB Manager for Employee App

const DB_NAME = 'MimiProEmployee';
const DB_VERSION = 1;

const STORES = {
    ATTENDANCE: 'attendance',
    DELIVERIES: 'deliveries',
    ADVANCES: 'advances',
    PROFILE: 'profile'
};

class EmployeeDB {
    constructor() {
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
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

                if (!db.objectStoreNames.contains(STORES.PROFILE)) {
                    db.createObjectStore(STORES.PROFILE, { keyPath: 'employeeId' });
                }
            };
        });
    }

    // Get all records from a store
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get records by index
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Add or update record
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Add multiple records
    async putMany(storeName, dataArray) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            dataArray.forEach(data => store.put(data));

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Clear store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Delete record
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Create global instance
const employeeDB = new EmployeeDB();

// Initialize on load
employeeDB.init().catch(error => {
    console.error('Database initialization error:', error);
});
