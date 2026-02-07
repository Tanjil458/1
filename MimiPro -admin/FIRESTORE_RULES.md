# Firebase Firestore Security Rules

## Update Firestore Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your MimiPro project: **mimipro-0458**
3. Go to: **Firestore Database** → **Rules** tab
4. **Replace ALL existing rules** with the code below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==================== SHARED COLLECTIONS ====================
    // These are readable by all (employees can see them)
    // Writable by authenticated users (admin writes them)
    
    match /users/{companyId}/employees/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{companyId}/attendance/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{companyId}/delivery/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{companyId}/profile/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{companyId}/credits/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{companyId}/advances/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{companyId}/stock/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // ==================== ADMIN PRIVATE COLLECTIONS ====================
    // Private admin data - only accessible by that admin's UID
    
    match /users/{userId}/expenses/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/history/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/settings/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/deliveries/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/salaryReports/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click **Publish** button

## Why These Rules?

- **Shared collections** (`attendance`, `delivery`, `employees`, `profile`, `credits`, `advances`, `stock`):
  - `allow read: if true` → Anyone can read (needed for employees to view data)
  - `allow write: if request.auth != null` → Only logged-in users (admin) can write

- **Private collections** (`expenses`, `history`, `settings`):
  - Only accessible by the admin who owns them (`request.auth.uid == userId`)

## Data Structure After Rules Update

```
Firestore Database Structure:
├── users/
│   ├── 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/    ← companyId (admin's UID or identifier)
│   │   ├── employees/               ← READ: public, WRITE: admin
│   │   ├── attendance/              ← READ: public, WRITE: admin
│   │   ├── delivery/                ← READ: public, WRITE: admin
│   │   ├── profile/                 ← READ: public, WRITE: admin
│   │   ├── credits/                 ← READ: public, WRITE: admin
│   │   ├── advances/                ← READ: public, WRITE: admin
│   │   └── stock/                   ← READ: public, WRITE: admin
│   │
│   └── [admin's full UID]/
│       ├── expenses/                ← READ/WRITE: admin only
│       ├── history/                 ← READ/WRITE: admin only
│       └── settings/                ← READ/WRITE: admin only
```

## Test After Update

1. **Admin app**: Open and mark attendance → Data syncs to `/users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/attendance`
2. **Employee app**: Login with Company ID `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2` → Should now see attendance ✅

If you still get "Permission denied" after updating rules:
- Wait 30-60 seconds for Firebase to apply the new rules
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh both apps
