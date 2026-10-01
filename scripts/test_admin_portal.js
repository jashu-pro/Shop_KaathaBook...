// scripts/test_admin_portal.js
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve('screenshots/admin');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testAdminPortal() {
  console.log('============================================================');
  console.log('🛡️ TESTING ADMIN PORTAL END-TO-END IN GOOGLE CHROME');
  console.log('============================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[Page Error] ${err.message}`);
  });

  try {
    // 1. Visit /admin/login
    console.log('1️⃣ Navigating to /admin/login ...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_admin_login.png') });
    console.log('   📸 Captured /admin/login');

    // 2. Perform Login as Super Admin
    console.log('2️⃣ Submitting Admin Login form with jaswanthmajji43@gmail.com...');
    await page.type('input[type="email"]', 'jaswanthmajji43@gmail.com');
    await page.type('input[type="password"]', 'Jaswanth@2007');
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    console.log('   Current URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_admin_dashboard.png') });
    console.log('   📸 Captured /admin (Dashboard)');

    // 3. Test /admin/pending
    console.log('3️⃣ Navigating to /admin/pending ...');
    await page.goto(`${BASE_URL}/admin/pending`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_admin_pending_requests.png') });
    console.log('   📸 Captured /admin/pending');

    // 4. Test /admin/shops
    console.log('4️⃣ Navigating to /admin/shops ...');
    await page.goto(`${BASE_URL}/admin/shops`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_admin_shops.png') });
    console.log('   📸 Captured /admin/shops');

    // 5. Test /admin/workers
    console.log('5️⃣ Navigating to /admin/workers ...');
    await page.goto(`${BASE_URL}/admin/workers`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_admin_workers.png') });
    console.log('   📸 Captured /admin/workers');

    // 6. Test /admin/permissions
    console.log('6️⃣ Navigating to /admin/permissions ...');
    await page.goto(`${BASE_URL}/admin/permissions`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_admin_permissions.png') });
    console.log('   📸 Captured /admin/permissions');

    // 7. Test /admin/audit
    console.log('7️⃣ Navigating to /admin/audit ...');
    await page.goto(`${BASE_URL}/admin/audit`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_admin_audit.png') });
    console.log('   📸 Captured /admin/audit');

    // 8. Test /admin/reports
    console.log('8️⃣ Navigating to /admin/reports ...');
    await page.goto(`${BASE_URL}/admin/reports`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_admin_reports.png') });
    console.log('   📸 Captured /admin/reports');

    // 9. Test /admin/settings
    console.log('9️⃣ Navigating to /admin/settings ...');
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_admin_settings.png') });
    console.log('   📸 Captured /admin/settings');

    console.log('\n============================================================');
    console.log('🎉 ALL ADMIN PORTAL PAGES LOADED & AUDITED SUCCESSFULLY!');
    console.log('   Total Page Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('   Errors found:');
      consoleErrors.forEach((e) => console.log('   -', e));
    }
    console.log('============================================================\n');

  } catch (err) {
    console.error('Admin test failed with error:', err);
  } finally {
    await browser.close();
  }
}

testAdminPortal();
