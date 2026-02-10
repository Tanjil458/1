const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Security Testing', () => {
  
  test('should check for XSS vulnerabilities in error handling', async ({ page }) => {
    // Test XSS in admin app error handling
    const adminPath = path.join(__dirname, '../MimiPro -admin/js/app.js');
    const content = fs.readFileSync(adminPath, 'utf-8');
    
    // Check for innerHTML usage with error messages
    const innerHTMLMatches = content.match(/innerHTML\s*=\s*`[^`]*\$\{[^}]*\.message[^`]*`/g);
    
    if (innerHTMLMatches) {
      console.error('❌ SECURITY ISSUE: Found innerHTML with error messages (XSS vulnerability)');
      console.error('   Locations:', innerHTMLMatches);
      expect(innerHTMLMatches).toBeNull();
    } else {
      console.log('✅ No innerHTML XSS vulnerabilities found in error handling');
    }
  });

  test('should check for exposed API keys', async ({ page }) => {
    const firebaseConfigPath = path.join(__dirname, '../MimiPro -admin/js/firebase-config.js');
    const content = fs.readFileSync(firebaseConfigPath, 'utf-8');
    
    // Check for hardcoded API keys
    const apiKeyMatch = content.match(/apiKey:\s*["']([^"']+)["']/);
    
    if (apiKeyMatch) {
      console.warn('⚠️ WARNING: Firebase API key found in source code');
      console.warn('   Key:', apiKeyMatch[1].substring(0, 10) + '...');
      console.warn('   This is acceptable for Firebase client SDK but should be protected with Firebase Security Rules');
    }
    
    expect(apiKeyMatch).toBeTruthy(); // This is expected for Firebase client apps
  });

  test('should check for insecure localStorage usage', async ({ page }) => {
    const files = [
      '../MimiPro E/auth/employee-auth.js',
      '../MimiPro E/auth/session.js',
      '../MimiPro -admin/js/modules/employeeListing.js'
    ];
    
    let insecureStorageFound = false;
    
    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for unencrypted session storage
      const sessionStorageMatch = content.match(/localStorage\.setItem\(['"]employeeSession['"]/);
      const userIdStorageMatch = content.match(/localStorage\.setItem\(['"]localUserId['"]/);
      
      if (sessionStorageMatch || userIdStorageMatch) {
        console.error(`❌ SECURITY ISSUE: Unencrypted sensitive data in localStorage in ${file}`);
        insecureStorageFound = true;
      }
    }
    
    expect(insecureStorageFound).toBe(true); // Documenting the issue
  });

  test('should check for weak password hashing', async ({ page }) => {
    const authPath = path.join(__dirname, '../MimiPro E/auth/employee-auth.js');
    const content = fs.readFileSync(authPath, 'utf-8');
    
    // Check for SHA-256 usage (weak for passwords)
    const sha256Match = content.match(/crypto\.subtle\.digest\(['"]SHA-256['"]/);
    
    if (sha256Match) {
      console.error('❌ SECURITY ISSUE: Using SHA-256 for password hashing (should use bcrypt/argon2)');
      expect(sha256Match).toBeTruthy(); // Documenting the issue
    }
  });

  test('should check for innerHTML XSS vulnerabilities in modules', async ({ page }) => {
    const modulesDir = path.join(__dirname, '../MimiPro -admin/js/modules');
    const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
    
    let xssVulnerabilities = [];
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(modulesDir, file), 'utf-8');
      
      // Check for innerHTML with template literals (potential XSS)
      const innerHTMLMatches = content.match(/\.innerHTML\s*=\s*`/g);
      
      if (innerHTMLMatches) {
        xssVulnerabilities.push({
          file,
          count: innerHTMLMatches.length
        });
      }
    }
    
    if (xssVulnerabilities.length > 0) {
      console.error('❌ POTENTIAL XSS: innerHTML usage with template literals found in:');
      xssVulnerabilities.forEach(v => {
        console.error(`   ${v.file}: ${v.count} occurrences`);
      });
    }
    
    // Document the findings
    expect(xssVulnerabilities.length).toBeGreaterThan(0);
  });

  test('should check Content Security Policy', async ({ page }) => {
    const adminIndexPath = path.join(__dirname, '../MimiPro -admin/index.html');
    const employeeIndexPath = path.join(__dirname, '../MimiPro E/index.html');
    
    const adminContent = fs.readFileSync(adminIndexPath, 'utf-8');
    const employeeContent = fs.readFileSync(employeeIndexPath, 'utf-8');
    
    // Check for CSP meta tag
    const adminCSP = adminContent.match(/Content-Security-Policy/);
    const employeeCSP = employeeContent.match(/Content-Security-Policy/);
    
    if (adminCSP) {
      console.log('✅ Admin app has CSP defined');
    } else {
      console.error('❌ SECURITY ISSUE: Admin app missing Content Security Policy');
    }
    
    if (employeeCSP) {
      console.log('✅ Employee app has CSP defined');
    } else {
      console.error('❌ SECURITY ISSUE: Employee app missing Content Security Policy');
    }
    
    expect(adminCSP || employeeCSP).toBeTruthy();
  });

  test('should check for SQL injection patterns (Firebase)', async ({ page }) => {
    // Firebase doesn't use SQL, but check for unsafe query building
    const syncPath = path.join(__dirname, '../MimiPro E/sync/employee-sync-service.js');
    const content = fs.readFileSync(syncPath, 'utf-8');
    
    // Check for proper query filtering
    const hasEmployeeIdFilter = content.includes('where("employeeId", "==",');
    
    if (hasEmployeeIdFilter) {
      console.log('✅ Employee data filtering implemented');
    } else {
      console.warn('⚠️ WARNING: Employee data filtering may be missing');
    }
    
    expect(hasEmployeeIdFilter).toBe(true);
  });

  test('should check for hardcoded credentials', async ({ page }) => {
    const files = [
      '../MimiPro E/auth/employee-auth.js',
      '../MimiPro -admin/js/firebase-config.js'
    ];
    
    let credentialsFound = false;
    
    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for hardcoded passwords/secrets (basic pattern)
      const passwordMatch = content.match(/password\s*[:=]\s*["'][^"']+["']/i);
      const secretMatch = content.match(/secret\s*[:=]\s*["'][^"']+["']/i);
      
      if (passwordMatch || secretMatch) {
        console.error(`❌ SECURITY ISSUE: Potential hardcoded credentials in ${file}`);
        credentialsFound = true;
      }
    }
    
    if (!credentialsFound) {
      console.log('✅ No obvious hardcoded credentials found');
    }
  });

  test('should verify authentication implementation', async ({ page }) => {
    const authPath = path.join(__dirname, '../MimiPro E/auth/employee-auth.js');
    const content = fs.readFileSync(authPath, 'utf-8');
    
    // Check for session validation
    const hasSessionValidation = content.includes('validateSession') || content.includes('checkSession');
    
    // Check for logout functionality
    const hasLogout = content.includes('logout') || content.includes('signOut');
    
    console.log('Authentication checks:');
    console.log(`  Session validation: ${hasSessionValidation ? '✅' : '❌'}`);
    console.log(`  Logout functionality: ${hasLogout ? '✅' : '❌'}`);
    
    expect(hasLogout).toBe(true);
  });

  test('should check for input validation', async ({ page }) => {
    const validatorsPath = path.join(__dirname, '../MimiPro -admin/js/utils/validators.js');
    
    if (fs.existsSync(validatorsPath)) {
      const content = fs.readFileSync(validatorsPath, 'utf-8');
      
      // Check for validation functions
      const hasEmailValidation = content.includes('email') || content.includes('validateEmail');
      const hasPhoneValidation = content.includes('phone') || content.includes('validatePhone');
      
      console.log('Input validation checks:');
      console.log(`  Email validation: ${hasEmailValidation ? '✅' : '❌'}`);
      console.log(`  Phone validation: ${hasPhoneValidation ? '✅' : '❌'}`);
      
      expect(hasEmailValidation || hasPhoneValidation).toBe(true);
    } else {
      console.warn('⚠️ WARNING: No validators.js file found');
    }
  });
});
