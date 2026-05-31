const https = require("https");
const http = require("http");
const { URL } = require("url");

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function extractLinks(html, baseUrl) {
  const links = new Set();
  const linkPattern = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl);
      if (url.hostname === new URL(baseUrl).hostname) {
        links.add(url.href);
      }
    } catch {
      continue;
    }
  }

  return [...links];
}

async function crawlStore(storeUrl, maxPages = 10) {
  console.log(`Crawling store: ${storeUrl}`);
  const visited = new Set();
  const queue = [storeUrl];
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();

    if (visited.has(url)) continue;
    visited.add(url);

    try {
      console.log(`Crawling: ${url}`);
      const html = await fetchPage(url);
      const links = await extractLinks(html, storeUrl);

      pages.push({ url, html });
      queue.push(...links.filter((l) => !visited.has(l)));
    } catch (error) {
      console.error(`Failed to crawl: ${url}`);
    }
  }

  console.log(`Crawl complete. Pages found: ${pages.length}`);
  return pages;
}

module.exports = { crawlStore };
