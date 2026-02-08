# Company ID Mapping Fix - Verification Guide

## Problem Fixed
Employee MD1 (and any employee using company ID `017000000000`) could not sync advances and attendance data because the phone number-based company ID was not mapped to the admin's Firebase UID.

## Solution
Added mapping in `MimiPro E/auth/company-id-map.js`:
```javascript
'017000000000': '5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2'
```

This maps the phone number to the actual admin Firebase UID where the data is stored in Firestore.

## Updated expandCompanyId Logic
The function now:
1. **First** checks if a mapping exists for the company ID (works for any length)
2. **Then** checks if it's already a full Firebase UID (28+ chars)
3. **Finally** returns as-is with a warning if no mapping found

This ensures phone numbers like `017000000000` are properly mapped even though they're longer than 8 characters.

## How to Verify the Fix

### Step 1: Test Company ID Expansion
Open browser console and run:
```javascript
// Load the mapping
console.log('Testing expandCompanyId function...');

// Test with phone number
const result = expandCompanyId('017000000000');
console.log('Input: 017000000000');
console.log('Output:', result);
console.log('Expected: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2');
console.log('Match:', result === '5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2' ? '✅ PASS' : '❌ FAIL');
```

Expected console output:
```
✅ Expanded company ID 017000000000 to full Firebase UID
Input: 017000000000
Output: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2
Expected: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2
Match: ✅ PASS
```

### Step 2: Test Employee Login
1. Open Employee App (`MimiPro E/index.html`)
2. Enter credentials:
   - **Company ID**: `017000000000`
   - **Employee ID**: `1` (for MD1)
   - **Password**: (employee's password)
3. Click Login
4. Check browser console for:
   ```
   ✅ Expanded company ID 017000000000 to full Firebase UID
   📍 Querying: /users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/employees
   ```

### Step 3: Verify Session Storage
After successful login:
1. Open Developer Tools (F12)
2. Go to **Application** tab → **Local Storage**
3. Find key `employeeSession`
4. Verify the value contains:
   ```json
   {
     "companyId": "5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2",
     "employeeId": "1",
     "name": "MD1",
     ...
   }
   ```
   ✅ **CRITICAL**: `companyId` must be `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`, NOT `017000000000`

### Step 4: Test Data Sync
1. After login, check console for sync logs:
   ```
   🔄 Starting employee sync...
   👤 Employee ID: 1
   🏢 Company ID: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2
   📋 Syncing profile...
   ✅ Profile synced
   📅 Syncing attendance...
   ✅ Found X attendance records in cloud
   💰 Syncing advances...
   ✅ Found 1 advance records in cloud  ← Should show 1 or more
   ```

2. Navigate to **Advances** page
3. Verify you see the ₹500 advance for February 2026

### Step 5: Verify Firestore Queries
Check browser console for Firestore query paths:
```
📍 Querying advances: /users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/advances
📍 Querying attendance: /users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/attendance
```

These paths must match where the admin app stores data.

## What Was Wrong Before

**Before Fix:**
- Employee enters: `017000000000`
- `expandCompanyId` checked length first: 12 chars > 8, so returned as-is
- Query tried: `/users/017000000000/advances` ❌
- No data found because admin stores at: `/users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/advances`

**After Fix:**
- Employee enters: `017000000000`
- `expandCompanyId` checks mapping first: Found! Returns `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`
- Query tries: `/users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/advances` ✅
- Data found and synced successfully

## Testing Matrix

| Company ID Input | Expanded To | Result |
|-----------------|-------------|--------|
| `017000000000` | `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` | ✅ Works |
| `5ti4r7Rz` | `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` | ✅ Works |
| `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` | `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` | ✅ Works |
| `UNKNOWN` | `UNKNOWN` (with warning) | ⚠️ No mapping |

## Troubleshooting

### If sync still fails:
1. Clear browser cache and localStorage
2. Verify admin has synced data to Firestore
3. Check Firebase console: `users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/advances`
4. Ensure employee document has `employeeId: "1"` in Firestore

### If wrong company ID in session:
1. Logout and clear localStorage
2. Login again with `017000000000`
3. Check console for expansion log
4. Verify session has correct companyId

## Related Files
- `MimiPro E/auth/company-id-map.js` - Company ID mappings
- `MimiPro E/auth/employee-auth.js` - Login logic (calls expandCompanyId)
- `MimiPro E/sync/employee-sync-service.js` - Sync logic (uses session.companyId)

## Success Criteria
- ✅ Employee can login with `017000000000` as company ID
- ✅ Session stores correct Firebase UID (`5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`)
- ✅ Advances sync shows: "Found 1 advance records in cloud"
- ✅ Attendance sync shows attendance data
- ✅ Advances page displays ₹500 advance for February 2026
