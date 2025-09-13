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
      await el.tap();  // mobile
    } else {
      await el.click(); // desktop
    }
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik/tap:", e.message);
    return false;
  }
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

// scan semua elemen penting
async function scanAllElements(page, keywords = [], label = "Scan") {
  const elements = await page.evaluate((keywords) => {
    const all = [...document.querySelectorAll("div, span, button, textarea, input")];
    return all.map(el => {
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

  console.log(`🔎 ${label} (elemen yang matched keyword):`);
  elements.filter(e => e.matched).forEach(e => console.log(e));
  return elements;
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
      headless: false,
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
    // 1. Scan & klik composer
    // =========================
    const composerKeywords = [
      "Write something",
      "Apa yang Anda pikirkan",
      "Tulis sesuatu",
      "Create a post",
      "Buat postingan"
    ];

    await scanAllElements(page, composerKeywords, "Composer sebelum klik");

    const composerHandle = await page.evaluateHandle((keywords) => {
      const all = [...document.querySelectorAll("div[role='button'], span, div")];
      for (let el of all) {
        const txt = (el.innerText || el.getAttribute("aria-label") || "").trim();
        if (keywords.some(k => txt.toLowerCase().includes(k.toLowerCase()))) {
          return el.closest("div[role='button'], div[tabindex], button") || el;
        }
      }
      return null;
    }, composerKeywords);

    let composer = composerHandle ? composerHandle.asElement() : null;
    if (composer) {
      console.log("✅ Composer ditemukan, klik...");
      await safeClick(composer);
      await page.waitForTimeout(3000);
    } else {
      throw new Error("❌ Composer tidak ditemukan");
    }

    // =========================
    // 2. Scan & isi textbox caption
    // =========================
    const textboxKeywords = [
      "Write something",
      "Apa yang Anda pikirkan",
      "Tulis sesuatu",
      "Create a public post",
      "Buat postingan publik",
    ];

    await scanAllElements(page, textboxKeywords, "Textbox / Caption");

    const textboxHandle = await page.evaluateHandle(() => {
      const all = [...document.querySelectorAll("div[role='textbox'], textarea")];
      return all.length ? all[0] : null; // fallback ambil pertama
    });

    let textbox = textboxHandle ? textboxHandle.asElement() : null;
    if (textbox) {
      console.log("✅ Textbox ditemukan, isi caption...");
      await textbox.click();
      await page.type("div[role='textbox'], textarea", caption, { delay: 50 });
      await page.waitForTimeout(1000);
    } else {
      throw new Error("❌ Textbox tidak ditemukan");
    }

    // =========================
    // 3. Scan & klik tombol Post
    // =========================
    const postKeywords = ["Post", "Kirim", "Bagikan", "Bagikan sekarang", "OK"];
    await scanAllElements(page, postKeywords, "Tombol Post");

    let posted = await clickButtonByText(page, postKeywords);
    if (posted) {
      console.log("✅ Tombol Post berhasil diklik!");
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
                        
