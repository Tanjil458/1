#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issues = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPassed(testName) {
  totalTests++;
  passedTests++;
  log(`✅ ${testName}`, 'green');
}

function testFailed(testName, reason) {
  totalTests++;
  failedTests++;
  log(`❌ ${testName}`, 'red');
  if (reason) log(`   ${reason}`, 'yellow');
  issues.push({ test: testName, reason });
}

function testInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function sectionHeader(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

// SECURITY TESTS
function runSecurityTests() {
  sectionHeader('SECURITY TESTING');

  // Test 1: XSS vulnerabilities in error handling
  {
    const testName = 'Check for XSS vulnerabilities in error handling';
    try {
      const adminAppPath = path.join(__dirname, '../MimiPro -admin/js/app.js');
      const content = fs.readFileSync(adminAppPath, 'utf-8');
      
      const innerHTMLMatches = content.match(/innerHTML\s*=\s*`[^`]*\$\{[^}]*\.message[^`]*`/g);
      
      if (innerHTMLMatches) {
        testFailed(testName, `Found innerHTML with error messages (XSS vulnerability): ${innerHTMLMatches.length} occurrences`);
      } else {
        testPassed(testName);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 2: Check for exposed API keys
  {
    const testName = 'Check for exposed Firebase API keys';
    try {
      const firebaseConfigPath = path.join(__dirname, '../MimiPro -admin/js/firebase-config.js');
      const content = fs.readFileSync(firebaseConfigPath, 'utf-8');
      
      const apiKeyMatch = content.match(/apiKey:\s*["']([^"']+)["']/);
      
      if (apiKeyMatch) {
        testInfo(`Firebase API key found in source code (${apiKeyMatch[1].substring(0, 10)}...)`);
        testInfo('This is acceptable for Firebase client SDK but should be protected with Security Rules');
        testPassed(testName);
      } else {
        testFailed(testName, 'No Firebase API key found - configuration may be missing');
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 3: Insecure localStorage usage
  {
    const testName = 'Check for insecure localStorage usage';
    try {
      const files = [
        '../MimiPro E/auth/employee-auth.js',
        '../MimiPro E/auth/session.js',
        '../MimiPro -admin/js/modules/employeeListing.js'
      ];
      
      let insecureStorageFound = false;
      const vulnerableFiles = [];
      
      for (const file of files) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const sessionStorageMatch = content.match(/localStorage\.setItem\(['"]employeeSession['"]/);
        const userIdStorageMatch = content.match(/localStorage\.setItem\(['"]localUserId['"]/);
        
        if (sessionStorageMatch || userIdStorageMatch) {
          insecureStorageFound = true;
          vulnerableFiles.push(file);
        }
      }
      
      if (insecureStorageFound) {
        testFailed(testName, `Unencrypted sensitive data in localStorage in files: ${vulnerableFiles.join(', ')}`);
      } else {
        testPassed(testName);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 4: Weak password hashing
  {
    const testName = 'Check for weak password hashing';
    try {
      const authPath = path.join(__dirname, '../MimiPro E/auth/employee-auth.js');
      const content = fs.readFileSync(authPath, 'utf-8');
      
      const sha256Match = content.match(/crypto\.subtle\.digest\(['"]SHA-256['"]/);
      
      if (sha256Match) {
        testFailed(testName, 'Using SHA-256 for password hashing (should use bcrypt/argon2 with salt)');
      } else {
        testPassed(testName);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 5: innerHTML XSS vulnerabilities in modules
  {
    const testName = 'Check for innerHTML XSS vulnerabilities in modules';
    try {
      const modulesDir = path.join(__dirname, '../MimiPro -admin/js/modules');
      const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
      
      const xssVulnerabilities = [];
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(modulesDir, file), 'utf-8');
        const innerHTMLMatches = content.match(/\.innerHTML\s*=\s*`/g);
        
        if (innerHTMLMatches) {
          xssVulnerabilities.push({
            file,
            count: innerHTMLMatches.length
          });
        }
      }
      
      if (xssVulnerabilities.length > 0) {
        const summary = xssVulnerabilities.map(v => `${v.file}(${v.count})`).join(', ');
        testFailed(testName, `innerHTML with template literals found in: ${summary}`);
      } else {
        testPassed(testName);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 6: Content Security Policy
  {
    const testName = 'Check Content Security Policy';
    try {
      const adminIndexPath = path.join(__dirname, '../MimiPro -admin/index.html');
      const employeeIndexPath = path.join(__dirname, '../MimiPro E/index.html');
      
      const adminContent = fs.readFileSync(adminIndexPath, 'utf-8');
      const employeeContent = fs.readFileSync(employeeIndexPath, 'utf-8');
      
      const adminCSP = adminContent.match(/Content-Security-Policy/);
      const employeeCSP = employeeContent.match(/Content-Security-Policy/);
      
      if (adminCSP && employeeCSP) {
        testPassed(testName);
      } else if (adminCSP || employeeCSP) {
        testFailed(testName, `CSP missing in ${!adminCSP ? 'admin' : 'employee'} app`);
      } else {
        testFailed(testName, 'CSP missing in both admin and employee apps');
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 7: SQL injection patterns (Firebase)
  {
    const testName = 'Check for proper query filtering (Firebase)';
    try {
      const syncPath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
      const content = fs.readFileSync(syncPath, 'utf-8');
      
      const hasEmployeeIdFilter = content.includes('where("employeeId", "==",');
      
      if (hasEmployeeIdFilter) {
        testPassed(testName);
      } else {
        testFailed(testName, 'Employee data filtering may be missing');
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 8: Hardcoded credentials
  {
    const testName = 'Check for hardcoded credentials';
    try {
      const files = [
        '../MimiPro E/auth/employee-auth.js',
        '../MimiPro -admin/js/firebase-config.js'
      ];
      
      let credentialsFound = false;
      
      for (const file of files) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const passwordMatch = content.match(/password\s*[:=]\s*["'][a-zA-Z0-9!@#$%^&*]{6,}["']/i);
        const secretMatch = content.match(/secret\s*[:=]\s*["'][a-zA-Z0-9!@#$%^&*]{6,}["']/i);
        
        if (passwordMatch || secretMatch) {
          credentialsFound = true;
          break;
        }
      }
      
      if (credentialsFound) {
        testFailed(testName, 'Potential hardcoded credentials found');
      } else {
        testPassed(testName);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }
}

// FUNCTIONAL TESTS
function runFunctionalTests() {
  sectionHeader('FUNCTIONAL TESTING');

  // Test 1: Admin HTML structure
  {
    const testName = 'Verify admin HTML structure';
    try {
      const adminIndexPath = path.join(__dirname, '../MimiPro -admin/index.html');
      const content = fs.readFileSync(adminIndexPath, 'utf-8');
      
      const hasTitle = content.includes('<title>');
      const hasFirebaseScripts = content.includes('firebase-app-compat.js');
      const hasAuthScript = content.includes('firebase-auth-compat.js');
      const hasNavigation = content.includes('side-nav');
      const hasSyncButton = content.includes('syncBtn');
      
      if (hasTitle && hasFirebaseScripts && hasAuthScript && hasNavigation && hasSyncButton) {
        testPassed(testName);
      } else {
        const missing = [];
        if (!hasTitle) missing.push('title');
        if (!hasFirebaseScripts) missing.push('Firebase App SDK');
        if (!hasAuthScript) missing.push('Firebase Auth SDK');
        if (!hasNavigation) missing.push('navigation');
        if (!hasSyncButton) missing.push('sync button');
        testFailed(testName, `Missing: ${missing.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 2: Employee HTML structure
  {
    const testName = 'Verify employee HTML structure';
    try {
      const employeeIndexPath = path.join(__dirname, '../MimiPro E/index.html');
      const content = fs.readFileSync(employeeIndexPath, 'utf-8');
      
      const hasLoginForm = content.includes('loginForm');
      const hasCompanyIdInput = content.includes('companyId');
      const hasEmployeeIdInput = content.includes('employeeId');
      const hasPasswordInput = content.includes('password');
      const hasFirebaseScripts = content.includes('firebase-app-compat.js');
      
      if (hasLoginForm && hasCompanyIdInput && hasEmployeeIdInput && hasPasswordInput && hasFirebaseScripts) {
        testPassed(testName);
      } else {
        const missing = [];
        if (!hasLoginForm) missing.push('login form');
        if (!hasCompanyIdInput) missing.push('company ID input');
        if (!hasEmployeeIdInput) missing.push('employee ID input');
        if (!hasPasswordInput) missing.push('password input');
        if (!hasFirebaseScripts) missing.push('Firebase SDK');
        testFailed(testName, `Missing: ${missing.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 3: Module files exist
  {
    const testName = 'Verify module files exist';
    try {
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
      
      const missing = [];
      for (const module of requiredModules) {
        const modulePath = path.join(modulesDir, module);
        if (!fs.existsSync(modulePath)) {
          missing.push(module);
        }
      }
      
      if (missing.length === 0) {
        testPassed(testName);
      } else {
        testFailed(testName, `Missing modules: ${missing.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 4: Database modules
  {
    const testName = 'Verify database modules';
    try {
      const dbDir = path.join(__dirname, '../MimiPro -admin/js/db');
      const requiredDBModules = [
        'db.js',
        'sync.js',
        'employeeDB.js',
        'attendanceDB.js',
        'deliveryDB.js'
      ];
      
      const missing = [];
      for (const module of requiredDBModules) {
        const modulePath = path.join(dbDir, module);
        if (!fs.existsSync(modulePath)) {
          missing.push(module);
        }
      }
      
      if (missing.length === 0) {
        testPassed(testName);
      } else {
        testFailed(testName, `Missing DB modules: ${missing.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 5: Employee pages
  {
    const testName = 'Verify employee pages';
    try {
      const pagesDir = path.join(__dirname, '../MimiPro E/pages');
      const requiredPages = [
        'dashboard/dashboard.js',
        'attendance/attendance.js',
        'advances/advances.js',
        'deliveries/deliveries.js',
        'profile/profile.js'
      ];
      
      const missing = [];
      for (const page of requiredPages) {
        const fullPath = path.join(pagesDir, page);
        if (!fs.existsSync(fullPath)) {
          missing.push(page);
        }
      }
      
      if (missing.length === 0) {
        testPassed(testName);
      } else {
        testFailed(testName, `Missing pages: ${missing.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }
}

// DATA INTEGRITY TESTS
function runDataIntegrityTests() {
  sectionHeader('DATA INTEGRITY TESTING');

  // Test 1: Sync metadata fields
  {
    const testName = 'Verify sync metadata fields';
    try {
      const dbPath = path.join(__dirname, '../MimiPro -admin/js/db/db.js');
      const content = fs.readFileSync(dbPath, 'utf-8');
      
      const hasSyncVersion = content.includes('syncVersion');
      const hasDeleted = content.includes('deleted');
      const hasCreatedAt = content.includes('createdAt');
      const hasUpdatedAt = content.includes('updatedAt');
      const hasOwnerId = content.includes('ownerId');
      
      if (hasSyncVersion && hasDeleted && hasCreatedAt && hasUpdatedAt && hasOwnerId) {
        testPassed(testName);
      } else {
        const missing = [];
        if (!hasSyncVersion) missing.push('syncVersion');
        if (!hasDeleted) missing.push('deleted');
        if (!hasCreatedAt) missing.push('createdAt');
        if (!hasUpdatedAt) missing.push('updatedAt');
        if (!hasOwnerId) missing.push('ownerId');
        testFailed(testName, `Missing metadata: ${missing.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 2: Soft delete implementation
  {
    const testName = 'Verify soft delete implementation';
    try {
      const dbPath = path.join(__dirname, '../MimiPro -admin/js/db/db.js');
      const content = fs.readFileSync(dbPath, 'utf-8');
      
      const hasSoftDelete = content.includes('deleted: true') || content.includes('deleted = true');
      
      if (hasSoftDelete) {
        testPassed(testName);
      } else {
        testFailed(testName, 'Soft delete not implemented (data recovery risk)');
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 3: Employee ID consistency
  {
    const testName = 'Verify employee ID consistency (string type)';
    try {
      const advancesPath = path.join(__dirname, '../MimiPro -admin/js/modules/advances.js');
      const attendancePath = path.join(__dirname, '../MimiPro -admin/js/modules/attendance.js');
      
      const advancesContent = fs.readFileSync(advancesPath, 'utf-8');
      const attendanceContent = fs.readFileSync(attendancePath, 'utf-8');
      
      const advancesUsesString = advancesContent.includes('String(employee.employeeId)');
      const attendanceUsesString = attendanceContent.includes('String(employee.employeeId)');
      
      if (advancesUsesString && attendanceUsesString) {
        testPassed(testName);
      } else {
        const issues = [];
        if (!advancesUsesString) issues.push('advances');
        if (!attendanceUsesString) issues.push('attendance');
        testFailed(testName, `Not using String(employeeId) in: ${issues.join(', ')}`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 4: Guard clauses for employee lookup
  {
    const testName = 'Verify guard clauses for employee lookup';
    try {
      const advancesPath = path.join(__dirname, '../MimiPro -admin/js/modules/advances.js');
      const content = fs.readFileSync(advancesPath, 'utf-8');
      
      const hasGuardClause = content.includes('if (!employee)');
      const hasErrorHandling = content.includes('Employee not found');
      
      if (hasGuardClause && hasErrorHandling) {
        testPassed(testName);
      } else {
        const issues = [];
        if (!hasGuardClause) issues.push('guard clause missing');
        if (!hasErrorHandling) issues.push('error handling missing');
        testFailed(testName, issues.join(', '));
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 5: Read-only employee access
  {
    const testName = 'Verify read-only employee access';
    try {
      const employeeSyncPath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
      const content = fs.readFileSync(employeeSyncPath, 'utf-8');
      
      const hasSetDoc = content.includes('.set(') || content.includes('setDoc');
      const hasUpdateDoc = content.includes('.update(') || content.includes('updateDoc');
      const hasDeleteDoc = content.includes('.delete(') || content.includes('deleteDoc');
      
      if (!hasSetDoc && !hasUpdateDoc && !hasDeleteDoc) {
        testPassed(testName);
      } else {
        testFailed(testName, 'CRITICAL: Employee app can write to Firestore (should be read-only)');
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }
}

// CODE QUALITY TESTS
function runCodeQualityTests() {
  sectionHeader('CODE QUALITY TESTING');

  // Test 1: Console.log statements
  {
    const testName = 'Check for console.log statements';
    try {
      const files = [
        '../MimiPro -admin/js/modules/dashboard.js',
        '../MimiPro -admin/js/modules/attendance.js',
        '../MimiPro E/pages/dashboard/dashboard.js'
      ];
      
      const consoleLogsFound = [];
      
      for (const file of files) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(/console\.log/g);
        
        if (matches) {
          consoleLogsFound.push({
            file: path.basename(file),
            count: matches.length
          });
        }
      }
      
      if (consoleLogsFound.length > 0) {
        const summary = consoleLogsFound.map(item => `${item.file}(${item.count})`).join(', ');
        testInfo(`Console.log found in: ${summary} (consider removing in production)`);
        testPassed(testName);
      } else {
        testPassed(testName);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }

  // Test 2: Error handling
  {
    const testName = 'Check for proper error handling';
    try {
      const syncPath = path.join(__dirname, '../MimiPro -admin/js/db/sync.js');
      const content = fs.readFileSync(syncPath, 'utf-8');
      
      const tryBlocks = content.match(/try\s*{/g);
      const catchBlocks = content.match(/catch\s*\(/g);
      
      if (tryBlocks && catchBlocks && tryBlocks.length === catchBlocks.length) {
        testPassed(testName);
      } else {
        testFailed(testName, `Mismatched try/catch blocks: ${tryBlocks?.length || 0} try, ${catchBlocks?.length || 0} catch`);
      }
    } catch (error) {
      testFailed(testName, error.message);
    }
  }
}

// Run all tests
function runAllTests() {
  log('\n' + '═'.repeat(60), 'magenta');
  log('  COMPREHENSIVE APPLICATION TESTING SUITE', 'bold');
  log('  MimiPro Admin & Employee Applications', 'cyan');
  log('═'.repeat(60) + '\n', 'magenta');

  runSecurityTests();
  runFunctionalTests();
  runDataIntegrityTests();
  runCodeQualityTests();

  // Summary
  sectionHeader('TEST SUMMARY');
  log(`Total Tests: ${totalTests}`, 'bold');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');
  log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`, 'cyan');

  if (issues.length > 0) {
    sectionHeader('CRITICAL ISSUES FOUND');
    issues.forEach((issue, index) => {
      log(`${index + 1}. ${issue.test}`, 'red');
      log(`   ${issue.reason}\n`, 'yellow');
    });
  }

  return failedTests === 0 ? 0 : 1;
}

// Execute
process.exit(runAllTests());
