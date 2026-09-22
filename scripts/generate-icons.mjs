import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const source = new URL('../public/icons/icon.svg', import.meta.url);
for (const [name, size] of [
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
  ['icons/maskable-512.png', 512],
  ['icons/apple-touch-icon.png', 180],
  ['logo192.png', 192],
]) {
  await sharp(source.pathname)
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/${name}`, import.meta.url).pathname);
}
// ICO supports a PNG payload. Keep the legacy browser favicon URL valid too.
const png = await sharp(source.pathname).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([header, png]));
