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
  await page.screenshot({ path: "after_upload.png", fullPage: true });
  console.log("✅ Media siap diposting.");


         
// ✅ Upload dan tunggu preview + auto-post
async function uploadMediaAndPost(page, filePath, fileName) {
  // 1️⃣ Klik tombol Photo/Video
  const addMediaBtn = await page.$('div[aria-label="Photo/Video"], div[aria-label="Photos"], div[aria-label="Video"]');
  if (addMediaBtn) {
    await addMediaBtn.click();
    console.log("📸 Tombol Photo/Video diklik.");
    await page.waitForTimeout(2000);
  }

  // 2️⃣ Cari input file
  const fileInput =
    (await page.$('input[type="file"][accept="image/*"]')) ||
    (await page.$('input[type="file"][accept*="video/*"]')) ||
    (await page.$('input[type="file"]'));

  if (!fileInput) {
    console.log("❌ Input file tidak ditemukan, upload gagal");
    return false;
  }

  // Upload file
  await fileInput.uploadFile(filePath);
  console.log("✅ File sudah diattach");

  // Trigger event supaya React sadar
  await page.evaluate((selector) => {
    const input = document.querySelector(selector);
   if (!input) return;
    ["input", "change"].forEach(evt =>
     input.dispatchEvent(new Event(evt, { bubbles: true }))
    );
  }, 'input[type="file"]');

  // 3️⃣ Tunggu preview
  const ext = path.extname(fileName).toLowerCase();
  let bufferTime = 10000; // default buffer foto



if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
 console.log("⏳ Tunggu foto upload sampai preview muncul...");
 try {
    await page.waitForSelector(
     'img[src*="scontent"],img[src*="safe_image"], div[data-mcomponent="ImageArea"] img',
     { timeout: 60000 }
   );
    console.log("✅ Foto preview muncul.");
  } catch (e) {
    console.log("❌ Gagal deteksi foto, fallback cek ImageArea...");
    const previewImg = await page.$('div[data-mcomponent="ImageArea"] img');
    if (previewImg) {
      console.log("✅ Foto preview ditemukan lewat fallback.");
    } else {
      throw new Error("Foto tidak muncul sama sekali!");
    }
  }

} else if ([".mp4", ".mov", ".webm"].includes(ext)) {
  console.log("⏳ Tunggu video upload sampai preview muncul...");
  try {
    await page.waitForSelector(
     'div[data-mcomponent="VideoArea"], div[data-mcomponent="ImageArea"] img',
      { timeout: 120000 }
    );
    console.log("✅ Video preview muncul.");
    bufferTime = 15000; // kasih jeda lebih lama
  } catch (e) {
    console.log("❌ Gagal deteksi video, fallback cek VideoArea + ikon X...");
    const previewVid = await page.$('div[data-mcomponent="VideoArea"]');
    if (previewVid) 
      console.log("✅ Video preview ditemukan lewat fallback.");
   } else {
     throw new Error("Video tidak muncul sama sekali!");
   }
 }

} else {
 console.log("⚠️ Ekstensi file tidak dikenali:", ext);
}


// Debug: pastikan file ada

if (fs.existsSync(screenshotPath)) {
  console.log("✅ Screenshot ada di folder media");
} else {
  console.log("❌ Screenshot TIDAK ADA di folder media");
}

const screenshotPath = path.join(__dirname, "media", "after_upload.png");
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`📸 Screenshot preview media tersimpan: ${screenshotPath}`);

  // 4️⃣ Tambahkan buffer ekstra sebelum klik POST
  console.log(`⏳ Tunggu buffer ${bufferTime / 1000}s sebelum klik POST...`);
  await page.waitForTimeout(bufferTime);
 // 4️⃣ Debug screenshot
 // await page.screenshot({ path: "after_upload.png", fullPage: true });
 // console.log("✅ Media siap diposting.");

// Tunggu tombol muncul
   await page.evaluate(() => {
  const btn = [...document.querySelectorAll('div[role="button"]')]
    .find(div => div.querySelector('span.f2')?.innerText === 'POST');
  if (!btn) return console.log("❌ Tombol POST tidak ditemukan");
  ["mousedown","mouseup","click","touchstart","touchend"].forEach(evt => btn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true })));
});
   

await page.evaluate(() => {
  const btn = [...document.querySelectorAll('div[role="button"]')]
    .find(div => div.querySelector('span.f2')?.innerText === 'POST');
  if (!btn) return console.log("❌ Tombol POST tidak ditemukan");

  const dispatchTouch = (el, type) => {
    el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, view: window }));
  };

  // Dispatch semua event yang mungkin ditangkap React
  ["mousedown", "mouseup", "click", "touchstart", "touchend", "pointerdown", "pointerup"].forEach(evt => {
    if (evt.startsWith("touch")) {
      dispatchTouch(btn, evt);
    } else {
      btn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
    }
  });
});
  // 7️⃣ Optional: upload screenshot ke artifact GitHub
  if (process.env.GITHUB_ACTIONS) {
    console.log(`📤 Screenshot siap di-upload ke artifact (gunakan actions/upload-artifact di workflow)`);
  }

  return true;
}

module.exports = { uploadMediaAndPost };
                                          
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

  
await uploadMediaAndPost(page, filePath, fileName);
   


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
   


    

    // ===== Stop recorder
    await recorder.stop();
    console.log("🎬 Rekaman selesai: recording.mp4");

    await browser.close();
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
