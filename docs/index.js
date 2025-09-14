const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Helper
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
        name: el.getAttribute("name"),
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
    const groupUrl = "https://www.facebook.com/groups/5763845890292336/"; // ganti link grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer!";

    const browser = await puppeteer.launch({
      headless: false, // false supaya bisa lihat jalannya
      defaultViewport: { width: 1200, height: 900 },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const page = await browser.newPage();
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    await page.goto("https://www.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    console.log("🌐 Opening group:", groupUrl);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    // =========================
    // Klik composer / placeholder "Write something"
    let composerHandle = await page.$('div[aria-label*="Write something"], div[role="button"], span[dir="auto"]');
    if (composerHandle) {
      console.log("✅ Composer ditemukan, klik...");
      await safeClick(composerHandle);
      await page.waitForTimeout(2000);
    } else {
      console.log("❌ Composer tidak ditemukan, scan elements:");
      await scanAllElementsVerbose(page, "Composer");
    }

    // =========================
    // Isi caption
    let textboxHandle = await page.$('div[role="textbox"][contenteditable="true"], div[contenteditable="true"], textarea[name="xs"]');
    if (textboxHandle) {
      console.log("✅ Textbox / Caption ditemukan, isi caption...");
      await textboxHandle.focus();
      await page.keyboard.type(caption, { delay: 50 });
      await page.waitForTimeout(1000);
    } else {
      console.log("❌ Textbox tidak ditemukan, scan elements:");
      await scanAllElementsVerbose(page, "Textbox / Caption");
    }

    // =========================
    // Klik tombol post (fallback klik semua jika kata kunci tidak ketemu)
    const postCandidates = await page.$$('button, div[role="button"], input[type="submit"], a');
    let postClicked = false;
    for (const el of postCandidates) {
      const name = await page.evaluate(e => (e.innerText || e.getAttribute("aria-label") || "").trim(), el);
      if (["post", "kirim", "bagikan"].some(t => name.toLowerCase().includes(t))) {
        console.log("✅ Klik tombol:", name);
        await safeClick(el);
        postClicked = true;
        break;
      }
    }

    if (!postClicked) {
      console.log("⚠️ Kata kunci tombol post tidak ditemukan, coba klik semua tombol/div...");
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
