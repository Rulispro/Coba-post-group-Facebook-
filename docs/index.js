// index.js
const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Fungsi helper
// =========================
// cari elemen berdasarkan placeholder / aria-label / innerText
async function getElementByPlaceholder(page, texts) {
  const handle = await page.evaluateHandle((placeholders) => {
    const els = Array.from(document.querySelectorAll("input, textarea, div[role='textbox'], div[role='button']"));
    for (let el of els) {
      const ph = el.getAttribute("placeholder") || el.getAttribute("aria-label") || el.innerText || "";
      for (let i = 0; i < placeholders.length; i++) {
        if (ph.toLowerCase().includes(placeholders[i].toLowerCase())) {
          return el;
        }
      }
    }
    return null;
  }, texts);

  if (!handle) return null;
  return handle.asElement(); // biar bisa .click(), .type()
}

// klik tombol berdasarkan text/aria-label
async function clickButtonByText(page, texts) {
  const handle = await page.evaluateHandle((labels) => {
    const els = Array.from(document.querySelectorAll("button, div[role='button'], input[type='submit']"));
    for (let el of els) {
      const txt = (el.innerText || el.getAttribute("aria-label") || "").trim();
      for (let i = 0; i < labels.length; i++) {
        if (txt.toLowerCase().includes(labels[i].toLowerCase())) {
          return el;
        }
      }
    }
    return null;
  }, texts);

  if (!handle) return false;
  const btn = handle.asElement();
  if (!btn) return false;

  try {
    // click biasa dulu
    await btn.click();
    return true;
  } catch (e) {
    console.log("⚠️ Gagal click biasa, coba fallback tap:", e.message);
    try {
      // fallback tap via touchscreen
      const box = await btn.boundingBox();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        return true;
      }
    } catch (e2) {
      console.log("⚠️ Fallback tap juga gagal:", e2.message);
    }
  }

  return false;
}


// =========================
// Main
// =========================
(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; 
    const caption = "Halo 👋 ini posting otomatis Puppeteer (click/tap fallback)!";

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
    // 1. Composer
    // =========================
    console.log("👉 Cari composer...");
    let composer = await getElementByPlaceholder(page, [
      "Write something",
      "Tulis sesuatu",
      "Apa yang Anda pikirkan",
      "Create a post",
      "Buat postingan"
    ]);

    if (composer) {
      console.log("✅ Composer ditemukan, klik/tap...");
      try {
        await composer.click().catch(() => {});
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log("⚠️ Gagal klik composer:", e.message);
      }
    } else {
      console.log("❌ Composer tidak ditemukan (lanjut tetap)");
    }

    // =========================
    // 2. Caption
    // =========================
    console.log("👉 Cari textbox caption...");
    let textbox = await getElementByPlaceholder(page, [
      "Write something",
      "Tulis sesuatu",
      "Apa yang Anda pikirkan"
    ]);

    if (textbox) {
      console.log("✅ Textbox ketemu, isi caption...");
      try {
        await textbox.click().catch(() => {});
        await page.waitForTimeout(500);
        await textbox.type(caption, { delay: 50 });
      } catch (e) {
        console.log("⚠️ Gagal isi caption:", e.message);
      }
    } else {
      console.log("❌ Textbox caption tidak ditemukan");
    }

    // =========================
    // 3. Tombol Post
    // =========================
    console.log("👉 Cari tombol Post...");
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
