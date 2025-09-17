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
        file.close(resolve);
      });
    }).on("error", (err) => reject(err));
  });
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
   
    // ===== 3️⃣ Download + upload media
    const today = getTodayString();
    const fileName = `akun1_${today}.jpg`; // bisa ganti .mp4 kalau video
    const mediaUrl = "https://github.com/Rulispro/Coba-post-group-Facebook-/releases/download/v1.0/akun1_2025-09-16.jpg";

    await downloadMedia(mediaUrl, fileName);
    console.log(`✅ Media ${fileName} berhasil di-download.`);

    const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.click('div[aria-label="Photo/Video"]')
]);

await fileChooser.accept([path.join(mediaFolder, fileName)]);


    await fileChooser.accept([path.join(mediaFolder, fileName)]);
console.log(`✅ ${fileName} berhasil dipilih.`);

// Deteksi apakah file foto atau video
if (fileName.endsWith(".mp4") || fileName.endsWith(".mov")) {
  console.log("⏳ Tunggu minimal 10 detik untuk video processing...");
  await delay(10000); // 10 detik
} else {
  console.log("⏳ Tunggu 2 detik untuk foto processing...");
  await delay(2000); // 2 detik
}

console.log("✅ Media berhasil diproses dan siap diposting.");
   
    // ===== 4️⃣ Klik tombol POST
    const [postBtn] = await page.$x("//div[@role='button']//span[contains(text(), 'POST')]");
    if (postBtn) {
      await postBtn.click();
      console.log("✅ Tombol POST berhasil diklik!");
    } else {
      console.log("❌ Tombol POST tidak ditemukan");
    }

    // ===== Stop recorder
    await recorder.stop();
    console.log("🎬 Rekaman selesai: recording.mp4");

    await browser.close();
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
