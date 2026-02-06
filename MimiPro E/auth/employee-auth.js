// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwlN548N9A0uRKiRGdvxmoASFCfJtvmo0",
    authDomain: "mimipro-0458.firebaseapp.com",
    projectId: "mimipro-0458",
    storageBucket: "mimipro-0458.firebasestorage.app",
    messagingSenderId: "414929851648",
    appId: "1:414929851648:web:535b52279d5e894bfd8fe5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('employeeSession');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            // Verify session is valid
            if (sessionData.companyId && sessionData.employeeId) {
                console.log('✅ Existing session found, redirecting to home...');
                window.location.href = 'home.html';
                return;
            }
        } catch (error) {
            console.error('Invalid session data:', error);
            localStorage.removeItem('employeeSession');
        }
    }
});

// SHA-256 Hash Function
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Show Error Message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let companyId = document.getElementById('companyId').value.trim();
    const employeeId = document.getElementById('employeeId').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    if (!companyId || !employeeId || !password) {
        showError('Please enter Company ID, Employee ID and Password');
        return;
    }
    
    // Expand short company ID to full ID using mapping
    companyId = expandCompanyId(companyId);
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    
    try {
        // Hash the password
        const passwordHash = await hashPassword(password);
        console.log('🔐 Password hash generated');
        
        // Query Firestore for employee under company/user
        console.log(`📍 Querying: /users/${companyId}/employees`);
        const employeeSnapshot = await db.collection('users')
            .doc(companyId)
            .collection('employees')
            .where('employeeId', '==', employeeId)
            .limit(1)
            .get();
        
        console.log(`📊 Query result: ${employeeSnapshot.size} employees found`);
        
        if (employeeSnapshot.empty) {
            console.error('❌ No employee found with ID:', employeeId);
            console.log('💡 Debug info:');
            console.log('  - Company ID:', companyId);
            console.log('  - Employee ID:', employeeId);
            console.log('  - Make sure you have synced employees from the admin app');
            showError('Invalid Company ID, Employee ID or Password');
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            return;
        }
        
        const employeeDoc = employeeSnapshot.docs[0];
        const employeeData = employeeDoc.data();
        console.log('✅ Employee found:', employeeData.name);
        
        // Verify password
        console.log('🔒 Verifying password...');
        console.log('  - Provided hash:', passwordHash.substring(0, 16) + '...');
        console.log('  - Expected hash:', employeeData.passwordHash?.substring(0, 16) + '...');
        
        if (!employeeData.passwordHash) {
            console.error('❌ Error: Employee record has no password hash!');
            showError('Account configuration error. Contact administrator.');
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            return;
        }
        
        if (employeeData.passwordHash !== passwordHash) {
            console.error('❌ Password mismatch');
            showError('Invalid Company ID, Employee ID or Password');
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            return;
        }
        
        console.log('✅ Password verified');
        
        // Check if employee is active
        console.log('🟢 Checking status:', employeeData.status);
        if (employeeData.status !== 'active') {
            showError('Your account is inactive. Please contact your supervisor.');
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            return;
        }
        
        // Create session
        const session = {
            companyId: companyId,
            employeeId: employeeData.employeeId,
            name: employeeData.name,
            phone: employeeData.phone || employeeData.mobile,
            role: employeeData.role,
            salary: employeeData.salary,
            loginTime: new Date().toISOString()
        };
        
        // Store session in localStorage (persists across app restarts)
        localStorage.setItem('employeeSession', JSON.stringify(session));
        
        // Redirect to home
        window.location.href = 'home.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please try again.');
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
});
