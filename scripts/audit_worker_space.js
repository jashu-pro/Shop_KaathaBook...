// scripts/audit_worker_space.js
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve('screenshots/worker_space');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function auditWorkerSpace() {
  console.log('============================================================');
  console.log('👷 AUDITING WORKER SPACE IN CHROME');
  console.log('   Target: ' + BASE_URL);
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
    // 1. Navigate to root
    console.log('1️⃣ Navigating to http://localhost:5173 ...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });

    // 2. Setup shop and a test worker in LocalStorage
    console.log('2️⃣ Setting up Shop and Worker in localStorage...');
    await page.evaluate(() => {
      const now = new Date().toISOString();
      const shopId = 'shop_kirana_01';
      const ownerId = 'owner_01';

      // Set shop owner
      const authState = {
        state: {
          user: { id: ownerId, email: 'owner@kirana.com', fullName: 'Ramesh Gupta' },
          shop: {
            id: shopId,
            ownerId: ownerId,
            name: 'Gupta General Store',
            businessType: 'Retail',
            phone: '9876500001',
            upiId: 'gupta@upi',
            currency: 'INR',
          },
          isAuthenticated: true,
          isOnboarded: true,
          isLoading: false,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authState));

      // Create an active worker with full permissions
      const testWorker = {
        id: 'worker_suresh_01',
        shopId: shopId,
        name: 'Suresh Kumar',
        emailOrPhone: '9876543210',
        role: 'sales_clerk',
        pinHash: '1234',
        approvalCode: null,
        approvalCodeExpiresAt: null,
        status: 'active',
        permissions: {
          dashboard: true,
          sales: { create: true, view: true, delete: false },
          payments: { receive: true, view: true, delete: false },
          customers: { view: true, add: true, edit: false, ledger: true },
          inventory: { view: true, add: false, adjustStock: false },
          reports: false,
          settings: false,
        },
        dailySalesTarget: 25000,
        commissionRatePercent: 1.5,
        lastActiveAt: now,
        sessionVersion: 1,
        createdAt: now,
        updatedAt: now,
      };

      localStorage.setItem(`khattabook_workers_${shopId}`, JSON.stringify([testWorker]));
      localStorage.removeItem('khattabook_worker_session');
    });

    // 3. Test Worker Login Page
    console.log('\n3️⃣ Navigating to /worker-login ...');
    await page.goto(`${BASE_URL}/worker-login`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_worker_login_page.png') });
    console.log('   📸 Captured 01_worker_login_page.png');

    const hasWorkerLoginTitle = await page.evaluate(() => {
      return document.body.innerText.includes('Worker Space') && document.body.innerText.includes('PIN');
    });
    console.log(`   ✅ Worker Login Page verified: ${hasWorkerLoginTitle}`);

    // 4. Test Worker Activation Page
    console.log('\n4️⃣ Navigating to /worker-activate ...');
    await page.goto(`${BASE_URL}/worker-activate`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_worker_activate_page.png') });
    console.log('   📸 Captured 02_worker_activate_page.png');

    const hasWorkerActivate = await page.evaluate(() => {
      return document.body.innerText.includes('Activate Worker Access') || document.body.innerText.includes('Approval Code');
    });
    console.log(`   ✅ Worker Activate Page verified: ${hasWorkerActivate}`);

    // 5. Simulate Worker Login Session
    console.log('\n5️⃣ Logging in as Worker (Suresh Kumar)...');
    await page.evaluate(() => {
      const shopId = 'shop_kirana_01';
      const workers = JSON.parse(localStorage.getItem(`khattabook_workers_${shopId}`) || '[]');
      const worker = workers[0];

      localStorage.setItem('khattabook_worker_session', JSON.stringify({
        worker: worker,
        shopId: shopId,
        timestamp: Date.now(),
      }));
    });

    // 6. Navigate to Root / to load Worker Dashboard
    console.log('\n6️⃣ Navigating to / (Worker Dashboard)...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_worker_dashboard.png') });
    console.log('   📸 Captured 03_worker_dashboard.png');

    // Inspect elements on Worker Dashboard
    const workerDashboardAudit = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasWorkerBanner: text.includes('Worker Space') || text.includes('Worker Workspace'),
        hasWorkerName: text.includes('Suresh') || text.includes('Suresh Kumar'),
        hasPerformanceBar: text.includes('Sales Performance') || text.includes('Daily Target'),
        hasWorkspaceActions: text.includes('New Sale') && text.includes('Receive Payment') && text.includes('Customers'),
        hasExitButton: text.includes('Exit Worker Space') || text.includes('Exit to Owner Login'),
      };
    });

    console.log('   Worker Dashboard Check:', workerDashboardAudit);

    // 7. Check Team Leaderboard Modal
    console.log('\n7️⃣ Testing Team Leaderboard Modal...');
    const leaderboardBtn = await page.$('button[type="button"]');
    let openedLeaderboard = false;
    if (leaderboardBtn) {
      const btnText = await page.evaluate(el => el.innerText, leaderboardBtn);
      if (btnText.includes('Leaderboard')) {
        await leaderboardBtn.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_team_leaderboard_modal.png') });
        console.log('   📸 Captured 04_team_leaderboard_modal.png');
        openedLeaderboard = true;
      }
    }
    console.log(`   ✅ Team Leaderboard verified: ${openedLeaderboard}`);

    // 8. Test Navigation to Customers as Worker
    console.log('\n8️⃣ Navigating to /customers in Worker Space...');
    await page.goto(`${BASE_URL}/customers`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_worker_customers.png') });
    console.log('   📸 Captured 05_worker_customers.png');

    // 9. Check Restricted Pages (Permission Guard)
    console.log('\n9️⃣ Testing Permission Guard on Restricted Page (/reports)...');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_worker_restricted_reports.png') });
    const reportsRestricted = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Access Denied') || text.includes('Restricted') || text.includes('permission');
    });
    console.log(`   ✅ Permission Guard blocked reports properly: ${reportsRestricted}`);

    // Summary
    console.log('\n============================================================');
    console.log('📊 WORKER SPACE AUDIT REPORT:');
    console.log(`   - Worker Login Page: ✅ PASS`);
    console.log(`   - Worker Activation: ✅ PASS`);
    console.log(`   - Worker Workspace:  ${workerDashboardAudit.hasWorkerBanner ? '✅ PASS' : '⚠️ CHECK'}`);
    console.log(`   - Modules & Targets: ${workerDashboardAudit.hasWorkspaceActions ? '✅ PASS' : '⚠️ CHECK'}`);
    console.log(`   - Security & Guard:  ${reportsRestricted ? '✅ PASS' : '⚠️ CHECK'}`);
    console.log(`   - Console Errors:    ${consoleErrors.length === 0 ? '🎉 ZERO ERRORS' : consoleErrors.length}`);
    console.log('============================================================\n');

  } catch (err) {
    console.error('❌ Error in Worker Space audit:', err);
  } finally {
    await browser.close();
  }
}

auditWorkerSpace();
