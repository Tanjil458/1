// Session Management

// Get session data
function getSession() {
    const sessionData = localStorage.getItem('employeeSession');
    if (!sessionData) return null;
    
    try {
        return JSON.parse(sessionData);
    } catch (error) {
        console.error('Session parse error:', error);
        return null;
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return getSession() !== null;
}

// Logout
function logout() {
    localStorage.removeItem('employeeSession');
    window.location.href = 'index.html';
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

// Initialize auth check on home page
if (window.location.pathname.includes('home.html')) {
    requireAuth();
}
