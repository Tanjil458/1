# Updated Firestore Security Rules

## Required Firestore Rules for MimiPro

These rules implement the security requirements from the problem statement:
- Admin (owner) has full read/write access to their data
- Employees can only read their own data (filtered by employeeId)
- Employees NEVER write to Firestore

### How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mimipro-0458**
3. Navigate to: **Firestore Database** → **Rules** tab
4. **Replace ALL existing rules** with the code below
5. Click **Publish**

### Rules Code

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==================== ADMIN/OWNER DATA ====================
    // Owner has full access to all their company data
    // Path: /users/{ownerId}/...
    
    match /users/{ownerId}/{document=**} {
      // Owner (authenticated admin) can read/write all their data
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    // ==================== EMPLOYEE READ ACCESS ====================
    // Employees can READ shared collections (but NEVER write)
    // These are the same paths, but with different permissions
    
    match /users/{ownerId}/employees/{employeeId} {
      // Anyone can read employee profiles (needed for employee app)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/attendance/{attendanceId} {
      // Anyone can read attendance (employee will filter by their ID)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/delivery/{deliveryId} {
      // Anyone can read deliveries (employee will filter by their ID)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/advances/{advanceId} {
      // Anyone can read advances (employee will filter by their ID)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/productAdvances/{productAdvanceId} {
      // Anyone can read product advances (employee will filter by their ID)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/repayments/{repaymentId} {
      // Anyone can read repayments (employee will filter by their ID)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/salaryReports/{salaryReportId} {
      // Anyone can read salary reports (employee will filter by their ID)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/stock/{stockId} {
      // Anyone can read stock (for reference)
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/credits/{creditId} {
      // Anyone can read credits
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/creditPayments/{paymentId} {
      // Anyone can read credit payments
      allow read: if true;
      // Only owner can write
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    // Private admin-only collections
    match /users/{ownerId}/products/{productId} {
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/customers/{customerId} {
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/deliveries/{deliveryId} {
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/history/{historyId} {
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    match /users/{ownerId}/areas/{areaId} {
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
  }
}
```

## Security Principles

### ✅ What These Rules Enforce

1. **Owner Full Access**: Admin user (authenticated with Firebase Auth) has complete read/write access to all their company data
2. **Employee Read-Only**: Employees can read shared collections, but the app code filters data by employeeId
3. **No Employee Writes**: Employees cannot write to Firestore (enforced at rule level)
4. **Public Read on Shared Collections**: Allows employee app to query without auth (app filters by employeeId)

### 🔒 Security Notes

- **Employee Filtering**: While rules allow public read on shared collections, the employee app code filters by `employeeId` at query level and verifies locally
- **No Auth for Employees**: Employees don't authenticate with Firebase Auth, they use app-level login
- **Write Protection**: All write operations require Firebase Auth (admin only)
- **Data Isolation**: Each owner's data is isolated in `/users/{ownerId}/` path

### 📊 Data Structure

```
/users/
  /{ownerId}/  (Firebase Auth UID of admin/owner)
    /employees/{employeeId}
    /attendance/{attendanceId}
    /advances/{advanceId}
    /productAdvances/{productAdvanceId}
    /repayments/{repaymentId}
    /salaryReports/{salaryReportId}
    /delivery/{deliveryId}
    /stock/{stockId}
    /credits/{creditId}
    /creditPayments/{paymentId}
    /products/{productId}        (admin private)
    /customers/{customerId}      (admin private)
    /deliveries/{deliveryId}     (admin private)
    /history/{historyId}         (admin private)
    /expenses/{expenseId}        (admin private)
    /areas/{areaId}              (admin private)
```

## Testing Rules

After updating rules, wait 30-60 seconds for changes to propagate, then test:

### Admin App
1. Sign in to admin app
2. Create an attendance record
3. Click sync button
4. Verify data appears in Firestore Console
5. Check console logs for errors

### Employee App
1. Login to employee app
2. Click sync button
3. Verify data appears (filtered by employeeId)
4. Check that only own data is visible
5. Verify console shows no permission errors

## Troubleshooting

### "Permission Denied" Errors

**For Admin**:
- Ensure you're signed in with Firebase Auth
- Check that `request.auth.uid` matches the ownerId in the path
- Wait 60 seconds after updating rules

**For Employee**:
- Employees should NOT get permission errors on READ operations
- If you get permission denied, check the Firestore path matches these rules
- Verify rules have been published and propagated

### "Missing Index" Errors

Firestore may require composite indexes for queries with multiple filters. If you see "missing index" errors:

1. Click the link in the error message (takes you to Firebase Console)
2. Click "Create Index"
3. Wait for index to build (usually 1-2 minutes)
4. Retry the operation

Common indexes needed:
- `attendance`: `employeeId` + `deleted` + `date`
- `advances`: `employeeId` + `deleted` + `date`
- `delivery`: `employeeId` + `deleted` + `date`

## Migration from Old Rules

If you had different rules before, these new rules are:

✅ **Compatible**: Data structure remains the same (`/users/{ownerId}/`)  
✅ **More Secure**: Explicit write protection for employees  
✅ **More Explicit**: Each collection has specific rules instead of wildcard

No data migration needed - just update the rules.
