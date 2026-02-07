# Testing Guide - Employee App Sync Fixes

## Overview
This guide helps you test the fixes for:
1. ✅ Attendance sync (admin → employee)
2. ✅ Advances sync (admin → employee)
3. ✅ Days worked display
4. ✅ Shortened Company ID (8 characters)

---

## Pre-Test Setup

### 1. Migrate Existing Data (if you have old advances)
1. Open `migrate-advances-data.html` in your browser
2. Click **"1. Check Data"** to see if migration is needed
3. Click **"2. Migrate Data"** to update records
4. Click **"3. Verify Fix"** to confirm all records are correct

### 2. Ensure Firebase Sync is Working
1. Open **Admin App** (`index.html`)
2. Log in with your Firebase credentials
3. Go to **Employees** page
4. Click **Sync** button to push employees to Firestore
5. Wait for "Synced successfully" message

---

## Test 1: Attendance Sync ✅

### Admin App Steps:
1. Open **Admin App** (`index.html`)
2. Go to **Attendance** page
3. Select an employee (e.g., "Sohel")
4. Mark them **Present** for today's date
5. Click **Save**
6. Open browser console (F12)
7. **Verify** you see logs like:
   ```
   📊 Attendance Details:
     employeeId: "1"
     employeeIdType: "string"
   ```
8. Click **Sync** button in the navbar
9. Wait for sync to complete

### Employee App Steps:
1. Open **Employee App** (`MimiPro E/index.html`)
2. Login with:
   - **Company ID**: `5ti4r7Rz` (or full ID)
   - **Employee ID**: `1`
   - **Password**: (the one set in admin app)
3. Go to **Attendance** page
4. Click **🔄 Refresh** button
5. **Expected Result**: ✅
   - Today's date shows "✔ Present" (green)
   - Monthly summary shows correct count
   - Console shows: `✅ Fetched [N] attendance records`

### ✅ Pass Criteria:
- [ ] Employee can see attendance marked by admin
- [ ] Status shows as "Present" with green styling
- [ ] Monthly summary counts are correct

---

## Test 2: Advances Sync ✅

### Admin App Steps:
1. Open **Admin App** (`index.html`)
2. Go to **Advances** page
3. **Add Cash Advance**:
   - Employee: Select "Sohel"
   - Amount: `500`
   - Date: Today's date
   - Note: `Salary advance`
   - Click **Save Cash Advance**
4. Open browser console (F12)
5. **Verify** you see logs like:
   ```
   💰 Advance Details:
     employeeId: "1"
     employeeIdType: "string"
     amount: 500
     reason: "Salary advance"
     status: "pending"
   ```
6. Click **Sync** button in navbar
7. Wait for sync to complete

### Employee App Steps:
1. Open **Employee App** (`MimiPro E/index.html`)
2. Login as employee (if not already)
3. Go to **Dashboard**
4. **Expected Results**: ✅
   - "Total Days Worked" card shows correct count
   - "Advances Taken" card shows `৳500`
5. Go to **Advances** page
6. Click **Sync** button at bottom
7. **Expected Results**: ✅
   - "Total Advances": `৳500`
   - "Pending": `৳500`
   - "Days Worked (Total)": Shows attendance count
   - Advance History shows:
     - Date: Today
     - Reason: "Salary advance"
     - Amount: `৳500`
     - Badge: "PENDING" (yellow)

### ✅ Pass Criteria:
- [ ] Employee can see advance added by admin
- [ ] Amount displays correctly
- [ ] Days worked count is visible
- [ ] Status badge shows correct color

---

## Test 3: Product Advance Sync ✅

### Admin App Steps:
1. Go to **Advances** page
2. **Add Product Advance**:
   - Employee: Select "Sohel"
   - Product Name: `Rice`
   - Quantity: `10`
   - Unit Price: `50`
   - Total Value: Auto-calculated (`500`)
   - Date: Today
   - Click **Save Product Advance**
3. Click **Sync** button
4. Wait for sync

### Employee App Steps:
1. Go to **Advances** page
2. Click **Sync** button
3. **Expected Results**: ✅
   - New record appears
   - Reason: "Product: Rice (10 × ৳50)"
   - Amount: `৳500`
   - Total Advances increased by 500

### ✅ Pass Criteria:
- [ ] Product advance appears in employee app
- [ ] Reason includes product details
- [ ] Amount matches total value

---

## Test 4: Shortened Company ID ✅

### Test Short ID Login:
1. Open **Employee App** (`MimiPro E/index.html`)
2. Logout if logged in
3. Try logging in with:
   - **Company ID**: `5ti4r7Rz` (8 characters)
   - **Employee ID**: `1`
   - **Password**: Your employee password
4. **Expected Result**: ✅ Login succeeds

### Test Full ID Still Works:
1. Logout
2. Try logging in with:
   - **Company ID**: `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` (32 characters)
   - **Employee ID**: `1`
   - **Password**: Your employee password
