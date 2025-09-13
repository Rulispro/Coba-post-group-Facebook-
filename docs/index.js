// index.js
const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; // ganti ID grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer versi placeholder!";

    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const page = await browser.newPage();
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));

    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
    );

    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    // =========================
    // Fungsi bantu
    // =========================
    async function getElementByPlaceholder(page, texts) {
      return await page.evaluateHandle((placeholders) => {
        const els = [...document.querySelectorAll("input, textarea, div[role='textbox']")];
        for (let el of els) {
          const ph = el.getAttribute("placeholder") || el.getAttribute("aria-label") || "";
          if (placeholders.some(p => ph.toLowerCase().includes(p.toLowerCase()))) {
            return el;
          }
        }
        return null;
      }, texts);
    }

    async function clickButtonByText(page, texts) {
      const btn = await page.evaluateHandle((labels) => {
        const els = [...document.querySelectorAll("button, div[role='button'], input[type='submit']")];
        for (let el of els) {
          const txt = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim();
          if (labels.some(t => txt.toLowerCase().includes(t.toLowerCase()))) {
            return el;
          }
        }
        return null;
      }, texts);

      if (btn) {
        const box = await btn.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          return true;
        }
      }
      return false;
    }

    // =========================
    // 1. Composer
    // =========================
    console.log("👉 Cari composer via placeholder...");
    let composer = await getElementByPlaceholder(page, [
      "Write something",
      "Tulis sesuatu",
      "Apa yang Anda pikirkan",
      "Create a post",
      "Buat postingan"
    ]);

    if (composer) {
      console.log("✅ Composer ditemukan, klik...");
      await composer.click({ delay: 50 });
      await page.waitForTimeout(2000);
    } else {
      console.log("❌ Composer tidak ditemukan");
    }

    // =========================
    // 2. Caption
    // =========================
    console.log("👉 Cari textbox caption via placeholder...");
    let textbox = await getElementByPlaceholder(page, [
      "Write something",
      "Tulis sesuatu",
      "Apa yang Anda pikirkan"
    ]);

    if (textbox) {
      console.log("✅ Textbox ketemu, isi caption...");
      await textbox.click({ delay: 50 });
      await page.waitForTimeout(500);
      await textbox.type(caption, { delay: 50 });
    } else {
      console.log("❌ Textbox caption tidak ditemukan");
    }

    // =========================
    // 3. Tombol Post
    // =========================
    console.log("👉 Klik tombol Post...");
    let posted = await clickButtonByText(page, [
      "Post",
      "Kirim",
      "Bagikan",
      "Bagikan sekarang",
      "OK"
    ]);

    if (posted) {
      console.log("✅ Post berhasil diklik!");
    } else {
      console.log("❌ Tombol Post tidak ketemu");
    }

    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
