"use strict";

/*
  index.js
  Gabungan script lengkap untuk:
  - Multi-akun Facebook posting + like berdasarkan schedule di Excel (sheet "posting" dan "like")
  - Ambil cookies dari GitHub Secrets / environment variables (COOKIES_JSON / COOKIES / COOKIES_<USERNAME>)
  - Download media dari GitHub Release
  - Upload media ke composer Facebook
  - Penjadwalan dengan Luxon (Asia/Jakarta) + jitter (± menit)
  - Delay acak antar akun dan antar aksi
  - Recorder opsional (PuppeteerScreenRecorder)

  Dependensi:
    npm install puppeteer-extra puppeteer-extra-plugin-stealth puppeteer puppeteer-screen-recorder xlsx luxon
*/

const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const xlsx = require("xlsx");
const { DateTime } = require("luxon");

puppeteer.use(StealthPlugin());

// ===== Helpers
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomMs(minMs, maxMs) {
  return randomInt(minMs, maxMs);
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function safeJsonParse(s, fallback = null) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return fallback;
  }
}

// ===== Safe click helpers
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

// ===== Media download from GitHub Release
const mediaFolder = path.join(__dirname, "media");
if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder, { recursive: true });

async function downloadMedia(url, filename) {
  const filePath = path.join(mediaFolder, filename);
  const options = { headers: { "User-Agent": "Mozilla/5.0 (PuppeteerBot)" } };

  return new Promise((resolve, reject) => {
    const request = https.get(url, options, (res) => {
      console.log("🌐 GET:", url);
      console.log("🔢 Status:", res.statusCode);
      console.log("📎 Location:", res.headers.location || "(tidak ada)");

      // Redirect handling
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log("🔁 Redirect ke:", res.headers.location);
        return resolve(downloadMedia(res.headers.location, filename));
      }

      if (res.statusCode !== 200) {
        reject(new Error(`❌ Gagal download media: ${res.statusCode}`));
        return;
      }

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

// ===== Upload media to Facebook composer
async function uploadMedia(page, filePath, fileName) {
  console.log(`🚀 Mulai upload media: ${fileName}`);

  const ext = path.extname(fileName).toLowerCase();
  let label = "Photos";
  if ([".mp4", ".mov"].includes(ext)) label = "Video";

  console.log(`🧩 Deteksi ekstensi ${ext}, target tombol: ${label}`);

  // Try to click Photos/Video button if available
  const clicked = await page.evaluate((label) => {
    const btn = [...document.querySelectorAll('div[role="button"]')].find(div => {
      const txt = (div.innerText || "").toLowerCase();
      const aria = (div.getAttribute("aria-label") || "").toLowerCase();
      return txt.includes("photos") || txt.includes("video") || txt.includes("foto") || aria.includes("photo") || aria.includes("video");
    });

    if (!btn) return false;
    ["pointerdown","mousedown","touchstart","mouseup","pointerup","touchend","click"].forEach(evt => {
      btn.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
    });
    return true;
  }, label);

  await page.waitForTimeout(2000);

  const fileInput = (await page.$('input[type="file"][accept="image/*"]')) ||
                    (await page.$('input[type="file"][accept*="video/*"]')) ||
                    (await page.$('input[type="file"]'));
  if (!fileInput) {
    console.log("❌ Input file tidak ditemukan, upload gagal");
    return false;
  }

  await fileInput.uploadFile(filePath);
  console.log(`✅ File ${fileName} berhasil di-upload ke input`);

  // Inject File object so React detects it
  const fileNameOnly = path.basename(filePath);
  const mimeType = ext === ".mp4" ? "video/mp4" : (ext === ".png" ? "image/png" : "image/jpeg");
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString("base64");

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
      if (!input) throw new Error("❌ Input file tidak ditemukan");

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      ["input", "change"].forEach(evt =>
        input.dispatchEvent(new Event(evt, { bubbles: true }))
      );

      console.log("⚡ File injected ke React dengan File API browser");
    },
    { fileNameOnly, base64Data, mimeType }
  );

  console.log(`✅ File ${fileNameOnly} berhasil diinject sebagai File object`);

  await page.evaluate(() => {
    const input = document.querySelector('input[type="file"]');
    if (input) {
      const events = ["input", "change", "focus", "blur", "keydown", "keyup"];
      events.forEach(evt => input.dispatchEvent(new Event(evt, { bubbles: true, cancelable: true })));
    }
  });
  console.log("⚡ Event React input/change/keydown/keyup dikirim");

  // Wait preview
  try {
    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      console.log("⏳ Tunggu foto preview...");
      await page.waitForSelector(
        [
          'div[data-mcomponent="ImageArea"] img[src^="data:image"]',
          'img[src^="blob:"]',
          'div[aria-label="Photo preview"] img',
        ].join(", "),
        { timeout: 60000 }
      );
      console.log("✅ Foto preview ready");
    } else if ([".mp4", ".mov"].includes(ext)) {
      console.log("⏳ Tunggu preview video ...");
      await page.waitForSelector('div[data-mcomponent="ImageArea"] img[data-type="image"]', { timeout: 120000 });
      await page.waitForFunction(() => {
        const thumbs = [...document.querySelectorAll('div[data-mcomponent="ImageArea"] img[data-type="image"]')];
        return thumbs.some(img =>
          img.src &&
          !img.src.includes("rsrc.php") &&
          !img.src.startsWith("data:,") &&
          (img.src.includes("fbcdn.net") || img.src.startsWith("blob:"))
        );
      }, { timeout: 60000 });
      console.log("✅ Video thumbnail sudah berubah → preview ready");
    }
    await page.waitForTimeout(3000);
    console.log("⏳ Tambahan waktu encode 3 detik selesai");
  } catch (e) {
    console.log("⚠️ Preview tidak muncul dalam batas waktu, paksa lanjut...");
  }

  const screenshotPath = path.join(__dirname, "media", `after_upload_${Date.now()}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot preview media tersimpan: ${screenshotPath}`);
  } catch (e) {
    // ignore
  }

  return true;
}

