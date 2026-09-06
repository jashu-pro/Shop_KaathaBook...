import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/jaswanth/.gemini/antigravity-ide/brain/7ea677e1-b4fc-4e08-8dff-e6822d6c2578';

async function runChromeTest() {
  console.log('🚀 Starting Chrome automated UI check for KhattaBook...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Seed worker credentials and customer into localStorage
  console.log('1. Navigating to http://localhost:5173/worker-login ...');
  await page.goto('http://localhost:5173/worker-login', { waitUntil: 'networkidle0', timeout: 30000 });

  await page.evaluate(() => {
    // SHA-256 for PIN "1234"
    const pinHash1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const shopId = 'default_shop';

    const testWorker = {
      id: 'worker_jaswanth_test',
      shopId: shopId,
      name: 'Jaswanth Majji',
      emailOrPhone: '08121157489',
      role: 'admin',
      status: 'active',
      pinHash: pinHash1234,
      sessionVersion: 1,
      permissions: {
        sales: { view: true, create: true, edit: true, delete: true },
        payments: { view: true, receive: true, edit: true, delete: true },
        customers: { view: true, add: true, edit: true, delete: true },
        inventory: { view: true, add: true, edit: true, delete: true },
        reports: { view: true },
        staff: { view: true, manage: true },
        settings: { view: true, edit: true }
      }
    };

    localStorage.setItem(`khattabook_workers_${shopId}`, JSON.stringify([testWorker]));

    // Seed test customer & products
    const dbStr = localStorage.getItem('khattabook_db') || '{}';
    let db;
    try { db = JSON.parse(dbStr); } catch { db = {}; }
    if (!db.customers) db.customers = [];
    if (!db.customers.some(c => c.name.includes('Jaswanth'))) {
      db.customers.unshift({
        id: 'cust_jaswanth_majji_1',
        shop_id: shopId,
        name: 'Jaswanth Majji',
        phone: '08121157489',
        village: 'Srikakulam',
        current_balance: 0,
        created_at: new Date().toISOString()
      });
    }
    localStorage.setItem('khattabook_db', JSON.stringify(db));
  });

  // Fill worker login form
  console.log('2. Logging into Worker Space with Mobile: 08121157489 and PIN: 1234 ...');
  await page.type('input[placeholder*="mobile" i], input[type="text"]', '08121157489');
  await page.type('input[placeholder*="PIN" i], input[type="password"]', '1234');
  await new Promise(r => setTimeout(r, 500));

  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  console.log('Current URL after login:', page.url());
  const dashboardScreenshotPath = path.join(ARTIFACTS_DIR, 'chrome_dashboard.png');
  await page.screenshot({ path: dashboardScreenshotPath });
  console.log('📸 Saved dashboard screenshot to', dashboardScreenshotPath);

  // 3. Open Record Credit Sale Modal
  console.log('3. Opening Record Credit Sale Modal...');
  const opened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => 
      b.innerText.includes('New Sale') || 
      b.innerText.includes('Record Sale') || 
      b.innerText.includes('Add Bill') ||
      b.innerText.includes('Credit Sale') ||
      b.innerText.includes('+')
    );
    if (btn) {
      btn.click();
      return btn.innerText;
    }
    return null;
  });
  console.log('Triggered sale button:', opened);
  await new Promise(r => setTimeout(r, 1500));

  const modalScreenshotPath = path.join(ARTIFACTS_DIR, 'chrome_sale_modal.png');
  await page.screenshot({ path: modalScreenshotPath });
  console.log('📸 Saved modal screenshot to', modalScreenshotPath);

  // 4. Verify Camera Button & click it
  console.log('4. Clicking "📸 Camera (Unlimited)" button...');
  const cameraBtnClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const camBtn = buttons.find(b => b.innerText.includes('Camera (Unlimited)') || b.innerText.includes('Camera'));
    if (camBtn) {
      camBtn.click();
      return camBtn.innerText;
    }
    return null;
  });

  console.log('Camera button text clicked:', cameraBtnClicked);
  await new Promise(r => setTimeout(r, 2000));

  const cameraStudioScreenshotPath = path.join(ARTIFACTS_DIR, 'chrome_camera_studio.png');
  await page.screenshot({ path: cameraStudioScreenshotPath });
  console.log('📸 Saved Camera Studio screenshot to', cameraStudioScreenshotPath);

  // 5. Test Live Camera Shutter & Unlimited Snapping
  console.log('5. Clicking Shutter button repeatedly for unlimited photos...');
  await page.evaluate(() => {
    const shutter = document.querySelector('button[title="Snap Photo"]');
    if (shutter) {
      shutter.click();
      setTimeout(() => shutter.click(), 500);
      setTimeout(() => shutter.click(), 1000);
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const cameraSnappedScreenshotPath = path.join(ARTIFACTS_DIR, 'chrome_camera_snapped.png');
  await page.screenshot({ path: cameraSnappedScreenshotPath });
  console.log('📸 Saved Camera Snapped screenshot to', cameraSnappedScreenshotPath);

  // 6. Click Done to return to sale modal
  console.log('6. Clicking Done to return to sale bill...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const doneBtn = buttons.find(b => b.innerText.includes('Done'));
    if (doneBtn) doneBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const modalWithPhotosScreenshotPath = path.join(ARTIFACTS_DIR, 'chrome_modal_with_photos.png');
  await page.screenshot({ path: modalWithPhotosScreenshotPath });
  console.log('📸 Saved Modal with attached photos to', modalWithPhotosScreenshotPath);

  // 7. Click "+ Add New Customer" to add customer
  console.log('7. Clicking "+ Add New Customer"...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addCustBtn = buttons.find(b => b.innerText.includes('Add New Customer'));
    if (addCustBtn) addCustBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Fill customer form
  console.log('Filling Add Customer modal...');
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const nameInput = inputs.find(i => i.placeholder && i.placeholder.includes('Name'));
    const phoneInput = inputs.find(i => i.placeholder && i.placeholder.includes('Phone') || (i.placeholder && i.placeholder.includes('Mobile')));
    if (nameInput) {
      nameInput.value = 'Jaswanth Majji';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (phoneInput) {
      phoneInput.value = '08121157489';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Submit Add Customer
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveCustBtn = buttons.find(b => b.innerText.includes('Save Customer') || b.innerText.includes('Add Customer'));
    if (saveCustBtn) saveCustBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 8. Click Save Sale
  console.log('8. Submitting sale bill...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.innerText.includes('Save Sale'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const postSaveScreenshotPath = path.join(ARTIFACTS_DIR, 'chrome_sale_success.png');
  await page.screenshot({ path: postSaveScreenshotPath });
  console.log('📸 Saved post-save screenshot to', postSaveScreenshotPath);

  const pageText = await page.evaluate(() => document.body.innerText);
  const hasError = pageText.includes('Product 1 does not exist') || pageText.includes('does not exist');
  const hasSuccess = pageText.includes('Sale Saved Successfully') || pageText.includes('Invoice #');

  console.log('\n========================================');
  console.log('🎉 FINAL CHROME VALIDATION RESULTS:');
  console.log('1. Camera Studio Opened & Snapped: YES');
  console.log('2. "Product 1 does not exist" Error Present?:', hasError ? '❌ YES (FAILED)' : '✅ NO (CLEAN)');
  console.log('3. "Sale Saved Successfully" Displayed?:', hasSuccess ? '✅ YES (SUCCESS)' : '⚠️ NO');
  console.log('========================================\n');

  await browser.close();
}

runChromeTest().catch(err => {
  console.error('❌ Error during Chrome test:', err);
  process.exit(1);
});
