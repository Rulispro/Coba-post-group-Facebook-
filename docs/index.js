const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Fungsi helper
// =========================
async function safeClick(el) {
  if (!el) return false;
  try {
    if (typeof el.tap === "function") {
      await el.tap();
    } else {
      await el.click();
    }
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik/tap:", e.message);
    return false;
  }
}

async function scanAllElementsVerbose(page, label = "Scan") {
  console.log(`\n🔎 ${label} (50 elemen pertama)`);
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll("div, span, a, button, textarea, input")]
      .slice(0, 50)
      .map((el, i) => ({
        index: i,
        tag: el.tagName,
        txt: (el.innerText || "").trim(),
        aria: el.getAttribute("aria-label"),
        placeholder: el.getAttribute("placeholder"),
        role: el.getAttribute("role"),
        href: el.getAttribute("href"),
        contenteditable: el.getAttribute("contenteditable"),
        classes: el.className
      }));
  });
  elements.forEach(el => console.log(`#${el.index}`, el));
  return elements;
}

// =========================
// Main
// =========================
(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://m.facebook.com/groups/5763845890292336/";
    const caption = "Halo 👋 ini posting otomatis Puppeteer!";

    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"]
    });

    const page = await browser.newPage();
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
    );
    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    // ===== 1️⃣ Klik composer / write something
    const composerSelectors = [
      'a[href*="composer"]',
      'div[role="button"]',
      'span[dir="auto"][placeholder*="write"]',
      'div[placeholder*="write something"]'
    ];

    let composerClicked = false;
    for (const sel of composerSelectors) {
      const handle = await page.$(sel);
      if (handle) {
        console.log("✅ Composer ditemukan:", sel);
        await safeClick(handle);
        composerClicked = true;
        await page.waitForTimeout(2000);
        break;
      }
    }

    if (!composerClicked) {
      console.log("❌ Composer tidak ditemukan, scan semua elemen");
      await scanAllElementsVerbose(page, "Composer");
    }

    // ===== 2️⃣ Isi caption
    const textboxSelectors = [
      'div[role="textbox"][contenteditable="true"]',
      'textarea[name="xs"]',
      '[aria-label*="write something"]'
    ];

    let typed = false;
    for (const sel of textboxSelectors) {
      const handle = await page.$(sel);
      if (handle) {
        console.log("✅ Textbox ditemukan:", sel);
        await handle.focus();
        await page.keyboard.type(caption, { delay: 50 });
        typed = true;
        await page.waitForTimeout(1000);
        break;
      }
    }

    if (!typed) {
      console.log("❌ Textbox / Caption tidak ditemukan, scan semua elemen");
      await scanAllElementsVerbose(page, "Textbox / Caption");
    }

    // ===== 3️⃣ Klik tombol post
    const postCandidates = await page.$$('button, div[role="button"], input[type="submit"], a');
    let postClicked = false;

    for (const el of postCandidates) {
      const name = await page.evaluate(e => (e.innerText || e.getAttribute("aria-label") || "").trim(), el);
      console.log("🔹 Tombol ditemukan:", name);

      // jika ada kata post/kirim/bagikan klik
      if (["post", "kirim", "bagikan"].some(t => name.toLowerCase().includes(t))) {
        console.log("✅ Klik tombol:", name);
        await safeClick(el);
        postClicked = true;
        break;
      }
    }

    // fallback: klik semua tombol yang terlihat
    if (!postClicked) {
      console.log("⚠️ Tombol post kata kunci tidak ditemukan, coba klik semua tombol");
      for (const el of postCandidates) {
        await safeClick(el);
      }
    }

    await page.waitForTimeout(5000);
    await browser.close();
    console.log("🎉 Selesai posting!");
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
