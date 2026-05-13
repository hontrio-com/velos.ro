/**
 * Generează iconițele PWA (192x192 și 512x512) în public/icons/
 * Rulează o singură dată: node scripts/generate-icons.mjs
 * Requires: sharp (deja în dependencies)
 */

import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");

mkdirSync(outDir, { recursive: true });

// SVG simplu: fundal albastru #1877F2, text "ITP" alb
function makeSvg(size) {
  const fontSize = Math.round(size * 0.32);
  const radius = Math.round(size * 0.2);
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#1877F2"/>
      <text
        x="50%" y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="white"
        letter-spacing="2"
      >ITP</text>
    </svg>
  `);
}

for (const size of [192, 512]) {
  await sharp(makeSvg(size))
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
  console.log(`✓ public/icons/icon-${size}.png`);
}

console.log("Done! Înlocuiește fișierele cu iconițe branded dacă vrei.");
