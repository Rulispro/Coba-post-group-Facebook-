"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const XLSX = require("xlsx");   
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

puppeteer.use(StealthPlugin())
//Validasinya 
async function validateCaption(page, caption) {
  return await page.evaluate(text => {
    const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
  if (!el) return false;
    const val = el.textContent || el.innerText || "";
    return val.includes(text.slice(0, 5));
  }, caption);
}

//ISI CAPTION type manusia tahan update 

async function typeCaptionStable(page, caption)
 (page, caption) {
  console.log("🧠 typeCaptionUltimate start");

  // 1️⃣ AKTIFKAN COMPOSER (WAJIB KLIK)
  await page.evaluate(() => {
    // klik area composer (placeholder / container)
    const candidates = [
      '[role="textbox"]',
      '[role="combobox"]',
      '["textarea"]',
      'div[contenteditable="true"]',
      '[aria-label*="Tulis sesuatu"]',
      '[aria-label*="Write something"]'
    ];

    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) {
        el.click();
        return true;
      }
    }
    return false;
  });

  await page.waitForTimeout(800);

  // 2️⃣ AMBIL TEXTBOX (SETELAH KLIK)
  const ok = await page.evaluate(() => {
    const el = document.querySelector(
      'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
    );

    if (!el) return false;

    el.focus();
    el.textContent = "";
    return true;
  });

  if (!ok) {
    console.log("❌ Textbox masih belum muncul setelah activate");
    return { ok: false, step: "textbox_not_found" };
  }

  // 3️⃣ TYPING MANUSIA
  await page.keyboard.type(caption, {
    delay: 120 + Math.random() * 120
  });

  // 4️⃣ COMMIT REACT
  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  // 5️⃣ VALIDASI
  if (await validateCaption(page, caption)) {
    console.log("✅ Caption OK (Ultimate)");
    return { ok: true };
  }

  console.log("⚠️ Caption tidak tervalidasi");
  return { ok: false, step: "validation_failed" };
}


//isi caption klik placeholder 
async function activateComposerAndFillCaption(page, caption) {
  return await page.evaluate((text) => {
    const placeholderKeywords = [
      "write something",
      "tulis sesuatu",
      "buat postingan publik",
      "create a public post",
      "kirim postingan buat persetujuan admin",
      "submit a post for admin"
    ];

    // ===============================
    // 1️⃣ CLICK PLACEHOLDER (DOM BUTTON)
    // ===============================
    const btn = [...document.querySelectorAll("div[role='button']")]
      .find(el => {
        const t = (el.innerText || "").toLowerCase();
        return placeholderKeywords.some(k => t.includes(k));
      });

    if (btn) {
      ["mousedown", "mouseup", "click"].forEach(type =>
        btn.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window
          })
        )
      );
    }

    // ===============================
    // 2️⃣ FIND & FILL TEXTBOX
    // ===============================
    const selectors = [
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true']",
  "textarea"
];
    for (const s of selectors) {
      const tb = document.querySelector(s);
      if (!tb) continue;

      tb.focus();

      // clear dulu (penting buat React)
      if ("value" in tb) {
        tb.value = "";
      } else {
        tb.innerText = "";
        tb.textContent = "";
      }

      // isi caption
      if ("value" in tb) {
        tb.value = text;
        tb.dispatchEvent(new Event("input", { bubbles: true }));
        tb.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        tb.innerText = text;
        tb.dispatchEvent(new InputEvent("input", { bubbles: true }));
        tb.dispatchEvent(new Event("change", { bubbles: true }));
      }

      return {
        ok: true,
        step: "activate+fill",
        selector: s
      };
    }

    return {
      ok: false,
      step: "textbox_not_found"
    };
  }, caption);
}

