# Testing Guide - Employee Attendance App Fixes

## Overview
This guide will help you test the fixes made to ensure attendance data flows correctly from admin app to employee app.

## What Was Fixed

### 1. EmployeeId Type Consistency Issue
- **Problem**: Admin was storing `employeeId` inconsistently (sometimes as number, sometimes as string)
- **Fix**: Now always stores as string for consistency with employee app queries
- **File**: `js/modules/attendance.js` - Line 319

### 2. Enhanced Debug Logging
- **Admin Sync**: Logs employeeId type and value when syncing attendance to Firestore
- **Employee App**: Logs detailed query parameters and results when fetching attendance
- **Purpose**: Makes it easy to diagnose sync issues by checking browser console

## Testing Steps

### Step 1: Open Admin App
1. Open `index.html` in your browser
2. If not logged in, sign in with your admin credentials
3. Open browser DevTools (F12) and go to Console tab

### Step 2: Mark Attendance in Admin App
1. Navigate to **Attendance** page
2. Select current month (should be pre-selected)
3. Click on any employee's cell to mark them present
4. Watch the console for these log messages:
   ```
   ✅ Pushed attendance/[ID] to cloud
   📊 Attendance Details: {
     id: [number],
     employeeId: "[string]",
     employeeIdType: "string",
     date: "YYYY-MM-DD",
     path: "users/[companyId]/attendance/[id]"
   }
   ```
5. Verify `employeeIdType: "string"` - this confirms the fix is working

### Step 3: Force Sync to Firestore
1. Look for the sync button in the admin app (usually top-right)
2. Click it to force a full sync
3. Watch console for sync completion messages
4. Expected output:
   ```
   🔗 Writing attendance to shared path: users/[companyId]/attendance
   ✅ Pushed attendance/[ID] to cloud
   ✅ Full sync completed: [N] items pushed
   ```

### Step 4: Open Employee App
1. Open `MimiPro E/index.html` in a new browser tab or window
2. Open browser DevTools (F12) and go to Console tab

### Step 5: Login as Employee
1. Use the credentials from `EMPLOYEE_LOGIN_GUIDE.md`:
   - **Company ID**: `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`
   - **Employee ID**: `1` (for Sohel) or `2` (for Ramjan)
   - **Password**: [Set by admin when creating employee]
2. Click Login
3. Watch console for login success messages

### Step 6: Navigate to Attendance Page
1. Click on "Attendance" in the employee app navigation
2. Watch console for detailed logs:
   ```
   📡 Employee requesting attendance from Firestore: {
     companyId: "5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2",
     employeeId: "1",
     employeeIdType: "string",
     monthKey: "2026-02"
   }
   ```
3. Then:
   ```
   ✅ Employee attendance page received: [N] records
   📋 Sample attendance record: {
     id: "[ID]",
     employeeId: "1",
     employeeIdType: "string",
     date: "2026-02-06",
     status: "present"
   }
   ```

### Step 7: Verify Attendance Display
1. Look at the attendance calendar in employee app
2. Dates marked as present in admin app should show **"✔ Present"** (green background)
3. Other dates should show **"✗ Absent"** (gray background)
4. Check the Monthly Summary section shows correct counts

## Troubleshooting

### Issue: No Records Showing in Employee App
**Check these:**
1. Console logs in employee app - do they show `employeeId: "1"` or `employeeId: 1`?
2. If number, the query won't match (expecting string)
3. Go back to admin app, delete the attendance record, recreate it
4. The new record should have string employeeId due to the fix

### Issue: "Permission Denied" Error
**Fix:**
1. Check Firestore rules in Firebase Console
2. Follow instructions in `FIRESTORE_RULES.md`
3. Make sure rules allow read access to attendance collection

### Issue: Records Not Syncing
**Check:**
1. Admin app console - is sync enabled? Look for `✅ User logged in: [email]`
2. Click the sync button manually
3. Wait 5 minutes for auto-sync to run
4. Check for error messages in console

### Issue: Employee Login Fails
**Fix:**
1. Verify Company ID matches admin's userId (check `COMPANY_ID.txt`)
2. Verify Employee ID exists in admin app's Employees list
3. Verify password was set when creating/editing employee
4. Check employee status is "active"

## Expected Results

After following all steps:
- ✅ Admin can mark attendance
- ✅ Attendance syncs to Firestore with string employeeId
- ✅ Employee can login successfully
- ✅ Employee sees their attendance marked by admin
- ✅ Both apps show consistent data
- ✅ Summary counts are accurate

## Console Logs Reference

### Admin App - When Marking Attendance:
```javascript
✅ Marked present
✅ Pushed attendance/123 to cloud
📊 Attendance Details: {
  id: 123,
  employeeId: "1",        // ← Should be STRING
  employeeIdType: "string", // ← Should be "string"
  date: "2026-02-06",
  path: "users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/attendance/123"
}
```

### Employee App - When Loading Attendance:
```javascript
📡 Employee requesting attendance from Firestore: {
  companyId: "5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2",
  employeeId: "1",           // ← Should be STRING
  employeeIdType: "string",  // ← Should be "string"
  monthKey: "2026-02"
}
📥 Fetching attendance for: { companyId: ..., employeeId: "1" }
✅ Fetched 5 attendance records
  Record 1: { id: 123, employeeId: "1", employeeIdType: "string", date: "2026-02-06" }
  Record 2: { id: 124, employeeId: "1", employeeIdType: "string", date: "2026-02-07" }
  ...
```

## Next Steps

If everything works:
1. ✅ The fix is successful
2. ✅ Admin and employee apps are in sync
3. ✅ You can now use both apps normally

If issues persist:
1. Check the console logs and compare with expected output above
2. Copy the error messages and console logs
3. Share them for further debugging
4. Check Firestore directly in Firebase Console to see stored data

## Firebase Console - Manual Verification

To check data directly in Firestore:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mimipro-0458**
3. Go to **Firestore Database**
4. Navigate to: `users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/attendance`
5. Click on any document
6. Check `employeeId` field - should be a **string** (not number)
7. Example: `employeeId: "1"` ✅ (not `employeeId: 1` ❌)

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `js/modules/attendance.js` | `employeeId: String(employeeId)` | Ensure consistent string type |
| `js/db/sync.js` | Added attendance-specific logging | Track employeeId type during sync |
| `MimiPro E/sync/firestore.js` | Added detailed record logging | Debug Firestore queries |
| `MimiPro E/pages/attendance/attendance.js` | Added sample record logging | Verify data types received |

All changes are backwards compatible and improve debugging capabilities.
