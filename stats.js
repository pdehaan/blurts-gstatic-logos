import fs from "node:fs/promises";
import path from "node:path";
import bytes from "bytes";
import sizeOf from "image-size";

const LOGO_DIR = "logo_cache";
const BYTES_OPTS = {
  decimalPlaces: 1,
  unit: "KB",
  unitSeparator: " ",
};

const logos = await fs.readdir("logo_cache");

const results = [];
const errors = [];

console.log(`LOGO | DIMENSIONS | TYPE | SIZE\n:----|:----:|:----:|----:|`)
for (const logo of logos.filter((logo) => logo.endsWith(".png"))) {
  const logoPath = path.join(LOGO_DIR, logo);
  try {
    const res = sizeOf(logoPath);
    if (res.images) {
      const biggest = res.images.reduce((acc, curr) => {
        if (curr.width * curr.height > acc.width * acc.height) {
          return curr;
        }
        return acc;
      });
      res.width = biggest.width;
      res.height = biggest.height;
    }
    let { width, height } = res;
    const { size } = await fs.stat(logoPath);
    console.log(
      `${logo} | ${width}×${height} | ${res.type} | ${bytes(size, BYTES_OPTS)}`
    );
    results.push({logo, ...res, dimensions: `${width}×${height}`, size});
  } catch (err) {
    errors.push(`[${logoPath}] ${err.message}`);
  }
}

console.log("\n\n" + errors.join("\n"));
await fs.writeFile("stats.json", JSON.stringify({results, errors}, null, 2));
