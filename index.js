import fs from "node:fs/promises";
import path from "node:path";
import CachedFetch from "@11ty/eleventy-fetch";

const breaches = await CachedFetch("https://haveibeenpwned.com/api/breaches", {duration: "1h", type:"json"});

let domains = breaches.reduce((set, {Domain}) => {
  if (Domain) {
    set.add(Domain);
  }
  return set;
}, new Set());
domains = Array.from(domains).sort();

const errors = [];

for (const domain of domains) {
  await fetchLogo(domain);
}

async function fetchLogo(domain="", size=64) {
  if (!domain) {
    throw new Error(`Missing domain: "${domain}"`);
  }
  try {
    try {
      const logoBuffer = await CachedFetch(`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size}`, {
        duration: "2w",
        type: "buffer",
      });
      await fs.writeFile(path.join("logo_cache", `${domain}.png`), logoBuffer);
      return logoBuffer;
    } catch (err) {
      const logoBuffer = await CachedFetch(`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=${size}`, {
        duration: "2w",
        type: "buffer",
      });
      await fs.writeFile(path.join("logo_cache", `${domain}.png`), logoBuffer);
      return logoBuffer;
    }
  } catch (err) {
    const e = new Error(`Unable to fetch logo for "${domain}"`, {cause: err.message});
    errors.push(e);
  }
}

if (errors) {
  for (const err of errors) {
    console.log(err.message);
  }
}
