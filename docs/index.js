// index.js
const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    console.log("🚀 Start bot...");

    // =========================
    // 1. Load Cookies
    // =========================
    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; // ganti ID grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer versi mobile!";

    console.log("✅ Cookies loaded");

    // =========================
    // 2. Launch Browser
    // =========================
    const browser = await puppeteer.launch({
      headless: true, // untuk GitHub Actions
      defaultViewport: {
        width: 412,
        height: 915,
        isMobile: true,
        hasTouch: true,
      },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    // User-Agent mirip Chrome Android
    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
    );

    // set cookies
    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    // buka homepage dulu biar login aktif
    console.log("🌐 Opening m.facebook.com ...");
    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    // buka grup target
    console.log("🌐 Opening group:", groupUrl);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    // =========================
    // 3. Klik Composer
    // =========================
    console.log("👉 Mencari tombol composer...");
    const composerFound = await page.evaluate(() => {
      const spans = [...document.querySelectorAll("span")];
      console.log("DEBUG: Jumlah span =", spans.length);

      const span = spans.find(
        (e) =>
          e.innerText?.toLowerCase().includes("write something") ||
          e.innerText?.toLowerCase().includes("tulis sesuatu") ||
          e.innerText?.toLowerCase().includes("buat postingan")
      );

      if (!span) {
        console.log("❌ Tidak ketemu span composer. Contoh span pertama:", spans[0]?.outerHTML);
        return false;
      }

      console.log("✅ Span composer ditemukan:", span.innerText, span.outerHTML);

      let el =
        span.closest("div[data-mcomponent='TextArea']") ||
        span.closest("div[role='textbox']") ||
        span.parentElement;

      if (!el) {
        console.log("❌ Tidak ketemu container composer dari span:", span.outerHTML);
        return false;
      }

      console.log("DEBUG: Klik element composer:", el.className, el.outerHTML);

      ["mousedown", "mouseup", "click"].forEach((type) => {
        el.dispatchEvent(
          new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
        );
      });
      return true;
    });

    if (!composerFound) throw new Error("❌ Composer button not found");

    console.log("✅ Composer diklik");

    // =========================
    // 4. Isi Caption
    // =========================
    console.log("⌛ Menunggu textarea muncul...");
    await page.waitForSelector("textarea", { timeout: 15000 });

    // debug list textarea
    const textareas = await page.evaluate(() => {
      return [...document.querySelectorAll("textarea")].map((t) => ({
        placeholder: t.getAttribute("placeholder"),
        outerHTML: t.outerHTML,
      }));
    });
    console.log("DEBUG: Textarea ditemukan:", JSON.stringify(textareas, null, 2));

    await page.type("textarea", caption, { delay: 50 });
    console.log("✅ Caption berhasil diisi");

    // =========================
    // 5. Klik tombol Post
    // =========================
    console.log("👉 Mencari tombol Post...");
    const clicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button, input[type='submit']")];
      console.log("DEBUG: Jumlah tombol =", buttons.length);

      const btn = buttons.find(
        (b) =>
          b.innerText?.toLowerCase().includes("post") ||
          b.innerText?.toLowerCase().includes("kirim") ||
          b.innerText?.toLowerCase().includes("share")
      );

      if (btn) {
        console.log("✅ Tombol Post ditemukan:", btn.innerText, btn.outerHTML);
        ["mousedown", "mouseup", "click"].forEach((type) => {
          btn.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
          );
        });
        return true;
      }

      console.log("❌ Tidak ada tombol Post. Contoh tombol pertama:", buttons[0]?.outerHTML);
      return false;
    });

    if (!clicked) throw new Error("❌ Tombol Post tidak ditemukan");

    console.log("✅ Post berhasil dikirim!");

    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
