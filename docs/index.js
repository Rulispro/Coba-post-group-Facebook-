const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/";
    const caption = "Halo 👋 ini posting otomatis Puppeteer!";

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
    await page.waitForTimeout(4000);

    // =========================
    // 1. Klik composer
    // =========================
    let composer = null;
    try {
      console.log("🔍 Mencari composer dengan XPath...");
      composer = await page.waitForXPath("//span[contains(text(),'Write something')]", { timeout: 5000 });
      console.log("✅ Composer ditemukan via XPath");
    } catch (e) {
      console.log("❌ Composer XPath gagal:", e.message);
      // fallback
      try {
        console.log("🔍 Mencari composer via evaluateHandle fallback...");
        composer = await page.evaluateHandle(() => {
          const texts = ["Write something", "Tulis sesuatu", "Apa yang Anda pikirkan", "Create a post", "Buat postingan"];
          const els = [...document.querySelectorAll("div[role='button'], div[role='textbox'], span")];
          for (let el of els) {
            const txt = el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
            if (texts.some(t => txt.toLowerCase().includes(t.toLowerCase()))) return el;
          }
          return null;
        });
        composer = composer.asElement();
        if (composer) console.log("✅ Composer ditemukan via fallback");
        else console.log("❌ Composer fallback gagal, lanjut ke caption");
      } catch (err) {
        console.log("⚠️ Error fallback composer:", err.message);
      }
    }

    if (composer) {
      try {
        await composer.click({ delay: 50 });
        console.log("✅ Composer diklik");
        await page.waitForTimeout(2000);
      } catch (err) {
        console.log("⚠️ Gagal klik composer:", err.message);
      }
    }

    // =========================
    // 2. Klik textbox caption
    // =========================
    let textbox = null;
    try {
      console.log("🔍 Mencari textbox via selector...");
      textbox = await page.waitForSelector("div[role='textbox'], div[role='button'][aria-label*='create a post']", { timeout: 5000 });
      console.log("✅ Textbox ditemukan via selector");
    } catch (e) {
      console.log("❌ Textbox selector gagal:", e.message);
      // fallback
      try {
        console.log("🔍 Mencari textbox via evaluateHandle fallback...");
        textbox = await page.evaluateHandle(() => {
          const texts = ["Write something", "Tulis sesuatu", "Buat postingan publik","Create a public post"];
          const els = [...document.querySelectorAll("div[role='textbox'], div[role='button']")];
          for (let el of els) {
            const txt = el.innerText || el.getAttribute("aria-label") || "";
            if (texts.some(t => txt.toLowerCase().includes(t.toLowerCase()))) return el;
          }
          return null;
        });
        textbox = textbox.asElement();
        if (textbox) console.log("✅ Textbox ditemukan via fallback");
        else console.log("❌ Textbox fallback gagal, lanjut ke tombol post");
      } catch (err) {
        console.log("⚠️ Error fallback textbox:", err.message);
      }
    }

    if (textbox) {
      try {
        await textbox.click({ delay: 50 });
        await page.waitForTimeout(500);
        await page.keyboard.type(caption, { delay: 50 });
        console.log("✅ Caption berhasil diisi");
      } catch (err) {
        console.log("⚠️ Gagal isi caption:", err.message);
      }
    }

    // =========================
    // 3. Klik tombol Post
    // =========================
    let postBtn = null;
    try {
      console.log("🔍 Mencari tombol Post via XPath...");
      postBtn = await page.waitForXPath("//span[contains(text(),'Post') or contains(text(),'Bagikan')]", { timeout: 5000 });
      console.log("✅ Tombol Post ditemukan via XPath");
    } catch (e) {
      console.log("❌ Post XPath gagal:", e.message);
      try {
        console.log("🔍 Mencari tombol Post via evaluateHandle fallback...");
        postBtn = await page.evaluateHandle(() => {
          const texts = ["Post", "Kirim", "Bagikan", "Bagikan sekarang", "OK"];
          const els = [...document.querySelectorAll("button, div[role='button'], input[type='submit']")];
          for (let el of els) {
            const txt = el.innerText || el.getAttribute("aria-label") || "";
            if (texts.some(t => txt.toLowerCase().includes(t.toLowerCase()))) return el;
          }
          return null;
        });
        postBtn = postBtn.asElement();
        if (postBtn) console.log("✅ Tombol Post ditemukan via fallback");
        else console.log("❌ Tombol Post fallback gagal");
      } catch (err) {
        console.log("⚠️ Error fallback postBtn:", err.message);
      }
    }

    if (postBtn) {
      try {
        await postBtn.click({ delay: 50 });
        console.log("✅ Tombol Post diklik");
      } catch (err) {
        console.log("⚠️ Gagal klik tombol Post:", err.message);
      }
    }

    await page.waitForTimeout(5000);
    await browser.close();
    console.log("✅ Selesai!");
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
