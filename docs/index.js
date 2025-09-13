const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Helper functions
// =========================
async function safeClick(el, page, label = "Unknown") {
  if (!el) return false;
  try {
    await el.evaluate(e => e.scrollIntoView({ behavior: "smooth", block: "center" }));
    console.log(`👉 [${label}] Coba click()...`);
    await el.click({ delay: 30 });
    return true;
  } catch (e1) {
    console.log(`⚠️ [${label}] Gagal click(): ${e1.message}`);
    try {
      if (typeof el.tap === "function") {
        console.log(`👉 [${label}] Coba tap()...`);
        await el.tap();
        return true;
      }
      const box = await el.boundingBox();
      if (box) {
        console.log(`👉 [${label}] Coba touchscreen.tap()...`);
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        return true;
      }
    } catch (e2) {
      console.log(`❌ [${label}] Gagal tap(): ${e2.message}`);
    }
    return false;
  }
}

async function scanElements(page, label = "Scan") {
  console.log(`\n🔎 ${label} (50 elemen pertama)`);
  await page.evaluate((label) => {
    [...document.querySelectorAll("div, span, button, a, textarea, input")]
      .slice(0, 50)
      .forEach((el, i) => {
        console.log(`#${i}`, {
          tag: el.tagName,
          txt: (el.innerText || "").trim(),
          aria: el.getAttribute("aria-label"),
          placeholder: el.getAttribute("placeholder"),
          role: el.getAttribute("role"),
          href: el.getAttribute("href")
        });
      });
  }, label);
}

async function findByKeywords(page, keywords = []) {
  const handle = await page.evaluateHandle((keywords) => {
    const all = [
      ...document.querySelectorAll("div, span, button, a, textarea, input")
    ];
    for (let el of all) {
      const txt = (el.innerText || "").trim();
      const aria = el.getAttribute("aria-label") || "";
      const placeholder = el.getAttribute("placeholder") || "";
      const href = el.getAttribute("href") || "";
      const combined = [txt, aria, placeholder, href].join(" ").toLowerCase();
      if (keywords.some(k => combined.includes(k.toLowerCase()))) {
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
      headless: true, // bisa true di GitHub Action
      defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const page = await browser.newPage();
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
    await page.setUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36");
    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    // buka halaman grup
    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000);

    // =========================
    // 1️⃣ Cari & klik composer
    // =========================
    await scanElements(page, "Composer scan");
    const composerKeywords = ["write something", "tulis sesuatu", "apa yang anda pikirkan", "create a post", "buat postingan", "composer"];
    const composer = await findByKeywords(page, composerKeywords);
    if (!composer) throw new Error("❌ Composer tidak ditemukan");
    await safeClick(composer, page, "Composer");
    await page.waitForTimeout(3000);

    // =========================
    // 2️⃣ Cari & isi caption
    // =========================
    await scanElements(page, "Textbox scan");
    const textboxKeywords = ["write something", "tulis sesuatu", "apa yang anda pikirkan", "postingan publik"];
    const textbox = await findByKeywords(page, textboxKeywords);
    if (!textbox) throw new Error("❌ Textbox tidak ditemukan");
    await safeClick(textbox, page, "Textbox");
    await page.keyboard.type(caption, { delay: 50 });
    await page.waitForTimeout(2000);

    // =========================
    // 3️⃣ Cari & klik tombol Post
    // =========================
    await scanElements(page, "Tombol Post scan");
    const postKeywords = ["post", "kirim", "bagikan", "bagikan sekarang", "ok"];
    const postBtn = await findByKeywords(page, postKeywords);
    if (!postBtn) throw new Error("❌ Tombol Post tidak ditemukan");
    await safeClick(postBtn, page, "Tombol Post");
    console.log("✅ Tombol Post berhasil diklik!");

    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
        
