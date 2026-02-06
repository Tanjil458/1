// Firestore Configuration for Employee App

// Firebase Configuration (same as admin app)
const firebaseConfig = {
    apiKey: "AIzaSyDwlN548N9A0uRKiRGdvxmoASFCfJtvmo0",
    authDomain: "mimipro-0458.firebaseapp.com",
    projectId: "mimipro-0458",
    storageBucket: "mimipro-0458.firebasestorage.app",
    messagingSenderId: "414929851648",
    appId: "1:414929851648:web:535b52279d5e894bfd8fe5"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const firestoreDB = firebase.firestore();

// Firestore helpers
const FirestoreService = {
    // Get employee profile
    async getEmployeeProfile(companyId, employeeId) {
        try {
            console.log('📥 Fetching profile for:', { companyId, employeeId });
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('profile')
                .where('employeeId', '==', employeeId)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                console.warn('⚠️ Employee profile not found');
                return null;
            }
            
            const doc = snapshot.docs[0];
            console.log('✅ Profile fetched successfully');
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('❌ Error fetching employee profile:', error.code, error.message);
            throw error;
        }
    },

    // Get employee attendance
    async getEmployeeAttendance(companyId, employeeId) {
        try {
            console.log('📥 Fetching attendance for:', { companyId, employeeId });
            console.log('📋 Data types:', { 
                companyIdType: typeof companyId, 
                employeeIdType: typeof employeeId,
                employeeIdValue: employeeId
            });
            
            // Query from shared companyId path
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('attendance')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('✅ Fetched', results.length, 'attendance records');
            
            // Log details of each record for debugging
            results.forEach((rec, idx) => {
                console.log(`  Record ${idx + 1}:`, {
                    id: rec.id,
                    employeeId: rec.employeeId,
                    employeeIdType: typeof rec.employeeId,
                    date: rec.date
                });
            });
            
            return results;
            
        } catch (error) {
            console.error('❌ Error fetching attendance:', error.code, error.message);
            throw error;
        }
    },

    // Get employee deliveries
    async getEmployeeDeliveries(companyId, employeeId) {
        try {
            console.log('📥 Fetching deliveries for:', { companyId, employeeId });
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('delivery')
                .where('employeeId', '==', String(employeeId))
                .get();
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('✅ Fetched', results.length, 'delivery records');
            return results;
        } catch (error) {
            console.error('❌ Error fetching deliveries:', error.code, error.message);
            throw error;
        }
    },

    // Get employee advances
    async getEmployeeAdvances(companyId, employeeId) {
        try {
            console.log('📥 Fetching advances for:', { companyId, employeeId });
            const snapshot = await firestoreDB.collection('users')
                .doc(companyId)
                .collection('advances')
                .where('employeeId', '==', String(employeeId))
                .get();
            
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('✅ Fetched', results.length, 'advance records');
            return results;
        } catch (error) {
            console.error('❌ Error fetching advances:', error.code, error.message);
            throw error;
        }
    }
};
