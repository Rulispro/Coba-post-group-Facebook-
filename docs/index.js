"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

puppeteer.use(StealthPlugin());

//--FUNGSI RUN ACCOUNT--//

async function runAccount(page, acc) {
  const groupUrl = acc.groupUrl;
  const caption = acc.caption;
  const mediaUrl = acc.mediaUrl;
  
}

//--FUNGSI KLIK ELEMEN WRITE SOMETHING --//
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
  const mediaFolder = path.join(__dirname, "media");
  if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder, { recursive: true });

  const filePath = path.join(mediaFolder, filename);
  const options = {
    headers: { "User-Agent": "Mozilla/5.0 (PuppeteerBot)" }
  };

  return new Promise((resolve, reject) => {
    const request = https.get(url, options, (res) => {
    console.log("🌐 GET:", url);
    console.log("🔢 Status:", res.statusCode);
    console.log("📎 Location:", res.headers.location || "(tidak ada)");
      
      // 🔁 Handle redirect (301, 302)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log("🔁 Redirect ke:", res.headers.location);
        return resolve(downloadMedia(res.headers.location, filename));
      }

      // ❌ Handle error status
      if (res.statusCode !== 200) {
        reject(new Error(`❌ Gagal download media: ${res.statusCode}`));
        return;
      }

      // 💾 Tulis file ke disk
      const file = fs.createWriteStream(filePath);
      res.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          try {
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
              reject(new Error(`❌ File ${filename} kosong! Download gagal.`));
              return;
            }
            console.log(`✅ Media selesai diunduh (${(stats.size / 1024).toFixed(2)} KB): ${filePath}`);
            resolve(filePath);
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    request.on("error", (err) => {
      console.log("❌ Error saat download:", err.message);
      reject(err);
    });
  });
}

