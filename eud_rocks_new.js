const puppeteer = require('puppeteer');
const Client = require('@infosimples/node_two_captcha');

require('dotenv').config();

const snapshotPathRoot = './snapshot/'

// Declare your client
const client = new Client(process.env.CAPTCHA_SOLVER_KEY, {
  timeout: 60000,
  polling: 5000,
  throwErrors: false
});

(async () => {
  const browser = await puppeteer.launch({ args: ['--lang=zh-CN'] }); //{ headless: false }

  const page = await browser.newPage();

  // 开启js有效
  await page.setJavaScriptEnabled(true)
  // 配置跳转无超时时间
  await page.setDefaultNavigationTimeout(0)
  // 配置默认无超时时间
  await page.setDefaultTimeout(0)

  await page.goto('https://eud.rocks/login');

  await page.waitForSelector('input#username');
  await page.type('input#username', process.env.EUD_ROCKS_USERNAME);

  await page.type('input#password', process.env.EUD_ROCKS_PASSWORD);

  await page.waitForSelector('.captcha-clk2');

  recaptchaBypass = async (execTimes = 0) => {
    if (execTimes > 2) {
      return console.log('retry 3 times');
    }
    const [imgResponse] = await Promise.all([
      page.waitForResponse(imgResponse => imgResponse.url()),
      page.click(execTimes === 0 ? '.captcha-clk2' : '.captcha-img'),
    ]);

    const buffer = await imgResponse.buffer();

    await client.decode({
      buffer,
    }).then(async (response) => {
      console.log(response.text);
      await page.$eval('input#captcha', (el, value) => el.value = value, response.text);
    });

    await page.screenshot({
      path: snapshotPathRoot + `Before_Login_${Date.now().toString()}.png`,
      fullPage: true
    })

    await page.click('input[type=submit]')

    await page.waitForTimeout(5000);

    await page.screenshot({
      path: snapshotPathRoot + `After_Login_${Date.now().toString()}.png`,
      fullPage: true
    })

    try {
      await page.waitForSelector('div.usertitle', { timeout: 5000 });
      console.log('Login successed')
    } catch {
      console.log('Login failed');
      return await recaptchaBypass(execTimes + 1)
    }
  }

  await recaptchaBypass();

  await page.screenshot({
    path: snapshotPathRoot + `Complete_Login_${Date.now().toString()}.png`,
    fullPage: true
  })

  await page.waitForSelector('.close', { timeout: 10000 });
  await page.click('.close');

  try {
    await page.$eval('a.usercheck.checkin', el => el.click());
  } catch {
    console.log('Not ready to checkin yet')
  }

  await browser.close();
})();