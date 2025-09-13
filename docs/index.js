// index.js
const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  try {
    console.log("🚀 Start bot...");

    // =========================
    // 1. Load Cookies
    // =========================
    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://facebook.com/groups/512223333438818/"; // ganti ID grup
    const caption = "Halo 👋 ini posting otomatis Puppeteer versi mobile!";

    console.log("✅ Cookies loaded");

    // =========================
    // 2. Launch Browser
    // =========================
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 412,
        height: 915,
        isMobile: true,
        hasTouch: true,
      },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    page.on("console", (msg) => {
      console.log("BROWSER LOG:", msg.text());
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
    );

    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    console.log("🌐 Opening m.facebook.com ...");
    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    console.log("🌐 Opening group:", groupUrl);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    // =========================
    // 3. Klik Composer
    // =========================
    console.log("👉 Cari tombol composer via page.evaluate ...");
    const composerClicked = await page.evaluate(() => {
      const texts = ["Write something", "Tulis sesuatu", "Create a post", "Buat postingan"];
      let target = null;

      const spans = Array.from(document.querySelectorAll("div[role='button'] span"));
      for (const s of spans) {
        const txt = (s.innerText || "").trim();
        if (texts.some((t) => txt.toLowerCase().includes(t.toLowerCase()))) {
          target = s.closest("div[role='button']");
          break;
        }
      }

      if (target) {
        ["mousedown", "mouseup", "click", "touchstart", "touchend"].forEach((type) => {
          target.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
          );
        });
        return true;
      }
      return false;
    });

    if (!composerClicked) throw new Error("❌ Composer button not found");
    console.log("✅ Composer diklik, tunggu 2 detik...");
    await page.waitForTimeout(2000);

    // =========================
    // 4. Isi Caption
    // =========================
    console.log("👉 Cari textbox caption...");
    let textbox = await page.$("div[aria-label*='What'][data-mcomponent='TextArea']");
    if (!textbox) textbox = await page.$("textarea[name='xs message']");
    if (!textbox) textbox = await page.$("textarea");
    if (!textbox) {
      // fallback evaluasi
      const ok = await page.evaluate((text) => {
        const box = document.querySelector("textarea");
        if (box) {
          box.value = text;
          box.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        return false;
      }, caption);
      if (!ok) throw new Error("❌ Textbox caption tidak ditemukan");
    } else {
      console.log("✅ Textbox ketemu, isi caption...");
      await textbox.type(caption, { delay: 50 });
    }

    console.log("✅ Caption berhasil diisi");
    await page.waitForTimeout(1500);

    // =========================
    // 5. Klik Tombol Post
    // =========================
    console.log("👉 Cari tombol Post...");
    let postBtn = await page.$x(
      "//div[@role='button']//span[text()='Post' or text()='Kirim' or text()='Bagikan sekarang' or text()='OK']"
    );

    if (postBtn.length > 0) {
      await postBtn[0].click();
      console.log("✅ Postingan terkirim (via XPath)!");
    } else {
      console.log("⚠️ Tombol Post tidak ketemu via XPath, coba evaluate...");
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, div[role='button'] span"));
        const target = btns.find((b) => {
          const txt = (b.innerText || "").toLowerCase();
          return txt.includes("post") || txt.includes("kirim") || txt.includes("bagikan");
        });
        if (target) {
          const clickable = target.closest("button, div[role='button']") || target;
          ["mousedown", "mouseup", "click", "touchstart", "touchend"].forEach((type) => {
            clickable.dispatchEvent(
              new MouseEvent(type, { bubbles: true, cancelable: true, view: window })
            );
          });
          return true;
        }
        return false;
      });
      if (!clicked) throw new Error("❌ Tombol Post tidak ditemukan");
      console.log("✅ Postingan terkirim (via evaluate)!");
    }

    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
