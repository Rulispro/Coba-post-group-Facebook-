const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Helper functions
// =========================
async function safeClick(el) {
  if (!el) return false;
  try {
    await el.evaluate(e => e.scrollIntoView({ behavior: "smooth", block: "center" }));
    await el.click();
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik/tap:", e.message);
    return false;
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
        const role = el.getAttribute("role") || "";
        const classes = el.className || "";
        const parent = el.parentElement ? el.parentElement.tagName : null;
        const matched = keywords.some(k => txt.toLowerCase().includes(k.toLowerCase()) 
                                          || aria.toLowerCase().includes(k.toLowerCase()));
        return { tag: el.tagName, txt, aria, role, classes, parent, matched };
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
      if (rect.width === 0 || rect.height === 0) continue; // skip hidden
      const txt = (el.innerText || "").trim();
      const aria = el.getAttribute("aria-label") || "";

      // cek nested span/div juga
      const nested = el.querySelectorAll("span, div");
      for (let n of nested) {
        if (keywords.some(k => (n.innerText || "").toLowerCase().includes(k.toLowerCase()))) {
          return el;
        }
      }

      if (keywords.some(k => txt.toLowerCase().includes(k.toLowerCase()) || aria.toLowerCase().includes(k.toLowerCase()))) {
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
    const groupUrl = "https://facebook.com/groups/512223333438818/";
    const caption = "Halo 👋 ini posting otomatis Puppeteer!";

    const browser = await puppeteer.launch({
      headless: false, // bisa diubah true/false
      defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const page = await browser.newPage();
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
    await page.setUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36");
    await page.setCookie(...cookies);

    // buka halaman grup
    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000); // tunggu render ekstra

    // =========================
    // 1️⃣ Scan & klik composer
    // =========================
    const composerKeywords = ["Write something","Apa yang Anda pikirkan","Tulis sesuatu","Create a post","Buat postingan"];
    await scanVisibleElements(page, composerKeywords, "Composer sebelum klik");

    const composer = await findElementByKeyword(page, composerKeywords);
    if (!composer) throw new Error("❌ Composer tidak ditemukan");
    await safeClick(composer);
    await page.waitForTimeout(3000);

    // =========================
    // 2️⃣ Scan & isi caption
    // =========================
    const textboxKeywords = ["Write something","Apa yang Anda pikirkan","Tulis sesuatu","Create a public post","Buat postingan publik"];
    await scanVisibleElements(page, textboxKeywords, "Textbox / Caption");

    const textbox = await findElementByKeyword(page, textboxKeywords);
    if (!textbox) throw new Error("❌ Textbox tidak ditemukan");

    await safeClick(textbox);
    await page.keyboard.type(caption, { delay: 50 });
    await page.waitForTimeout(1000);

    // =========================
    // 3️⃣ Scan & klik tombol Post
    // =========================
    const postKeywords = ["Post","Kirim","Bagikan","Bagikan sekarang","OK"];
    await scanVisibleElements(page, postKeywords, "Tombol Post");

    const postButton = await findElementByKeyword(page, postKeywords);
    if (postButton) {
      await safeClick(postButton);
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
