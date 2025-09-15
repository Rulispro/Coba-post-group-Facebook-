"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// Aktifkan plugin stealth
puppeteer.use(StealthPlugin());

// ===== Fungsi klik aman
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

// ===== Fungsi scan elemen verbose
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

// ===== Main Puppeteer
(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://m.facebook.com/groups/5763845890292336/";
    const caption = "Halo 👋 ini posting otomatis Puppeteer versi mobile!";

    const browser = await puppeteer.launch({
      headless: "new",
      defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
    });

    const page = await browser.newPage();

    // ===== Mulai rekaman
    const recorder = new PuppeteerScreenRecorder(page);
    await recorder.start('recording.mp4');

    // ===== Anti-detect: spoof user-agent & browser properties
    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"
    );
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, "languages", { get: () => ["id-ID", "id"] });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    });

    // ===== Pasang cookies
    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    // ===== Buka grup
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
        await page.waitForTimeout(2000); // tunggu launcherbox muncul
        break;
      }
    }
    if (!composerClicked) {
      console.log("❌ Composer tidak ditemukan, scan semua elemen");
      await scanAllElementsVerbose(page, "Composer");
    }

    // ===== 2️⃣ Klik launcherbox
    const launcherbox = await page.$('div[role="button"][tabindex="0"][aria-label*="create a post"], a[href*="composer"]');
    if (launcherbox) {
      console.log("✅ Launcherbox ditemukan");
      await safeClick(launcherbox);
      await page.waitForTimeout(1500);
    } else {
      console.log("❌ Launcherbox tidak ditemukan");
    }

    // ===== 3️⃣ Isi caption
    const textbox = await page.$('div[contenteditable="true"]');
    if (textbox) {
      console.log("✅ Textbox aktif ditemukan");
      await textbox.focus();
      await page.keyboard.type(caption, { delay: 50 });
      await page.waitForTimeout(2000);
    } else {
      console.log("❌ Textbox aktif tidak ditemukan, scan elemen");
      await scanAllElementsVerbose(page, "Textbox setelah klik launcherbox");
    }

    // ===== 4️⃣ Klik tombol POST
    const postButton = await page.$('div[role="button"] span.f2');
    if (postButton) {
      console.log("✅ Tombol POST ditemukan");
      await postButton.click();
      console.log("🎉 Post berhasil dikirim");
    } else {
      console.log("❌ Tombol POST tidak ditemukan");
      await scanAllElementsVerbose(page, "Tombol POST");
    }

    // ===== Debug: cek webdriver
    const webdriver = await page.evaluate(() => navigator.webdriver);
    console.log("navigator.webdriver:", webdriver);

    // ===== Stop recorder
    await recorder.stop();
    console.log("🎬 Rekaman selesai: recording.mp4");

    await browser.close();
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
