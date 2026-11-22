import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import recorded from '../data/imageSizes.json' with { type: 'json' };

const table = recorded as Record<string, ImageSize>;

export type ImageSize = { width: number; height: number };

function u16(bytes: Uint8Array, offset: number, little = false) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint16(offset, little);
}

export function parseSize(bytes: Uint8Array): ImageSize | undefined {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { height: u16(bytes, offset + 5), width: u16(bytes, offset + 7) };
      }
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      offset += 2 + u16(bytes, offset + 2);
    }
    return undefined;
  }
  if (bytes.length >= 30 && bytes[0] === 0x52 && bytes[8] === 0x57) {
    const four = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (four === 'VP8X') {
      return {
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      };
    }
    if (four === 'VP8 ') {
      return { width: u16(bytes, 26, true) & 0x3fff, height: u16(bytes, 28, true) & 0x3fff };
    }
    if (four === 'VP8L') {
      const bits = bytes[21] + (bytes[22] << 8) + (bytes[23] << 16) + (bytes[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return undefined;
}

/** Pixel size of a file in public/. Missing files and remote URLs return undefined. */
export function imageSize(publicPath: string): ImageSize | undefined {
  if (!publicPath.startsWith('/') || publicPath.includes('..') || publicPath.includes('\\')) return undefined;
  const known = table[publicPath];
  if (known?.width && known?.height) return known;
  try {
    const file = join(process.cwd(), 'public', publicPath.slice(1));
    return parseSize(readFileSync(file));
  } catch {
    return undefined;
  }
}
