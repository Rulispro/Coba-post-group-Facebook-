// index.js
const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; // ganti ID grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer versi fallback log!";

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
    // 1. Composer
    // =========================
    console.log("👉 Cari tombol composer via page.evaluate ...");
    let composerClicked = await page.evaluate(() => {
      const texts = ["Write something", "Tulis sesuatu", "Create a post", "Buat postingan"];
      let target = null;
      const spans = Array.from(document.querySelectorAll("div[role='button'] span"));
      for (const s of spans) {
        const txt = (s.innerText || "").trim();
        if (texts.some(t => txt.toLowerCase().includes(t.toLowerCase()))) {
          target = s.closest("div[role='button']");
          break;
        }
      }
      if (target) {
        ["mousedown", "mouseup", "click"].forEach(type =>
          target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }))
        );
        return true;
      }
      return false;
    });

    if (!composerClicked) {
      console.log("❌ Composer via evaluate tidak ditemukan, coba pakai page.$x ...");
      const [btn] = await page.$x(
        "//div[@role='button']//span[contains(text(),'Write') or contains(text(),'Tulis') or contains(text(),'Buat')]"
      );
      if (btn) {
        await btn.click().catch(() => {});
        composerClicked = true;
      }
    }

    if (composerClicked) {
      console.log("✅ Composer berhasil diklik, tunggu 2 detik...");
      await page.waitForTimeout(2000);
    } else {
      console.log("❌ Composer button not found (skip ke caption)");
    }

    // =========================
    // 2. Textbox Caption
    // =========================
    console.log("👉 Cari textbox caption...");
    let textbox = await page.$("textarea");
    if (!textbox) {
      textbox = await page.$("div[aria-label*='What']") || null;
    }

    if (textbox) {
      console.log("✅ Textbox ketemu, isi caption...");
      await textbox.type(caption, { delay: 50 });
    } else {
      console.log("❌ Textbox caption tidak ditemukan");
    }

    // =========================
    // 3. Tombol Post
    // =========================
    console.log("👉 Cari tombol Post...");
    let postBtn = null;

    // coba evaluate
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, div[role='button'], input[type='submit']"));
      const target = btns.find(
        b =>
          (b.innerText || "").toLowerCase().includes("post") ||
          (b.innerText || "").toLowerCase().includes("kirim") ||
          (b.innerText || "").toLowerCase().includes("bagikan")
      );
      if (target) {
        ["mousedown", "mouseup", "click"].forEach(type =>
          target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }))
        );
        return true;
      }
      return false;
    });

    if (!clicked) {
      console.log("❌ Tombol Post via evaluate tidak ketemu, coba pakai XPath...");
      const [btn2] = await page.$x(
        "//div[@role='button']//span[text()='Post' or text()='Kirim' or text()='Bagikan sekarang']"
      );
      if (btn2) {
        await btn2.click().catch(() => {});
        postBtn = true;
      }
    } else {
      postBtn = true;
    }

    if (postBtn) {
      console.log("✅ Postingan dikirim!");
    } else {
      console.log("❌ Tombol Post gagal ditemukan");
    }

    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
