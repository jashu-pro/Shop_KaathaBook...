// scripts/test_multi_user_isolation.js
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve('screenshots/multi_user');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMultiUserIsolationTest() {
  console.log('================================================================');
  console.log('👥 MULTI-USER AUTHENTICATION & DATA ISOLATION AUDIT IN CHROME');
  console.log('   Testing: Registration, Shop Setup, Data Isolation & Re-Login');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  try {
    // -------------------------------------------------------------
    // PART 1: Register User 1 (Ramesh Kirana Store)
    // -------------------------------------------------------------
    console.log('1️⃣ [USER 1] Navigating to /register to create Account 1...');
    await page.goto(BASE_URL + '/register', { waitUntil: 'networkidle0' });

    // Fill registration form
    const inputs = await page.$$('input');
    await inputs[0].type('Ramesh Kumar'); // Full Name
    await inputs[1].type('ramesh@kirana.com'); // Email
    await inputs[2].type('9848011223'); // Phone (if present)
    await inputs[3].type('Password123!'); // Password
    await inputs[4].type('Password123!'); // Confirm Password

    console.log('   Submitting registration for ramesh@kirana.com...');
    await page.click('button[type="submit"]');
    await sleep(1500);

    // Should now be on /shop-setup
    console.log('   Current URL:', page.url());
    if (!page.url().includes('shop-setup')) {
      throw new Error(`Expected /shop-setup, got ${page.url()}`);
    }

    // Step 1: Shop Name & Category
    console.log('   Completing Step 1 (Business Identity)...');
    const shopNameInput = await page.$('input[placeholder*="Sri Laxmi Kirana"]');
    await shopNameInput.type('Ramesh Kirana & General Store');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 2: Location & Address
    console.log('   Completing Step 2 (Location & Address)...');
    await page.waitForSelector('input[placeholder*="Door No"]');
    await (await page.$('input[placeholder*="Door No"]')).type('Door 12-3, Main Bazaar');
    await (await page.$('input[placeholder*="Srikakulam"]')).type('Guntur');
    await (await page.$('input[placeholder*="532001"]')).type('522001');
    await (await page.$('input[placeholder*="98765"]')).type('9848011223');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 3: Tax / GSTIN (Optional)
    console.log('   Completing Step 3 (Tax details - skip)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 4: UPI ID
    console.log('   Completing Step 4 (UPI ID)...');
    await page.waitForSelector('input[placeholder*="merchant@upi"]');
    await (await page.$('input[placeholder*="merchant@upi"]')).type('rameshkirana@okaxis');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 5: Activate Shop Account
    console.log('   Completing Step 5 (Activate Shop Account)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const finishBtn = btns.find((b) => b.innerText.includes('Create Shop Account'));
      if (finishBtn) finishBtn.click();
    });

    console.log('   Waiting for navigation to Dashboard (/)...');
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 });
    console.log('   Landed on Dashboard! URL:', page.url());

    // Verify User 1 Dashboard
    const user1DashboardText = await page.evaluate(() => document.body.innerText);
    const user1HasShopName = user1DashboardText.includes('Ramesh Kirana');
    console.log(`   ✅ User 1 Dashboard loaded. Shop Name visible: ${user1HasShopName}`);

    // Add customer for User 1 via repository helper in page
    console.log('   Adding Customer "Sita Ram" for Ramesh Kirana...');
    await page.evaluate(async () => {
      const activeUser = JSON.parse(localStorage.getItem('active_local_user') || '{}');
      const shops = JSON.parse(localStorage.getItem('db_shops') || '[]');
      const currentShop = shops.find((s) => s.owner_id === activeUser.id);
      const shopId = currentShop ? currentShop.id : 'unknown';

      const customers = JSON.parse(localStorage.getItem('db_customers') || '[]');
      customers.push({
        id: 'cust_ramesh_01',
        shop_id: shopId,
        name: 'Sita Ram',
        phone: '9876543210',
        village: 'Guntur Urban',
        credit_limit: 10000,
        current_balance: 500,
        tag: 'Regular',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem('db_customers', JSON.stringify(customers));
    });

    await page.reload({ waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_ramesh_dashboard.png') });
    console.log('   📸 Captured Ramesh Kirana dashboard screenshot.');

    // -------------------------------------------------------------
    // PART 2: Sign Out User 1
    // -------------------------------------------------------------
    console.log('\n2️⃣ [SIGN OUT] User 1 signing out...');
    await page.click('button[title="Sign Out"]');
    await sleep(1500);
    console.log('   Current URL after sign out:', page.url());
    if (!page.url().includes('login')) {
      throw new Error(`Expected /login after sign out, got ${page.url()}`);
    }
    console.log('   ✅ Successfully signed out and redirected to /login.');

    // -------------------------------------------------------------
    // PART 3: Register User 2 (Anand Textiles)
    // -------------------------------------------------------------
    console.log('\n3️⃣ [USER 2] Navigating to /register to create Account 2...');
    await page.goto(BASE_URL + '/register', { waitUntil: 'networkidle0' });

    const inputs2 = await page.$$('input');
    await inputs2[0].type('Anand Varma'); // Full Name
    await inputs2[1].type('anand@clothstore.com'); // Email
    await inputs2[2].type('9988776655'); // Phone
    await inputs2[3].type('Password456!'); // Password
    await inputs2[4].type('Password456!'); // Confirm Password

    console.log('   Submitting registration for anand@clothstore.com...');
    await page.click('button[type="submit"]');
    await sleep(1500);

    // Step 1: Shop Name & Category
    console.log('   Completing Step 1 for Anand Textiles...');
    const shopNameInput2 = await page.$('input[placeholder*="Sri Laxmi Kirana"]');
    await shopNameInput2.type('Anand Sarees & Textiles');
    // Select Apparel / Clothing
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('button, div, span'));
      const clothingOption = options.find((el) => el.innerText && el.innerText.includes('Apparel / Clothing'));
      if (clothingOption) clothingOption.click();

      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 2: Location
    console.log('   Completing Step 2 for Anand Textiles...');
    await page.waitForSelector('input[placeholder*="Door No"]');
    await (await page.$('input[placeholder*="Door No"]')).type('MG Road, Near Clock Tower');
    await (await page.$('input[placeholder*="Srikakulam"]')).type('Vijayawada');
    await (await page.$('input[placeholder*="532001"]')).type('520002');
    await (await page.$('input[placeholder*="98765"]')).type('9988776655');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 3: Tax (skip)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 4: UPI ID
    await page.waitForSelector('input[placeholder*="merchant@upi"]');
    await (await page.$('input[placeholder*="merchant@upi"]')).type('anandtextiles@icici');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find((b) => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(800);

    // Step 5: Activate
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const finishBtn = btns.find((b) => b.innerText.includes('Create Shop Account'));
      if (finishBtn) finishBtn.click();
    });

    console.log('   Waiting for Anand to land on Dashboard (/)...');
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 });
    console.log('   Landed on Anand Dashboard! URL:', page.url());

    // -------------------------------------------------------------
    // PART 4: Verify Multi-Tenant Data Isolation for User 2
    // -------------------------------------------------------------
    console.log('\n4️⃣ [DATA ISOLATION CHECK] Checking User 2 Dashboard...');
    const user2DashboardText = await page.evaluate(() => document.body.innerText);
    const user2HasAnandShop = user2DashboardText.includes('Anand Sarees');
    const user2HasRameshShop = user2DashboardText.includes('Ramesh Kirana');
    const user2HasSitaRam = user2DashboardText.includes('Sita Ram');

    console.log(`   - Anand Shop Name visible: ${user2HasAnandShop}`);
    console.log(`   - Ramesh Shop Name leaked?: ${user2HasRameshShop} (Must be false)`);
    console.log(`   - Sita Ram (Ramesh's customer) leaked?: ${user2HasSitaRam} (Must be false)`);

    if (!user2HasAnandShop || user2HasRameshShop || user2HasSitaRam) {
      throw new Error('Data Isolation Failure: User 2 saw User 1 shop or customers!');
    }

    // Add Anand's own customer
    console.log('   Adding Anand\'s own customer: "Lakshmi Priya"...');
    await page.evaluate(async () => {
      const activeUser = JSON.parse(localStorage.getItem('active_local_user') || '{}');
      const shops = JSON.parse(localStorage.getItem('db_shops') || '[]');
      const currentShop = shops.find((s) => s.owner_id === activeUser.id);
      const shopId = currentShop ? currentShop.id : 'unknown';

      const customers = JSON.parse(localStorage.getItem('db_customers') || '[]');
      customers.push({
        id: 'cust_anand_01',
        shop_id: shopId,
        name: 'Lakshmi Priya',
        phone: '9123456789',
        village: 'Benz Circle',
        credit_limit: 25000,
        current_balance: 3200,
        tag: 'Regular',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem('db_customers', JSON.stringify(customers));
    });

    await page.reload({ waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_anand_dashboard.png') });
    console.log('   📸 Captured Anand Textiles dashboard screenshot.');

    // -------------------------------------------------------------
    // PART 5: Switch back to User 1 (Ramesh) via Login Page
    // -------------------------------------------------------------
    console.log('\n5️⃣ [RE-LOGIN] Signing out Anand and logging back in as Ramesh (User 1)...');
    await page.click('button[title="Sign Out"]');
    await sleep(1500);

    // Login as Ramesh
    const loginInputs = await page.$$('input');
    await loginInputs[0].type('ramesh@kirana.com');
    await loginInputs[1].type('Password123!');
    await page.click('button[type="submit"]');
    await sleep(2000);

    // Check Ramesh's restored dashboard
    console.log('   Checking Ramesh restored dashboard URL:', page.url());
    const rameshRestoredText = await page.evaluate(() => document.body.innerText);
    const rameshHasShop = rameshRestoredText.includes('Ramesh Kirana');
    console.log(`   - Ramesh Shop Name visible on Dashboard: ${rameshHasShop}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_ramesh_restored_dashboard.png') });

    // Navigate to /customers to check isolated customer directory
    console.log('   Navigating to Ramesh /customers directory...');
    await page.goto(BASE_URL + '/customers', { waitUntil: 'networkidle0' });
    const rameshCustomerPageText = await page.evaluate(() => document.body.innerText);
    const rameshHasSitaRam = rameshCustomerPageText.includes('Sita Ram');
    const rameshHasLakshmiPriya = rameshCustomerPageText.includes('Lakshmi Priya');

    console.log(`   - Sita Ram (Ramesh's customer) in list: ${rameshHasSitaRam}`);
    console.log(`   - Lakshmi Priya (Anand's customer) leaked into Ramesh?: ${rameshHasLakshmiPriya} (Must be false)`);

    if (!rameshHasShop || !rameshHasSitaRam || rameshHasLakshmiPriya) {
      throw new Error('Re-login Verification Failure: Ramesh did not get expected isolated customer data!');
    }

    // -------------------------------------------------------------
    // PART 6: Switch back to User 2 (Anand) via Login Page
    // -------------------------------------------------------------
    console.log('\n6️⃣ [RE-LOGIN] Signing out Ramesh and logging back in as Anand (User 2)...');
    await page.click('button[title="Sign Out"]');
    await sleep(1500);

    const loginInputs2 = await page.$$('input');
    await loginInputs2[0].type('anand@clothstore.com');
    await loginInputs2[1].type('Password456!');
    await page.click('button[type="submit"]');
    await sleep(2000);

    const anandRestoredText = await page.evaluate(() => document.body.innerText);
    const anandHasShop = anandRestoredText.includes('Anand Sarees');
    console.log(`   - Anand Shop Name visible on Dashboard: ${anandHasShop}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_anand_restored_dashboard.png') });

    // Navigate to /customers for Anand
    console.log('   Navigating to Anand /customers directory...');
    await page.goto(BASE_URL + '/customers', { waitUntil: 'networkidle0' });
    const anandCustomerPageText = await page.evaluate(() => document.body.innerText);
    const anandHasLakshmiPriya = anandCustomerPageText.includes('Lakshmi Priya');
    const anandHasSitaRam = anandCustomerPageText.includes('Sita Ram');

    console.log(`   - Lakshmi Priya (Anand's customer) in list: ${anandHasLakshmiPriya}`);
    console.log(`   - Sita Ram (Ramesh's customer) leaked into Anand?: ${anandHasSitaRam} (Must be false)`);

    if (!anandHasShop || !anandHasLakshmiPriya || anandHasSitaRam) {
      throw new Error('Re-login Verification Failure: Anand did not get expected isolated customer data!');
    }

    console.log('\n================================================================');
    console.log('🎉 MULTI-TENANT USER ISOLATION VERIFICATION PASSED 100%!');
    console.log('   - Account 1 (ramesh@kirana.com) -> Ramesh Kirana & General Store');
    console.log('   - Account 2 (anand@clothstore.com) -> Anand Sarees & Textiles');
    console.log('   - Zero cross-tenant data contamination');
    console.log('   - Flawless sign-in, sign-up, shop registration & sign-out');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Multi-user Isolation Test Error:', err);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

runMultiUserIsolationTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
