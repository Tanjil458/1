# Quick Start Guide: Multi-Tenant Employee Login

## 🎯 How It Works

Your MimiPro system now supports **multiple companies**, each with their own employees:

```
Company A (Admin: user1@email.com)
    ├── Employee EMP001 (Rahim)
    └── Employee EMP002 (Karim)

Company B (Admin: user2@email.com)
    ├── Employee EMP001 (John)  ← Same ID, different company
    └── Employee EMP002 (Mike)
```

Each employee logs in with **3 credentials**:
1. **Company ID** - Identifies which company they belong to
2. **Employee ID** - Their unique ID within the company (EMP001, EMP002, etc.)
3. **Password** - Their secret password

---

## 📝 Step-by-Step: Adding an Employee

### In Admin App:

**Step 1:** Sign in to your admin account
```
Email: youremail@example.com
Password: yourpassword
```

**Step 2:** Go to Employees → Employee List → Click "+"

**Step 3:** Fill in employee details:
```
Name: Rahim Khan
Mobile: 01712345678
Role: DSR
Salary: 15000
Salary Type: Daily
Login Password: rahim123  ← This is for Employee App login
```

**Step 4:** Click "Save"

**Step 5:** You'll see this message - **SAVE IT!**
```
╔══════════════════════════════════╗
║    Employee Added Successfully!   ║
╠══════════════════════════════════╣
║  Company ID: ABC12345            ║
║  Employee ID: EMP001             ║
║  Password: rahim123              ║
║                                  ║
║  Give these credentials to       ║
║  the employee.                   ║
╚══════════════════════════════════╝
```

**Step 6:** Write these down or take a screenshot

**Step 7:** Give all 3 credentials to the employee

---

## 📱 Employee Login

### In Employee App:

The employee opens the MimiPro Employee App and enters:

```
┌─────────────────────────────────┐
│ Company ID:  ABC12345           │  ← From admin's message
│ Employee ID: EMP001             │  ← From admin's message  
│ Password:    rahim123           │  ← From admin's message
│                                 │
│         [ LOGIN ]               │
└─────────────────────────────────┘
```

After successful login, employee sees **only their own data**:
- ✅ Their attendance records
- ✅ Their deliveries
- ✅ Their advances
- ✅ Their profile

---

## 🔐 Security Features

1. **Password Hashing:** Passwords stored as SHA-256 hash (never plain text)
2. **Data Isolation:** Each company's data is completely separate
3. **Employee Isolation:** Employees only see their own records
4. **Read-Only Access:** Employees cannot modify any data
5. **Session-Based:** Auto logout when app closes

---

## 📊 Data Structure

### Firestore Database:
```
users/
  ├── abc123xyz/              ← Admin User 1 (your account)
  │   ├── employees/
  │   │   ├── 1/              {employeeId: "EMP001", ...}
  │   │   └── 2/              {employeeId: "EMP002", ...}
  │   ├── attendance/
  │   ├── deliveries/
  │   └── advances/
  │
  └── def456uvw/              ← Admin User 2 (another company)
      ├── employees/
      │   ├── 1/              {employeeId: "EMP001", ...}
      │   └── 2/              {employeeId: "EMP002", ...}
      ├── attendance/
      ├── deliveries/
      └── advances/
```

**Company ID = First 8 characters of your Firebase User ID (uppercase)**

---

## ❓ Frequently Asked Questions

### Q: Where do I find my Company ID?
**A:** It's shown when you create an employee in the admin app. It's also your Firebase User ID (first 8 chars).

### Q: Can two companies have the same Employee ID?
**A:** Yes! Each company can have EMP001, EMP002, etc. They're isolated by Company ID.

### Q: What if I forgot an employee's password?
**A:** Edit the employee in admin app, enter a new password, and save. Give the new password to the employee.

### Q: Can employees change their own password?
**A:** No, only the admin can set/change passwords in the admin app.

### Q: What if I forgot my Company ID?
**A:** You can find it in Firebase Console under Authentication. It's your User UID.

### Q: How many employees can I add?
**A:** Unlimited (within Firestore free tier limits).

### Q: Can one employee work for multiple companies?
**A:** Yes, they need separate logins for each company.

---

## 🚀 Testing Checklist

Admin App:
- [ ] Can sign in to admin account
- [ ] Can create new employee
- [ ] See success message with Company ID, Employee ID, Password
- [ ] Employee appears in employee list

Employee App:
- [ ] Can enter Company ID, Employee ID, Password
- [ ] Login succeeds with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Can see dashboard after login
- [ ] Sync button works
- [ ] Can view attendance, deliveries, advances
- [ ] Data shown belongs to correct employee
- [ ] Logout works

---

## 🛠️ Troubleshooting

### Login fails with correct credentials
- Check that employee status is "active" in Firestore
- Verify Company ID matches the admin's user ID
- Check browser console for errors
- Try regenerating password in admin app

### Employee sees no data
- Use sync button to download data from cloud
- Check internet connection
- Verify attendance/deliveries exist for that employee in admin app

### Company ID not shown after creating employee
- Check that admin is signed in to Firebase
- Look for toast message that appears after save
- Check browser console for errors

---

## 📞 Support

For issues:
1. Check browser console (F12) for error messages
2. Verify Firebase configuration is correct
3. Check Firestore security rules
4. Ensure internet connection is working

---

**System Ready!** 🎉

Your multi-tenant employee management system is now fully configured.