async function uploadMedia(page, filePath, fileName) {
  console.log(`🚀 Mulai upload media: ${fileName}`);

  const ext = path.extname(fileName).toLowerCase();
  const isVideo = [".mp4", ".mov"].includes(ext);

  console.log(`🧩 Deteksi ekstensi ${ext} -> isVideo=${isVideo}`);

  // ---- Klik tombol Photos / Foto / Video sesuai ekstensi ----
  try {
    if (isVideo) {
      // klik tombol Video (mencari span dengan teks "Video" lalu klik parent button)
      const clickedVideo = await page.evaluate(() => {
        const span = [...document.querySelectorAll("span")].find(s => s.textContent && s.textContent.trim().toLowerCase() === "video");
        if (!span) return false;
        const button = span.closest('div[role="button"], button');
        if (!button) return false;
        button.scrollIntoView({ block: "center", behavior: "instant" });
        ["pointerdown","touchstart","mousedown","mouseup","touchend","click"].forEach(type => {
          button.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
        });
        return true;
      });
      console.log("🎬 Klik tombol Video:", clickedVideo);
    } else {
      // klik tombol Photos/Foto
      const clickedPhotos = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('div[role="button"]')];
        const btn = buttons.find(b => {
          const text = (b.innerText || b.textContent || "").toLowerCase();
          const aria = (b.getAttribute && (b.getAttribute("aria-label") || "")).toLowerCase();
          return text.includes("photos") || text.includes("Koleksi foto") || text.includes("foto") || aria.includes("photo") || aria.includes("foto");
        });
        if (!btn) return false;
        btn.scrollIntoView({ block: "center", behavior: "instant" });
        btn.focus && btn.focus();
        ["pointerdown","pointerup","touchstart","touchend","mousedown","mouseup","click"].forEach(type => {
          btn.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
        });
        return true;
      });
      console.log("🖼 Klik tombol Photos/Foto:", clickedPhotos);
    }
  } catch (e) {
    console.log("⚠️ Error saat klik tombol media:", e.message);
  }

  // beri waktu agar input file muncul
  await page.waitForTimeout(1500 + Math.floor(Math.random() * 2500));

  // ---- Temukan input file ----
  const fileInput = (await page.$('input[type="file"][accept="image/*"]')) ||
                    (await page.$('input[type="file"][accept*="video/*"]')) ||
                    (await page.$('input[type="file"]'));
  if (!fileInput) {
    console.log("❌ Input file tidak ditemukan setelah klik tombol media — mencoba fallback scanning...");
    // coba cari input secara dinamis via evaluate (fallback)
    const inputFound = await page.evaluate(() => !!document.querySelector('input[type="file"]'));
    if (!inputFound) {
      console.log("❌ Tidak ada input[type=file] di DOM. Upload gagal.");
      return false;
    }
  }

  // ---- Siapkan MIME type ----
  const mimeType =
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    ext === ".png" ? "image/png" :
    ext === ".gif" ? "image/gif" :
    ext === ".webp" ? "image/webp" :
    isVideo ? "video/mp4" :
    "application/octet-stream";

  // baca file dan ubah jadi base64 untuk inject via browser File API
  const fileNameOnly = path.basename(filePath);
  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(filePath);
  } catch (e) {
    console.log("❌ Gagal baca file dari disk:", e.message);
    return false;
  }
  const base64Data = fileBuffer.toString("base64");

  // ---- Inject File object ke input agar React/JSX detect ----
  try {
    await page.evaluate(
      async ({ fileNameOnly, base64Data, mimeType }) => {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const file = new File([blob], fileNameOnly, { type: mimeType });

        const input = document.querySelector('input[type="file"]');
        if (!input) throw new Error("❌ Input file tidak ditemukan (runtime)");

        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        // dispatch events so React detects change
        ["input", "change"].forEach(evt => input.dispatchEvent(new Event(evt, { bubbles: true })));
        // extra events sometimes helpful
        ["focus", "blur", "keydown", "keyup"].forEach(evt => input.dispatchEvent(new Event(evt, { bubbles: true })));

        console.log("⚡ File injected ke React dengan File API browser (in-page)");
      },
      { fileNameOnly, base64Data, mimeType }
    );
  } catch (e) {
    console.log("❌ Gagal inject File ke input:", e.message);
    return false;
  }

  console.log(`✅ File ${fileNameOnly} berhasil diinject sebagai File object (mime=${mimeType})`);

  // ---- Trigger extra events to be safe ----
  try {
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      if (input) {
        const events = ["input", "change", "focus", "blur", "keydown", "keyup"];
        events.forEach(evt => input.dispatchEvent(new Event(evt, { bubbles: true, cancelable: true })));
      }
    });
    console.log("⚡ Event React input/change/keydown/keyup dikirim (extra)");
  } catch (e) {
    // ignore
  }

  // ---- Tunggu preview (foto / video) ----
  try {
    if (!isVideo) {
      console.log("⏳ Tunggu foto preview...");
      await page.waitForSelector(
        [
          'div[data-mcomponent="ServerImageArea"] img[scr^="data:image"]',
          'img[src^="data:image"]',
          'img[src^="blob:"]',
        ].join(","),
        { timeout: 60000 }
      );
      console.log("✅ Foto preview ready");
    } else {
      console.log("⏳ Tunggu preview video ...");
      // tunggu placeholder/thumbnail berubah
      await page.waitForSelector('div[data-mcomponent="ImageArea"] img[data-type="image"], div[data-mcomponent="ServerImageArea"] img', { timeout: 120000 });
      await page.waitForFunction(() => {
        const thumbs = [...document.querySelectorAll('div[data-mcomponent="ImageArea"] img[data-type="image"], div[data-mcomponent="ServerImageArea"] img')];
        return thumbs.some(img =>
          img.src &&
          !img.src.includes("rsrc.php") &&
          !img.src.startsWith("data:,") &&
          (img.src.includes("fbcdn.net") || img.src.startsWith("blob:") || img.src.startsWith("data:image"))
        );
      }, { timeout: 60000 });
      console.log("✅ Video preview/thumbnail ready");
    }

    // ekstra buffer waktu agar Facebook selesai memproses preview/encode
    await page.waitForTimeout(2000 + Math.floor(Math.random() * 3000));
    console.log("⏳ Buffer tambahan selesai");
  } catch (e) {
    console.log("⚠️ Preview tidak muncul dalam batas waktu, lanjutkan tetap mencoba (", e.message, ")");
  }

 // Tambah buffer agar Facebook encode selesai
  await page.waitForTimeout(5000);
  console.log("⏳ Tambahan waktu encode 5 detik selesai");


  // 6️⃣ Screenshot hasil preview
  const screenshotPath = path.join(__dirname, "media", "after_upload.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot preview media tersimpan: ${screenshotPath}`);

  const exists = fs.existsSync(screenshotPath);
  console.log(exists ? "✅ Screenshot tersimpan dengan baik" : "❌ Screenshot gagal disimpan");

   return true; //selesai 
}


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
    const groupUrl = "https://facebook.com/groups/5763845890292336/";
    const caption = "🚀 semangat semuanya......";

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
   
    await page.setBypassCSP(true);
                                           
     // 🔊 Monitor semua console dari browser
