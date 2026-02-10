const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Functional Testing - Admin Application', () => {
  
  test('should verify admin HTML structure', async ({ page }) => {
    const adminIndexPath = path.join(__dirname, '../MimiPro -admin/index.html');
    const content = fs.readFileSync(adminIndexPath, 'utf-8');
    
    // Check for essential elements
    const hasTitle = content.includes('<title>');
    const hasFirebaseScripts = content.includes('firebase-app-compat.js');
    const hasAuthScript = content.includes('firebase-auth-compat.js');
    const hasFirestoreScript = content.includes('firebase-firestore-compat.js');
    const hasNavigation = content.includes('side-nav');
    const hasSyncButton = content.includes('syncBtn');
    
    console.log('Admin HTML Structure:');
    console.log(`  Title tag: ${hasTitle ? '✅' : '❌'}`);
    console.log(`  Firebase App SDK: ${hasFirebaseScripts ? '✅' : '❌'}`);
    console.log(`  Firebase Auth SDK: ${hasAuthScript ? '✅' : '❌'}`);
    console.log(`  Firebase Firestore SDK: ${hasFirestoreScript ? '✅' : '❌'}`);
    console.log(`  Side Navigation: ${hasNavigation ? '✅' : '❌'}`);
    console.log(`  Sync Button: ${hasSyncButton ? '✅' : '❌'}`);
    
    expect(hasTitle).toBe(true);
    expect(hasFirebaseScripts).toBe(true);
    expect(hasNavigation).toBe(true);
  });

  test('should verify employee HTML structure', async ({ page }) => {
    const employeeIndexPath = path.join(__dirname, '../MimiPro E/index.html');
    const content = fs.readFileSync(employeeIndexPath, 'utf-8');
    
    // Check for essential elements
    const hasLoginForm = content.includes('loginForm');
    const hasCompanyIdInput = content.includes('companyId');
    const hasEmployeeIdInput = content.includes('employeeId');
    const hasPasswordInput = content.includes('password');
    const hasFirebaseScripts = content.includes('firebase-app-compat.js');
    
    console.log('Employee Login HTML Structure:');
    console.log(`  Login form: ${hasLoginForm ? '✅' : '❌'}`);
    console.log(`  Company ID input: ${hasCompanyIdInput ? '✅' : '❌'}`);
    console.log(`  Employee ID input: ${hasEmployeeIdInput ? '✅' : '❌'}`);
    console.log(`  Password input: ${hasPasswordInput ? '✅' : '❌'}`);
    console.log(`  Firebase SDK: ${hasFirebaseScripts ? '✅' : '❌'}`);
    
    expect(hasLoginForm).toBe(true);
    expect(hasCompanyIdInput).toBe(true);
    expect(hasEmployeeIdInput).toBe(true);
  });

  test('should verify module files exist', async ({ page }) => {
    const modulesDir = path.join(__dirname, '../MimiPro -admin/js/modules');
    const requiredModules = [
      'dashboard.js',
      'employees.js',
      'attendance.js',
      'advances.js',
      'delivery.js',
      'salary.js',
      'settings.js'
    ];
    
    console.log('Checking required modules:');
    for (const module of requiredModules) {
      const modulePath = path.join(modulesDir, module);
      const exists = fs.existsSync(modulePath);
      console.log(`  ${module}: ${exists ? '✅' : '❌'}`);
      expect(exists).toBe(true);
    }
  });

  test('should verify router implementation', async ({ page }) => {
    const routerPath = path.join(__dirname, '../MimiPro -admin/js/router.js');
    const content = fs.readFileSync(routerPath, 'utf-8');
    
    // Check for route definitions
    const hasRouteMapping = content.includes('routes') || content.includes('route');
    const hasNavigationHandler = content.includes('navigate') || content.includes('hashchange');
    
    console.log('Router Implementation:');
    console.log(`  Route mapping: ${hasRouteMapping ? '✅' : '❌'}`);
    console.log(`  Navigation handler: ${hasNavigationHandler ? '✅' : '❌'}`);
    
    expect(hasRouteMapping).toBe(true);
  });

  test('should verify database modules', async ({ page }) => {
    const dbDir = path.join(__dirname, '../MimiPro -admin/js/db');
    const requiredDBModules = [
      'db.js',
      'sync.js',
      'employeeDB.js',
      'attendanceDB.js',
      'deliveryDB.js'
    ];
    
    console.log('Checking database modules:');
    for (const module of requiredDBModules) {
      const modulePath = path.join(dbDir, module);
      const exists = fs.existsSync(modulePath);
      console.log(`  ${module}: ${exists ? '✅' : '❌'}`);
      expect(exists).toBe(true);
    }
  });

  test('should verify sync implementation', async ({ page }) => {
    const syncPath = path.join(__dirname, '../MimiPro -admin/js/db/sync.js');
    const content = fs.readFileSync(syncPath, 'utf-8');
    
    // Check for sync functions
    const hasSyncNow = content.includes('syncNow') || content.includes('sync()');
    const hasUpload = content.includes('upload') || content.includes('pushToCloud');
    const hasDownload = content.includes('download') || content.includes('pullFromCloud');
    
    console.log('Sync Implementation:');
    console.log(`  Sync function: ${hasSyncNow ? '✅' : '❌'}`);
    console.log(`  Upload capability: ${hasUpload ? '✅' : '❌'}`);
    console.log(`  Download capability: ${hasDownload ? '✅' : '❌'}`);
    
    expect(hasSyncNow).toBe(true);
  });
});

