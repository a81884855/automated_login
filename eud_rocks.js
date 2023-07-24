const puppeteer = require('puppeteer');
require('dotenv').config();

(async () => {
  const browser = await puppeteer.launch(); //{ headless: false }

  const cookie1 = { 'url': process.env.EUD_ROCKS_COOKIE_URL, 'name': process.env.EUD_ROCKS_COOKIE_1_NAME, 'value': process.env.EUD_ROCKS_COOKIE_1_VALUE }
  const cookie2 = { 'url': process.env.EUD_ROCKS_COOKIE_URL, 'name': process.env.EUD_ROCKS_COOKIE_2_NAME, 'value': process.env.EUD_ROCKS_COOKIE_2_VALUE }

  const page = await browser.newPage();
  await page.setCookie(cookie1, cookie2)

  await page.goto('https://eud.rocks/user-2');

  try {
    await page.$eval('a.usercheck.checkin', el => el.click());
  } catch {
    console.log('Not ready to checkin yet')
  }

  await browser.close();
})();