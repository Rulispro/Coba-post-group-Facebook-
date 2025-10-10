"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

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

// ===== Fungsi download media dari GitHub Release
const mediaFolder = path.join(__dirname, "media");
if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);

async function downloadMedia(url, filename) {
  const filePath = path.join(mediaFolder, filename);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
   https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(filePath)); // ✅ sekarang return path
      });
    }).on("error", (err) => reject(err));
  });
}


  // 4️⃣ Debug screenshot
//  await page.screenshot({ path: "after_upload.png", fullPage: true });
//  console.log("✅ Media siap diposting.");

  
//async function uploadMedia(page, filePath, fileName, type = "Photos") {
//  console.log(`🚀 Mulai upload ${type}: ${fileName}`);

// 1️⃣ Klik tombol Photo/Video di composer
//  const btn = await page.evaluateHandle(() => {
  //  return [...document.querySelectorAll('div[role="button"]')]
      //.find(div => {
       // const txt = (div.innerText || "").toLowerCase();
     //   const aria = (div.getAttribute("aria-label") || "").toLowerCase();
     //   return txt.includes("Photos") || txt.includes("Video") || aria.includes("photo") || aria.includes("video") || txt.includes("foto");
    //  });
//  });
///
 // if (btn) {
  //  await btn.asElement().click();
 //   console.log("✅ Tombol Photo/Video diklik");
//  } else {
  //  console.log("❌ Tombol Photo/Video tidak ditemukan");
//    return false;
//  }
//
    
  // 2️⃣ Cari input file
//  const fileInput =
  //  (await page.$('input[type="file"][accept="image/*"]')) ||
  //  (await page.$('input[type="file"][accept*="video/*"]')) ||
 //   (await page.$('input[type="file"]'));

 // if (!fileInput) {
  //  console.log("❌ Input file tidak ditemukan, upload gagal");
  //  return false;
//  }
 
  //upload file 
   // await fileInput.uploadFile(filePath);
//  console.log("✅ File sudah diattach:", filePath);

  // Trigger React
 // await page.evaluate(() => {
 //   const input = document.querySelector('input[type="file"]');
 //   if (input) {
  //    ["input", "change"].forEach(evt =>
  //      input.dispatchEvent(new Event(evt, { bubbles: true }))
  //    );
  //  }
//  });

// 3️⃣ Tunggu preview media (foto/video)
//let previewOk = false;
//let bufferTime = 10000;

//try {
 // const ext = path.extname(fileName).toLowerCase();

 // if ([".jpg", ".jpeg", ".png"].includes(ext)) {
   // console.log("⏳ Tunggu foto preview...");

  //  await page.waitForSelector(
   //   [
    //    'div[data-mcomponent="ImageArea"] img[src^="data:image"]', // base64 inline
    //    'img[src*="scontent"]',                                    // foto dari CDN
    //    'div[aria-label="Photo preview"] img',                     // fallback
   //   ].join(", "),
   //   { timeout: 60000 }
 //   );

  //  console.log("✅ Foto preview ready");
 //   previewOk = true;

//  } else if ([".mp4", ".mov"].includes(ext)) {
  //  console.log("⏳ Tunggu video preview...");

  //  await page.waitForSelector(
   //   [
    //    'div[data-mcomponent="VideoArea"] video',   // wrapper video
    //    'video[src]',                               // video element
    //    'div[aria-label="Video preview"]',          // fallback
   //   ].join(", "),
 //     { timeout: 120000 }
 //   );

  //  console.log("✅ Video preview ready");
 //   bufferTime = 15000;
//    previewOk = true;
//  }

//} catch (e) {
//  console.log("⚠️ Preview tidak muncul dalam batas waktu, paksa lanjut...");
//}

async function uploadMedia(page, filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const isVideo = [".mp4", ".mov", ".avi"].includes(ext);
  const type = isVideo ? "Video" : "Photos";
  console.log(`🚀 Mulai upload ${type}: ${fileName}`);

  // 1️⃣ Klik tombol Photos atau Video
  const clicked = await page.evaluate((label) => {
    const btn = [...document.querySelectorAll("div[role='button']")]
      .find(div => {
        const txt = (div.innerText || "").toLowerCase();
        const aria = (div.getAttribute("aria-label") || "").toLowerCase();
        return txt.includes(label.toLowerCase()) || aria.includes(label.toLowerCase()) || txt.includes("foto");
      });

    if (!btn) return false;

    // Simulasikan semua event React
    ["pointerdown", "mousedown", "mouseup", "click"].forEach(evt => {
      btn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
    });

    return true;
  }, type);

  if (!clicked) {
    console.log(`❌ Tombol ${type} tidak ditemukan`);
    return false;
  }
  console.log(`✅ Tombol ${type} berhasil diklik`);
  await page.waitForTimeout(3000);

  // 2️⃣ Cari input file yang sesuai
  const selector = isVideo
    ? 'input[type="file"][accept*="video"], input[type="file"][accept="video/*"]'
    : 'input[type="file"][accept*="image"], input[type="file"][accept="image/*"]';

  const fileInput = await page.$(selector);
  if (!fileInput) {
    console.log("❌ Input file tidak ditemukan, upload gagal");
    return false;
  }

  // 3️⃣ Upload file ke input
  await fileInput.uploadFile(filePath);
  console.log(`✅ File sudah diattach: ${filePath}`);

  // 4️⃣ Trigger React agar Facebook tahu file sudah diinput
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(input => {
      ["input", "change"].forEach(evt =>
        input.dispatchEvent(new Event(evt, { bubbles: true }))
      );
    });
  });
  console.log("⚡ Event React 'input' & 'change' dikirim");

  // 5️⃣ Tunggu preview media muncul (foto/video)
  let previewOk = false;
  let bufferTime = 10000;

  try {
    if (!isVideo) {
      console.log("⏳ Tunggu foto preview...");
      await page.waitForSelector(
        [
          'div[data-mcomponent="ImageArea"] img[src^="data:image"]', // base64 inline
          'img[src*="scontent"]',                                    // foto dari CDN
          'div[aria-label="Photo preview"] img'                      // fallback
        ].join(", "),
        { timeout: 60000 }
      );
      console.log("✅ Foto preview ready");
      previewOk = true;

    } else {
      console.log("⏳ Tunggu video preview...");
      await page.waitForSelector(
        [
          'div[data-mcomponent="VideoArea"] video',   // wrapper video
          'video[src]',                               // direct video
          'div[aria-label="Video preview"]'           // fallback
        ].join(", "),
        { timeout: 120000 }
      );
      console.log("✅ Video preview ready");
      previewOk = true;
      bufferTime = 15000;
    }
  } catch (e) {
    console.log("⚠️ Preview tidak muncul dalam batas waktu, lanjut paksa...");
  }

  // 6️⃣ Tambahkan buffer sebelum klik tombol POST
  console.log(`⏳ Tunggu buffer ${bufferTime / 1000}s sebelum klik POST...`);
  await page.waitForTimeout(bufferTime);

  return previewOk;
}