test.describe('Functional Testing - Employee Application', () => {
  
  test('should verify employee pages', async ({ page }) => {
    const pagesDir = path.join(__dirname, '../MimiPro E/pages');
    const requiredPages = [
      'dashboard/dashboard.js',
      'attendance/attendance.js',
      'advances/advances.js',
      'deliveries/deliveries.js',
      'profile/profile.js'
    ];
    
    console.log('Checking employee pages:');
    for (const pagePath of requiredPages) {
      const fullPath = path.join(pagesDir, pagePath);
      const exists = fs.existsSync(fullPath);
      console.log(`  ${pagePath}: ${exists ? '✅' : '❌'}`);
      expect(exists).toBe(true);
    }
  });

  test('should verify authentication files', async ({ page }) => {
    const authDir = path.join(__dirname, '../MimiPro E/auth');
    const requiredAuthFiles = [
      'employee-auth.js',
      'session.js',
      'company-id-map.js'
    ];
    
    console.log('Checking authentication files:');
    for (const file of requiredAuthFiles) {
      const filePath = path.join(authDir, file);
      const exists = fs.existsSync(filePath);
      console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
      expect(exists).toBe(true);
    }
  });

  test('should verify sync service', async ({ page }) => {
    const syncPath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
    const content = fs.readFileSync(syncPath, 'utf-8');
    
    // Check for sync functions
    const hasSyncProfile = content.includes('syncProfile');
    const hasSyncAttendance = content.includes('syncAttendance');
    const hasSyncAdvances = content.includes('syncAdvances');
    const hasSyncDeliveries = content.includes('syncDeliveries');
    
    console.log('Employee Sync Service:');
    console.log(`  Profile sync: ${hasSyncProfile ? '✅' : '❌'}`);
    console.log(`  Attendance sync: ${hasSyncAttendance ? '✅' : '❌'}`);
    console.log(`  Advances sync: ${hasSyncAdvances ? '✅' : '❌'}`);
    console.log(`  Deliveries sync: ${hasSyncDeliveries ? '✅' : '❌'}`);
    
    expect(hasSyncProfile).toBe(true);
    expect(hasSyncAttendance).toBe(true);
  });

  test('should verify IndexedDB implementation', async ({ page }) => {
    const dbPath = path.join(__dirname, '../MimiPro E/db/indexeddb.js');
    const content = fs.readFileSync(dbPath, 'utf-8');
    
    // Check for IndexedDB operations
    const hasOpenDB = content.includes('indexedDB.open');
    const hasObjectStore = content.includes('objectStore');
    const hasTransaction = content.includes('transaction');
    
    console.log('IndexedDB Implementation:');
    console.log(`  Database opening: ${hasOpenDB ? '✅' : '❌'}`);
    console.log(`  Object store usage: ${hasObjectStore ? '✅' : '❌'}`);
    console.log(`  Transaction handling: ${hasTransaction ? '✅' : '❌'}`);
    
    expect(hasOpenDB).toBe(true);
  });

  test('should verify utility functions', async ({ page }) => {
    const utilsDir = path.join(__dirname, '../MimiPro E/utils');
    const requiredUtils = [
      'date.js',
      'money.js',
      'ui.js'
    ];
    
    console.log('Checking utility files:');
    for (const file of requiredUtils) {
      const filePath = path.join(utilsDir, file);
      const exists = fs.existsSync(filePath);
      console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
      expect(exists).toBe(true);
    }
  });
});