//caption keyboard 
async function typeByKeyboard(page, caption) {
  const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
 await page.click(selector);
  await page.waitForTimeout(200);
  await page.keyboard.type(caption, { delay: 100 });
}
//caption human like 
async function typeByExecCommand(page, caption) {
  await page.evaluate(text => {
    const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
  if (!el) return;

    el.focus();
    document.execCommand("insertText", false, text);
  }, caption);
}
//caption input event 
async function typeByInputEvent(page, caption) {
  await page.evaluate(text => {
     const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
  if (!el) return;

    el.focus();
    el.textContent = "";

    el.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      data: text,
      inputType: "insertText"
    }));

    el.textContent = text;
  }, caption);
}
//caption force
async function typeByForceReact(page, caption) {
  await page.evaluate(text => {
     const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
 if (!el) return false;

    el.focus();
    el.innerText = text;

    ["input", "change", "keydown", "keyup", "blur"].forEach(evt =>
      el.dispatchEvent(new Event(evt, { bubbles: true }))
    );

    return true;
  }, caption);
}

//HELPER ISI CAPTION 
async function typeByKeyboard(page, caption) {
  await page.keyboard.type(caption, { delay: 80 });
}

async function typeByExecCommand(page, caption) {
  await page.evaluate(text => {
    document.execCommand("insertText", false, text);
  }, caption);
}

async function typeByInputEvent(page, caption) {
  await page.evaluate(text => {
      const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);
  if (!el) return false;

    el.focus();

    el.dispatchEvent(new InputEvent("beforeinput", {
      inputType: "insertText",
      data: text,
      bubbles: true,
      cancelable: true
    }));

    el.textContent = text;

    el.dispatchEvent(new InputEvent("input", {
      inputType: "insertText",
      data: text,
      bubbles: true
    }));

    return true;
  }, caption);
}

async function typeByForceReact(page, caption) {
  await page.evaluate(text => {
      const el = document.querySelector(
  'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea'
);

    if (!el) return false;

    el.focus();
    el.innerText = text;

    ["input","change","keydown","keyup","blur"].forEach(evt =>
      el.dispatchEvent(new Event(evt, { bubbles: true }))
    );
    return true;
  }, caption);
}

//isi caption tambahan cara 
async function typeCaptionUltimate(page, caption) {
    console.log("🧠 typeCaptionUltimate start");
   
    if (await typeCaptionStable(page, caption)) {
    console.log("✅ Caption OK via Stable");
    return;
  }
  
  console.log("🧠 Activate composer + fill caption (combo)");
  const comboResult = await activateComposerAndFillCaption(page, caption);
  console.log("COMBO:", comboResult);

  await page.waitForTimeout(2000);

  if (comboResult?.ok && await validateCaption(page, caption)) {
    console.log("✅ Caption OK via combo helper");
    return;
  }
  
  console.log("🧠 Try typeCaptionSafe (legacy)");

  try {
    await typeCaptionSafe(page, caption);
    await page.waitForTimeout(400);

    if (await validateCaption(page, caption)) {
      console.log("✅ typeCaptionSafe OK");
      return;
    }
  } catch (e) {
    console.log("⚠️ typeCaptionSafe gagal, lanjut fallback");
  }

  const methods = [
    { name: "Keyboard", fn: typeByKeyboard },
    { name: "ExecCommand", fn: typeByExecCommand },
    { name: "InputEvent", fn: typeByInputEvent },
    { name: "ForceReact", fn: typeByForceReact }
  ];

  for (const m of methods) {
    console.log(`✍️ Try ${m.name}...`);

    await m.fn(page, caption);
    await page.waitForTimeout(500);

    // trigger commit React
    await page.keyboard.press("Space");
    await page.keyboard.press("Backspace");

    if (await validateCaption(page, caption)) {
      console.log(`✅ ${m.name} OK`);
      return;
    }
  }

  throw new Error("❌ Semua metode input caption gagal (akun keras / FB update)");
}