//module.exports = { uploadMedia };


  // 4️⃣ Screenshot
  const screenshotPath = path.join(__dirname, "media", "after_upload.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot preview media tersimpan: ${screenshotPath}`);

  if (fs.existsSync(screenshotPath)) {
    console.log("✅ Screenshot ada di folder media");
  } else {
    console.log("❌ Screenshot TIDAK ADA di folder media");
  }

  // Buffer ekstra
  //console.log(`⏳ Tunggu buffer ${bufferTime / 1000}s sebelum klik POST...`);
 // await page.waitForTimeout(bufferTime);

 // console.log("✅ Upload selesai");
 // return true;
//}


    

// ✅ Export fungsi yang benar
module.exports = { uploadMedia };


  // 7️⃣ Optional: upload screenshot ke artifact GitHub
  if (process.env.GITHUB_ACTIONS) {
    console.log(`📤 Screenshot siap di-upload ke artifact (gunakan actions/upload-artifact di workflow)`);
  }
                                          
// ===== Ambil tanggal hari ini
function getTodayString() {
  const today = new Date();
 const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
// 🕒 Fungsi delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      console.log("⚠️ Composer tidak ditemukan, fallback scan");
      await scanAllElementsVerbose(page, "Composer");
    }
    await page.waitForTimeout(2000);
   // 1️⃣ Klik placeholder composer
const clickResult = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("div[role='button']")]
    .find(el => {
      const t = (el.innerText || "").toLowerCase();
      return t.includes("write something") || t.includes("buat postingan") || t.includes("tulis sesuatu");
    });
  if (!btn) return { ok: false, msg: "Placeholder tidak ditemukan" };
  ["mousedown", "mouseup", "click"].forEach(type => {
    btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  });
  return { ok: true, msg: "Klik placeholder berhasil" };
});
console.log("CLICK:", clickResult);
await page.waitForTimeout(1000);

// 2️⃣ Isi caption
const fillResult = await page.evaluate((text) => {
  const selectors = [
    "textarea[name='xc_message']",
    "textarea",
    "div[role='textbox'][contenteditable='true']",
    "div[contenteditable='true']"
  ];

  for (const s of selectors) {
    const tb = document.querySelector(s);
    if (tb) {
      tb.focus();
      if ("value" in tb) {
        tb.value = text;
        tb.dispatchEvent(new Event("input", { bubbles: true }));
        tb.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        tb.innerText = text;
        tb.dispatchEvent(new InputEvent("input", { bubbles: true }));
        tb.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return { ok: true, selector: s, msg: "Caption berhasil diisi" };
    }
  }
  return { ok: false, msg: "Textbox tidak ditemukan" };
}, caption);

console.log("FILL:", fillResult);
   await delay(3000); // kasih waktu 3 detik minimal


  // ===== 3️⃣ Download + upload media
 const today = process.env.DATE;
 const fileName = `akun1_${today}.png`; // bisa .mp4
const mediaUrl ="https://github.com/Rulispro/Coba-post-group-Facebook-/releases/download/V1.0/Screenshot_20250909-071607.png";

// download media → simpan return value ke filePat
  const filePath = await downloadMedia(mediaUrl, fileName);
console.log(`✅ Media ${fileName} berhasil di-download.`);

// upload ke Facebook

  
await uploadMedia(page, filePath, fileName, "Photos");
   


  // Delay berdasarkan jenis
//  if (fileName.endsWith(".mp4") || fileName.endsWith(".mov")) {
 //   console.log("⏳ Tunggu minimal 10 detik untuk video processing...");
  //  await new Promise(r => setTimeout(r, 10000));
//  } else {
 //   console.log("⏳ Tunggu 5 detik untuk foto processing...");
 //   await new Promise(r => setTimeout(r, 5000));
//  }

 // console.log("✅ Media siap diposting.");
//}
   

    // ===== 3️⃣ Klik tombol POST
    // Tunggu tombol muncul
   
// Cari tombol POST dengan innerText
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('div[role="button"]')];
  const postBtn = buttons.find(b => b.innerText.trim().toUpperCase() === "POST");
  if (postBtn) {
    postBtn.click();
  }
});
console.log("✅ Klik POST berhasil (via innerText)");

    // ===== Stop recorder
    await recorder.stop();
    console.log("🎬 Rekaman selesai: recording.mp4");

    await browser.close();
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
