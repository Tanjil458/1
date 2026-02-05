/**
 * Helper utilities for MimiPro app
 */

/**
 * Check if Firebase is available and initialized
 * @returns {boolean} True if Firebase is ready to use
 */
function isFirebaseAvailable() {
    return window.FirebaseInitialized === true && 
           window.FirebaseDB !== null && 
           window.FirebaseAuth !== null;
}

/**
 * Wait for Firebase to be ready
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<boolean>} Resolves to true when Firebase is ready, false on timeout
 */
function waitForFirebase(timeout = 10000) {
    return new Promise((resolve) => {
        if (isFirebaseAvailable()) {
            resolve(true);
            return;
        }

        const timeoutId = setTimeout(() => {
            window.removeEventListener('firebaseReady', onReady);
            console.warn('⚠️ Firebase initialization timeout - continuing in offline mode');
            resolve(false);
        }, timeout);

        const onReady = () => {
            clearTimeout(timeoutId);
            resolve(true);
        };

        window.addEventListener('firebaseReady', onReady, { once: true });
    });
}

/**
 * Safely execute a Firebase operation with fallback
 * @param {Function} firebaseOperation - Function to execute if Firebase is available
 * @param {Function} fallbackOperation - Function to execute if Firebase is not available
 * @returns {Promise<any>} Result of the operation
 */
async function safeFirebaseOperation(firebaseOperation, fallbackOperation = null) {
    const isReady = await waitForFirebase(5000);
    
    if (isReady) {
        try {
            return await firebaseOperation();
        } catch (error) {
            console.error('Firebase operation failed:', error);
            if (fallbackOperation) {
                return await fallbackOperation();
            }
            throw error;
        }
    } else {
        console.warn('Firebase not available, using fallback operation');
        if (fallbackOperation) {
            return await fallbackOperation();
        }
        throw new Error('Firebase not available and no fallback provided');
    }
}

// Export helpers globally
window.isFirebaseAvailable = isFirebaseAvailable;
window.waitForFirebase = waitForFirebase;
window.safeFirebaseOperation = safeFirebaseOperation;