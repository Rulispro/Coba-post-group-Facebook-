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

  // 🟢 Samakan User-Agent dengan Chrome Android
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
// buka grup
await page.goto("https://m.facebook.com/groups/123456789", { waitUntil: "networkidle2" });
await page.waitForTimeout(5000);

// buka composer dengan simulate click/tap
await page.evaluate(() => {
  const span = [...document.querySelectorAll("span")]
    .find(e =>
      e.innerText?.toLowerCase().includes("write something") ||
      e.innerText?.toLowerCase().includes("tulis sesuatu")
    );

  if (!span) {
    console.log("❌ Tidak ketemu tombol composer");
    return;
  }

  let el =
    span.closest("div[data-mcomponent='TextArea']") ||
    span.closest("div[role='textbox']") ||
    span.parentElement;

  if (!el) {
    console.log("❌ Tidak ketemu elemen klik");
    return;
  }

  ["mousedown", "mouseup", "click"].forEach(type => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  });

  console.log("✅ Composer dibuka aman 👍");
});

// tunggu textarea muncul setelah klik composer
await page.waitForSelector("textarea", { timeout: 15000 });

// isi pesan
await page.type("textarea", "Hello, ini posting otomatis dengan Puppeteer!", { delay: 50 });

// tombol kirim biasanya button dengan text "Post" / "Kirim"
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button, input[type='submit']")]
    .find(b => b.innerText?.toLowerCase().includes("post") ||
               b.innerText?.toLowerCase().includes("kirim"));
  if (btn) btn.click();
});

console.log("✅ Postingan berhasil dikirim");
    

  await browser.close();
})();
