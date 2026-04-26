// Generates PWA icons (192/512/512-maskable) as solid-bg PNGs with
// a simple paperclip-ish glyph. No external deps; uses zlib only.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [15, 23, 42];     // slate-950
const GOLD = [251, 191, 36]; // amber-400
const ACCENT = [148, 163, 184]; // slate-400

function makeBuffer(size, drawPixel) {
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawPixel(x, y);
      const i = (y * size + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = a;
    }
  }
  return buf;
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[(width * 4 + 1) * y] = 0; // filter: none
    rgba.copy(raw, (width * 4 + 1) * y + 1, y * width * 4, y * width * 4 + width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const crc32 = (buf) => zlib.crc32 ? zlib.crc32(buf) : crcFallback(buf);

  function crcFallback(buf) {
    // standard CRC32
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcInput = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Paperclip glyph (very simplified): a U-shape inside a rounded rect frame.
// We'll just render a simple stylized "C" of gold pixels for visual.
function drawIcon(size, padPct = 0.12) {
  const pad = size * padPct;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size - pad * 2) / 2;

  const innerR1 = outerR * 0.62;
  const innerR2 = outerR * 0.42;

  return makeBuffer(size, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);

    // outer rounded square (background fill of accent)
    if (Math.abs(dx) < outerR && Math.abs(dy) < outerR) {
      // round corners
      const cornerR = outerR * 0.35;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (
        ax > outerR - cornerR &&
        ay > outerR - cornerR &&
        Math.hypot(ax - (outerR - cornerR), ay - (outerR - cornerR)) > cornerR
      ) {
        return [...BG, 255];
      }

      // gold "C" — outer ring minus inner
      const ringOuter = outerR * 0.9;
      const ringInner = outerR * 0.55;
      if (r < ringOuter && r > ringInner) {
        // make it a "C": cut out right side
        if (dx > outerR * 0.15 && Math.abs(dy) < outerR * 0.3) {
          return [...BG, 255];
        }
        return [...GOLD, 255];
      }
      // inner circle accent
      if (r < innerR2) return [...ACCENT, 255];
      // fill rest dark
      void innerR1;
      return [...BG, 255];
    }
    return [...BG, 255];
  });
}

function drawMaskable(size) {
  // For maskable, content must stay within ~80% safe zone. Use less padding.
  return makeBuffer(size, (x, y) => {
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    const safe = size * 0.4;

    const ringOuter = safe * 0.9;
    const ringInner = safe * 0.55;
    if (r < ringOuter && r > ringInner) {
      if (dx > safe * 0.15 && Math.abs(dy) < safe * 0.3) return [...BG, 255];
      return [...GOLD, 255];
    }
    return [...BG, 255];
  });
}

function write(name, size, fn) {
  const buf = fn(size);
  const png = encodePng(size, size, buf);
  const path = resolve(outDir, name);
  writeFileSync(path, png);
  console.log("wrote", path, png.length, "bytes");
}

write("icon-192.png", 192, drawIcon);
write("icon-512.png", 512, drawIcon);
write("icon-512-maskable.png", 512, drawMaskable);
