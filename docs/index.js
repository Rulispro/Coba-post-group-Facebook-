//"use strict";

//const fs = require("fs");
//const path = require("path");
//const https = require("https");
//const puppeteer = require("puppeteer-extra");
//const StealthPlugin = require("puppeteer-extra-plugin-stealth");
//const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

// Aktifkan plugin stealth
//puppeteer.use(StealthPlugin());

// ===== Fungsi klik aman (element langsung)
// async function scanAllElementsVerbose(page, label = "Scan") {
 // return elements;
//}

// ===== Fungsi download media dari GitHub Release
//const mediaFolder = path.join(__dirname, "media");
//if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);
//async function downloadMedia(url, filename) {
//  const filePath = path.join(mediaFolder, filename);
//  return new Promise((resolve, reject) => {
   // const file = fs.createWriteStream(filePath);
 //   https.get(url, (res) => {
    //  res.pipe(file);
  //    file.on("finish", () => {
     //   file.close(resolve);
   //   });
  //  }).on("error", (err) => reject(err));
 // });
//}
// ===== Ambil tanggal hari ini
//function getTodayString() {
 // const today = new Date();
 // const yyyy = today.getFullYear();
//  const mm = String(today.getMonth() + 1).padStart(2, "0");
//  const dd = String(today.getDate()).padStart(2, "0");
  //return `${yyyy}-${mm}-${dd}`;
//}
// ===== Main Puppeteer
//(async () => {
//  try {
// async function scanAllElementsVerbose(page, label = "Scan") {

    // ===== 1️⃣ Klik composer / write something
    //let writeClicked = await safeClickXpath(page, "//*[contains(text(),'Write something')]", "Composer");
   // if (!writeClicked) {
    //  console.log("⚠️ XPath gagal, coba fallback evaluateHandle");
     // const fallback = await page.evaluateHandle(() => {
       // const els = Array.from(document.querySelectorAll("div, span, p"));
       // return els.find(el => {
       //   if (!el.innerText) return false;
         // if (!el.innerText.includes("Write something")) return false;
        //  const childHas = Array.from(el.children)
          //  .some(c => c.innerText && c.innerText.includes("Write something"));
         // return !childHas;
       // }) || null;
    //  });
     // if (fallback) {
       // await fallback.asElement().click();
      //  console.log("🟦 Klik composer via fallback berhasil");
   //   } else {
      //  console.log("❌ Composer tidak ditemukan sama sekali");
     //   await scanAllElementsVerbose(page, "Composer");
     // }
    //  console.log("⚠️ Composer tidak ditemukan, fallback scan");
    //  await scanAllElementsVerbose(page, "Composer");
   // }
  //  await page.waitForTimeout(2000);

    // ===== 2️⃣ Isi caption (klik placeholder + isi textbox)
   // const clickResult = await page.evaluate(() => {
    //  const btn = [...document.querySelectorAll("div[role='button']")]
      //  .find(el => {
       //   const t = (el.innerText || "").toLowerCase();
       //   return t.includes("write something") || t.includes("buat postingan") || t.includes("tulis sesuatu");
      //  });
    //  if (!btn) return { ok: false, msg: "Placeholder 'Write something' tidak ditemukan" };
    //  ["mousedown", "mouseup", "click"].forEach(type => {
      //  btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      //});
     // return { ok: true, msg: "Klik placeholder berhasil" };
   // });
   // console.log("CLICK:", clickResult);
   // await page.waitForTimeout(1000);
    // ===== 2️⃣ Isi caption
   // const fillResult = await page.evaluate((text) => {
  //    const selectors = [
     //   "textarea[name='xc_message']",
        //"textarea",
       // "div[role='textbox'][contenteditable='true']",
       // "div[contenteditable='true']"
    //  ];
     // let tb = null;
     // for (const s of selectors) {
       // tb = document.querySelector(s);
       // if (tb) {
      //    try {
           // if ("value" in tb) {
         //     tb.focus();
           //   tb.value = text;
            //  tb.dispatchEvent(new Event("input", { bubbles: true }));
             // tb.dispatchEvent(new Event("change", { bubbles: true }));
         //   } else {
            //  tb.focus();
            //  tb.innerText = text;
            //  tb.dispatchEvent(new InputEvent("input", { bubbles: true }));
            //  tb.dispatchEvent(new Event("change", { bubbles: true }));
          //  }
          //  return { ok: true, selector: s, msg: "Terisi" };
        //  } catch (err) {
         //   return { ok: false, selector: s, msg: "Error: " + err.message };
        //  }
      //  }
      //const tb = document.querySelector("div[contenteditable='true']");
     // if (tb) {
       // tb.focus();
      //  tb.innerText = text;
       // tb.dispatchEvent(new InputEvent("input", { bubbles: true }));
     //   return { ok: true };
    //  }
      //return { ok: false, msg: "Textbox tidak ditemukan" };
    //  return { ok: false };
  //  }, caption);
  //  console.log("FILL:", fillResult);

    // ===== 3️⃣ Klik tombol POST
    // Tunggu tombol POST muncul
