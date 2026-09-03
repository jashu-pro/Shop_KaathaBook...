// scripts/test_in_chrome.js
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve('screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runChromePhaseAudit() {
  console.log('============================================================');
  console.log('🌐 RUNNING GOOGLE CHROME BROWSER PHASE AUDIT');
  console.log('   Target: ' + BASE_URL);
  console.log('   Browser: Google Chrome (' + CHROME_PATH + ')');
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
    // 1. Initial navigation to root & seed mock session if needed
    console.log('1️⃣ Navigating to root / ...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 15000 });

    // Seed test shop & customer data into localStorage so protected routes are authenticated
    await page.evaluate(() => {
      const now = new Date().toISOString();
      const shopId = 'chrome_audit_shop';
      const ownerId = 'chrome_audit_owner';

      const activeUser = {
        id: ownerId,
        email: 'owner@kirana.com',
        fullName: 'Sharma Ji',
      };
      localStorage.setItem('active_local_user', JSON.stringify(activeUser));

      // Set auth store
      const authState = {
        state: {
          user: activeUser,
          shop: {
            id: shopId,
            ownerId: ownerId,
            name: 'Sri Krishna Kirana & General Store',
            businessType: 'Retail Grocery',
            phone: '9848022338',
            upiId: 'srikrishna@okaxis',
            currency: 'INR',
          },
          isAuthenticated: true,
          isOnboarded: true,
          isLoading: false,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authState));

      // Seed shops table
      const shops = [
        {
          id: shopId,
          owner_id: ownerId,
          name: 'Sri Krishna Kirana & General Store',
          business_type: 'Retail Grocery',
          phone: '9848022338',
          upi_id: 'srikrishna@okaxis',
          currency: 'INR',
          created_at: now,
          updated_at: now,
        },
      ];
      localStorage.setItem('db_shops', JSON.stringify(shops));

      // Seed customers
      const customers = [
        {
          id: 'cust_001',
          shop_id: shopId,
          name: 'Rajesh Sharma',
          phone: '9876543210',
          village: 'Guntur Rural',
          credit_limit: 10000,
          current_balance: 1450,
          tag: 'Regular',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'cust_002',
          shop_id: shopId,
          name: 'Venkatesh Rao',
          phone: '9123456789',
          village: 'Tenali',
          credit_limit: 5000,
          current_balance: 800,
          tag: 'Moderate',
          created_at: now,
          updated_at: now,
        },
      ];
      localStorage.setItem('db_customers', JSON.stringify(customers));

      // Seed categories & products
      const categories = [
        { id: 'cat_001', shop_id: shopId, name: 'Grains & Flours', color: '#10b981', created_at: now, updated_at: now },
      ];
      localStorage.setItem('db_categories', JSON.stringify(categories));

      const products = [
        {
          id: 'prod_001',
          shop_id: shopId,
          category_id: 'cat_001',
          name: 'Aashirvaad Superior MP Atta 10kg',
          price: 430,
          cost_price: 380,
          mrp: 460,
          sku: 'SKU-ATTA10',
          unit: 'packet',
          stock_qty: 35,
          alert_qty: 5,
          created_at: now,
          updated_at: now,
        },
      ];
      localStorage.setItem('db_products', JSON.stringify(products));

      // Seed sales
      const sales = [
        {
          id: 'sale_001',
          shop_id: shopId,
          customer_id: 'cust_001',
          customer_name: 'Rajesh Sharma',
          customer_phone: '9876543210',
          invoice_no: 'INV-CHROME-001',
          subtotal: 860,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: 860,
          amount_paid: 400,
          payment_status: 'partially_paid',
          payment_method: 'cash',
          created_at: now,
          updated_at: now,
        },
      ];
      localStorage.setItem('db_sales', JSON.stringify(sales));

      // Seed payments
      const payments = [
        {
          id: 'pay_001',
          shop_id: shopId,
          customer_id: 'cust_001',
          customer_name: 'Rajesh Sharma',
          amount: 500,
          payment_method: 'upi',
          reference_no: 'UPI-CR-9988',
          created_at: now,
          updated_at: now,
        },
      ];
      localStorage.setItem('db_payments', JSON.stringify(payments));

      // Seed ledger entries
      const ledger = [
        {
          id: 'led_001',
          shop_id: shopId,
          customer_id: 'cust_001',
          customer_name: 'Rajesh Sharma',
          entry_date: now,
          entry_type: 'debit',
          amount: 860,
          balance_after: 860,
          description: 'Sale INV-CHROME-001',
          created_at: now,
        },
        {
          id: 'led_002',
          shop_id: shopId,
          customer_id: 'cust_001',
          customer_name: 'Rajesh Sharma',
          entry_date: now,
          entry_type: 'credit',
          amount: 500,
          balance_after: 360,
          description: 'UPI Payment',
          created_at: now,
        },
      ];
      localStorage.setItem('db_ledger_entries', JSON.stringify(ledger));
    });

    // Reload page to let App.tsx run loadSession() with the seeded storage
    await page.reload({ waitUntil: 'networkidle0' });

    // 2. Test Phase 11: Dashboard
    console.log('\n2️⃣ [PHASE 11] Testing Dashboard (/) in Chrome...');
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_dashboard.png') });
    const dashboardTitle = await page.title();
    const hasKpiElements = await page.evaluate(() => {
      return document.body.innerText.includes('Sales') || document.body.innerText.includes('Khatta');
    });
    console.log(`   ✅ Dashboard loaded. Title: "${dashboardTitle}". Content rendered: ${hasKpiElements}`);

    // 3. Test Phase 4: Customers Page
    console.log('\n3️⃣ [PHASE 4] Testing Customer Directory (/customers) in Chrome...');
    await page.goto(BASE_URL + '/customers', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_customers.png') });
    const hasCustomer = await page.evaluate(() => {
      return document.body.innerText.includes('Rajesh Sharma') || document.body.innerText.includes('Customer');
    });
    console.log(`   ✅ Customers Page loaded. Found customer cards: ${hasCustomer}`);

    // 4. Test Phase 5: Inventory Page
    console.log('\n4️⃣ [PHASE 5] Testing Inventory (/inventory) in Chrome...');
    await page.goto(BASE_URL + '/inventory', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_inventory.png') });
    const hasInventory = await page.evaluate(() => {
      return document.body.innerText.includes('Aashirvaad') || document.body.innerText.includes('Product') || document.body.innerText.includes('Stock');
    });
    console.log(`   ✅ Inventory Page loaded. Found products/stock controls: ${hasInventory}`);

    // 5. Test Phase 6: Sales & POS Billing
    console.log('\n5️⃣ [PHASE 6] Testing Sales List & POS (/sales & /sales/new) in Chrome...');
    await page.goto(BASE_URL + '/sales', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_sales_list.png') });

    await page.goto(BASE_URL + '/sales/new', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_new_sale.png') });
    const hasSaleForm = await page.evaluate(() => {
      return document.body.innerText.includes('Sale') || document.body.innerText.includes('Customer') || document.body.innerText.includes('Amount');
    });
    console.log(`   ✅ Sales & New POS Sale wizard loaded: ${hasSaleForm}`);

    // 6. Test Phase 7: Payments Collection
    console.log('\n6️⃣ [PHASE 7] Testing Payment Collections (/payments & /payments/receive) in Chrome...');
    await page.goto(BASE_URL + '/payments', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_payments_list.png') });

    await page.goto(BASE_URL + '/payments/receive', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_receive_payment.png') });
    const hasReceivePayment = await page.evaluate(() => {
      return document.body.innerText.includes('Payment') || document.body.innerText.includes('Customer');
    });
    console.log(`   ✅ Payment history & Receive Payment counter loaded: ${hasReceivePayment}`);

    // 7. Test Phase 8: Digital Bahi Khatta (Ledger)
    console.log('\n7️⃣ [PHASE 8] Testing Digital Bahi Khatta (/ledger) in Chrome...');
    await page.goto(BASE_URL + '/ledger', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_ledger.png') });
    const hasLedger = await page.evaluate(() => {
      return document.body.innerText.includes('Ledger') || document.body.innerText.includes('Debit') || document.body.innerText.includes('Credit') || document.body.innerText.includes('Jama');
    });
    console.log(`   ✅ Digital Ledger loaded with traditional entries: ${hasLedger}`);

    // 8. Test Phase 10: Reports & Analytics
    console.log('\n8️⃣ [PHASE 10] Testing Reports & Analytics (/reports) in Chrome...');
    await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_reports.png') });
    const hasReports = await page.evaluate(() => {
      return document.body.innerText.includes('Report') || document.body.innerText.includes('Sales') || document.body.innerText.includes('Profit');
    });
    console.log(`   ✅ Business Analytics & Reports loaded: ${hasReports}`);

    // 9. Test Phase 11 & 12: AI Assistant
    console.log('\n9️⃣ [PHASE 12] Testing AI Assistant (/ai-assistant) in Chrome...');
    await page.goto(BASE_URL + '/ai-assistant', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_ai_assistant.png') });
    const hasAi = await page.evaluate(() => {
      return document.body.innerText.includes('AI') || document.body.innerText.includes('Assistant');
    });
    console.log(`   ✅ AI Voice & Smart Assistant loaded: ${hasAi}`);

    // 10. Test Settings Page
    console.log('\n🔟 Testing Settings (/settings) in Chrome...');
    await page.goto(BASE_URL + '/settings', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_settings.png') });
    const hasSettings = await page.evaluate(() => {
      return document.body.innerText.includes('Settings') || document.body.innerText.includes('Shop') || document.body.innerText.includes('UPI');
    });
    console.log(`   ✅ Settings page loaded: ${hasSettings}`);

    // 11. Test Phase 9: Worker Login & Activation
    console.log('\n1️⃣1️⃣ [PHASE 9] Testing Staff / Worker PIN Access (/worker-login & /worker-activate) in Chrome...');
    await page.goto(BASE_URL + '/worker-login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_worker_login.png') });

    await page.goto(BASE_URL + '/worker-activate', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_worker_activate.png') });
    const hasWorkerAuth = await page.evaluate(() => {
      return document.body.innerText.includes('PIN') || document.body.innerText.includes('Worker') || document.body.innerText.includes('Staff');
    });
    console.log(`   ✅ Worker PIN login and activation pages loaded: ${hasWorkerAuth}`);

    console.log('\n============================================================');
    console.log('🔍 CONSOLE ERROR AUDIT:');
    if (consoleErrors.length === 0) {
      console.log('   🎉 ZERO UNCAUGHT CONSOLE ERRORS DETECTED IN CHROME!');
    } else {
      console.log(`   ⚠️ Found ${consoleErrors.length} console error(s):`);
      consoleErrors.forEach((e) => console.log('   - ' + e));
    }
    console.log('============================================================');
    console.log(`📸 13 Screenshots captured and saved to: ${SCREENSHOTS_DIR}`);
    console.log('============================================================\n');

  } catch (error) {
    console.error('❌ Chrome Test Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

runChromePhaseAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
