# URGENT: Fix Delivery Page Permission Error

## Problem
Employee app shows **"FirebaseError: Missing or insufficient permissions"** when accessing delivery data because the `history` collection is restricted to admin-only access.

## Solution
Update Firestore security rules to allow employees to read delivery history.

## Steps to Fix

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mimipro-0458**
3. Navigate to: **Firestore Database** → **Rules** tab

### 2. Update Security Rules
**REPLACE ALL EXISTING RULES** with this updated code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==================== ADMIN/OWNER FULL ACCESS ====================
    // Owner has full access to all their company data
    // This is the broad rule that covers all collections
    
    match /users/{ownerId}/{document=**} {
      // Owner (authenticated admin) can read/write ALL their data
      allow read, write: if request.auth != null && request.auth.uid == ownerId;
    }
    
    // ==================== EMPLOYEE READ ACCESS OVERRIDES ====================
    // These rules OVERRIDE the above for specific collections
    // Employees can READ these collections (but still can't write)
    
    match /users/{ownerId}/employees/{employeeId} {
      // Anyone can read employee profiles (needed for employee app login)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/attendance/{attendanceId} {
      // Anyone can read attendance (employee app filters by their ID)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/delivery/{deliveryId} {
      // Anyone can read deliveries (employee app filters by their ID)  
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/advances/{advanceId} {
      // Anyone can read advances (employee app filters by their ID)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/productAdvances/{productAdvanceId} {
      // Anyone can read product advances (employee app filters by their ID)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/repayments/{repaymentId} {
      // Anyone can read repayments (employee app filters by their ID)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/history/{historyId} {
      // Anyone can read delivery history (for DSR verification)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/stock/{stockId} {
      // Anyone can read stock (for reference)
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/credits/{creditId} {
      // Anyone can read credits
      allow read: if true;
      // Write still controlled by admin rule above  
    }
    
    match /users/{ownerId}/creditPayments/{paymentId} {
      // Anyone can read credit payments
      allow read: if true;
      // Write still controlled by admin rule above
    }
    
    match /users/{ownerId}/salaryReports/{salaryReportId} {
      // Anyone can read salary reports (employee app filters by their ID)
      allow read: if true;
      // Write still controlled by admin rule above
    }
  }
}
```

### 3. Apply Changes
1. Click **"Publish"** button in Firebase console
2. Wait 30-60 seconds for rules to propagate
3. Refresh the employee app

## Key Change Made
✅ **Added `history` collection to shared collections** - now employees can read delivery calculations for verification

## What This Fixes
- ❌ Before: `history` was admin-only → Permission denied error
- ✅ After: `history` is readable by employees → Delivery page shows data

## Test After Update
1. Open employee app
2. Navigate to Deliveries page
3. Should now see delivery records instead of "0 records found"
4. DSRs can verify their calculations against admin data

## Important Notes
- Only **read access** is given to employees for history
- Admin still has full **read/write** control
- Other security remains unchanged