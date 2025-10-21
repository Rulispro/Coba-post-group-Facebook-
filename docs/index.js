"use strict";
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // === Samakan environment dengan browser Android / Kiwi ===
  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/95.0.4638.74 Mobile Safari/537.36"
  );

  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  });

  // === Load cookies login Facebook ===
  const cookies = require("./cookies.json");
  await page.setCookie(...cookies);

  // === Buka Facebook mobile ===
  await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
  console.log("✅ Berhasil buka Facebook (mobile)");

  // === Masuk ke grup target ===
  await page.goto("https://m.facebook.com/groups/514277487342192/", {
    waitUntil: "networkidle2",
  });

  const max = 10; // jumlah Like maksimal
  const delayMs = 3000;
  let clicked = 0;

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  while (clicked < max) {
    console.log(`\n🔎 Mencari tombol Like ke-${clicked + 1}...`);

    // Jalankan script di dalam halaman (browser context)
    const result = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
      const el = buttons.find(
        (btn) =>
          btn.innerText?.toLowerCase().includes("suka") ||
          btn.innerText?.toLowerCase().includes("like")
      );

      if (!el) return "❌ Tidak ditemukan tombol Like.";

      // Kasih border biar kelihatan (opsional)
      el.style.outline = "2px solid red";

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      function trigger(el, type, props = {}) {
        const ev = new Event(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        Object.assign(ev, props);
        el.dispatchEvent(ev);
      }

      trigger(el, "pointerover", { pointerType: "touch" });
      trigger(el, "pointerdown", {
        pointerType: "touch",
        clientX: cx,
        clientY: cy,
      });
      trigger(el, "touchstart", { touches: [{ clientX: cx, clientY: cy }] });

      setTimeout(() => {
        trigger(el, "pointerup", {
          pointerType: "touch",
          clientX: cx,
          clientY: cy,
        });
        trigger(el, "touchend", {
          changedTouches: [{ clientX: cx, clientY: cy }],
        });
        trigger(el, "click", { clientX: cx, clientY: cy });
      }, 120);

      return "👍 Klik Like berhasil via innerText!";
    });

    console.log(result);
    clicked++;

    // Scroll sedikit biar postingan baru muncul
    await page.evaluate(() => window.scrollBy(0, 600));
    await delay(delayMs);
  }

  console.log(`🎉 Selesai! ${clicked} tombol Like sudah diklik.`);
  await browser.close();
})();
