const express   = require("express");
const puppeteer = require("puppeteer");
const app       = express();

app.use(express.json({ limit: "2mb" }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/generate-cert", async (req, res) => {
  const { name, partnerId, capital, units, tier,
          isFoundingMember, partnerNumber, date, pct } = req.body;

  const founderBadge = isFoundingMember
    ? `<div style="display:inline-block;background:#d4af37;color:#1a472a;font-weight:bold;
        font-size:13px;padding:6px 18px;border-radius:20px;margin:10px 0;letter-spacing:1px">
        🏅 FOUNDING MEMBER #${String(partnerNumber).padStart(3,"0")}</div>`
    : "";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin:0; padding:20px; background:linear-gradient(135deg,#1a472a,#2d5a3d);
         font-family:Georgia,serif; min-height:100vh; display:flex;
         align-items:center; justify-content:center; }
  .cert { background:white; padding:35px 45px; border:16px solid #d4af37;
          border-radius:10px; box-shadow:0 0 30px rgba(0,0,0,.4);
          text-align:center; position:relative; width:100%; }
  .watermark { position:absolute; top:50%; left:50%;
               transform:translate(-50%,-50%) rotate(-30deg);
               font-size:85px; color:rgba(26,71,42,.04);
               font-weight:bold; letter-spacing:8px;
               pointer-events:none; white-space:nowrap; }
  .logo img { max-width:85px; height:auto; border-radius:50%;
              border:3px solid #d4af37; margin-bottom:8px; }
  .ornament { font-size:26px; color:#d4af37; margin:6px 0; letter-spacing:6px; }
  .title { color:#1a472a; font-size:34px; font-weight:bold;
           letter-spacing:3px; text-transform:uppercase; margin:6px 0; }
  .subtitle { color:#d4af37; font-size:15px; font-style:italic; margin-bottom:12px; }
  .certify { font-size:14px; color:#666; margin:6px 0; }
  .name { font-size:28px; font-weight:bold; color:#1a472a;
          border-bottom:3px solid #d4af37; display:inline-block;
          padding:0 20px 5px; margin:8px 0; letter-spacing:2px;
          text-transform:uppercase; }
  .company { font-size:18px; color:#1a472a; font-weight:bold; margin:6px 0; }
  .details { margin:14px auto; max-width:480px; font-size:13px; text-align:left; }
  .detail-row { display:flex; justify-content:space-between; padding:7px 12px;
                background:#f8f9fa; border-left:4px solid #1a472a;
                margin:4px 0; border-radius:0 4px 4px 0; }
  .detail-label { font-weight:bold; color:#1a472a; }
  .detail-value { color:#333; }
  .seal { border-top:2px solid #d4af37; margin-top:14px; padding-top:12px; }
  .sig img { max-width:140px; height:auto; margin-bottom:4px; }
  .sig-name { font-weight:bold; font-size:13px; color:#1a472a; }
  .sig-title { font-size:10px; color:#666; }
</style></head><body>
<div class="cert">
  <div class="watermark">SIDOCONNECT</div>
  <div class="logo">
    <img src="https://sidoconnect.name.ng/images/favicon.jpg" alt="Logo">
  </div>
  <div class="ornament">☪️</div>
  <div class="title">Partnership Certificate</div>
  <div class="subtitle">Shariah-Compliant Musharaka Investment</div>
  <div class="ornament">✦ ✦ ✦</div>
  ${founderBadge}
  <div class="certify">This is to certify that</div>
  <div class="name">${name}</div>
  <div class="certify" style="margin-top:6px">has become a valued partner in</div>
  <div class="company">Sidoconnect Partnership</div>
  <div class="certify" style="font-style:italic;font-size:12px">
    through a Musharaka Partnership Agreement
  </div>
  <div class="details">
    <div class="detail-row">
      <span class="detail-label">Partner ID:</span>
      <span class="detail-value">${partnerId}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Capital Invested:</span>
      <span class="detail-value">₦${Number(capital).toLocaleString()}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Units Held:</span>
      <span class="detail-value">${Number(units).toLocaleString()}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Ownership:</span>
      <span class="detail-value">${pct}%</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Partner Tier:</span>
      <span class="detail-value">${tier}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Date Issued:</span>
      <span class="detail-value">${date}</span>
    </div>
  </div>
  <div class="seal">
    <p style="font-size:11px;color:#666;margin-bottom:10px">
      This certificate is issued in accordance with Islamic Shariah principles
    </p>
    <div class="sig">
      <img src="https://sidoconnect.name.ng/images/signature.png" alt="Signature">
      <div class="sig-name">Raifu Adekunle</div>
      <div class="sig-title">Founder · Sidoconnect Partnership</div>
    </div>
  </div>
  <div class="ornament" style="margin-top:10px">☪️</div>
</div>
</body></html>`;

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox",
             "--disable-dev-shm-usage", "--disable-gpu"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4", landscape: true,
      printBackground: true
    });
    await browser.close();

    // Return as base64 so the portal can store it in Firestore
    const base64 = Buffer.from(pdf).toString("base64");
    res.json({ pdf: "data:application/pdf;base64," + base64 });

  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("Sidoconnect Certificate Server running ✅"));

app.listen(process.env.PORT || 3000, () => console.log("Server started"));