//Helper isi caption status 
async function typeCaptionSafe(page, caption) {
  const selector =
    'div[contenteditable="true"][role="textbox"], div[contenteditable="true"], textarea';

  // ===============================
  // 1️⃣ WAKE UP REACT COMPOSER
  // ===============================
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);

  // ===============================
  // 2️⃣ PASTIKAN FOCUS KE TEXTBOX
  // ===============================
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (el) el.focus();
  }, selector);

  await page.waitForTimeout(200);

  // ===============================
  // 3️⃣ INPUT PALING AMAN: KEYBOARD
  // ===============================
  await page.keyboard.type(caption, { delay: 90 });
  await page.waitForTimeout(600);

  // ===============================
  // 4️⃣ VALIDASI REACT (BUKAN DOM PALSU)
  // ===============================
  const ok = await page.evaluate((sel, text) => {
    const el = document.querySelector(sel);
    if (!el) return false;

    const value = el.textContent || el.innerText || "";
    return value.includes(text.slice(0, 5));
  }, selector, caption);

 // if (!ok) {
   // throw new Error("❌ Caption tidak diterima oleh React FB");
 // }
if (!ok) {
  console.log("⚠️ React validation skipped (STATUS mode)");
  return;
}

  console.log("✅ Caption TERISI (React acknowledged)");
}

//PARSE TANGGAL///
function parseTanggalXLSX(tgl) {
  if (!tgl) return null;

  // format: M/D/YY atau MM/DD/YY
  const [m, d, y] = tgl.split("/");

  const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);

  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    }


//FUNGSI POSTING STATUS 
async function runStatus(page, row) {
  console.log(`\n📝 Post STATUS → ${row.account}`);
  const account = row.account;
  console.log(`\n📝 Post STATUS → ${account}`);
  const caption = row.caption;
  const mediaUrl = row.media_url || row.github_release;

  if (!caption && !mediaUrl) {
    console.log("⚠️ Status kosong, skip");
    return;
  }

  // 1️⃣ BUKA HOME FB (WAJIB)
  await page.goto("https://m.facebook.com", { waitUntil: "networkidle2" });
  
  await delay(3000);
  
async function clickComposerStatus(page) {
  const ok = await page.evaluate(() => {
    const keywords = [
      "what's on your mind",
      "apa yang anda pikirkan",
      "tulis sesuatu",
      "buat postingan"
    ];

    const btn = [...document.querySelectorAll('div[role="button"]')]
      .find(el =>
        keywords.some(k =>
          (el.innerText || "").toLowerCase().includes(k)
        )
      );

    if (!btn) return false;

    btn.scrollIntoView({ block: "center" });

    [
      "pointerdown",
      "touchstart",
      "mousedown",
      "mouseup",
      "touchend",
      "click"
    ].forEach(e =>
      btn.dispatchEvent(new Event(e, { bubbles: true, cancelable: true }))
    );

    return true;
  });

  console.log(
    ok ? "✅ Composer STATUS diklik" : "❌ Tombol STATUS tidak ditemukan"
  );
  return ok;
}
  
  // 3️⃣ TUNGGU TEXTBOX
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

  // 🔥 PAKAI FUNGSI AMAN 
  await typeCaptionUltimate(page, caption);

  await page.keyboard.press("Space");
  await page.keyboard.press("Backspace");

  console.log("✅ Caption diketik");

    
 await delay(3000);

  // ===== 3️⃣ Download + upload media
 const today = process.env.DATE || new Date().toISOString().split("T")[0];
 // HARUS sama dengan nama file di Release!

const originalName = mediaUrl.split("?")[0].split("/").pop();
 
  const fileName = `${account}_${Date.now()}_${originalName}`;
console.log(`✅ Posting selesai untuk ${account}`);

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
await delay(3000);
console.log(`✅ Posting selesai untuk ${account}`);
}

//--ACAK JEDA LINK GRUPNYA --//
let lastDelay = null;

function pickRandomNoRepeat(arr) {
  if (arr.length === 1) return arr[0];

  let picked;
  do {
    picked = arr[Math.floor(Math.random() * arr.length)];
  } while (picked === lastDelay);

  lastDelay = picked;
  return picked;
}


// ===== HELPER =====
function getTodayWIB() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    })
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function urlExists(url) {
  return new Promise(resolve => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      },
      res => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      }
    ).on("error", () => resolve(false));
  });
}



