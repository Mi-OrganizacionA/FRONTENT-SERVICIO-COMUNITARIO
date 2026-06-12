const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('response', response => {
    console.log('RESPONSE:', response.url(), response.status());
  });
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  const url = 'file:///' + __dirname.replace(/\\/g, '/') + '/login.html';
  console.log('Opening:', url);
  await page.goto(url);

  await page.type('#loginUser', 'admin@sicag.com');
  await page.type('#loginPass', 'alvaro.09');
  
  await page.click('#loginBtn');
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