3. **Expected Result**: ✅ Login succeeds

### Check Credentials Page:
1. Open `MimiPro E/credentials.html`
2. **Expected Results**: ✅
   - "Company ID (Login)": Shows `5ti4r7Rz`
   - "Full ID (Reference)": Shows full ID (grayed out)
   - Console log shows both IDs

### ✅ Pass Criteria:
- [ ] 8-character ID works for login
- [ ] Full 32-character ID still works
- [ ] Credentials page shows short ID prominently

---

## Test 5: Days Worked Display ✅

### Employee Dashboard:
1. Login to **Employee App**
2. Go to **Dashboard**
3. **Expected Results**: ✅
   - Card 1: "This Month" - shows current month attendance
   - Card 2: "Total Days Worked" - shows ALL attendance (all time)
   - Card 4: "Advances Taken" - shows total with pending amount

### Employee Advances Page:
1. Go to **Advances** page
2. **Expected Results**: ✅
   - Summary section shows "Days Worked (Total)"
   - Count matches total attendance records

### ✅ Pass Criteria:
- [ ] Dashboard shows total days worked
- [ ] Advances page shows days worked
- [ ] Count matches actual attendance

---

## Debugging Tips

### If Attendance Doesn't Show:
1. Check admin console for `employeeIdType: "string"`
2. Check employee console for `✅ Fetched [N] attendance records`
3. Run `migrate-attendance-data.html` to fix old data
4. Verify employeeId matches between admin and employee

### If Advances Don't Show:
1. Check admin console for advance sync logs
2. Check employee console: `💰 Loaded [N] advance records`
3. Run `migrate-advances-data.html` to fix old data
4. Verify advances have `reason` and `status` fields
5. Check that employeeId is a string in Firestore

### If Login Fails:
1. Verify employee exists in admin app
2. Check that password is set for employee
3. Try both short and full Company ID
4. Check browser console for error messages
5. Verify Firebase credentials are correct

### General Debugging:
1. **Open Browser Console (F12)** in both apps
2. Look for colored log messages:
   - 🟢 Green = Success
   - 🔴 Red = Error
   - 🟡 Yellow = Warning
   - 🔵 Blue = Info
3. Check that sync button shows "Synced successfully"
4. Verify Firestore rules allow reading/writing

---

## Success Checklist

### Attendance:
- [ ] Admin can mark attendance
- [ ] Employee sees attendance after sync
- [ ] Status shows correct (Present/Absent)
- [ ] Monthly summary is accurate

### Advances:
- [ ] Admin can add cash advances
- [ ] Admin can add product advances
- [ ] Employee sees all advances after sync
- [ ] Amounts are correct
- [ ] Reasons/notes display properly
- [ ] Status badges show correct color

### Days Worked:
- [ ] Dashboard shows total days worked
- [ ] Advances page shows days worked
- [ ] Count matches attendance records

### Company ID:
- [ ] Short ID (8 chars) works for login
- [ ] Full ID (32 chars) works for login
- [ ] Credentials page shows short ID
- [ ] Login page hints at 8-char ID

---

## Expected Console Output

### Admin App (when adding advance):
```
💰 Advance Details:
  id: 1234567890
  employeeId: "1"
  employeeIdType: "string"
  amount: 500
  date: "2026-02-06"
  reason: "Salary advance"
  status: "pending"
  path: "users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/advances/1234567890"
```

### Employee App (when loading advances):
```
💰 Advances: Loading data for employee: 1
💰 Employee ID type: string
💰 Loaded 1 advance records
💰 Sample advance:
  id: 1234567890
  employeeId: "1"
  employeeIdType: "string"
  amount: 500
  date: "2026-02-06"
  reason: "Salary advance"
📅 Days worked: 15
```

---

## Troubleshooting

### Problem: "No records found"
**Solution**: 
1. Ensure data is synced from admin app
2. Run migration tools for old data
3. Check Firestore rules allow reading

### Problem: "Permission denied"
**Solution**:
1. Update Firestore rules (see FIRESTORE_RULES.md)
2. Wait 60 seconds for rules to apply
3. Clear browser cache

### Problem: "employeeId mismatch"
**Solution**:
1. Run migration tools to convert to strings
2. Verify employeeId in Firestore is string
3. Check console logs for type information

---

## Final Verification

After all tests pass:

1. ✅ Attendance syncs from admin to employee
2. ✅ Cash advances sync from admin to employee
3. ✅ Product advances sync from admin to employee
4. ✅ Days worked displays on dashboard and advances
5. ✅ Short Company ID (8 chars) works for login
6. ✅ All employeeIds are stored as strings
7. ✅ Console logs show proper data types
8. ✅ No errors in browser console

**If all items are checked, the fixes are working correctly! 🎉**
