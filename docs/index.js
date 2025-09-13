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

// klik tombol berdasarkan text/aria-label
async function clickButtonByText(page, texts) {
  const handle = await page.evaluateHandle((labels) => {
    const els = [...document.querySelectorAll("button, div[role='button'], input[type='submit'], a")];
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

// scanner debug (lihat 50 elemen pertama)
async function scanElements(page, label = "Scan") {
  console.log(`\n🔎 ${label} (50 elemen pertama)`);
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll("div, span, button, a, textarea, input")]
      .slice(0, 50)
      .map((el, i) => ({
        index: i,
        tag: el.tagName,
        txt: (el.innerText || "").trim(),
        aria: el.getAttribute("aria-label"),
        placeholder: el.getAttribute("placeholder"),
        role: el.getAttribute("role"),
        href: el.getAttribute("href"),
        classes: el.className || ""
      }));
  });
  elements.forEach(el => {
    console.log(`#${el.index}`, el);
  });
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
    await scanElements(page, "Composer sebelum klik");

    const composerHandle = await page.evaluateHandle(() => {
      // kemungkinan composer bisa <a href="...composer..."> atau <span dir="auto">Write something</span>
      const candidates = [
        ...document.querySelectorAll("a[href*='composer'], div[role='button'], span")
      ];
      for (let el of candidates) {
        const txt = (el.innerText || el.getAttribute("aria-label") || "").trim().toLowerCase();
        if (txt.includes("write") || txt.includes("tulis") || txt.includes("posting")) {
          return el;
        }
      }
      return null;
    });

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
    await scanElements(page, "Textbox / Caption");

    const textboxHandle = await page.evaluateHandle(() => {
      const all = [...document.querySelectorAll("div[role='textbox'], textarea")];
      return all.length ? all[0] : null;
    });

    let textbox = textboxHandle ? textboxHandle.asElement() : null;
    if (textbox) {
      console.log("✅ Textbox ditemukan, isi caption...");
      await safeClick(textbox);
      await page.type("div[role='textbox'], textarea", "Halo 👋 ini posting otomatis Puppeteer!", { delay: 50 });
      await page.waitForTimeout(1000);
    } else {
      throw new Error("❌ Textbox tidak ditemukan");
    }

    // =========================
    // 3. Scan & klik tombol Post
    // =========================
    await scanElements(page, "Tombol Post");

    const postClicked = await clickButtonByText(page, ["Post", "Kirim", "Bagikan"]);
    if (postClicked) {
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
