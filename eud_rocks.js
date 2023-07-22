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
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] }); //{ headless: false }

  const page = await browser.newPage();

  await page.goto('https://eud.rocks/login');

  await page.waitForSelector('input#username');
  await page.type('input#username', process.env.EUD_ROCKS_USERNAME);

  await page.type('input#password', process.env.EUD_ROCKS_PASSWORD);

  await page.waitForSelector('.captcha-clk2');

  recaptchaBypass = async (execTimes = 0) => {
    if (execTimes > 2) return console.log('retry 3 times');
    const [imgResponse] = await Promise.all([
      page.waitForResponse(imgResponse => imgResponse.url()),
      page.click(execTimes === 0 ? '.captcha-clk2' : '.captcha-img'),
    ]);

    await client.decode({
      buffer: await imgResponse.buffer()
    }).then(async (response) => {
      console.log(response.text);
      await page.$eval('input#captcha', (el, value) => el.value = value, response.text);
    });

    await page.click('input[type=submit]')

    try {
      await page.waitForSelector('div.usertitle', { timeout: 5000 });
      console.log('Login successed')
    } catch {
      console.log('Login failed');
      return await recaptchaBypass(execTimes + 1)
    }
  }

  await recaptchaBypass();

  await page.waitForSelector('.close');
  await page.click('.close');

  try {
    await page.$eval('a.usercheck.checkin', el => el.click());
  } catch {
    console.log('Not ready to checkin yet')
  }

  await browser.close();
})();