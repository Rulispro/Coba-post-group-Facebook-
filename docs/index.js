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
    // 3. Cari & Klik Composer (versi fleksibel)
    // =========================
    console.log("👉 Cari tombol composer...");

    const composerClicked = await page.evaluate(async () => {
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));

      // kata kunci yg mungkin dipakai Facebook
      const keywords = [
        "write something",
        "tulis sesuatu",
        "buat postingan",
        "create a public post",
      ];

      // ambil semua kandidat elemen
      const candidates = [...document.querySelectorAll("span, div, button")];
      console.log("DEBUG: Total kandidat =", candidates.length);

      let target = null;
      for (let el of candidates) {
        const txt = (el.innerText || "").toLowerCase();
        if (keywords.some((k) => txt.includes(k))) {
          console.log("✅ Ketemu kandidat composer:", txt, el.outerHTML);

          // cari parent yg bisa diklik
          target =
            el.closest("div[role='button']") ||
            el.closest("div[data-mcomponent]") ||
            el.closest("div") ||
            el;

          break;
        }
      }

      if (!target) {
        console.log("❌ Tidak ada composer dengan teks:", keywords.join(", "));
        return false;
      }

      console.log("DEBUG: Target klik =", target.tagName, target.className);

      // klik manual pakai event
      ["mousedown", "mouseup", "click"].forEach((type) => {
        target.dispatchEvent(
          new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
        );
      });

      await delay(2000);
      return true;
    });

    if (!composerClicked) throw new Error("❌ Composer button not found");

    console.log("✅ Composer berhasil diklik");

    // =========================
    // 4. Isi Caption
    // =========================
    console.log("⌛ Menunggu textarea muncul...");
    await page.waitForSelector("textarea", { timeout: 15000 });

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
