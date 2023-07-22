const puppeteer = require('puppeteer');
const Client = require('@infosimples/node_two_captcha');

require('dotenv').config();

// Declare your client
const client = new Client(process.env.CAPTCHA_SOLVER_KEY, {
  timeout: 60000,
  polling: 5000,
  throwErrors: false
});

(async () => {
  const browser = await puppeteer.launch({ headless: false }); //{ headless: false }

  const page = await browser.newPage();

  await page.goto('https://eud.rocks/login');

  await page.waitForSelector('input#username');
  await page.type('input#username', process.env.EUD_ROCKS_USERNAME);

  await page.type('input#password', process.env.EUD_ROCKS_PASSWORD);

  await page.waitForSelector('.captcha-clk2');

  const [response] = await Promise.all([
    page.waitForResponse(response => response.url()),
    page.click('.captcha-clk2'),
  ]);

  const buffer = await response.buffer();

  await client.decode({
    buffer
  }).then(async (response) => {
    console.log(response.text);
    await page.type('input#captcha', response.text);
  });

  await page.click('input[type=submit]')

  await page.waitForSelector('.usertitle')

  try {
    await page.$eval('a.usercheck.checkin', el => el.click());
  } catch {
    console.log('Not ready to checkin yet')
  }

  await browser.close();
})();