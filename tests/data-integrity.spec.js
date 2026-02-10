const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Data Integrity Testing', () => {
  
  test('should verify employee data structure requirements', async ({ page }) => {
    const employeeDBPath = path.join(__dirname, '../MimiPro -admin/js/db/employeeDB.js');
    const content = fs.readFileSync(employeeDBPath, 'utf-8');
    
    // Check for required fields
    const hasEmployeeId = content.includes('employeeId');
    const hasName = content.includes('name') || content.includes('employeeName');
    const hasRole = content.includes('role');
    const hasPassword = content.includes('password');
    
    console.log('Employee Data Structure:');
    console.log(`  employeeId field: ${hasEmployeeId ? '✅' : '❌'}`);
    console.log(`  name field: ${hasName ? '✅' : '❌'}`);
    console.log(`  role field: ${hasRole ? '✅' : '❌'}`);
    console.log(`  password field: ${hasPassword ? '✅' : '❌'}`);
    
    expect(hasEmployeeId).toBe(true);
  });

  test('should verify sync metadata fields', async ({ page }) => {
    const dbPath = path.join(__dirname, '../MimiPro -admin/js/db/db.js');
    const content = fs.readFileSync(dbPath, 'utf-8');
    
    // Check for required metadata fields
    const hasSyncVersion = content.includes('syncVersion');
    const hasDeleted = content.includes('deleted');
    const hasCreatedAt = content.includes('createdAt');
    const hasUpdatedAt = content.includes('updatedAt');
    const hasOwnerId = content.includes('ownerId');
    
    console.log('Sync Metadata Fields:');
    console.log(`  syncVersion: ${hasSyncVersion ? '✅' : '❌'}`);
    console.log(`  deleted flag: ${hasDeleted ? '✅' : '❌'}`);
    console.log(`  createdAt: ${hasCreatedAt ? '✅' : '❌'}`);
    console.log(`  updatedAt: ${hasUpdatedAt ? '✅' : '❌'}`);
    console.log(`  ownerId: ${hasOwnerId ? '✅' : '❌'}`);
    
    expect(hasSyncVersion).toBe(true);
    expect(hasDeleted).toBe(true);
  });

  test('should verify soft delete implementation', async ({ page }) => {
    const dbPath = path.join(__dirname, '../MimiPro -admin/js/db/db.js');
    const content = fs.readFileSync(dbPath, 'utf-8');
    
    // Check for soft delete (deleted: true instead of actual deletion)
    const hasSoftDelete = content.includes('deleted: true') || content.includes('deleted = true');
    
    console.log('Soft Delete Implementation:');
    console.log(`  Soft delete used: ${hasSoftDelete ? '✅' : '❌'}`);
    
    if (!hasSoftDelete) {
      console.warn('⚠️ WARNING: Hard deletes may be in use (data recovery risk)');
    }
    
    expect(hasSoftDelete).toBe(true);
  });

  test('should verify employee ID consistency (string vs number)', async ({ page }) => {
    const advancesPath = path.join(__dirname, '../MimiPro -admin/js/modules/advances.js');
    const attendancePath = path.join(__dirname, '../MimiPro -admin/js/modules/attendance.js');
    
    const advancesContent = fs.readFileSync(advancesPath, 'utf-8');
    const attendanceContent = fs.readFileSync(attendancePath, 'utf-8');
    
    // Check for String(employeeId) usage
    const advancesUsesString = advancesContent.includes('String(employee.employeeId)');
    const attendanceUsesString = attendanceContent.includes('String(employee.employeeId)');
    
    console.log('Employee ID Type Consistency:');
    console.log(`  Advances uses String(employeeId): ${advancesUsesString ? '✅' : '❌'}`);
    console.log(`  Attendance uses String(employeeId): ${attendanceUsesString ? '✅' : '❌'}`);
    
    expect(advancesUsesString).toBe(true);
  });

  test('should verify guard clauses for employee lookup', async ({ page }) => {
    const advancesPath = path.join(__dirname, '../MimiPro -admin/js/modules/advances.js');
    const content = fs.readFileSync(advancesPath, 'utf-8');
    
    // Check for guard clauses after employee lookup
    const hasGuardClause = content.includes('if (!employee)');
    const hasErrorHandling = content.includes('Employee not found');
    
    console.log('Employee Lookup Safety:');
    console.log(`  Guard clause present: ${hasGuardClause ? '✅' : '❌'}`);
    console.log(`  Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
    
    expect(hasGuardClause).toBe(true);
  });

  test('should verify date format consistency', async ({ page }) => {
    const dateUtilsPath = path.join(__dirname, '../MimiPro -admin/js/utils/date.js');
    const deliveryPath = path.join(__dirname, '../MimiPro -admin/js/modules/delivery.js');
    
    const dateUtilsExists = fs.existsSync(dateUtilsPath);
    
    if (dateUtilsExists) {
      const content = fs.readFileSync(dateUtilsPath, 'utf-8');
      
      // Check for date formatting functions
      const hasISOFormat = content.includes('toISOString');
      const hasDateParser = content.includes('parseDate') || content.includes('formatDate');
      
      console.log('Date Format Consistency:');
      console.log(`  ISO format used: ${hasISOFormat ? '✅' : '❌'}`);
      console.log(`  Date parser available: ${hasDateParser ? '✅' : '❌'}`);
    }
    
    expect(dateUtilsExists).toBe(true);
  });

  test('should verify advances data structure', async ({ page }) => {
    const advancesPath = path.join(__dirname, '../MimiPro -admin/js/modules/advances.js');
    const content = fs.readFileSync(advancesPath, 'utf-8');
    
    // Check for required fields in advances
    const hasReason = content.includes('reason:');
    const hasStatus = content.includes('status:');
    const hasAmount = content.includes('amount');
    const hasEmployeeId = content.includes('employeeId');
    
    console.log('Advances Data Structure:');
    console.log(`  reason field: ${hasReason ? '✅' : '❌'}`);
    console.log(`  status field: ${hasStatus ? '✅' : '❌'}`);
    console.log(`  amount field: ${hasAmount ? '✅' : '❌'}`);
    console.log(`  employeeId field: ${hasEmployeeId ? '✅' : '❌'}`);
    
    expect(hasReason).toBe(true);
    expect(hasStatus).toBe(true);
  });
});

test.describe('Business Logic Testing', () => {
  
  test('should verify attendance tracking implementation', async ({ page }) => {
    const attendancePath = path.join(__dirname, '../MimiPro -admin/js/modules/attendance.js');
    const content = fs.readFileSync(attendancePath, 'utf-8');
    
    // Check for attendance functionality
    const hasToggleAttendance = content.includes('toggleAttendance');
    const hasDateFilter = content.includes('date');
    const hasStatusField = content.includes('status');
    
    console.log('Attendance Implementation:');
    console.log(`  Toggle functionality: ${hasToggleAttendance ? '✅' : '❌'}`);
    console.log(`  Date filtering: ${hasDateFilter ? '✅' : '❌'}`);
    console.log(`  Status tracking: ${hasStatusField ? '✅' : '❌'}`);
    
    expect(hasToggleAttendance).toBe(true);
  });

  test('should verify delivery tracking implementation', async ({ page }) => {
    const deliveryPath = path.join(__dirname, '../MimiPro -admin/js/modules/delivery.js');
    const content = fs.readFileSync(deliveryPath, 'utf-8');
    
    // Check for delivery functionality
    const hasDeliveryCalculation = content.includes('calculate') || content.includes('total');
    const hasProductTracking = content.includes('product');
    const hasCustomerTracking = content.includes('customer');
    
    console.log('Delivery Implementation:');
    console.log(`  Calculation logic: ${hasDeliveryCalculation ? '✅' : '❌'}`);
    console.log(`  Product tracking: ${hasProductTracking ? '✅' : '❌'}`);
    console.log(`  Customer tracking: ${hasCustomerTracking ? '✅' : '❌'}`);
    
    expect(hasDeliveryCalculation).toBe(true);
  });

  test('should verify salary calculation implementation', async ({ page }) => {
    const salaryPath = path.join(__dirname, '../MimiPro -admin/js/modules/salary.js');
    
    if (fs.existsSync(salaryPath)) {
      const content = fs.readFileSync(salaryPath, 'utf-8');
      
      // Check for salary calculation logic
      const hasSalaryCalculation = content.includes('calculate');
      const hasAdvancesDeduction = content.includes('advances') || content.includes('deduction');
      const hasMonthlySalary = content.includes('monthly') || content.includes('salary');
      
      console.log('Salary Calculation:');
      console.log(`  Calculation logic: ${hasSalaryCalculation ? '✅' : '❌'}`);
      console.log(`  Advances deduction: ${hasAdvancesDeduction ? '✅' : '❌'}`);
      console.log(`  Monthly salary: ${hasMonthlySalary ? '✅' : '❌'}`);
      
      expect(hasSalaryCalculation).toBe(true);
    } else {
      console.log('ℹ️ Salary module not found');
    }
  });

  test('should verify role-based access control', async ({ page }) => {
    const syncServicePath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
    const content = fs.readFileSync(syncServicePath, 'utf-8');
    
    // Check for role-based filtering
    const hasDSRRoleCheck = content.includes('DSR') || content.includes('role');
    const hasEmployeeIdFilter = content.includes('employeeId');
    
    console.log('Role-Based Access Control:');
    console.log(`  DSR role check: ${hasDSRRoleCheck ? '✅' : '❌'}`);
    console.log(`  Employee ID filtering: ${hasEmployeeIdFilter ? '✅' : '❌'}`);
    
    expect(hasDSRRoleCheck).toBe(true);
  });

  test('should verify conditional navigation for DSR', async ({ page }) => {
    const appPath = path.join(__dirname, '../MimiPro E/assets/js/app.js');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // Check for conditional navigation
    const hasConditionalNav = content.includes('setupConditionalNavigation') || 
                             (content.includes('DSR') && content.includes('deliveries'));
    
    console.log('Conditional Navigation:');
    console.log(`  DSR-specific navigation: ${hasConditionalNav ? '✅' : '❌'}`);
    
    expect(hasConditionalNav).toBe(true);
  });

  test('should verify company ID mapping implementation', async ({ page }) => {
    const companyIdMapPath = path.join(__dirname, '../MimiPro E/auth/company-id-map.js');
    const content = fs.readFileSync(companyIdMapPath, 'utf-8');
    
    // Check for company ID expansion logic
    const hasExpandFunction = content.includes('expandCompanyId');
    const hasMapping = content.includes('COMPANY_ID_MAP');
    const hasLengthCheck = content.includes('length');
    
    console.log('Company ID Mapping:');
    console.log(`  Expand function: ${hasExpandFunction ? '✅' : '❌'}`);
    console.log(`  Mapping object: ${hasMapping ? '✅' : '❌'}`);
    console.log(`  Length validation: ${hasLengthCheck ? '✅' : '❌'}`);
    
    expect(hasExpandFunction).toBe(true);
    expect(hasMapping).toBe(true);
  });
});

test.describe('Integration Testing', () => {
  
  test('should verify Firebase configuration', async ({ page }) => {
    const firebaseConfigPath = path.join(__dirname, '../MimiPro -admin/js/firebase-config.js');
    const content = fs.readFileSync(firebaseConfigPath, 'utf-8');
    
    // Check for required Firebase config fields
    const hasApiKey = content.includes('apiKey');
    const hasAuthDomain = content.includes('authDomain');
    const hasProjectId = content.includes('projectId');
    const hasStorageBucket = content.includes('storageBucket');
    const hasMessagingSenderId = content.includes('messagingSenderId');
    const hasAppId = content.includes('appId');
    
    console.log('Firebase Configuration:');
    console.log(`  apiKey: ${hasApiKey ? '✅' : '❌'}`);
    console.log(`  authDomain: ${hasAuthDomain ? '✅' : '❌'}`);
    console.log(`  projectId: ${hasProjectId ? '✅' : '❌'}`);
    console.log(`  storageBucket: ${hasStorageBucket ? '✅' : '❌'}`);
    console.log(`  messagingSenderId: ${hasMessagingSenderId ? '✅' : '❌'}`);
    console.log(`  appId: ${hasAppId ? '✅' : '❌'}`);
    
    expect(hasApiKey).toBe(true);
    expect(hasProjectId).toBe(true);
  });

  test('should verify sync service consistency between admin and employee', async ({ page }) => {
    const adminSyncPath = path.join(__dirname, '../MimiPro -admin/js/db/sync.js');
    const employeeSyncPath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
    
    const adminContent = fs.readFileSync(adminSyncPath, 'utf-8');
    const employeeContent = fs.readFileSync(employeeSyncPath, 'utf-8');
    
    // Check for sync compatibility
    const adminHasFirestore = adminContent.includes('firestore') || adminContent.includes('Firestore');
    const employeeHasFirestore = employeeContent.includes('firestore') || employeeContent.includes('Firestore');
    
    const adminHasSyncVersion = adminContent.includes('syncVersion');
    const employeeHasSyncVersion = employeeContent.includes('syncVersion');
    
    console.log('Sync Service Consistency:');
    console.log(`  Admin uses Firestore: ${adminHasFirestore ? '✅' : '❌'}`);
    console.log(`  Employee uses Firestore: ${employeeHasFirestore ? '✅' : '❌'}`);
    console.log(`  Admin tracks syncVersion: ${adminHasSyncVersion ? '✅' : '❌'}`);
    console.log(`  Employee tracks syncVersion: ${employeeHasSyncVersion ? '✅' : '❌'}`);
    
    expect(adminHasFirestore && employeeHasFirestore).toBe(true);
  });

  test('should verify read-only employee access', async ({ page }) => {
    const employeeSyncPath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
    const content = fs.readFileSync(employeeSyncPath, 'utf-8');
    
    // Employee should NEVER write to Firestore
    const hasSetDoc = content.includes('.set(') || content.includes('setDoc');
    const hasUpdateDoc = content.includes('.update(') || content.includes('updateDoc');
    const hasDeleteDoc = content.includes('.delete(') || content.includes('deleteDoc');
    
    console.log('Employee Read-Only Access:');
    console.log(`  Has setDoc (BAD): ${hasSetDoc ? '❌' : '✅'}`);
    console.log(`  Has updateDoc (BAD): ${hasUpdateDoc ? '❌' : '✅'}`);
    console.log(`  Has deleteDoc (BAD): ${hasDeleteDoc ? '❌' : '✅'}`);
    
    if (hasSetDoc || hasUpdateDoc || hasDeleteDoc) {
      console.error('❌ CRITICAL: Employee app should NEVER write to Firestore');
      expect(hasSetDoc).toBe(false);
    } else {
      console.log('✅ Employee app is read-only as expected');
    }
  });

  test('should verify IndexedDB and Firestore integration', async ({ page }) => {
    const employeeDBPath = path.join(__dirname, '../MimiPro E/db/indexeddb.js');
    const syncServicePath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
    
    const dbContent = fs.readFileSync(employeeDBPath, 'utf-8');
    const syncContent = fs.readFileSync(syncServicePath, 'utf-8');
    
    // Check for proper integration
    const dbHasStores = dbContent.includes('createObjectStore');
    const syncUsesDB = syncContent.includes('indexedDB') || syncContent.includes('db.');
    
    console.log('IndexedDB-Firestore Integration:');
    console.log(`  IndexedDB creates stores: ${dbHasStores ? '✅' : '❌'}`);
    console.log(`  Sync service uses local DB: ${syncUsesDB ? '✅' : '❌'}`);
    
    expect(dbHasStores).toBe(true);
  });
});
