# Testing Guide - MimiPro Sync System

This guide provides step-by-step instructions for testing the new sync system to verify all requirements are met.

## Pre-Testing Setup

### 1. Update Firestore Rules

**CRITICAL**: Before testing, update Firestore security rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mimipro-0458**
3. Navigate to: **Firestore Database** → **Rules**
4. Copy rules from `FIRESTORE_RULES_UPDATED.md`
5. Click **Publish**
6. **Wait 60 seconds** for rules to propagate

### 2. Clear Browser Cache (Optional)

For clean testing:
- Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files"
- Clear for "All time"
- Restart browser

### 3. Prepare Test Data

You'll need:
- **Admin account**: Email + password for Firebase Auth
- **At least 2 employees** created in admin app
- **Employee credentials**: Username + password for each employee

## Test Scenarios

### Test 1: Admin Sync on App Launch ✅

**Objective**: Verify admin app syncs data automatically on login

**Steps**:
1. Open admin app (`MimiPro -admin/index.html`)
2. Sign in with admin credentials
3. Watch browser console (F12 → Console tab)

**Expected Results**:
```
✅ User logged in: admin@example.com
🔄 Starting backup & restore sync...
⬆️ Uploading local changes...
⬆️ Upload complete: X items uploaded
⬇️ Downloading from cloud...
⬇️ Download complete: X items merged
✅ Sync completed successfully
```

**Pass Criteria**:
- ✅ Console shows sync started
- ✅ No permission errors
- ✅ Toast shows "Sync complete!"
- ✅ Sync button shows green checkmark

**If Test Fails**:
- Check Firestore rules were updated
- Verify Firebase Auth login successful
- Check network connection

---

### Test 2: Admin Manual Sync ✅

**Objective**: Verify manual sync button works

**Steps**:
1. While logged in as admin
2. Create new attendance record
3. Click "Sync" button in header
4. Watch console

**Expected Results**:
```
🔄 Starting backup & restore sync...
⬆️ Upload complete: 1 items uploaded
⬇️ Download complete: 0 items merged
✅ Sync completed successfully
```

**Verify in Firestore Console**:
1. Go to Firebase Console → Firestore Database → Data
2. Navigate to: `users/{yourUID}/attendance`
3. Find the new record
4. Verify fields:
   - `id`, `employeeId`, `date`, `status`
   - `deleted: false`
   - `syncVersion: 1`
   - `createdAt`, `updatedAt` (ISO timestamps)
   - `ownerId` (matches your UID)

**Pass Criteria**:
- ✅ Record appears in Firestore
- ✅ All metadata fields present
- ✅ employeeId is string type
- ✅ No duplicate records

---

### Test 3: Same Owner on 2 Devices ✅

**Objective**: Verify admin can sync across devices

**Setup**: Use 2 browser windows or different browsers

**Device A (First Browser)**:
1. Sign in as admin
2. Create 3 attendance records
3. Click Sync button
4. Wait for "Sync complete" toast

**Device B (Second Browser)**:
1. Sign in with SAME admin account
2. Click Sync button (or refresh to trigger auto-sync)
3. Navigate to Attendance page

**Expected Results**:
- ✅ Device B shows all 3 records from Device A
- ✅ No duplicates
- ✅ All data matches

**Modify on Device B**:
1. Update one of the records (change status)
2. Click Sync
3. Go back to Device A
4. Click Sync on Device A

**Expected**:
- ✅ Device A shows the updated record
- ✅ Conflict resolved (cloud newer wins)
- ✅ No data loss

---

### Test 4: Employee Sees Only Their Data 🔒

**Objective**: Verify employee data filtering works correctly

**Setup**:
- Admin creates attendance for Employee ID 1 and Employee ID 2
- Admin syncs data

**Steps**:
1. Open employee app (`MimiPro E/index.html`)
2. Login as **Employee 1**
3. Navigate to Attendance page
4. Check console logs

**Expected Console Logs**:
```
📥 Syncing attendance...
📋 Query params: { companyId: "abc123", employeeId: "1", employeeIdType: "string" }
✅ Found X attendance records in cloud
📊 Merge stats: { inserted: X, updated: 0, deleted: 0, skipped: 0 }
```

**Expected in UI**:
- ✅ Shows only Employee 1's attendance
- ✅ Employee 2's records NOT visible
- ✅ Summary counts are correct

**Verify Filtering**:
1. Check browser console logs
2. Look for: "Filtered out record with wrong employeeId" (should NOT appear)
3. All shown records should have `employeeId === "1"`

