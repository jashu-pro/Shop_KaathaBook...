// scripts/verify_live_vercel.js
import puppeteer from 'puppeteer-core';

async function checkLiveVercel() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to https://shop-kaatha-book.vercel.app ...');
  await page.goto('https://shop-kaatha-book.vercel.app', { waitUntil: 'networkidle0', timeout: 30000 });

  await new Promise(r => setTimeout(r, 2000));

  const pageTitle = await page.title();
  console.log('Page Title:', pageTitle);

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body snippet:', bodyText.slice(0, 150));

  const isBlocked = bodyText.includes('Shop KhattaBook is not configured');
  console.log('Is "Shop KhattaBook is not configured" showing?:', isBlocked);

  await page.screenshot({ path: 'scripts/live_vercel_screenshot.png' });
  console.log('Screenshot saved to scripts/live_vercel_screenshot.png');

  await browser.close();
}

checkLiveVercel().catch(err => {
  console.error(err);
  process.exit(1);
});
