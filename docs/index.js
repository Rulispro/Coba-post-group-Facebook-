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
    const caption = "🚀 Caption otomatis masuk dari Puppeteer!";

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

    // ===== 2️⃣ Isi caption (klik placeholder + isi textbox)
    const clickResult = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("div[role='button']")]
        .find(el => {
          const t = (el.innerText || "").toLowerCase();
          return t.includes("write something") || t.includes("buat postingan") || t.includes("tulis sesuatu");
        });

      if (!btn) return { ok: false, msg: "Placeholder 'Write something' tidak ditemukan" };

      ["mousedown", "mouseup", "click"].forEach(type => {
        btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      });

      return { ok: true, msg: "Klik placeholder berhasil" };
    });

    console.log("CLICK:", clickResult);

    await page.waitForTimeout(1000);

    const fillResult = await page.evaluate((text) => {
      const selectors = [
        "textarea[name='xc_message']",
        "textarea",
        "div[role='textbox'][contenteditable='true']",
        "div[contenteditable='true']"
      ];

      let tb = null;
      for (const s of selectors) {
        tb = document.querySelector(s);
        if (tb) {
          try {
            if ("value" in tb) {
              tb.focus();
              tb.value = text;
              tb.dispatchEvent(new Event("input", { bubbles: true }));
              tb.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
              tb.focus();
              tb.innerText = text;
              tb.dispatchEvent(new InputEvent("input", { bubbles: true }));
              tb.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return { ok: true, selector: s, msg: "Terisi" };
          } catch (err) {
            return { ok: false, selector: s, msg: "Error: " + err.message };
          }
        }
      }
      return { ok: false, msg: "Textbox tidak ditemukan" };
    }, caption);

    console.log("FILL:", fillResult);

    // ===== 3️⃣ Klik tombol POST
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
