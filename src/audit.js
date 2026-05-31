const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const fs = require("fs");
const path = require("path");

const STORE_URL = process.env.STORE_URL || process.argv[3];
const OUTPUT_FORMAT = process.env.OUTPUT_FORMAT || "json";

async function runAudit(url) {
  console.log(`Starting performance audit for: ${url}`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox"],
  });

  const options = {
    logLevel: "error",
    output: OUTPUT_FORMAT,
    onlyCategories: ["performance"],
    port: chrome.port,
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
    },
  };

  try {
    const result = await lighthouse(url, options);
    const report = result.lhr;

    const auditOutput = {
      store: url,
      audit_date: new Date().toISOString().split("T")[0],
      mobile_score: Math.round(report.categories.performance.score * 100),
      issues: extractIssues(report),
    };

    saveReport(auditOutput);
    return auditOutput;
  } finally {
    await chrome.kill();
  }
}

function extractIssues(report) {
  const issues = [];

  if (report.audits["cumulative-layout-shift"].score < 0.9) {
    issues.push({
      type: "cls",
      severity: "high",
      score: report.audits["cumulative-layout-shift"].displayValue,
      recommendation: "Add explicit width and height to images and embeds",
    });
  }

  if (report.audits["render-blocking-resources"].score < 0.9) {
    issues.push({
      type: "render_blocking",
      severity: "high",
      details: report.audits["render-blocking-resources"].details,
      recommendation: "Add defer or async attributes to non-critical scripts",
    });
  }

  if (report.audits["uses-optimized-images"].score < 0.9) {
    issues.push({
      type: "uncompressed_image",
      severity: "medium",
      details: report.audits["uses-optimized-images"].details,
      recommendation: "Convert images to WebP and compress below 200kb",
    });
  }

  if (report.audits["server-response-time"].score < 0.9) {
    issues.push({
      type: "ttfb",
      severity: "high",
      score: report.audits["server-response-time"].displayValue,
      recommendation: "Enable Shopify CDN and reduce app overhead",
    });
  }

  if (report.audits["largest-contentful-paint"].score < 0.9) {
    issues.push({
      type: "lcp",
      severity: "high",
      score: report.audits["largest-contentful-paint"].displayValue,
      recommendation: "Preload hero image and optimize font loading",
    });
  }

  return issues;
}

function saveReport(output) {
  const dir = path.join(__dirname, "../reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filename = `audit-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(dir, filename),
    JSON.stringify(output, null, 2)
  );

  console.log(`Audit complete. Report saved to reports/${filename}`);
  console.log(`Mobile Score: ${output.mobile_score}`);
  console.log(`Issues found: ${output.issues.length}`);
}

runAudit(STORE_URL);
