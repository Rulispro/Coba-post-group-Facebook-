const puppeteer = require("puppeteer");
const fs = require("fs");

// Fungsi klik aman
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

// Fungsi scan elemen verbose
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

(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://m.facebook.com/groups/5763845890292336/"; // versi mobile
    const caption = "Halo 👋 ini posting otomatis Puppeteer versi mobile!";

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

    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    // ===== 1️⃣ Klik composer / write something
    const composerSelectors = [
      'a[href*="composer"]',
      'div[role="button"]',
      'span[dir="auto"]',
      'div[placeholder*="write something"]',
      'div[aria-label*="write something"]',
      'div[aria-label*="what\'s on your mind"]',
      'div[aria-label*="create a post"]'
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

    // ===== 2️⃣ Isi caption (versi mobile, parent div[role="button"][tabindex="0"])
    const parentSelector = 'div[role="button"][tabindex="0"]';
    await page.waitForSelector(parentSelector);
    const parent = await page.$(parentSelector);

    const allChildren = await parent.$$('*');
    let textbox = null;

    for (const el of allChildren) {
      const isEditable = await el.evaluate(node => node.getAttribute('contenteditable') === 'true');
      const placeholder = await el.evaluate(node => node.getAttribute('placeholder') || '');
      const role = await el.evaluate(node => node.getAttribute('role') || '');
      const aria = await el.evaluate(node => node.getAttribute('aria-label') || '');

      if (
        isEditable ||
        placeholder.includes("Apa yang Anda pikirkan") ||
        (role === "button" && aria.toLowerCase().includes("write something")) ||
        (role === "button" && aria.toLowerCase().includes("create a public post"))
      ) {
        textbox = el;
        break;
      }
    }

    if (!textbox) {
      console.log('❌ Textbox / Caption tidak ditemukan, scan semua elemen');
      await scanAllElementsVerbose(page, "Textbox / Caption");
    } else {
      console.log('✅ Textbox ditemukan, klik dan isi teks');
      await textbox.click({ clickCount: 2 });
      await textbox.focus();
      await page.keyboard.type(caption, { delay: 50 });
      await page.waitForTimeout(1000);

      // ===== Klik tombol Post versi mobile
      const postButton = await page.$x(
        "//div[@role='button' and contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'kirim')]"
      );
      if (postButton.length > 0) {
        await safeClick(postButton[0]);
        console.log('✅ Post berhasil dikirim');
      } else {
        console.log('⚠️ Tombol Post tidak ditemukan, coba scan semua tombol');
        const postCandidates = await page.$$('button, div[role="button"], input[type="submit"], a');
        for (const el of postCandidates) await safeClick(el);
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
