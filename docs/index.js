const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Fungsi helper
// =========================

// klik/tap aman (mobile/desktop)
async function safeClick(el) {
  if (!el) return false;
  try {
    if (typeof el.tap === "function") {
      await el.tap();  // untuk mobile
    } else {
      await el.click(); // fallback desktop
    }
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik/tap:", e.message);
    return false;
  }
}

// cari elemen berdasarkan placeholder / aria-label / innerText
async function getElementByPlaceholder(page, texts) {
  const handle = await page.evaluateHandle((placeholders) => {
    const els = [...document.querySelectorAll("input, textarea, div[role='textbox'], div[role='button']")];
    for (let el of els) {
      const ph = el.getAttribute("placeholder") || el.getAttribute("aria-label") || el.innerText || "";
      if (placeholders.some(p => ph.toLowerCase().includes(p.toLowerCase()))) {
        return el;
      }
    }
    return null;
  }, texts);

  if (!handle) return null;
  return handle.asElement();
}

// klik tombol berdasarkan text/aria-label
async function clickButtonByText(page, texts) {
  const handle = await page.evaluateHandle((labels) => {
    const els = [...document.querySelectorAll("button, div[role='button'], input[type='submit']")];
    for (let el of els) {
      const txt = (el.innerText || el.getAttribute("aria-label") || "").trim();
      if (labels.some(t => txt.toLowerCase().includes(t.toLowerCase()))) {
        return el;
      }
    }
    return null;
  }, texts);

  if (!handle) return false;
  const btn = handle.asElement();
  if (!btn) return false;

  return await safeClick(btn);
}

// =========================
// Main
// =========================
(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; // ganti ID grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer dengan tap()!";

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

    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    console.log("🌐 Opening group:", groupUrl);
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
      await safeClick(composer);
      await page.waitForTimeout(3000); // jeda biar textbox muncul
    } else {
      console.log("❌ Composer tidak ditemukan (lanjut ke caption)");
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
      await safeClick(textbox);
      await page.waitForTimeout(500);
      await textbox.type(caption, { delay: 50 });
    } else {
      console.log("❌ Textbox caption tidak ditemukan");
    }

    // =========================
    // 3. Tombol Post
    // =========================
    console.log("👉 Klik tombol Post...");
    let posted = await clickButtonByText(page, ["Post", "Kirim", "Bagikan", "Bagikan sekarang", "OK"]);

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