**Test with Employee 2**:
1. Logout
2. Login as **Employee 2**
3. Check attendance

**Expected**:
- ✅ Only Employee 2's records visible
- ✅ Employee 1's records NOT shown
- ✅ No data leakage

---

### Test 5: Employee Cannot Write 🔒

**Objective**: Verify employees have read-only access

**Steps**:
1. Login to employee app
2. Open browser console (F12)
3. Try to manually write to Firestore:

```javascript
// Try to write from console (should FAIL)
const db = firebase.firestore();
const testWrite = db.collection('users')
  .doc('test123')
  .collection('attendance')
  .doc('test456')
  .set({ test: 'data' });

testWrite.then(() => {
  console.log('FAIL: Employee can write! 🚨');
}).catch(err => {
  console.log('PASS: Write blocked ✅', err.code);
});
```

**Expected Result**:
```
PASS: Write blocked ✅ permission-denied
```

**Pass Criteria**:
- ✅ Permission denied error
- ✅ No data written to Firestore
- ✅ Employee can only read

---

### Test 6: Soft Deletes ✅

**Objective**: Verify delete doesn't lose data permanently

**Admin Steps**:
1. Create attendance record (note the ID)
2. Sync
3. Delete the record
4. Check console logs

**Expected Console Logs**:
```
// After delete button clicked
Updated attendance record: { id: 123, deleted: true, syncVersion: 2 }
```

**Verify in Firestore**:
1. Go to Firestore Console
2. Find the record
3. Check fields:
   - `deleted: true` ✅
   - `syncVersion: 2` (incremented) ✅
   - Original data still present ✅

**Employee Sync**:
1. Before admin syncs: Employee sees the record
2. Admin clicks Sync
3. Employee clicks Sync
4. Record disappears from employee app

**Expected**:
- ✅ Record removed from employee's local DB
- ✅ Not shown in employee UI
- ✅ Still exists in Firestore (deleted: true)
- ✅ Admin can undelete if needed

---

### Test 7: Deleted Records Sync ✅

**Objective**: Verify deleted records sync correctly

**Steps**:
1. **Device A**: Create 5 attendance records, sync
2. **Device B**: Sync (gets all 5 records)
3. **Device A**: Delete 2 records, sync
4. **Device B**: Sync again

**Expected**:
- ✅ Device B shows only 3 records
- ✅ Deleted records marked in Firestore
- ✅ No data loss (can be recovered)

**Console Logs on Device B**:
```
⬇️ Downloading from cloud...
📊 Merge stats: { inserted: 0, updated: 0, deleted: 2, skipped: 3 }
```

---

### Test 8: Offline → Online Sync ✅

**Objective**: Verify offline changes sync when back online

**Steps**:
1. Open admin app
2. Go offline:
   - Browser DevTools (F12)
   - Network tab
   - Select "Offline" from dropdown
3. Create 10 attendance records
4. Try to sync (should fail)
5. Go back online (select "No throttling")
6. Click Sync button

**Expected Results**:
```
// When offline
❌ Sync failed: Firebase unavailable - Check connection

// When back online
⬆️ Upload complete: 10 items uploaded
✅ Sync completed successfully
```

**Verify**:
- ✅ All 10 records appear in Firestore
- ✅ All marked as synced locally
- ✅ Sync indicator shows green

---

### Test 9: Conflict Resolution ✅

**Objective**: Verify cloud-newer-wins conflict resolution

**Setup**: Use 2 devices

**Steps**:
1. **Device A**: Create record with `note: "Version A"`, DON'T sync
2. **Device B**: Create SAME record ID with `note: "Version B"`, sync first
3. **Device A**: Now sync

**Expected**:
- ✅ Device A's local record replaced with Device B's version
- ✅ Console shows: "Skipped X/Y - cloud is newer"
- ✅ Final note in both devices: "Version B"

**Reasoning**: Device B synced first, so cloud has newer timestamp

---

### Test 10: Large Dataset ✅

**Objective**: Verify system handles large amounts of data

**Setup**:
- Create 100+ attendance records
- 20+ employees
- 3+ months of data

**Steps**:
1. Admin: Create all records offline
2. Click Sync
3. Monitor console for errors
4. Wait for completion
5. Employee: Login and sync

**Expected Admin**:
```
⬆️ Upload complete: 100+ items uploaded
✅ Sync completed successfully
```