//VERSI BARU BUAT TEST
function readTemplate(file) {
  if (!fs.existsSync(file)) {
    throw new Error("❌ File XLSX tidak ditemukan: " + file);
  }

  const wb = XLSX.readFile(file);
  const result = {};

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false
    });

    result[sheetName.trim()] = rows.map(row => {
      const clean = {};
      for (const k in row) {
        clean[k.trim()] =
          typeof row[k] === "string" ? row[k].trim() : row[k];
      }
      return clean;
    });
  }

  return result;
}

//--FUNGSI RUN ACCOUNT--//

async function runAccount(page, row) {
 console.log("\n🧪 runAccount row:", row);
    const account = row.account;
  const caption = row.caption;
  const mediaUrl = row.media_url || row.github_release;

  // ===== PARSE DELAY GRUP DARI XLSX =====
  const delayGroupList = String(row.delay_grup || "")
  .replace(/\./g, ",")  // ganti titik jadi koma
  .split(/,/)           // split koma
  .map(v => parseInt(v.trim(), 10))
  .filter(v => !isNaN(v) && v > 0);

  const defaultDelayGroup = 5000; // fallback kalau kosong

  
  const groups = String(row.grup_link || "")
  .split(",")
  .map(g => g.replace(/[\s\r\n]+/g, "").trim()) // hapus spasi, CR, LF
  .filter(Boolean);
  
  
   if (!account || !caption || !mediaUrl || groups.length === 0) {
    console.log("⚠️ Row XLSX tidak lengkap, skip:", row);
    return;
  }

  console.log(`🧠 runAccount (XLSX) → ${account}`);
  console.log(`🔗 Grup: ${groups.length}`);
    
  for (let i = 0; i < groups.length; i++) {
    const groupUrl = groups[i];
   
    console.log(`\n📌 [${account}] Grup ${i + 1}/${groups.length}`);
    console.log(`➡️ ${groupUrl}`);
    

// ✅ Validasi URL grup
    if (!groupUrl.startsWith("http")) {
      groupUrl = "https://m.facebook.com/" + groupUrl.replace(/^\/+/, "");
    }

    if (!groupUrl.includes("/groups/")) {
      console.log("❌ URL grup tidak valid, skip:", groupUrl);
      continue; // skip kalau bukan URL grup
    }

    console.log(`\n📌 [${account}] Membuka grup ${i + 1}/${groups.length}`);
    console.log("➡️", groupUrl);
    
    // ===== Buka grup
    await page.goto(groupUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(4000);
    // DEBUG SETELAH PAGE SIAP

  await page.evaluate(() => {
  const hits = [];

  document.querySelectorAll("span").forEach(s => {
    const t = s.textContent?.trim();
    if (t && /write|tulis|pikirkan|mind|status/i.test(t)) {
      hits.push(t);
    }
  });

  console.log("SPAN_HITS:", JSON.stringify(hits));
});


//KLIK TULISAN WRITE SOMETHING SEBELUM KOTAK CAPTION//
//async function openComposer(page) {
  //const opened = await page.evaluate(() => {
    //const span = [...document.querySelectorAll("span")]
      //.find(s =>
        //$/write something|tulis sesuatu/i
        //  .test(s.textContent || "")
     // );

    //if (!span) return false;

    //const container =
      //span.closest('[data-mcomponent="MContainer"]') ||
      //span.closest("div");

    //if (!container) return false;

    //container.scrollIntoView({ block: "center" });

   // [
     // "pointerdown",
      //"touchstart",
     // "mousedown",
    //  "mouseup",
     // "touchend",
     // "click"
   // ].forEach(e =>
      //container.dispatchEvent(
      //  new Event(e, { bubbles: true, cancelable: true })
     // )
  //  );

    //container.focus?.();
   // return true;
  //});

 // if (!opened) throw new Error("❌ Composer tidak berhasil diklik");
  //console.log("✅ Composer trigger sukses");
//}


    // ===== 1️⃣ Klik composer / write something
    let writeClicked =
    await safeClickXpath(page, "//*[contains(text(),'Write something')]", "Composer") ||
    await safeClickXpath(page, "//*[contains(text(),'Tulis sesuatu')]", "Composer") ||
    await safeClickXpath(page, "//*[contains(text(),'Tulis sesuatu...')]", "Composer");
    
    await page.waitForTimeout(2000);
   // 1️⃣ Klik placeholder composer
     await page.waitForSelector(
     'div[role="button"][data-mcomponent="ServerTextArea"]',
      { timeout: 10000 }
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

const originalName = mediaUrl.split("?")[0].split("/").pop();
 
  const fileName = `${account}_${Date.now()}_${originalName}`;
console.log(`✅ Posting selesai untuk ${account}`);

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
await delay(3000);
console.log(`✅ Posting selesai untuk ${account}`);
    
  //----FUNGSI MELAKUKAN LIKE POSTINGAN DI LINK GRUP ---////
    
 // await page.goto(groupUrl, { waitUntil: "networkidle2" });
  //console.log(" Mulai akan lakukan like postingan");
    
  //let max = 10;        // jumlah like maksimal
  //let delayMs = 3000;  // delay antar aksi (ms)
  //let clicked = 0;

 // async function delay(ms) {
   // return new Promise(res => setTimeout(res, ms));
 // }

 // while (clicked < max) {
    //const button = await page.$(
      //'div[role="button"][aria-label*="Like"],div[role="button"][aria-label*="like"], div[role="button"][aria-label*="Suka"]'
  // );

  //if (button) {
     // await button.tap(); // ✅ simulate tap (touchscreen)
      //clicked++;
    //  console.log(`👍 Klik tombol Like ke-${clicked}`);
    //} else {
      //console.log("🔄 Tidak ada tombol Like, scroll...");
   // }

    // Scroll sedikit biar postingan baru muncul
    //await page.evaluate(() => window.scrollBy(0, 500));
  // await delay(delayMs);
 //}

 //console.log(`🎉 Selesai! ${clicked} tombol Like sudah diklik.`);




// ⏳ JEDA ANTAR GRUP (ACAK, TANPA PENGULANGAN)
const delayGrup =
  delayGroupList.length > 0
    ? pickRandomNoRepeat(delayGroupList)
    : defaultDelayGroup;

console.log(`🎲 Delay grup (acak): ${delayGrup} ms`);
await delay(delayGrup);

}
  
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

// ===== Klik composer aman pakai trigger React



      


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
                                          

// 🕒 Fungsi delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== Main Puppeteer

(async () => {
  try {
    console.log("🚀 Start bot...");

    const accounts = JSON.parse(
      fs.readFileSync(__dirname + "/accounts.json", "utf8")
    );

    // ✅ BACA TEMPLATE SEKALI DI AWAL
    const TEMPLATE_PATH = "./docs/template1.xlsx";

    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error("❌ template1.xlsx tidak ditemukan");
    }


    const templates = readTemplate(TEMPLATE_PATH);
    console.log("📑 Sheet terbaca:", Object.keys(templates));
    const groupRows = templates.postGroup || [];
    const statusRows = templates.postStatus || [];
   // const templateRows = readTemplate(TEMPLATE_PATH);

    //console.log("📦 Template rows siap dipakai:", templateRows.length);
    
    
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

    // 🔁 LOOP PER AKUN
    for (const acc of accounts) {
      console.log(`\n🚀 Start akun: ${acc.account}`);
      const context = await browser.createIncognitoBrowserContext();
      const page = await context.newPage();
      // ===== PATCH BUG userAgentData FACEBOOK (WAJIB)
      await page.evaluateOnNewDocument(() => {
        try {
        if (navigator.userAgentData) {
         navigator.userAgentData.getHighEntropyValues = () => {
         return Promise.resolve({
          architecture: "arm",
          model: "",
          platform: "Android",
          platformVersion: "10",
          uaFullVersion: "120.0.0.0"
           });
           };
         }
        } catch (e) {
    // silent
        }
       });
      
      await page.setBypassCSP(true);

      // 🔊 Monitor console
      page.on("console", msg => console.log(`📢 [${acc.account}]`, msg.text()));
      page.on("pageerror", err => console.log("💥 [Browser Error]", err.message));

      // ===== Recorder PER AKUN
      const recorder = new PuppeteerScreenRecorder(page);
     await recorder.start(`recording_${acc.account}.mp4`);

      // ===== Anti-detect (KODE KAMU, TETAP)
      await page.setUserAgent(
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"
      );
      await page.setViewport({
        width: 360,
        height: 825,
        hasTouch: true,
        deviceScaleFactor: 2,
        isMobile: true
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        window.navigator.chrome = { runtime: {} };
        Object.defineProperty(navigator, "languages", { get: () => ["id-ID", "id"] });
        Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      });


      const today = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
).toISOString().slice(0, 10);
      console.log("📅 TODAY (WIB):", today);
console.log("📋 Semua status rows:", statusRows);
     

      const rowsStatusForAccount = statusRows.filter(row => {
  if (row.account !== acc.account) return false;

  const rowDate = parseTanggalXLSX(row.tanggal);
  return rowDate === today;
});
      


      //coba baru filter grup 
     const rowsForAccount = groupRows.filter(row => {
    if (row.account !== acc.account) return false;
    const rowDate = parseTanggalXLSX(row.tanggal);
  return rowDate === today;
 });
      
 // ================== FILTER GROUP BERDASARKAN TANGGAL ==================
//group/const rowsForAccount = groupRows.filter(row => {
 // if (row.account !== acc.account) return false;

 // if (!row.tanggal) {
//    console.log("⚠️ Row grup TANPA tanggal, skip:", row);
  //  return false;
  //}
//
 // const rowDate = parseTanggalXLSX(row.tanggal);

//  if (!rowDate) {
   // console.log("⚠️ Format tanggal grup tidak valid:", row.tanggal);
  //  return false;
  //}

 // if (rowDate !== today) {
   // console.log(
    ///  `⏭️ Skip grup karena beda tanggal → XLSX: ${rowDate}, TODAY: ${today}`
   // );
   /// return false;
 /// }

 /// return true;
//$group});

console.log("ACCOUNT JSON:", `[${acc.account}]`);
   



console.log(`📋 Row untuk ${acc.account}:`, rowsForAccount.length);


      //baru 
console.log(`📋 Group row ${acc.account}:`, rowsForAccount.length);
console.log(`📋 Status row ${acc.account}:`, rowsStatusForAccount.length);

// kalau dua-duanya kosong → skip akun
if (rowsForAccount.length === 0 && rowsStatusForAccount.length === 0) {
  console.log("⏭️ Tidak ada jadwal group & status hari ini");
  continue;
}
      

await page.goto("https://m.facebook.com", { waitUntil: "networkidle2" });
    console.log("👉 BUKA FACEBOOK.COM");

      await page.waitForTimeout(3000);
      console.log("👉 Tunggu 3 detik")
      
      await page.setCookie(
     ...acc.cookies.map(c => ({
       name: c.name,
       value: c.value,
       domain: ".facebook.com",
       path: "/",
      secure: true
     }))
     );

    await page.reload({ waitUntil: "networkidle2" });

      // ✅ LANGSUNG POSTGROUP PAKAI DATA
//  for (const row of rowsForAccount) {
  //  await runAccount(page, row);
   //  }
      // POST STATUS (kalau ada)
 for (const row of rowsStatusForAccount) {
    await runStatus(page, row);
  }

      // ===== Stop recorder
      await recorder.stop();
     console.log(`🎬 Rekaman selesai: recording_${acc.account}.mp4`);

      await page.close();
      await context.close();
      console.log(`✅ Posting selesai untuk ${acc.account}`);
    //await delay(6000); // jeda aman antar akun
     const delayRow = rowsForAccount.find(r => r.delay_akun);
    const delayAkun = Number(delayRow?.delay_akun) || 60000;
   console.log(
  "🕒 Delay dari row tanggal:",
  delayRow?.delay_akun,
  "→ dipakai:",
  delayAkun
);

await delay(delayAkun);
console.log(
  "DEBUG tanggal:",
  rowsForAccount.map(r => ({
    tanggal_raw: r.tanggal,
    tanggal_parse: parseTanggalXLSX(r.tanggal),
    delay_akun: r.delay_akun
  }))
);
      
    }

    await browser.close();
    console.log("🎉 Semua akun selesai");
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
      
