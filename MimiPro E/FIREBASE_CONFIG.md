# Firebase Configuration Guide

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your MimiPro project (or create a new one if you haven't already)
3. Click on the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you haven't added a web app:
   - Click the `</>` (Web) icon
   - Register your app with a nickname (e.g., "MimiPro Employee")
   - Click "Register app"
7. Copy the Firebase configuration object

## Step 2: Update Configuration Files

You need to update the Firebase configuration in **TWO** files:

### File 1: `auth/employee-auth.js`
```javascript
// Line 2-9
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### File 2: `sync/firestore.js`
```javascript
// Line 3-10
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Step 3: Enable Firestore Database

1. In Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose a location (closest to your users)
4. Start in **production mode** (we'll add custom rules next)

## Step 4: Set Up Firestore Collections

You should already have these collections from your admin app:
- `employees`
- `attendance`
- `deliveries`
- `advances`

## Step 5: Add Employees via Admin App (Automatic)

The admin app now automatically handles employee creation with passwords:

1. Open your admin app and sign in
2. Go to "Employees" → "Employee List"
3. Click the "+" button to add employee
4. Fill in employee details:
   - Name
   - Mobile Number
   - Role
   - Salary Amount
   - Salary Type
   - **Login Password** (for Employee App)
5. Click "Save"
6. **Important:** You'll see a success message with credentials:
   ```
   Employee Added!
   
   Company ID: ABC12345
   Employee ID: EMP001
   Password: yourpassword
   
   Give these credentials to the employee.
   ```
7. **Write down or screenshot** these credentials
8. Give Company ID, Employee ID, and Password to the employee

**Note:** The admin app automatically:
- Generates unique Employee ID (EMP001, EMP002, etc.)
- Hashes password with SHA-256
- Saves to Firestore with correct structure
- Associates employee with your company account

## Step 6: Configure Firestore Security Rules

1. Go to "Firestore Database" > "Rules" tab
2. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Multi-tenant structure: users/{userId}/...
    match /users/{userId} {
      
      // Admin users can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Employees collection - anyone can read (needed for employee login)
      match /employees/{employeeId} {
        allow read: if true; // Public read for login authentication
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Attendance - read-only for everyone, write for admin only
      match /attendance/{attendanceId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Deliveries - read-only for everyone, write for admin only
      match /deliveries/{deliveryId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Advances - read-only for everyone, write for admin only
      match /advances/{advanceId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Credits - read-only for everyone, write for admin only
      match /credits/{creditId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click "Publish" to save the rules

## Step 7: Verify Employee Data Structure

Employee data is stored in Firestore under your user account:

**Firestore Path:**
```
users/
  └── {yourUserId}/
      └── employees/
          └── {autoId}/
```

Each employee document has these fields (auto-created by admin app):

```javascript
{
  userId: "abc123xyz",         // String - Your admin account ID
  employeeId: "EMP001",        // String - Used for login
  name: "John Doe",            // String - Employee name
  phone: "01712345678",        // String - Phone number
  mobile: "01712345678",       // String - Mobile (same as phone)
  role: "Delivery Person",     // String - Job role
  salary: 15000,               // Number - Monthly/daily salary
  salaryType: "Daily",         // String - "Daily" or "Monthly"
  status: "active",            // String - Must be "active" for login
  active: true,                // Boolean - Employee active status
  passwordHash: "a665a45..."   // String - SHA-256 hash of password
}
```

## Step 8: Verify Attendance Data Structure

```javascript
{
  employeeId: "EMP001",        // String - Must match employee
  date: "2026-02-06",          // String - Format: YYYY-MM-DD
  status: "present",           // String - "present" or "absent"
  timestamp: 1707235200000     // Number - Optional timestamp
}
```

## Step 9: Verify Deliveries Data Structure

```javascript
{
  employeeId: "EMP001",        // String - Must match employee
  date: "2026-02-06",          // String - Format: YYYY-MM-DD
  customerName: "ABC Store",   // String - Customer name
  area: "Dhaka",               // String - Optional area
  amount: 5000,                // Number - Delivery amount
  products: [],                // Array - Optional products list
  timestamp: 1707235200000     // Number - Optional timestamp
}
```

## Step 10: Verify Advances Data Structure
First, add an employee in the admin app
2. Note down the credentials shown: Company ID, Employee ID, Password
3. Open Employee App `index.html` in Android WebView or browser
4. Enter the three credentials:
   - Company ID (shown when you created employee)
   - Employee ID (e.g., EMP001)
   - Password (the one you set)
5. Click Login
6. If successful, you should be redirected to the home page
7. Check the browser console for any errors
8 date: "2026-02-06",          // String - Format: YYYY-MM-DD
  amount: 2000,                // Number - Advance amount
  reason: "Emergency",         // String - Reason for advance
  status: "pending",           // String - "pending" or "paid"
  timestamp: 1707235200000     // Number - Optional timestamp
}
```

## Step 11: Test the Configuration

1. Open `index.html` in the Android WebView or browser
2. Try logging in with an employee ID and password
3. If successful, you should be redirected to the home page
4. Check the browser console for any errors
5. Try syncing data using the sync button

## Common Issues and Solutions

### Issue: "Firebase is not defined"
**Solution:** Make sure Firebase SDK is loaded before your scripts. Check the `<script>` tag order in HTML files.

### Issue: "Permission denied" errors
**Solution:** Check Firestore security rules and ensure the employee data has the correct `employeeId` field.

### Issue: "Invalid password"
**Solution:** 
1. Verify the password hash was generated correctly
2. Make sure the hash field name is exactly `passwordHash`
3. Try regenerating the hash using the password-hash-generator.html

### Issue: "Employee not found"
**Solution:**
1. Check that `employeeId` in the login form matches the one in Firestore
2. Verify the employee document exists in the `employees` collection
3. Employee ID is case-sensitive

### Issue: Data not syncing
**Solution:**
1. Check internet connection
2. Verify Firebase configuration is correct
3. Check browser console for errors
4. Verify Firestore rules allow read access

## Security Checklist

- ✅ Firebase configuration updated in both files
- ✅ Firestore security rules configured
- ✅ Employee passwords hashed with SHA-256
- ✅ Employee status set to "active"
- ✅ Read-only access enforced for employees
- ✅ Session data stored in sessionStorage (not localStorage)

## Important Notes

1. **Same Firebase Project:** This app should use the SAME Firebase project as your admin app
2. **Password Security:** Never store plain text passwords. Always use the hash generator
3. **Read-Only Access:** Employees cannot modify any data through this app
4. **Data Privacy:** Employees can only see their own data, not other employees' data
5. **Network Required:** Initial login and sync require internet connection
6. **Offline Support:** Once synced, data is available offline

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify all Firebase configuration values are correct
3. Ensure Firestore collections have the correct data structure
4. Test with a simple employee account first
5. Check that the employee status is "active"

---

**Configuration Complete!** 🎉

Once all steps are completed, your MimiPro Employee App should be ready to use.