// ===== Excel helpers
function readWorkbook(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file tidak ditemukan: ${filePath}`);
  }
  const wb = xlsx.readFile(filePath);
  return wb;
}
function sheetToJSON(wb, sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return xlsx.utils.sheet_to_json(sheet, { defval: "" });
}

// ===== Cookies loader (from env / GitHub Secrets)
function loadCookiesFromEnv() {
  const results = [];
  const envJSON = process.env.COOKIES_JSON || process.env.COOKIES;
  if (envJSON) {
    const parsed = safeJsonParse(envJSON, null);
    if (Array.isArray(parsed)) {
      parsed.forEach((it) => {
        if (it && it.username && Array.isArray(it.cookies)) results.push({ username: it.username, cookies: it.cookies });
      });
    } else {
      console.log("⚠️ COOKIES/COOKIES_JSON ditemukan tapi bukan array JSON. Gunakan format JSON array.");
    }
  }

  Object.keys(process.env).forEach((k) => {
    if (/^COOKIES_/i.test(k) && k !== "COOKIES" && k !== "COOKIES_JSON") {
      const username = k.replace(/^COOKIES_/i, "");
      const parsed = safeJsonParse(process.env[k], null);
      if (Array.isArray(parsed)) {
        results.push({ username: username, cookies: parsed });
      } else {
        console.log(`⚠️ Env ${k} tidak berisi JSON array. Isi harus berupa JSON array cookies.`);
      }
    }
  });

  if (results.length === 0) {
    console.log("⚠️ Tidak menemukan cookies di env. Pastikan secret COOKIES/COOKIES_JSON atau COOKIES_<USERNAME> tersedia.");
  } else {
    console.log(`🔐 Ditemukan cookies untuk ${results.length} akun:`, results.map(r => r.username));
  }

  return results;
}

// ===== Date/time helpers (Luxon Asia/Jakarta)
function parseDateTimeJakarta(dateStr, timeStr) {
  const zone = "Asia/Jakarta";
  const t = (timeStr || "00:00").toString().trim();
  let dt = DateTime.fromISO(`${dateStr}T${t}`, { zone });
  if (!dt.isValid) {
    dt = DateTime.fromFormat(`${dateStr} ${t}`, "dd/MM/yyyy HH:mm", { zone });
  }
  if (!dt.isValid) {
    dt = DateTime.fromFormat(`${dateStr} ${t}`, "yyyy-MM-dd HH:mm", { zone });
  }
  if (!dt.isValid) {
    const jsDate = new Date(`${dateStr} ${t}`);
    if (!isNaN(jsDate)) {
      dt = DateTime.fromJSDate(jsDate, { zone });
    }
  }
  if (!dt.isValid) {
    throw new Error(`Tidak dapat parse tanggal/waktu: ${dateStr} ${t}`);
  }
  return dt;
}
function applyJitter(dt, jitterMinutes = 5) {
  const jitter = randomInt(-jitterMinutes, jitterMinutes);
  return dt.plus({ minutes: jitter });
}

// ===== Main flow
(async () => {
  try {
    console.log("🚀 Start bot with multi-account scheduling...");

    // Config via env
    const excelFile = process.env.SCHEDULE_XLSX || path.join(__dirname, "schedule.xlsx");
    const accountMinDelaySec = parseInt(process.env.ACCOUNT_MIN_DELAY_SEC || "10", 10); // min random delay between accounts
    const accountMaxDelaySec = parseInt(process.env.ACCOUNT_MAX_DELAY_SEC || "300", 10); // max random delay between accounts
    const scheduleJitterMinutes = parseInt(process.env.SCHEDULE_JITTER_MINUTES || "5", 10); // ± minutes window
    const zone = "Asia/Jakarta";

    // Read cookies from env (GitHub Secrets)
    const accounts = loadCookiesFromEnv();
    if (accounts.length === 0) {
      throw new Error("Tidak ada akun (cookies) ditemukan di env. Batal.");
    }

    // Read schedule excel
    const wb = readWorkbook(excelFile);
    const postingRows = sheetToJSON(wb, "posting");
    const likeRows = sheetToJSON(wb, "like");

    console.log(`📥 Jadwal posting: ${postingRows.length} baris; Jadwal like: ${likeRows.length} baris`);

    // Preprocess posting rows into a map by username
    function groupRowsByUsername(rows) {
      const map = {};
      rows.forEach((r, idx) => {
        const user = (r.username || r.Username || "").toString().trim();
        if (!user) return;
        if (!map[user]) map[user] = [];
        map[user].push({ row: r, idx });
      });
      return map;
    }
    const postingByUser = groupRowsByUsername(postingRows);
    const likeByUser = groupRowsByUsername(likeRows);

    // Process each account sequentially (but with random delay between starts)
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      console.log(`\n🔑 Memproses akun ${i + 1}/${accounts.length}: ${acc.username}`);

      // Random delay before starting this account (to avoid parallel starts)
      const accountDelayMs = randomMs(accountMinDelaySec * 1000, accountMaxDelaySec * 1000);
      console.log(`⏳ Delay acak antar akun: ${Math.round(accountDelayMs / 1000)} detik`);
      await delay(accountDelayMs);

      // Launch browser for this account
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

      page.on("console", msg => console.log(`📢 [Browser ${acc.username}]`, msg.text()));
      page.on("pageerror", err => console.log(`💥 [Browser Error ${acc.username}]`, err.message));
      page.on("response", res => {
        if (!res.ok()) console.log(`⚠️ [HTTP ${res.status()}] ${res.url()}`);
      });

      // Recorder optional
      let recorder;
      try {
        recorder = new PuppeteerScreenRecorder(page);
        await recorder.start(path.join(__dirname, `recording_${acc.username || i}.mp4`));
      } catch (e) {
        console.log("⚠️ Recorder tidak bisa dijalankan:", e.message);
      }

      // Anti-detect
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

      // Set cookies for this account
      try {
        await page.setCookie(...acc.cookies);
        console.log("✅ Cookies set for", acc.username);
      } catch (e) {
        console.log("❌ Gagal set cookies untuk", acc.username, e.message);
      }

      // Go to home to ensure login with cookies
      await page.goto("https://m.facebook.com/", { waitUntil: "networkidle2" });
      await page.waitForTimeout(3000);

      // Handle posting schedule for this user
      const userPosting = postingByUser[acc.username] || [];
      for (const p of userPosting) {
        const r = p.row;
        const status = (r.status || r.Status || "").toString().trim().toLowerCase();
        if (status !== "start") {
          console.log(`ℹ️ Posting row idx ${p.idx} status=${status} => skip`);
          continue;
        }

        // Compose schedule time
        try {
          const dt = parseDateTimeJakarta((r.date || r.tanggal || r.Date || ""), (r.time || r.jam || r.Time || ""));
          const dtWithJitter = applyJitter(dt, scheduleJitterMinutes);
          console.log(`🕒 Dijadwalkan untuk: ${dt.withZone(zone).toISO()} (jittered -> ${dtWithJitter.toISO()})`);

          const now = DateTime.now().setZone(zone);
          if (dtWithJitter > now) {
            const msToWait = Math.max(0, dtWithJitter.toMillis() - now.toMillis());
            console.log(`⏳ Menunggu ${Math.round(msToWait / 1000)} detik sampai jadwal...`);
            await delay(msToWait);
          } else {
            console.log("⏩ Waktu sudah lewat, menjalankan segera");
          }

          // At scheduled time: open group links and post
          const rawLinks = (r["link group"] || r["link_group"] || r.link || r.links || r["Link Group"] || "").toString();
          const links = rawLinks.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);

          // Download media if provided
          const mediaUrl = (r["link github release"] || r.media || r["media url"] || "").toString().trim();
          let filePath = null, fileName = null;
          if (mediaUrl) {
            try {
              const today = DateTime.now().setZone(zone).toISODate();
              const urlPath = new URL(mediaUrl).pathname;
              const ext = path.extname(urlPath) || ".png";
              fileName = `media_${acc.username}_${today}${ext}`;
              filePath = await downloadMedia(mediaUrl, fileName);
              console.log("✅ Media downloaded:", filePath);
            } catch (e) {
              console.log("⚠️ Gagal download media, lanjut tanpa media:", e.message);
              filePath = null;
            }
          }

          // Caption
          const caption = (r.caption || r.Caption || "").toString();

          // Iterate group links
          for (const groupLink of links) {
            try {
              console.log(`🔗 Buka group: ${groupLink}`);
              await page.goto(groupLink, { waitUntil: "networkidle2" });
              await page.waitForTimeout(2000 + randomMs(1000, 4000));

              // Klik composer
              let writeClicked = await safeClickXpath(page, "//*[contains(text(),'What's on your mind?')]", "Composer");
              if (!writeClicked) {
                console.log("⚠️ Composer tidak ditemukan, fallback scan");
                await scanAllElementsVerbose(page, "Composer");
              }
              await page.waitForTimeout(1000);

              // Click placeholder using alternative method
              await page.evaluate(() => {
                const btn = [...document.querySelectorAll("div[role='button']")]
                  .find(el => {
                    const t = (el.innerText || "").toLowerCase();
                    return t.includes("what's on your mind?") || t.includes("buat postingan") || t.includes("tulis sesuatu");
                  });
                if (btn) ["mousedown", "mouseup", "click"].forEach(type => btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window })));
              });
              await page.waitForTimeout(1000);

              // Fill caption
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
              await delay(1000 + randomMs(500, 3000));

              // Upload file if any
              if (filePath) {
                await uploadMedia(page, filePath, path.basename(filePath));
                await delay(2000 + randomMs(1000, 5000));
              }

              // Click POST
              await page.evaluate(() => {
                const buttons = [...document.querySelectorAll('div[role="button"]')];
                const postBtn = buttons.find(b => b.innerText && b.innerText.trim().toUpperCase() === "POST");
                if (postBtn) {
                  postBtn.click();
                } else {
                  const fallback = buttons.find(b => /post/i.test(b.innerText || ""));
                  if (fallback) fallback.click();
                }
              });
              console.log("✅ Perintah klik POST dikirim");
              await delay(2000 + randomMs(2000, 6000));
            } catch (err) {
              console.log("❌ Error posting ke group", groupLink, err.message);
            }

            // jeda antar group untuk akun ini (dapat disesuaikan di excel per-row as 'jeda link grupnya' in seconds)
            const perGroupDelaySec = parseInt(r["jeda link grupnya"] || r["jeda"] || r["delay_group_sec"] || "10", 10);
            const extraJitterSec = randomInt(3, 30);
            const totalWait = (perGroupDelaySec + extraJitterSec) * 1000;
            console.log(`⏱ Menunggu ${Math.round(totalWait/1000)} detik sebelum buka grup selanjutnya`);
            await delay(totalWait);
          } // end for links

        } catch (err) {
          console.log("❌ Error scheduling/doing posting row:", err.message);
        }
      } // end posting rows loop

      // Handle likes for this user
      const userLikes = likeByUser[acc.username] || [];
      for (const p of userLikes) {
        const r = p.row;
        const status = (r.status || r.Status || "").toString().trim().toLowerCase();
        if (status !== "start") {
          console.log(`ℹ️ Like row idx ${p.idx} status=${status} => skip`);
          continue;
        }

        // compose schedule time
        try {
          const dt = parseDateTimeJakarta((r.date || r.tanggal || r.Date || ""), (r.time || r.jam || r.Time || ""));
          const dtWithJitter = applyJitter(dt, scheduleJitterMinutes);
          console.log(`🕒 (like) Dijadwalkan untuk: ${dtWithJitter.toISO()}`);

          const now = DateTime.now().setZone(zone);
          if (dtWithJitter > now) {
            const msToWait = Math.max(0, dtWithJitter.toMillis() - now.toMillis());
            console.log(`⏳ Menunggu ${Math.round(msToWait / 1000)} detik sampai jadwal like...`);
            await delay(msToWait);
          } else {
            console.log("⏩ Waktu sudah lewat, menjalankan like segera");
          }

          // get group links (newline or comma separated)
          const rawLinks = (r["link group"] || r["link_group"] || r.link || r.links || "").toString();
          const links = rawLinks.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
          const perGroupDelaySec = parseInt(r["jeda buka link grupnya"] || r["jeda"] || r["delay_group_sec"] || "10", 10);
          const delayLikeMs = parseInt(r["jeda klik tombol like"] || r["delay_like_ms"] || (randomInt(1000, 3000)), 10);

          for (const groupLink of links) {
            try {
              console.log(`🔗 Buka group for like: ${groupLink}`);
              await page.goto(groupLink, { waitUntil: "networkidle2" });
              await page.waitForTimeout(2000 + randomMs(1000, 4000));
              // find like buttons and click up to total specified or continuously
              let totalToLike = parseInt(r["total yang di-like"] || r.total || "10", 10);
              let clicked = 0;

              while (clicked < totalToLike) {
                const button = await page.$(
                  'div[role="button"][aria-label*="Like"],div[role="button"][aria-label*="like"], div[role="button"][aria-label*="Suka"]'
                );
                if (button) {
                  try {
                    await button.tap();
                    clicked++;
                    console.log(`👍 Klik tombol Like ke-${clicked} (group ${groupLink})`);
                    await delay(delayLikeMs + randomMs(500, 2500));
                  } catch (e) {
                    console.log("⚠️ Gagal klik like:", e.message);
                    break;
                  }
                } else {
                  console.log("🔄 Tidak ada tombol Like terlihat, scroll...");
                  await page.evaluate(() => window.scrollBy(0, 400));
                  await delay(1000 + randomMs(500, 1500));
                }
              }

            } catch (err) {
              console.log("❌ Error pada like group", groupLink, err.message);
            }

            // wait between group opens
            const totalWait = (perGroupDelaySec + randomInt(2, 20)) * 1000;
            console.log(`⏱ Menunggu ${Math.round(totalWait / 1000)} detik sebelum buka group like selanjutnya`);
            await delay(totalWait);
          }

        } catch (err) {
          console.log("❌ Error scheduling/doing like row:", err.message);
        }
      } // end like rows

      // stop recorder & close browser
      try {
        if (recorder && recorder.stop) await recorder.stop();
      } catch (e) {
        // ignore recorder errors
      }
      await browser.close();
      console.log(`✅ Selesai memproses akun ${acc.username}`);
    } // end accounts loop

    console.log("🎉 Semua akun selesai diproses.");
  } catch (err) {
    console.error("❌ Error utama:", err);
  }
})();
