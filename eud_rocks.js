const puppeteer = require('puppeteer');
require('dotenv').config();

console.log('env:', process.env);

(async () => {
  const browser = await puppeteer.launch(); //{ headless: false }

  const cookie1 = { 'url': process.env.EUD_ROCKS_COOKIE_URL, 'name': process.env.EUD_ROCKS_COOKIE_1_NAME, 'value': process.env.EUD_ROCKS_COOKIE_1_VALUE }
  const cookie2 = { 'url': process.env.EUD_ROCKS_COOKIE_URL, 'name': process.env.EUD_ROCKS_COOKIE_2_NAME, 'value': process.env.EUD_ROCKS_COOKIE_2_VALUE }

  const page = await browser.newPage();
  await page.setCookie(cookie1)
  await page.setCookie(cookie2)

  await page.goto('https://eud.rocks/user-2');
  const text = await page.$$eval('div.item  b.color', els => els.map(e => e.textContent))

  console.log(text, 'text')

  await browser.close();
})();