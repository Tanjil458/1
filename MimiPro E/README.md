# MimiPro Employee App

## Overview
MimiPro Employee is a mobile app for employees to view their attendance, deliveries, advances, and profile information. This is a companion app to the MimiPro admin application.

## Features
- **Employee Authentication**: Secure login with Employee ID and password (SHA-256 hashed)
- **Dashboard**: Overview of monthly stats including attendance, deliveries, and advances
- **Attendance**: View attendance records with monthly filtering
- **Deliveries**: View delivery records with date range filtering
- **Advances**: View advance payment history and status
- **Profile**: View employee profile information
- **Offline Support**: Data synced from Firestore and stored locally in IndexedDB
- **Data Sync**: Manual sync button to refresh data from cloud

## Project Structure
```
MimiPro E/
├── index.html              # Login page
├── home.html               # Main app shell
├── assets/
│   ├── css/
│   │   ├── base.css        # Base styles and utilities
│   │   ├── login.css       # Login page styles
│   │   ├── layout.css      # App layout styles
│   │   └── components.css  # Component styles
│   └── js/
│       ├── app.js          # Main app logic
│       └── router.js       # Simple hash-based router
├── auth/
│   ├── employee-auth.js    # Login authentication
│   └── session.js          # Session management
├── utils/
│   ├── date.js             # Date utilities
│   ├── money.js            # Money formatting utilities
│   └── ui.js               # UI utilities (toast, loading, etc.)
├── db/
│   └── indexeddb.js        # IndexedDB wrapper
├── sync/
│   ├── firestore.js        # Firestore service
│   └── sync-download.js    # Sync manager (download only)
└── pages/
    ├── dashboard/
    │   └── dashboard.js    # Dashboard page
    ├── attendance/
    │   └── attendance.js   # Attendance page
    ├── deliveries/
    │   └── deliveries.js   # Deliveries page
    ├── advances/
    │   └── advances.js     # Advances page
    └── profile/
        └── profile.js      # Profile page
```

## Setup Instructions

### 1. Firebase Configuration
Update the Firebase configuration in both:
- `auth/employee-auth.js`
- `sync/firestore.js`

Replace the placeholder values with your actual Firebase project credentials:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Employee Password Setup
In the admin app, you need to add a password hash for each employee:

1. Hash the employee's password using SHA-256
2. Store it in Firestore under the `employees` collection with field `passwordHash`

Example JavaScript to generate hash:
```javascript
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Example usage:
const hash = await hashPassword("employee123");
console.log(hash); // Copy this to Firestore
```

### 3. Firestore Security Rules
Ensure employees can only read their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Employees collection - read only for authenticated employees
    match /employees/{employeeId} {
      allow read: if request.auth != null;
    }
    
    // Attendance - employees can only read their own records
    match /attendance/{attendanceId} {
      allow read: if request.auth != null && 
                     resource.data.employeeId == request.auth.uid;
    }
    
    // Deliveries - employees can only read their own records
    match /deliveries/{deliveryId} {
      allow read: if request.auth != null && 
                     resource.data.employeeId == request.auth.uid;
    }
    
    // Advances - employees can only read their own records
    match /advances/{advanceId} {
      allow read: if request.auth != null && 
                     resource.data.employeeId == request.auth.uid;
    }
  }
}
```

### 4. Android WebView Integration
Create an Android app with WebView pointing to these HTML files. You can use the same approach as the admin app.

**MainActivity.java example:**
```java
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        
        webView.loadUrl("file:///android_asset/index.html");
    }
}
```

## Usage

### Login
1. Enter Employee ID (e.g., "EMP001")
2. Enter Password
3. Click "Login"

### Dashboard
- View monthly statistics
- Quick overview of attendance and deliveries
- Recent records displayed

### Attendance
- View attendance records by month
- Navigate between months
- See present/absent status

### Deliveries
- View delivery records
- Filter by date range
- See customer names and amounts

### Advances
- View all advance payments
- See paid and pending amounts
- View advance history

### Profile
- View employee information
- Check app sync status
- Logout option

## Data Sync
- Data is synced from Firestore on app load
- Manual sync available via sync button in header
- Last 3 months of attendance and deliveries are synced
- All advances are synced
- Data stored locally in IndexedDB for offline access

## Offline Support
- All synced data is available offline
- App continues to work without internet
- Sync required to get latest data from cloud

## Security
- Password hashed using SHA-256
- Session stored in sessionStorage (cleared on browser close)
- Read-only access to Firestore data
- Employee can only access their own records

## Browser Compatibility
- Modern browsers with ES6+ support
- IndexedDB support required
- Web Crypto API for password hashing

## Notes
- This is a read-only app for employees
- All data modifications must be done through the admin app
- Employees cannot modify their own records
- Contact supervisor for password changes

## Version
1.0.0

## License
Proprietary - MimiPro