test.describe('Code Quality Checks', () => {
  
  test('should check for console.log statements (potential debug code)', async ({ page }) => {
    const files = [
      '../MimiPro -admin/js/modules/dashboard.js',
      '../MimiPro -admin/js/modules/attendance.js',
      '../MimiPro E/pages/dashboard/dashboard.js'
    ];
    
    let consoleLogsFound = [];
    
    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(/console\.log/g);
      
      if (matches) {
        consoleLogsFound.push({
          file,
          count: matches.length
        });
      }
    }
    
    if (consoleLogsFound.length > 0) {
      console.log('⚠️ Console.log statements found (consider removing in production):');
      consoleLogsFound.forEach(item => {
        console.log(`  ${item.file}: ${item.count} occurrences`);
      });
    } else {
      console.log('✅ No console.log statements found in checked files');
    }
  });

  test('should check for TODO/FIXME comments', async ({ page }) => {
    const modulesDir = path.join(__dirname, '../MimiPro -admin/js/modules');
    const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
    
    let todosFound = [];
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(modulesDir, file), 'utf-8');
      const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi);
      
      if (todoMatches) {
        todosFound.push({
          file,
          count: todoMatches.length
        });
      }
    }
    
    if (todosFound.length > 0) {
      console.log('⚠️ TODO/FIXME comments found:');
      todosFound.forEach(item => {
        console.log(`  ${item.file}: ${item.count} items`);
      });
    } else {
      console.log('✅ No TODO/FIXME comments found');
    }
  });

  test('should check for proper error handling', async ({ page }) => {
    const syncPath = path.join(__dirname, '../MimiPro -admin/js/db/sync.js');
    const content = fs.readFileSync(syncPath, 'utf-8');
    
    // Check for try-catch blocks
    const tryBlocks = content.match(/try\s*{/g);
    const catchBlocks = content.match(/catch\s*\(/g);
    
    console.log('Error Handling:');
    console.log(`  Try blocks: ${tryBlocks ? tryBlocks.length : 0}`);
    console.log(`  Catch blocks: ${catchBlocks ? catchBlocks.length : 0}`);
    
    if (tryBlocks && catchBlocks) {
      expect(tryBlocks.length).toBe(catchBlocks.length);
    }
  });

  test('should verify CSS files exist', async ({ page }) => {
    const adminCssDir = path.join(__dirname, '../MimiPro -admin/css');
    const employeeCssDir = path.join(__dirname, '../MimiPro E/assets/css');
    
    const adminCssExists = fs.existsSync(adminCssDir);
    const employeeCssExists = fs.existsSync(employeeCssDir);
    
    console.log('CSS Files:');
    console.log(`  Admin CSS directory: ${adminCssExists ? '✅' : '❌'}`);
    console.log(`  Employee CSS directory: ${employeeCssExists ? '✅' : '❌'}`);
    
    expect(adminCssExists).toBe(true);
    expect(employeeCssExists).toBe(true);
  });
});
