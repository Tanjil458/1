/**
 * Firebase Configuration
 * MimiPro Firebase Project
 */

const FirebaseConfig = {
    apiKey: "AIzaSyDwlN548N9A0uRKiRGdvxmoASFCfJtvmo0",
    authDomain: "mimipro-0458.firebaseapp.com",
    databaseURL: "https://mimipro-0458-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mimipro-0458",
    storageBucket: "mimipro-0458.firebasestorage.app",
    messagingSenderId: "414929851648",
    appId: "1:414929851648:web:535b52279d5e894bfd8fe5"
};

// Flag to track initialization status
window.FirebaseInitialized = false;
window.FirebaseAuth = null;
window.FirebaseDB = null; // Firestore instance

/**
 * Initialize Firebase with retry mechanism
 * @param {number} retries - Number of retries left
 * @param {number} delay - Delay between retries in ms
 */
function initializeFirebase(retries = 5, delay = 500) {
    // Check if Firebase SDK is available
    if (typeof window.firebase === 'undefined') {
        if (retries > 0) {
            console.log(`⏳ Firebase SDK not ready yet. Retrying in ${delay}ms... (${retries} attempts left)`);
            updateFirebaseStatus('loading');
            setTimeout(() => initializeFirebase(retries - 1, delay), delay);
            return;
        } else {
            console.error('❌ Firebase SDK failed to load after multiple attempts. Running in offline mode.');
            console.error('💡 Possible causes: Network issue, CSP blocking, or script load failure');
            window.FirebaseInitialized = false;
            updateFirebaseStatus('offline');
            return;
        }
    }

    // Check if required Firebase services are available
    if (!window.firebase.firestore || !window.firebase.auth) {
        console.error('❌ Firebase services (firestore/auth) not available');
        console.error('Available services:', Object.keys(window.firebase));
        window.FirebaseInitialized = false;
        updateFirebaseStatus('offline');
        return;
    }

    // Initialize Firebase App
    try {
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(FirebaseConfig);
            console.log('✅ Firebase initialized successfully');
        } else {
            console.log('✅ Firebase already initialized');
        }
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        window.FirebaseInitialized = false;
        updateFirebaseStatus('offline');
        return;
    }

    // Initialize Firebase services
    try {
        window.FirebaseAuth = window.firebase.auth();
        window.FirebaseDB = window.firebase.firestore();

        window.FirebaseInitialized = true;
        console.log('✅ Firebase services ready');
        console.log('✅ Firestore connected');
        console.log('📊 Firebase config:', {
            projectId: FirebaseConfig.projectId,
            authDomain: FirebaseConfig.authDomain
        });
        
        // Update visual status indicator
        updateFirebaseStatus('online');
        
        // Dispatch event to notify app that Firebase is ready
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
    } catch (error) {
        console.error('❌ Firebase service initialization failed:', error);
        window.FirebaseAuth = null;
        window.FirebaseDB = null;
        updateFirebaseStatus('offline');
        window.FirebaseInitialized = false;
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeFirebase());
} else {
    initializeFirebase();
}

/**
 * Update Firebase status indicator in UI
 * @param {string} status - 'online', 'offline', or 'loading'
 */
function updateFirebaseStatus(status) {
    const statusEl = document.getElementById('firebaseStatus');
    if (!statusEl) return;
    
    const dot = statusEl.querySelector('.status-dot');
    
    switch(status) {
        case 'online':
            statusEl.style.display = 'inline-block';
            statusEl.title = 'Firebase Connected';
            if (dot) dot.style.background = '#4caf50';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
            break;
        case 'offline':
            statusEl.style.display = 'inline-block';
            statusEl.title = 'Firebase Offline - Using Local Data';
            if (dot) dot.style.background = '#f44336';
            break;
        case 'loading':
            statusEl.style.display = 'inline-block';
            statusEl.title = 'Connecting to Firebase...';
            if (dot) dot.style.background = '#ff9800';
            break;
    }
}

// Export for use in other modules
window.updateFirebaseStatus = updateFirebaseStatus;
