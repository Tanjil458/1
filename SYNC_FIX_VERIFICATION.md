# Sync System Fix Verification Guide

## Overview
This document provides instructions for verifying that the sync system fixes are working correctly.

## Changes Made

### 1. Debug Logging Added
- **Admin App**: Logs Firebase Auth UID when syncing
- **Employee App**: Logs session companyId, employeeId, and role on login

### 2. Role-Based Deliveries Access
- **DSR Role**: Can see deliveries navigation and view ALL deliveries
- **Other Roles**: Deliveries navigation is hidden
- **Default Date Range**: Last 7 days (not current month)

### 3. Verified Read-Only Employee App
- Confirmed no Firestore write operations in employee app
- Only local IndexedDB operations for data merging
- Employee app cannot modify Firestore data (no Firebase Auth)

## Testing Instructions

### Step 1: Verify CompanyId Matching

**In Admin App Console:**
1. Open admin app and log in
2. Click "Sync Now" button
3. Check console for: `🔑 Admin Firebase Auth UID: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`
4. Note down the UID

**In Employee App Console:**
1. Log in to employee app
   - Company ID: `5ti4r7Rz` (short form) or `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` (full UID)
   - Employee ID: Your employee ID
   - Password: Your password
2. Check console for:
   ```
   🔑 Employee Session Debug:
     - Company ID: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2
     - Employee ID: [your employee ID]
     - Employee Role: [your role]
     - Employee Name: [your name]
   ```
3. **CRITICAL**: Verify that "Company ID" matches "Admin Firebase Auth UID" exactly

### Step 2: Test Attendance Sync

**In Admin App:**
1. Create attendance record for an employee (e.g., Employee #1)
2. Click "Sync Now"
3. Verify data appears in Firebase Console:
   - Path: `users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/attendance/[record-id]`

**In Employee App (Employee #1):**
1. Log in as Employee #1
2. App will auto-sync on load
3. Navigate to "My Attendance" page
4. Verify attendance records appear
5. Check console for: `✅ Found X attendance records in cloud`

### Step 3: Test Advances Sync

**In Admin App:**
1. Create advance for an employee (e.g., Employee #1)
2. Click "Sync Now"
3. Verify data appears in Firebase Console:
   - Path: `users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/advances/[record-id]`

**In Employee App (Employee #1):**
1. Log in as Employee #1
2. Navigate to "My Advances" page
3. Verify advances appear
4. Check console for: `✅ Found X advance records in cloud`
5. Verify totals calculate correctly

### Step 4: Test DSR Deliveries Access

**Prerequisites:**
- Have at least one employee with role "DSR" in the system
- Create delivery records for multiple employees in admin app

**Test DSR Access:**
1. Log in as DSR employee
2. Verify deliveries button appears in:
   - Sidebar navigation (🚚 icon)
   - Bottom navigation bar
3. Check console for: `🚚 DSR role detected - adding deliveries navigation`
4. Click deliveries navigation
5. Verify:
   - Page title shows "All Deliveries (DSR)"
   - Date range shows last 7 days
   - ALL employees' deliveries are visible
   - Each delivery shows employee name
6. Check console for: `🚚 DSR Mode: true`

**Test Non-DSR Access:**
1. Log in as employee with role "Sales" or other (NOT DSR)
2. Verify deliveries button does NOT appear in navigation
3. Check console for: `ℹ️ Non-DSR role - deliveries navigation hidden`

### Step 5: Verify Read-Only Employee App

**In Employee App Console:**
1. Try manual write test:
   ```javascript
   firestoreDB.collection('users').doc('test').set({test: 1})
   ```
2. Should fail with permission error (employee has no Firebase Auth)
3. Verify employee app has no write capability

## Expected Results

### ✅ Success Indicators
- Admin UID and Employee companyId match exactly
- Employee sees their attendance records
- Employee sees their advances
- DSR sees all deliveries with employee names
- Non-DSR employees don't see deliveries page
- Deliveries default to last 7 days
- All sync operations work reliably
- No permission errors in console
- Employee app remains view-only (no writes)

### ❌ Failure Indicators
- Employee companyId doesn't match admin UID → Fix company-id-map.js
- Employee sees "0 records" after sync → Check Firestore path structure
- DSR doesn't see deliveries navigation → Check employee role in Firestore
- Non-DSR sees deliveries → Check conditional navigation logic
- Permission errors → Check Firestore security rules

## Troubleshooting

### Issue: Attendance/Advances sync returns 0 records

**Diagnosis:**
1. Check admin UID: Look in admin console after sync
2. Check employee companyId: Look in employee console after login
3. Compare the two values - they MUST match

**Fix:**
1. If they don't match, update `MimiPro E/auth/company-id-map.js`
2. Add or update the mapping:
   ```javascript
   const COMPANY_ID_MAP = {
       'shortID': 'correctAdminFirebaseUID'
   };
   ```

### Issue: DSR doesn't see deliveries

**Diagnosis:**
1. Check employee role in Firestore: `users/{adminUID}/employees/{employeeId}`
2. Verify `role` field is exactly "DSR" (case-sensitive)

**Fix:**
1. Update employee record in admin app
2. Set role to "DSR"
3. Sync from admin
4. Re-login in employee app

### Issue: Deliveries shows current month instead of last 7 days

**Diagnosis:**
Check `MimiPro E/pages/deliveries/deliveries.js` lines 4-5

**Fix:**
Should be:
```javascript
startDate: DateUtils.getDateDaysAgo(7),
endDate: DateUtils.getToday(),
```

## Debug Commands

Run these in browser console for detailed debugging:

**Admin App:**
```javascript
// Check admin UID
console.log('Admin UID:', firebase.auth().currentUser.uid);

// Check sync status
console.log('Sync enabled:', SyncModule.syncEnabled);
console.log('Current user:', SyncModule.currentUser);
```

**Employee App:**
```javascript
// Check session
const session = JSON.parse(localStorage.getItem('employeeSession'));
console.log('Employee Session:', session);
console.log('CompanyId:', session.companyId);
console.log('Role:', session.role);

// Trigger manual sync
EmployeeSyncService.syncNow();
```

## CompanyId Mapping Reference

The company-id-map.js file maps short IDs to full Firebase UIDs:

```javascript
const COMPANY_ID_MAP = {
    '5ti4r7Rz': '5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2'
};
```

- Short ID: `5ti4r7Rz` (8 characters)
- Full UID: `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` (28 characters)
- This mapping is used during employee login
- The full UID MUST match the admin's Firebase Auth UID

## Important Notes

1. **NO Firebase Authentication for Employees**: Employees use username/password stored in Firestore, not Firebase Auth
2. **Admin MUST use Firebase Auth**: This generates the ownerId used in Firestore paths
3. **Firestore Path Structure**: `users/{adminUID}/collectionName/{documentId}`
4. **Employee App is READ-ONLY**: Never writes to Firestore
5. **Sync is MANUAL**: No real-time listeners, only manual sync button
6. **Soft Deletes**: Records marked `deleted: true`, not actually removed
7. **Role-Based Access**: DSR role gets special deliveries access
