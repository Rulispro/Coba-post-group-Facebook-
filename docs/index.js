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

  // 🔎 Cari tombol "Write something" / "Tulis sesuatu" / "Buat postingan"
  const composerBtn = await page.$x(
    "//span[contains(text(),'Write something') or contains(text(),'Tulis sesuatu') or contains(text(),'Buat postingan')]"
  );

  if (composerBtn.length === 0) {
    console.log("❌ Tidak ketemu tombol composer");
    await browser.close();
    return;
  }

  // klik span → lalu naik ke parent tombol
  const composerBox = await composerBtn[0].evaluateHandle(el =>
    el.closest("div[role='textbox']") ||
    el.closest("div[data-mcomponent]") ||
    el.parentElement
  );

  if (!composerBox) {
    console.log("❌ Tidak ketemu element box composer");
    await browser.close();
    return;
  }

  await composerBox.asElement().click();
  console.log("✅ Composer dibuka aman 👍");

  // kasih delay kecil biar textarea siap
  await page.waitForTimeout(1500);

  // tunggu textarea
  const textareaSelector = "textarea[name='xc_message'], textarea";
  await page.waitForSelector(textareaSelector, { timeout: 10000 });

  // isi caption
  await page.$eval(textareaSelector, (el, caption) => {
    el.value = caption;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, caption);
  console.log("✅ Caption berhasil diisi:", caption);

  // 🔎 Cari tombol POST
  const postBtnHandle = await page.evaluateHandle(() => {
    const span = [...document.querySelectorAll("span")]
      .find(el => {
        const txt = el.innerText?.trim().toLowerCase();
        return txt === "post" || txt === "bagikan" || txt === "share";
      });
    if (!span) return null;
    return span.closest("div[role=button]") || null;
  });

  if (!postBtnHandle) {
    console.log("❌ Tombol POST tidak ketemu");
  } else {
    const postBtn = postBtnHandle.asElement();
    if (postBtn) {
      await postBtn.click();
      console.log("✅ Tombol POST berhasil diklik");
    } else {
      console.log("❌ Gagal convert tombol ke element handle");
    }
  }

  await browser.close();
})();
