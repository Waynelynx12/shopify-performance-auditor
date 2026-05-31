const fs = require("fs");
const path = require("path");

function generateHTMLReport(auditData) {
  const issueRows = auditData.issues
    .map(
      (issue) => `
      <tr class="severity-${issue.severity}">
        <td>${issue.type}</td>
        <td><span class="badge ${issue.severity}">${issue.severity}</span></td>
        <td>${issue.score || "See details"}</td>
        <td>${issue.recommendation}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Audit: ${auditData.store}</title>
  <style>
    body { font-family: system-ui; max-width: 900px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #1a1a1a; }
    .score-card { background: white; border-radius: 12px; padding: 24px; margin: 20px 0; display: flex; gap: 40px; }
    .score { font-size: 64px; font-weight: 800; }
    .score.poor { color: #e74c3c; }
    .score.average { color: #f39c12; }
    .score.good { color: #2ecc71; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; }
    th { background: #1a1a1a; color: white; padding: 12px 16px; text-align: left; }
    td { padding: 12px 16px; border-bottom: 1px solid #eee; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; color: white; }
    .badge.high { background: #e74c3c; }
    .badge.medium { background: #f39c12; }
    .badge.low { background: #2ecc71; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Shopify Performance Audit</h1>
  <p class="meta">Store: ${auditData.store} | Date: ${auditData.audit_date}</p>

  <div class="score-card">
    <div>
      <p>Mobile Score</p>
      <div class="score ${auditData.mobile_score < 50 ? "poor" : auditData.mobile_score < 90 ? "average" : "good"}">
        ${auditData.mobile_score}
      </div>
    </div>
    <div>
      <p>Issues Found</p>
      <div class="score poor">${auditData.issues.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Issue Type</th>
        <th>Severity</th>
        <th>Score</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>
      ${issueRows}
    </tbody>
  </table>
</body>
</html>`;

  const dir = path.join(__dirname, "../reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filename = `audit-${Date.now()}.html`;
  fs.writeFileSync(path.join(dir, filename), html);
  console.log(`HTML report saved to reports/${filename}`);
}

module.exports = { generateHTMLReport };
