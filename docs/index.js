"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

// Aktifkan plugin stealth
puppeteer.use(StealthPlugin());

// ===== Fungsi klik aman (element langsung)
async function safeClickEl(el) {
  if (!el) return false;
  try {
    await el.click();
    return true;
  } catch (e) {
    console.log("⚠️ Gagal klik element:", e.message);
    return false;
  }
}

// ===== Fungsi klik by XPath
async function safeClickXpath(page, xpath, desc = "elemen") {
  try {
    const el = await page.waitForXPath(xpath, { visible: true, timeout: 8000 });
    await el.click();
    console.log(`✅ Klik ${desc}`);
    return true;
  } catch (e) {
    console.log(`❌ Gagal klik ${desc}:`, e.message);
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
    await recorder.start("recording.mp4");

    // ===== Anti-detect
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
    let writeClicked = await safeClickXpath(page, "//*[contains(text(),'Write something')]", "Composer");

    if (!writeClicked) {
      console.log("⚠️ XPath gagal, coba fallback evaluateHandle");

      const fallback = await page.evaluateHandle(() => {
        const els = Array.from(document.querySelectorAll("div, span, p"));
        return els.find(el => {
          if (!el.innerText) return false;
          if (!el.innerText.includes("Write something")) return false;
          const childHas = Array.from(el.children)
            .some(c => c.innerText && c.innerText.includes("Write something"));
          return !childHas;
        }) || null;
      });

      if (fallback) {
        await fallback.asElement().click();
        console.log("🟦 Klik composer via fallback berhasil");
      } else {
        console.log("❌ Composer tidak ditemukan sama sekali");
        await scanAllElementsVerbose(page, "Composer");
      }
    }
    await page.waitForTimeout(2000);

    // ===== 2️⃣ Klik launcherbox (opsional, kadang langsung muncul textbox)
    const launcherbox = await page.$(
      'div[role="button"][tabindex="0"][aria-label*="create a post"]'
    );
    if (launcherbox) {
      console.log("✅ Launcherbox ditemukan");
      await safeClickEl(launcherbox);
      await page.waitForTimeout(1500);
    } else {
      console.log("ℹ️ Launcherbox tidak ada (mungkin langsung textbox)");
    }

     // ===== 3️⃣ Isi caption
    //const textbox = await page.$('div[contenteditable="true"]');
    //if (textbox) {
    //  console.log("✅ Textbox aktif ditemukan");
    //  await textbox.focus();
   //   await page.keyboard.type(caption, { delay: 50 });
   //   await page.waitForTimeout(2000);
  //  } else {
    //  console.log("❌ Textbox aktif tidak ditemukan, scan elemen");
     //   await scanAllElementsVerbose(page, "Textbox setelah klik launcherbox");
  //  }
     
     
      // ===== 3️⃣ Isi caption dengan cara aman
await page.waitForSelector('div[contenteditable="true"]', { visible: true });

await page.evaluate((text) => {
  const box = document.querySelector('div[contenteditable="true"]');
  if (box) {
    box.focus();

    // Kosongkan dulu
    box.innerHTML = "";

    // Masukkan teks
    box.innerHTML = text;

    // Trigger event biar Facebook anggap input valid
    const ev = new InputEvent("input", { bubbles: true });
    box.dispatchEvent(ev);
  }
}, caption);

console.log("✍️ Caption berhasil diisi via DOM API");
                              
    

    // ===== 4️⃣ Klik tombol POST
    let posted = false;

    const postButton = await page.$x("//span[text()='Post' or text()='Kirim']");
    if (postButton.length) {
      posted = await safeClickEl(postButton[0]);
    } else {
      console.log("❌ Tombol POST tidak ditemukan, coba scan");
      await scanAllElementsVerbose(page, "Tombol POST");
    }

    if (posted) {
      console.log("🎉 Status berhasil dikirim!");
    } else {
      console.log("⚠️ Status gagal diposting");
    }

    await page.waitForTimeout(5000);

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
