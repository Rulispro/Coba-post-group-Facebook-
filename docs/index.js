const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Helper functions
// =========================
async function safeClick(el, page, label = "Unknown") {
  if (!el) {
    console.log(`⚠️ [${label}] Elemen kosong, ga bisa klik`);
    return false;
  }
  try {
    await el.evaluate(e => e.scrollIntoView({ behavior: "smooth", block: "center" }));
    console.log(`👉 [${label}] Coba click()...`);
    await el.click({ delay: 50 });
    return true;
  } catch (e1) {
    console.log(`⚠️ [${label}] Gagal click(): ${e1.message}`);
    try {
      console.log(`👉 [${label}] Coba tap()...`);
      if (typeof el.tap === "function") {
        await el.tap();
        return true;
      }
      const box = await el.boundingBox();
      if (box) {
        console.log(`👉 [${label}] Fallback touchscreen.tap()`);
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        return true;
      }
    } catch (e2) {
      console.log(`❌ [${label}] Gagal tap(): ${e2.message}`);
      return false;
    }
  }
}

async function scanVisibleElements(page, keywords = [], label = "Scan") {
  const elements = await page.evaluate((keywords) => {
    const all = [...document.querySelectorAll("div, span, button, textarea, input")];
    return all
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0; // hanya elemen visible
      })
      .map(el => {
        const txt = (el.innerText || "").trim();
        const aria = el.getAttribute("aria-label") || "";
        const ph = el.getAttribute("placeholder") || "";
        const role = el.getAttribute("role") || "";
        const classes = el.className || "";
        const matched = keywords.some(k =>
          txt.toLowerCase().includes(k.toLowerCase()) ||
          aria.toLowerCase().includes(k.toLowerCase()) ||
          ph.toLowerCase().includes(k.toLowerCase())
        );
        return { tag: el.tagName, txt, aria, placeholder: ph, role, classes, matched };
      });
  }, keywords);

  console.log(`🔎 ${label} (matched keyword)`);
  elements.filter(e => e.matched).forEach(e => console.log(e));
  return elements;
}

async function findElementByKeyword(page, keywords = []) {
  const handle = await page.evaluateHandle((keywords) => {
    const all = [...document.querySelectorAll("div, span, button, textarea, input")];
    for (let el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const txt = (el.innerText || "").trim();
      const aria = el.getAttribute("aria-label") || "";
      const ph = el.getAttribute("placeholder") || "";

      if (keywords.some(k =>
        txt.toLowerCase().includes(k.toLowerCase()) ||
        aria.toLowerCase().includes(k.toLowerCase()) ||
        ph.toLowerCase().includes(k.toLowerCase())
      )) {
        return el;
      }
    }
    return null;
  }, keywords);

  return handle ? handle.asElement() : null;
}

// =========================
// Main
// =========================
(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; // ganti ID grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer!";

    const browser = await puppeteer.launch({
      headless: true, // set true di GitHub Action
      defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const page = await browser.newPage();

    // Debug log listener
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", err => console.log("BROWSER ERROR:", err));
    page.on("requestfailed", req => console.log("REQUEST FAIL:", req.url(), req.failure()?.errorText));

    await page.setUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36");
    await page.setCookie(...cookies);

    // buka halaman grup
    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000);

    // =========================
    // 1️⃣ Composer
    // =========================
    const composerKeywords = ["Write something", "Apa yang Anda pikirkan", "Tulis sesuatu", "Create a post", "Buat postingan"];
    await scanVisibleElements(page, composerKeywords, "Composer sebelum klik");

    const composer = await findElementByKeyword(page, composerKeywords);
    if (!composer) throw new Error("❌ Composer tidak ditemukan");
    await safeClick(composer, page, "Composer");
    await page.waitForTimeout(3000);

    // =========================
    // 2️⃣ Caption box
    // =========================
    const textboxKeywords = ["Write something", "Apa yang Anda pikirkan", "Tulis sesuatu", "Create a public post", "Buat postingan publik"];
    await scanVisibleElements(page, textboxKeywords, "Textbox / Caption");

    const textbox = await findElementByKeyword(page, textboxKeywords);
    if (!textbox) throw new Error("❌ Textbox tidak ditemukan");
    await safeClick(textbox, page, "Textbox");
    await page.keyboard.type(caption, { delay: 50 });
    await page.waitForTimeout(1000);

    // =========================
    // 3️⃣ Tombol Post
    // =========================
    const postKeywords = ["Post", "Kirim", "Bagikan", "Bagikan sekarang", "OK"];
    await scanVisibleElements(page, postKeywords, "Tombol Post");

    const postButton = await findElementByKeyword(page, postKeywords);
    if (postButton) {
      await safeClick(postButton, page, "Tombol Post");
      console.log("✅ Tombol Post berhasil diklik!");
    } else {
      console.log("❌ Tombol Post tidak ditemukan");
    }

    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