//await page.waitForXPath("//div[@role='button']//span[contains(text(), 'POST')]", { timeout: 5000 });
    // ===== 3️⃣ Download + upload media
   // const today = getTodayString();
    //const fileName = `akun1_${today}.jpg`; // bisa ganti .mp4 kalau video
   // const mediaUrl = `https://github.com/Rulispro/Coba-post-group-Facebook-/releases/download/v1.0/${fileName}`;

// Cari elemen tombol POST
//const [postBtn] = await page.$x("//div[@role='button']//span[contains(text(), 'POST')]");
  ///  await downloadMedia(mediaUrl, fileName);
//    console.log(`✅ Media ${fileName} berhasil di-download.`);

//if (postBtn) {
  //await postBtn.click();
 // console.log("✅ Tombol POST berhasil diklik!");
//} else {
 // console.log("❌ Tombol POST tidak ditemukan");
//}
    
//    const [fileChooser] = await Promise.all([
  //    page.waitForFileChooser(),
    //  page.click('div[aria-label="Photo/Video"]')
  //  ]);

    // ===== Debug: cek webdriver
  //  const webdriver = await page.evaluate(() => navigator.webdriver);
  //  console.log("navigator.webdriver:", webdriver);
   // await fileChooser.accept([path.join(mediaFolder, fileName)]);
  //  await page.waitForTimeout(2000);
  //  console.log("✅ Media berhasil diupload ke composer.");
    // ===== 4️⃣ Klik tombol POST
   // const [postBtn] = await page.$x("//div[@role='button']//span[contains(text(), 'POST')]");
  //  if (postBtn) {
    //  await postBtn.click();
     // console.log("✅ Tombol POST berhasil diklik!");
   // } else {
     // console.log("❌ Tombol POST tidak ditemukan");
  //  }

    // ===== Stop recorder
   // await recorder.stop();
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

  // ===== Fungsi upload ke Facebook (foto/video)
      
// async function uploadMedia(page, filePath) {
  //const fileName = path.basename(filePath);
 // const absolutePath = path.resolve(__dirname, "media", fileName);

  // Tentukan tombol media
//  let buttonSelector = fileName.match(/\.(mp4|mov|avi)$/i)
//    ? 'div[role="button"][aria-label="Video"]'
  //  : 'div[role="button"][aria-label="Photos"]';

  /* Klik tombol media
//  try {
 //   await page.click(buttonSelector, { delay: 100 });
  //  await delay(3000);
   // console.log("✅ Tombol media diklik (click biasa).");
//  } catch {
    console.log("⚠️ Click biasa gagal, coba dispatchEvent manual...");
}
*/
   // await page.evaluate((sel) => {
 //     const btn = document.querySelector(sel);
 //     if (btn) {
 //       ["mousedown", "mouseup", "click"].forEach(evt => {
 //        btn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
 //       });
 //     }
 //   }, buttonSelector);
  //  await delay(3000);
//  }

   //Cari input file
//  let fileInput;
 // if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
   // fileInput = await page.waitForSelector('input[type="file"][accept="image/*"]', { timeout: 10000 });
//  } else if (fileName.match(/\.(mp4|mov|avi)$/i)) {
   // fileInput = await page.waitForSelector('input[type="file"][accept="video/*"]', { timeout: 10000 });
 // } else {
  //  throw new Error("❌ Format file tidak didukung: " + fileName);
 // }

  // Upload file
  //await fileInput.uploadFile(absolutePath);
//  console.log(`✅ ${fileName} berhasil di-upload ke input.`);
//  await delay(5000);
  // ===== Ambil input file dan upload langsung
  
  
  
 //  //Trigger event React
//  const reactOk = await page.evaluate((selector) => {
   // const input = document.querySelector(selector);
  //  if (!input) return false;
    //["input", "change"].forEach(type => input.dispatchEvent(new Event(type, { bubbles: true })));
   // return true;
 // }, fileName.match(/\.(jpg|jpeg|png|gif)$/i)
      //  ? 'input[type="file"][accept="image/*"]'
      //  : 'input[type="file"][accept="video/*"]');

 // if (!reactOk) {
  //  console.log("⚠️ Event React gagal, coba drag-drop fallback...");
    //await page.evaluate((fileName) => {
     //const dropZone =
     //   document.querySelector('[aria-label*="Tambah foto"]') ||
      //  document.querySelector('[aria-label*="Tambah Video"]');
     // if (!dropZone) return false;
    //  const dt = new DataTransfer();
      //dt.items.add(new File(["dummy"], fileName));
     // dropZone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
    //  return true;
 //   }, fileName);
 // }

  // Tunggu preview muncul
  
  // ✅ Upload dan tunggu preview
