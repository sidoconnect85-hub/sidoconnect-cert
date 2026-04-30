const express    = require("express");
const puppeteer  = require("puppeteer-core");
const chromium   = require("@sparticuz/chromium");
const app        = express();

app.use(express.json({ limit: "2mb" }));

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
    ? `<div class="founder-badge">🏅 FOUNDING MEMBER &nbsp;#${String(partnerNumber).padStart(3,"0")}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: 297mm;
    height: 210mm;
    overflow: hidden;
    background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%);
    font-family: Georgia, serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10mm;
  }

  .cert {
    background: white;
    width: 100%;
    height: 100%;
    border: 12px solid #d4af37;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* Inner gold line */
  .cert::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1.5px solid rgba(212,175,55,0.4);
    border-radius: 6px;
    pointer-events: none;
    z-index: 0;
  }

  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 70px;
    color: rgba(26,71,42,.04);
    font-weight: bold;
    letter-spacing: 8px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 0;
  }

  /* Header */
  .cert-header {
    background: linear-gradient(135deg, #1a472a, #2d5a3d);
    color: white;
    text-align: center;
    padding: 10px 20px 8px;
    position: relative;
    z-index: 1;
  }

  .cert-header img.logo {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid #d4af37;
    vertical-align: middle;
    margin-right: 12px;
  }

  .cert-header .header-text {
    display: inline-block;
    vertical-align: middle;
    text-align: left;
  }

  .cert-header .company {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .cert-header .tagline {
    font-size: 10px;
    color: #d4af37;
    font-style: italic;
    letter-spacing: 1px;
  }

  /* Gold divider */
  .divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
    margin: 0;
  }

  /* Body */
  .cert-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 30px;
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .ornament {
    font-size: 18px;
    color: #d4af37;
    letter-spacing: 8px;
    margin: 3px 0;
  }

  .cert-title {
    font-size: 26px;
    font-weight: bold;
    color: #1a472a;
    letter-spacing: 4px;
    text-transform: uppercase;
    margin: 2px 0;
  }

  .cert-subtitle {
    font-size: 11px;
    color: #d4af37;
    font-style: italic;
    margin-bottom: 4px;
  }

  .founder-badge {
    display: inline-block;
    background: #d4af37;
    color: #1a472a;
    font-weight: bold;
    font-size: 10px;
    padding: 4px 16px;
    border-radius: 20px;
    letter-spacing: 1px;
    margin: 3px 0;
  }

  .certify {
    font-size: 11px;
    color: #888;
    margin: 3px 0;
  }

  .partner-name {
    font-size: 26px;
    font-weight: bold;
    color: #1a472a;
    text-transform: uppercase;
    letter-spacing: 3px;
    border-bottom: 2.5px solid #d4af37;
    padding-bottom: 4px;
    margin: 4px 0 6px;
  }

  .company-name {
    font-size: 14px;
    font-weight: bold;
    color: #1a472a;
    margin: 2px 0;
  }

  .agreement-type {
    font-size: 10px;
    color: #888;
    font-style: italic;
    margin-bottom: 8px;
  }

  /* Details grid */
  .details {
    display: flex;
    gap: 6px;
    margin: 6px 0;
    width: 100%;
    max-width: 680px;
  }

  .detail-box {
    flex: 1;
    background: #f8f9fa;
    border-left: 3px solid #1a472a;
    border-radius: 0 4px 4px 0;
    padding: 5px 8px;
    text-align: left;
  }

  .detail-label {
    font-size: 8px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: Arial, sans-serif;
  }

  .detail-value {
    font-size: 11px;
    font-weight: bold;
    color: #1a472a;
    font-family: Arial, sans-serif;
  }

  /* Seal / signature */
  .seal {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1.5px solid #d4af37;
    width: 100%;
    max-width: 680px;
    justify-content: center;
  }

  .seal-text {
    font-size: 9px;
    color: #888;
    font-style: italic;
    flex: 1;
    text-align: left;
  }

  .sig-block {
    text-align: center;
  }

  .sig-block img {
    height: 38px;
    width: auto;
    display: block;
    margin: 0 auto 2px;
  }

  .sig-name {
    font-size: 11px;
    font-weight: bold;
    color: #1a472a;
  }

  .sig-title {
    font-size: 9px;
    color: #888;
  }

  /* Footer */
  .cert-footer {
    background: linear-gradient(135deg, #1a472a, #2d5a3d);
    color: rgba(255,255,255,0.8);
    text-align: center;
    padding: 5px;
    font-size: 9px;
    letter-spacing: 1px;
    position: relative;
    z-index: 1;
  }
</style>
</head>
<body>
<div class="cert">
  <div class="watermark">SIDOCONNECT</div>

  <!-- Header -->
  <div class="cert-header">
    <img class="logo" src="https://sidoconnect.name.ng/images/favicon.jpg" alt="Logo">
    <div class="header-text">
      <div class="company">☪️ &nbsp;Sidoconnect Partnership</div>
      <div class="tagline">Building Wealth the Halal Way &nbsp;·&nbsp; Shariah-Compliant Musharaka</div>
    </div>
  </div>
  <div class="divider"></div>

  <!-- Body -->
  <div class="cert-body">
    <div class="ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
    <div class="cert-title">Partnership Certificate</div>
    <div class="cert-subtitle">Shariah-Compliant Musharaka Investment &nbsp;·&nbsp; 0% Riba</div>

    ${founderBadge}

    <div class="certify">This is to certify that</div>
    <div class="partner-name">${name}</div>
    <div class="certify">has become a valued partner in</div>
    <div class="company-name">Sidoconnect Partnership</div>
    <div class="agreement-type">through a Musharaka Partnership Agreement</div>

    <!-- Details -->
    <div class="details">
      <div class="detail-box">
        <div class="detail-label">Partner ID</div>
        <div class="detail-value">${partnerId}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Capital Invested</div>
        <div class="detail-value">₦${Number(capital).toLocaleString()}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Units Held</div>
        <div class="detail-value">${Number(units).toLocaleString()}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Ownership</div>
        <div class="detail-value">${pct}%</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Partner Tier</div>
        <div class="detail-value">${tier}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Date Issued</div>
        <div class="detail-value">${date}</div>
      </div>
    </div>

    <!-- Seal -->
    <div class="seal">
      <div class="seal-text">
        This certificate is issued in accordance with<br>Islamic Shariah principles. All rights reserved.
      </div>
      <div class="sig-block">
        <img src="https://sidoconnect.name.ng/images/signature.png" alt="Signature">
        <div class="sig-name">Raifu Adekunle</div>
        <div class="sig-title">Founder · Sidoconnect Partnership</div>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Footer -->
  <div class="cert-footer">
    ☪️ &nbsp; Sidoconnect Partnership &nbsp;·&nbsp; Shariah-Compliant Musharaka Investment &nbsp;·&nbsp; 0% Riba &nbsp;·&nbsp; sidoconnect.name.ng &nbsp;·&nbsp; ${partnerId}
  </div>
</div>
</body>
</html>`;

  try {
    const browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: { width: 1122, height: 794 },
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      width:           "297mm",
      height:          "210mm",
      printBackground: true,
      pageRanges:      "1",
    });
    await browser.close();

    const base64 = Buffer.from(pdf).toString("base64");
    res.json({ pdf: "data:application/pdf;base64," + base64 });

  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("Sidoconnect Certificate Server running ✅"));

app.listen(process.env.PORT || 3000, () => console.log("Server started"));
