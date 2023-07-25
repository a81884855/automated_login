const puppeteer = require('puppeteer');
const axios = require('axios');
const Client = require('@infosimples/node_two_captcha');

require('dotenv').config();

const client = new Client(process.env.CAPTCHA_SOLVER_KEY, {
  timeout: 120000,
  polling: 5000,
  throwErrors: false
});

const wait = ms => new Promise(r => setTimeout(r, ms));

const getSolverResponse = async (id) => {
  const response = await axios.request({
    method: 'GET',
    url: 'http://2captcha.com/res.php',
    params: {
      action: 'get',
      key: process.env.CAPTCHA_SOLVER_KEY,
      id
    },
  });
  return response.data
}

const retryOperation = async (operation, retries) => {
  let response = 'CAPCHA_NOT_READY';
  await wait(10000)
  while (response === 'CAPCHA_NOT_READY' && retries > 0) {
    console.log(`${retries} retries leave`)
    await wait(5000)
    response = await operation();
    console.log(response, 'cloudfare response')
    retries -= 1;
  }
  if (retries === 0) return console.error('retried too many times')
  return response.slice(3);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // { headless: false }

  const page = await browser.newPage();

  await page.goto('https://auth.1point3acres.com/login');

  await page.type('input[id="username"]', process.env.ONE_POINT_THREE_ARCES_USERNAME);
  await page.type('input[id="password"]', process.env.ONE_POINT_THREE_ARCES_PASSWORD);

  await page.waitForTimeout(100000)

  const sitekey = await page.evaluate(() => {
    return document.querySelector('.g-recaptcha').getAttribute('data-sitekey')
  })

  const pageurl = await page.url();

  const requestResponse = await axios.post(`http://2captcha.com/in.php?key=${process.env.CAPTCHA_SOLVER_KEY}&method=turnstile&sitekey=${sitekey}&pageurl=${pageurl}`);

  const result = await retryOperation(() => getSolverResponse(requestResponse.data.slice(3)), 20);

  await page.$eval('input[name="g-recaptcha-response"]', (el, value) => el.value = value, result);

  await page.click('input[id="submit"]')

  await page.waitForSelector('#qmenu_menu')
  console.log('To landing page')

  await page.goto('https://www.1point3acres.com/bbs/dsu_paulsign-sign.html');

  await page.evaluate(() => {
    document.querySelectorAll('input[name=qdmode]')[1].click();
  });

  const googlekey = await page.evaluate(() => {
    return document.querySelector('.g-recaptcha').getAttribute('data-sitekey')
  })

  const captchaAnswer = await client.decodeRecaptchaV2({
    googlekey,
    pageurl,
  }).then(response => response.text);

  console.log(captchaAnswer, 'captchaAnswer')

  await page.evaluate((captchaAnswer) => {
    document.querySelector("#g-recaptcha-response").style.display = "block";
    document.querySelector("#g-recaptcha-response").value = captchaAnswer;
  }, captchaAnswer);

  await page.evaluate(() => {
    document.querySelector('input[type="submit"]').click()
  })

  await page.waitForTimeout(10000)

  await browser.close();
})();

