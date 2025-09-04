const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const cookies = JSON.parse(fs.readFileSync(__dirname + '/cookies.json', 'utf8'));

  const groupUrl = 'https://facebook.com/groups/512223333438818/';
  const caption = 'Halo, ini posting otomatis dari Puppeteer versi mobile!';

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 412,
      height: 915,
      isMobile: true,
      hasTouch: true
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // 🟢 Samakan User-Agent dengan Chrome Android (sama kayak di Kiwi)
  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
  );

  // Set cookies
  await page.setCookie(...cookies);

  // Buka m.facebook.com
  await page.goto('https://m.facebook.com', { waitUntil: 'networkidle2' });

  // Buka grup
  await page.goto(groupUrl, { waitUntil: 'networkidle2' });

  // cari tombol "Write something" / "Buat postingan"
const btn = await page.$x(
  "//div[contains(., 'Write something') or contains(., 'Write a public post') or contains(., 'Buat postingan')]"
);

if (btn.length > 0) {
  await btn[0].click();
  console.log("✅ Tombol Write Something diklik");

  // tunggu textarea muncul
  const textareaSelector = "textarea[name='xc_message'], textarea";
  await page.waitForSelector(textareaSelector, { timeout: 10000 });

  // isi caption
  await page.$eval(textareaSelector, (el, caption) => {
    el.value = caption;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, caption);
  console.log("✅ Caption berhasil diisi:", caption);

  // cari tombol Post
  const postSpanXPath = "//span[text()='Post' or text()='Bagikan']";
  const [span] = await page.$x(postSpanXPath);
  if (span) {
    let clickable = await span.evaluateHandle(el =>
      el.closest("div[role=button], div[data-mcomponent], div[tabindex]") || el.parentElement
    );
    await clickable.asElement().click();
    console.log("✅ Tombol POST diklik");
  } else {
    console.log("❌ Tidak ketemu tombol POST");
  }
} else {
  console.log("❌ Tombol 'Write something' tidak ditemukan");
}
await browser.close();
})();
