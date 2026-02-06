# Employee Login Credentials Guide

## How to Get Employee Login Credentials

Employees receive their login credentials when added by the admin. When an employee is created, the admin sees this message:

```
Employee Added!

Company ID: XJKPKTVQ
Employee ID: EMP001
Password: [password entered by admin]

Give these credentials to the employee.
```

---

## Current Employees (from admin app)

### Employee 1: Sohel
- **Company ID**: `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`
- **Employee ID**: `1` (or `EMP001` - check admin app)
- **Password**: [Set by admin when creating employee]
- **Role**: OSR
- **Salary**: 16000

### Employee 2: Ramjan
- **Company ID**: `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`
- **Employee ID**: `2` (or `EMP002` - check admin app)
- **Password**: [Set by admin when creating employee]
- **Role**: Delivery Person
- **Salary**: 15000

---

## How to Login as Employee

1. Open **Employee App**: `MimiPro E/index.html`
2. Enter login credentials:
   - **Company ID**: `5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2`
   - **Employee ID**: `EMP001` or `EMP002` (or `1`, `2` - use what's shown)
   - **Password**: *(ask your supervisor)*

3. Click **Login**

4. You'll see your:
   - Attendance records
   - Deliveries
   - Advances
   - Profile

---

## How to Find/Reset Passwords (Admin Only)

If you forgot an employee's password:

1. In **Admin App** → Go to **Employees**
2. Find the employee
3. Click **Edit**
4. Set a **new Login Password**
5. Click **Save**
6. The system will show: `Employee updated successfully`
7. Share the **new password** with the employee

---

## Database Structure

```
Firestore Path: /users/5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2/employees/
├── {docId}
│   ├── employeeId: "1" or "EMP001"
│   ├── name: "Sohel"
│   ├── passwordHash: "sha256hash..."
│   ├── status: "active"
│   └── ...other fields
```

---

## Common Login Issues

| Issue | Fix |
|-------|-----|
| "Invalid Company ID, Employee ID or Password" | Check all 3 fields are correct. Make sure admin has synced employees. |
| "Your account is inactive" | Ask admin to set your status to "active" in Employees list |
| "Account configuration error" | Employee record has no password. Admin needs to set password and save. |
| No employees found | Admin app hasn't synced yet. Admin must: Employees → Click Sync button |

---

## How Admin Sets Employee Password

1. **Admin App** → **Employees**
2. **Add New Employee** or **Edit Existing**
3. Fill in fields:
   - Name: `Sohel`
   - Mobile: `01799999999`
   - Role: `OSR`
   - Salary: `16000`
   - **Login Password**: `YourPassword123` ← Important!
4. Click **Save**
6. See confirmation: `Employee Added! Company ID: 5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2 Employee ID: EMP001 Password: YourPassword123`
6. **Share** Company ID + Employee ID + Password with employee

---

## Next Steps

1. **Admin**: Make sure all employees are added with passwords in the admin app
2. **Admin**: Click Sync to push employees to Firestore
3. **Admin**: Share the credentials with each employee
4. **Employee**: Login with the provided credentials
5. **Employee**: View attendance, deliveries, advances in the app
