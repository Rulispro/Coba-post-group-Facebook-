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

  // 🔎 Cari elemen "Write something" / "Tulis sesuatu"
  const composer = await page.evaluateHandle(() => {
    const span = [...document.querySelectorAll("span")]
      .find(e =>
        e.innerText?.toLowerCase().includes("write something") ||
        e.innerText?.toLowerCase().includes("tulis sesuatu") ||
        e.innerText?.toLowerCase().includes("buat postingan")
      );

    if (!span) return null;

    let el =
      span.closest("div[data-mcomponent='TextArea']") ||
      span.closest("div[role='textbox']") ||
      span.parentElement;

    return el;
  });

  if (!composer) {
    console.log("❌ Tidak ketemu tombol composer");
    await browser.close();
    return;
  }

  const box = await composer.asElement();
  if (box) {
    await box.click();
    console.log("✅ Composer dibuka aman 👍");

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

    // 🔎 Cari tombol POST (versi baru)
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

  } else {
    console.log("❌ Gagal convert composer ke element handle");
  }

  await browser.close();
})();