async function uploadMedia(page, filePath, fileName) {
  const fileInput =
    (await page.$('input[type="file"][accept*="image"]')) ||
    (await page.$('input[type="file"][accept*="video"]')) ||
    (await page.$('input[type="file"]')); // fallback

  if (fileInput) {
    await fileInput.uploadFile(filePath);
    console.log("✅ File sudah diattach (React terinformasi)");

    // tunggu proses file
    await page.waitForTimeout(5000);

    // Trigger event supaya React sadar ada file baru
    await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      if (!input) return;
      ["input", "change"].forEach(evt =>
        input.dispatchEvent(new Event(evt, { bubbles: true }))
      );
    }, 'input[type="file"]');

    await page.waitForTimeout(3000); // tambahan sinkronisasi
  } else {
    console.log("❌ Input file tidak ditemukan, upload gagal");
    return;
  }

  console.log("⏳ Tunggu preview render...");

if (/\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
  // FOTO
  await page.waitForSelector('img[src*="scontent"], img[src*="safe_image"]', { timeout: 30000 });
  console.log("✅ Foto preview muncul.");
} else if (/\.(mp4|mov|webm)$/i.test(fileName)) {
  // VIDEO
  await page.waitForSelector('video[src*="fbcdn"], video', { timeout: 60000 });
  console.log("✅ Video preview muncul.");
} else {
  console.log("⚠️ Ekstensi file tidak dikenali, lanjut tanpa cek preview.");
}

// 📸 Debug screenshot
await page.screenshot({ path: "after_upload.png", fullPage: true });
console.log("✅ Media siap diposting.");
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
   // const recorder = new PuppeteerScreenRecorder(page);
   // await recorder.start("recording.mp4");

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
}

  // ===== 3️⃣ Download + upload media
 const today = getTodayString();
 const fileName = `akun1_${today}.png`; // bisa .mp4
const mediaUrl ="https://github.com/Rulispro/Coba-post-group-Facebook-/releases/download/V1.0/Screenshot_20250909-071607.png";

// download media → simpan return value ke filePat
  const filePath = await downloadMedia(mediaUrl, fileName);
console.log(`✅ Media ${fileName} berhasil di-download.`);

// upload ke Facebook
await uploadMedia(page, filePath);
 
    // ===== 3️⃣ Download + upload media
 //   const today = getTodayString();
   // const fileName = `akun1_${today}.jpg`; // bisa ganti .mp4 kalau video
//    const mediaUrl = "https://github.com/Rulispro/Coba-post-group-Facebook-/releases/download/v1.0/akun1_2025-09-16.jpg";
  // download media
//    await downloadMedia(mediaUrl, fileName);
//   console.log(`✅ Media ${fileName} berhasil di-download.`);
//   // 2️⃣ Upload ke Facebook
//   await uploadMedia(page, filePath);
    // ===== Fungsi upload ke Facebook
//  async function uploadMedia(page, filePath) {
//  const fileName = path.basename(filePath);

  // Klik tombol Foto/Video
//  let buttonSelector = "";
//  if (fileName.endsWith(".mp4") || fileName.endsWith(".mov")) {
//    buttonSelector = 'div[role="button"][aria-label="Video"]';
//  } else {
//    buttonSelector = 'div[role="button"][aria-label="Photos"]';
//  }

//  await page.click(buttonSelector);
//  console.log("✅ Tombol media diklik.");

  // Cari input file
//  const fileInput = await page.waitForSelector(
//    'input[type="file"][accept*="image"], input[type="file"][accept*="video"]',
//    { visible: true, timeout: 10000 }
//  );

  // Upload file
 // await fileInput.uploadFile(filePath);
 // console.log(`✅ ${fileName} berhasil di-upload.`);

  // Tunggu preview muncul → tanda sukses upload
//  await page.waitForSelector(
//    'img[src*="scontent"], video[src*="fbcdn"]',
 //   { visible: true, timeout: 20000 }
//  );

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
const [postBtn] = await page.$x("//div[@role='button']//span[contains(text(), 'POST')]");
if (postBtn) {
  try {
    await postBtn.click({ delay: 100 });
    console.log("✅ Tombol POST diklik biasa");
  } catch (e) {
    console.log("⚠️ Click biasa gagal, coba dispatchEvent...");
    await page.evaluate(() => {
      const btn = document.evaluate(
        "//div[@role='button']//span[contains(text(), 'POST')]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      if (btn) {
        ["mousedown", "mouseup", "click"].forEach(evt =>
          btn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }))
        );
      }
    });
    console.log("✅ Fallback dispatchEvent berhasil");
  }
} else {
  console.log("❌ Tombol POST tidak ditemukan");
}


    // ===== Stop recorder
  //  await recorder.stop();
   // console.log("🎬 Rekaman selesai: recording.mp4");

    await browser.close();
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