**Expected Employee**:
```
📊 Merge stats: { inserted: 5+, updated: 0, deleted: 0, skipped: 0 }
✅ Employee sync completed successfully
```

**Pass Criteria**:
- ✅ No timeout errors
- ✅ No memory issues
- ✅ All data synced correctly
- ✅ Employee sees only own data (5-10 records, not all 100+)
- ✅ Performance acceptable (< 10 seconds)

---

### Test 11: Data Duplication Check ✅

**Objective**: Verify no duplicate records created

**Steps**:
1. Admin: Create record, sync
2. Admin: Click Sync 3 more times
3. Check Firestore console

**Expected**:
- ✅ Only 1 record exists
- ✅ syncVersion incremented (but same record)
- ✅ No duplicates

**Employee**:
1. Employee: Sync 5 times
2. Check employee's local DB (browser DevTools → Application → IndexedDB)

**Expected**:
- ✅ Only 1 copy of each record
- ✅ No duplicates in IndexedDB

---

## Success Criteria Summary

All tests must pass for the sync system to be considered working:

### Admin App
- ✅ Syncs on app launch
- ✅ Manual sync works
- ✅ Data uploads to Firestore
- ✅ Soft deletes implemented
- ✅ Conflict resolution works
- ✅ Syncs across devices
- ✅ No data loss

### Employee App
- ✅ Read-only (cannot write)
- ✅ Sees only own data
- ✅ Filtering by employeeId works
- ✅ Deleted records hidden
- ✅ Merge strategy (no data overwrite)
- ✅ No data leakage

### Sync Behavior
- ✅ No real-time listeners
- ✅ Manual sync only
- ✅ Predictable behavior
- ✅ No duplicates
- ✅ Handles large datasets
- ✅ Offline → online works

### Security
- ✅ Employees cannot write
- ✅ Data filtered correctly
- ✅ Firestore rules enforced
- ✅ No permission errors for allowed operations

## Troubleshooting

### Issue: "Permission Denied"

**For Admin**:
```
Solution:
1. Ensure you're signed in with Firebase Auth
2. Check Firestore rules are updated
3. Verify request.auth.uid matches ownerId
4. Wait 60 seconds after updating rules
```

**For Employee**:
```
Solution:
1. Employees should NOT authenticate with Firebase Auth
2. Check companyId is correct in session
3. Verify you're querying the right path
```

### Issue: "Employee sees other employee's data"

```
Check:
1. Console logs show employeeId in query
2. Query uses: WHERE employeeId == "X"
3. Local verification filters correctly
4. Check employee session has correct ID
```

### Issue: "Data not syncing"

```
Solutions:
1. Click Sync button manually
2. Check network connection
3. Check browser console for errors
4. Verify Firestore rules allow the operation
```

### Issue: "Duplicate records"

```
Check:
1. Record IDs are consistent (strings)
2. Merge logic is working
3. Not creating new records with same data
4. IndexedDB has unique key constraints
```

## Performance Benchmarks

Expected sync times:

| Data Size | Admin Upload | Employee Download |
|-----------|-------------|-------------------|
| 10 records | < 2 seconds | < 1 second |
| 100 records | < 5 seconds | < 2 seconds |
| 1000 records | < 30 seconds | < 5 seconds |

If sync takes longer, check:
- Network speed
- Firestore region latency
- Browser performance

## Test Completion Checklist

Mark each test as passed:

- [ ] Test 1: Admin Sync on App Launch
- [ ] Test 2: Admin Manual Sync
- [ ] Test 3: Same Owner on 2 Devices
- [ ] Test 4: Employee Sees Only Their Data
- [ ] Test 5: Employee Cannot Write
- [ ] Test 6: Soft Deletes
- [ ] Test 7: Deleted Records Sync
- [ ] Test 8: Offline → Online Sync
- [ ] Test 9: Conflict Resolution
- [ ] Test 10: Large Dataset
- [ ] Test 11: Data Duplication Check

**All tests passed**: ✅ System is ready for production

**Some tests failed**: Review error logs and fix issues before deploying

---

## Next Steps After Testing

1. ✅ All tests pass → Deploy to production
2. ⚠️ Some issues found → Fix and re-test
3. 📊 Monitor Firestore usage after deployment
4. 🔧 Optimize if needed (batching, compression)

## Support

If you encounter issues during testing:
1. Check browser console logs
2. Review this guide's troubleshooting section
3. Verify Firestore rules are correct
4. Check `SYNC_IMPLEMENTATION_SUMMARY.md` for architecture details