page.on("console", msg => console.log("📢 [Browser]", msg.text()));
page.on("pageerror", err => console.log("💥 [Browser Error]", err.message));
page.on("response", res => {
  if (!res.ok()) console.log(`⚠️ [HTTP ${res.status()}] ${res.url()}`);
});
  
    // ===== Mulai rekaman
    const recorder = new PuppeteerScreenRecorder(page);
    await recorder.start("recording.mp4");

    // ===== Anti-detect
    await page.setUserAgent(
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"
    );
    await page.setViewport({ width: 360, height: 825, hasTouch: true, deviceScaleFactor: 2, isMobile: true });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, "languages", { get: () => ["id-ID", "id"] });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    });

    // ===== Pasang cookies
    await page.setCookie(...cookies);
    console.log("✅ Cookies set");

    // Buka versi mobile Facebook
  await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
  console.log("✅ Berhasil buka Facebook (mobile)");
    
    // ===== Buka grup
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    // ===== 1️⃣ Klik composer / write something
  let writeClicked =
  await safeClickXpath(page, "//*[contains(text(),'Write something')]", "Composer") ||
  await safeClickXpath(page, "//*[contains(text(),'Tulis sesuatu')]", "Composer") ||
  await safeClickXpath(page, "//*[contains(text(),'Tulis sesuatu...')]", "Composer");

    await page.waitForTimeout(2000);
   // 1️⃣ Klik placeholder composer
      await page.waitForSelector(
    'div[role="button"][data-mcomponent="ServerTextArea"]',
    { timeout: 20000 }
  );

  await page.evaluate(() => {
    const el = document.querySelector(
      'div[role="button"][data-mcomponent="ServerTextArea"]'
    );
    if (!el) return;

    el.scrollIntoView({ block: "center" });

    ["touchstart","touchend","mousedown","mouseup","click"]
      .forEach(e =>
        el.dispatchEvent(new Event(e, { bubbles: true }))
      );
  });

  
await page.waitForFunction(() => {
  return (
    document.querySelector('div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector('textarea') ||
    document.querySelector('textarea[role="combobox"]') ||
    document.querySelector('div[data-mcomponent="ServerTextArea"]') ||
    document.querySelector('[aria-label]')
  );
}, { timeout: 30000 });

console.log("✅ Composer textbox terdeteksi");

  const boxHandle = await page.evaluateHandle(() => {
  return (
    document.querySelector('div[contenteditable="true"][role="textbox"]') ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector('textarea') ||
    document.querySelector('textarea[role="combobox"]') ||
    document.querySelector('div[data-mcomponent="ServerTextArea"]') ||
    document.querySelector('[aria-label]')
  );
});
const box = boxHandle.asElement();
if (!box) {
  throw new Error("❌ Composer textbox tidak valid");
}

  await box.focus();
    
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  await page.keyboard.type(caption, { delay: 90 });

  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  console.log("✅ Caption diketik");

    
 await delay(3000); // kasih waktu 3 detik minimal


  // ===== 3️⃣ Download + upload media
 const today = process.env.DATE || new Date().toISOString().split("T")[0];
 // HARUS sama dengan nama file di Release!

const fileName = `recording.mp4`;
const mediaUrl = `https://github.com/sendy81/Coba-post-group-Facebook-/releases/download/V1.0/recording.mp4`;


  // download media → simpan return value ke filePat
const filePath = await downloadMedia(mediaUrl, fileName);
console.log(`✅ Media ${fileName} berhasil di-download.`);

const stats = fs.statSync(filePath);
if (stats.size === 0) {
  throw new Error(`❌ File ${fileName} kosong! Download gagal.`);
}


// upload ke Facebook

  
await uploadMedia(page, filePath, fileName, "Photos");
   
// Cari tombol POST dengan innerText
await page.evaluate(() => {
  const keywords = [
    "post", 
    "Posting",
    "POST",
    "POSTING",
    "posting",    // ID
    "bagikan"     // ID (kadang muncul)
  ];

  const buttons = [...document.querySelectorAll('div[role="button"]')];

  const postBtn = buttons.find(btn => {
    const text = (btn.innerText || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    return keywords.some(k => text === k || text.includes(k));
  });

  if (!postBtn) return false;

  postBtn.scrollIntoView({ block: "center" });
  postBtn.click();

  return true;
});

console.log("✅ Klik POST (EN+ID)");

  await delay(3000); // kasih waktu 3 detik minimal

  //----FUNGSI MELAKUKAN LIKE POSTINGAN DI LINK GRUP ---////
    
 //$ await page.goto(groupUrl, { waitUntil: "networkidle2" });
 //$ console.log(" Mulai akan lakukan like postingan");
    
//  $let max = 10;        // jumlah like maksimal
 //$ let delayMs = 3000;  // delay antar aksi (ms)
 //$ let clicked = 0;

 //$ async function delay(ms) {
 //$   return new Promise(res => setTimeout(res, ms));
//$  }

//$  while (clicked < max) {
 //$   const button = await page.$(
//$      'div[role="button"][aria-label*="Like"],div[role="button"][aria-label*="like"], div[role="button"][aria-label*="Suka"]'
//$   );

//$  if (button) {
  //$    await button.tap(); // ✅ simulate tap (touchscreen)
 //$     clicked++;
 //$     console.log(`👍 Klik tombol Like ke-${clicked}`);
  //$  } else {
 //$     console.log("🔄 Tidak ada tombol Like, scroll...");
//$    }

    // Scroll sedikit biar postingan baru muncul
 //$   await page.evaluate(() => window.scrollBy(0, 500));
//$   await delay(delayMs);
//$ }

//$ console.log(`🎉 Selesai! ${clicked} tombol Like sudah diklik.`);

    // ===== Stop recorder
    await recorder.stop();
    console.log("🎬 Rekaman selesai: recording.mp4");

    await browser.close();
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
