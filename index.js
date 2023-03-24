import fs from "node:fs/promises";
import path from "node:path";
import CachedFetch from "@11ty/eleventy-fetch";

const breaches = await fetchBreaches();
await fetchLogos(breaches);

async function fetchBreaches() {
  return CachedFetch("https://haveibeenpwned.com/api/breaches", {
    duration: "12h",
    type: "json",
  });
}

async function fetchLogos(breaches= []) {
  // Remove any duplicate domains (not that it matters since we aggressively cache locally).
  let domains = breaches.reduce((set, { Domain }) => {
    if (Domain) set.add(Domain);
    return set;
  }, new Set());
  domains = Array.from(domains).sort();

  const errors = [];

  for (const domain of domains) {
    await fetchLogo(domain)
      .catch(err => errors.push(err));
  }

  if (errors) {
    for (const err of errors) {
      console.log(err.message);
    }
  }
}



async function fetchLogo(domain = "") {
  return _fetcher(domain);
}

async function _fetcher(
  domain,
  protocol = "https",
  size = 64,
  duration = "2w"
) {
  if (!domain) {
    throw new Error(`Missing domain: "${domain}"`);
  }
  try {
    const logoBuffer = await CachedFetch(
      `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${protocol}://${domain}&size=${size}`,
      {
        duration,
        type: "buffer",
      }
    );
    await fs.writeFile(path.join("logo_cache", `${domain}.png`), logoBuffer);
    return logoBuffer;
  } catch (err) {
    if (protocol === "https") {
      return _fetcher(domain, "http", size, duration);
    }
    throw new Error(`Unable to fetch logo for "${domain}"`, { cause: err.message });
  }
}
