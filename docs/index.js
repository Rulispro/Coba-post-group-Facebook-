const puppeteer = require("puppeteer");
const fs = require("fs");

// =========================
// Fungsi helper
// =========================

// Safe klik / tap (mobile/desktop)
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
    const els = [...document.querySelectorAll("button, div[role='button'], input[type='submit'], a")];
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
// Scan & log semua elemen penting
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


// =========================
// Main
// =========================
(async () => {
  try {
    console.log("🚀 Start bot...");

    const cookies = JSON.parse(fs.readFileSync(__dirname + "/cookies.json", "utf8"));
    const groupUrl = "https://m.facebook.com/groups/5763845890292336//"; // ganti ID grup
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

    await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    console.log("🌐 Opening group:", groupUrl);
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);

    
    // =====// =========================
// 0️⃣ Skip banner "Use Facebook App"
// =========================
console.log("🔹 Cek banner 'Use App'...");
const bannerSelector = 'a[href*="use_store_link"], div.amcn';
const banner = await page.$(bannerSelector);

if (banner) {
  console.log("✅ Banner ditemukan, klik untuk skip...");
  try {
    await banner.evaluate(el => el.click());
    await page.waitForTimeout(1500); // tunggu hilang
  } catch (e) {
    console.log("⚠️ Gagal klik banner:", e.message);
  }
} else {
  console.log("ℹ️ Banner tidak muncul");
}
//===================
    // =========================
// Composer detect & click
const composerHandle = await page.$('a[href*="composer"], div[role="button"], span[dir="auto"]');
if (composerHandle) {
  console.log("✅ Composer ditemukan, klik/tap...");
  await safeClick(composerHandle);
  await page.waitForTimeout(2000);
} else {
  console.log("❌ Composer tidak ditemukan, scan semua elemen:");
  await scanAllElementsVerbose(page, "Composer");
}

    // =========================
// Textbox detect & click/tap
const textboxHandle = await page.$('div[role="textbox"], div[contenteditable="true"], span[dir="auto"]');
if (textboxHandle) {
  console.log("✅ Textbox ditemukan, klik/tap...");
  await safeClick(textboxHandle);
  await page.waitForTimeout(1000);
} else {
  console.log("❌ Textbox tidak ditemukan, scan semua elemen:");
  await scanAllElementsVerbose(page, "Textbox / Caption");
}
    

// 1. Scan & klik composer
// =========================
//await scanElements(page, "Composer sebelum klik");

//const composerHandle = await page.$('a[href*="composer"], span[dir="auto"]');
//let composer = composerHandle ? composerHandle.asElement() : null;
//if (composer) {
 // console.log("✅ Composer ditemukan, klik...");
  //await safeClick(composer);
  //await page.waitForTimeout(3000);
//} else {
 // console.log("❌ Composer tidak ditemukan");
//}

    // =========================
    // 2. Scan & isi textbox caption
    // =========================
    //await scanElements(page, "Textbox / Caption");

   // const textboxHandle = await page.evaluateHandle(() => {
      //const all = [...document.querySelectorAll("div[role='textbox'], textarea")];
      //return all.length ? all[0] : null;
    //});

    //let textbox = textboxHandle ? textboxHandle.asElement() : null;
    //if (textbox) {
     // console.log("✅ Textbox ditemukan, isi caption...");
     // await safeClick(textbox);
      //await page.type("div[role='textbox'], textarea", "Halo 👋 ini posting otomatis Puppeteer!", { delay: 50 });
      //await page.waitForTimeout(1000);
   // } else {
  //    throw new Error("❌ Textbox tidak ditemukan");
    //}

    // =========================
    // 3. Scan & klik tombol Post
    // =========================
    // =========================
// 3️⃣ Scan & klik tombol Post dengan debug log
// =========================
const postCandidates = await page.$$('button, div[role="button"], input[type="submit"], a');

let postClicked = false;

for (const el of postCandidates) {
  const name = await page.evaluate(e => (e.innerText || e.getAttribute("aria-label") || "").trim(), el);
  
  console.log("🔹 Tombol ditemukan:", name); // debug log nama tombol
  
  if (["post", "kirim", "bagikan"].some(t => name.toLowerCase().includes(t))) {
    console.log("✅ Klik tombol:", name);
    await safeClick(el);
    postClicked = true;
    break;
  }
}

if (!postClicked) {
  console.log("❌ Tombol Post tidak ketemu");
}

   
    await page.waitForTimeout(5000);
    await browser.close();
  } catch (err) {
    console.error("❌ Gagal posting:", err);
    process.exit(1);
  }
})();
