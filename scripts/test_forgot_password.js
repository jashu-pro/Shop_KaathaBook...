// scripts/test_forgot_password.js
import puppeteer from 'puppeteer-core';

async function testForgotPassword() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('1. Navigating to /forgot-password...');
  await page.goto('http://localhost:5173/forgot-password', { waitUntil: 'networkidle0' });

  console.log('2. Entering email ramesh@kirana.com...');
  await page.type('input[type="email"]', 'ramesh@kirana.com');

  console.log('3. Clicking Send Reset Link...');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    return document.body.innerText.includes('Reset link sent') || document.body.innerText.includes('No registered account');
  }, { timeout: 5000 });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Result message:', bodyText.includes('Reset link sent') ? '✓ Reset link sent!' : 'Error shown');

  await page.screenshot({ path: 'scripts/forgot_password_success.png' });
  console.log('Screenshot saved to scripts/forgot_password_success.png');

  await browser.close();
}

testForgotPassword().catch(err => {
  console.error(err);
  process.exit(1);
});
