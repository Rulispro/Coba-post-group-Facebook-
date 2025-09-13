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
    // 1. Cari composer parent
    // =========================
    console.log("👉 Cari composer...");
    const composerHandle = await page.evaluateHandle(() => {
      const keywords = [
        "Write something",
        "Apa yang Anda pikirkan",
        "Tulis sesuatu",
        "Create a post",
        "Buat postingan"
      ];
      const all = [...document.querySelectorAll("div[role='button'], span, div")];
      for (let el of all) {
        const txt = (el.innerText || el.getAttribute("aria-label") || "").trim();
        if (keywords.some(k => txt.toLowerCase().includes(k.toLowerCase()))) {
          return el.closest("div[role='button'], div[tabindex], button") || el;
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
    // 2. Cari textbox caption
    // =========================
    console.log("👉 Cari textbox caption...");
    const textboxHandle = await page.evaluateHandle(() => {
      const candidates = [
        "Write something",
        "Apa yang Anda pikirkan",
        "Tulis sesuatu",
        "Create a public post",
        "Buat postingan publik",
      ];
      const all = [...document.querySelectorAll("div[role='textbox']")];
      for (let el of all) {
        const label = el.getAttribute("aria-label") || "";
        if (candidates.some(c => label.toLowerCase().includes(c.toLowerCase()))) {
          return el;
        }
      }
      return all.length ? all[0] : null; // fallback
    });

    let textbox = textboxHandle ? textboxHandle.asElement() : null;
    if (textbox) {
      console.log("✅ Textbox ditemukan, isi caption...");
      await textbox.click();
      await page.type("div[role='textbox']", caption, { delay: 50 });
    } else {
      throw new Error("❌ Textbox tidak ditemukan");
    }

    // =========================
    // 3. Klik tombol Post
    // =========================
    console.log("👉 Klik tombol Post...");
    let posted = await clickButtonByText(page, ["Post", "Kirim", "Bagikan", "Bagikan sekarang", "OK"]);

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
          
