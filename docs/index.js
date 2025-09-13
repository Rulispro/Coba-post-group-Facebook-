const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Helper
// =========================
async function safeClick(el) {
  if (!el) return false;
  try {
    if (typeof el.tap === "function") {
      await el.tap(); // mobile
    } else {
      await el.click(); // desktop
    }
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik/tap:", e.message);
    return false;
  }
}

async function clickButtonByText(page, texts) {
  const handle = await page.evaluateHandle((labels) => {
    const els = [...document.querySelectorAll("button, div[role='button'], span")];
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
    const caption = "Halo 👋 ini posting otomatis Puppeteer 👍";

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
    // 1. Klik composer parent
    // =========================
    console.log("👉 Cari composer parent...");
    try {
      await page.waitForSelector("div.m.bg-s14[tabindex='0']", { timeout: 5000 });
      await page.click("div.m.bg-s14[tabindex='0']");
      console.log("✅ Composer diklik");
    } catch {
      console.log("❌ Composer parent tidak ditemukan");
    }

    // =========================
    // 2. Tunggu composer terbuka
    // =========================
    await page.waitForTimeout(2000);

    // =========================
    // 3. Cari textbox caption
    // =========================
    console.log("👉 Cari textbox caption...");
    const captionSelectors = [
      "div[role='textbox'][aria-label='Write something']",
      "div[role='textbox'][aria-label='Tulis sesuatu']",
      "div[role='textbox'][aria-label='Buat postingan publik']",
      "div[role='textbox'][aria-label='Create a public post']",
      "div[role='textbox'][aria-label=\"What's on your mind?\"]",
      "div[role='textbox']" // fallback
    ];

    let textbox = null;
    for (const sel of captionSelectors) {
      textbox = await page.$(sel);
      if (textbox) {
        console.log("🎯 Textbox ditemukan dengan selector:", sel);
        await textbox.click();
        await page.type(sel, caption, { delay: 50 });
        console.log("✅ Caption berhasil diisi");
        break;
      }
    }

    if (!textbox) throw new Error("❌ Textbox tidak ditemukan");

    // =========================
    // 4. Klik tombol Post
    // =========================
    console.log("👉 Cari tombol Post...");
    let posted = await clickButtonByText(page, ["Post", "Kirim", "Bagikan", "Bagikan sekarang", "OK"]);

    if (posted) {
      console.log("✅ Tombol Post berhasil diklik!");
    } else {
      throw new Error("❌ Tombol Post tidak ketemu");
    }

    await page.waitForTimeout(5000);
    await browser.close();
    console.log("🎉 Selesai!");

  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
