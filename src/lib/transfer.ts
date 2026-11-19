import * as ImageManipulator from 'expo-image-manipulator';
import { fromByteArray, toByteArray } from 'base64-js';
import * as jpeg from 'jpeg-js';

export type ColorStats = {
  mean: [number, number, number];
  std: [number, number, number];
  sat: number;
  lum: number;
};

const LUT_SIZE = 17;
const TRANSFER_WIDTH = 720;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function statsOf(data: Uint8Array, count: number): ColorStats {
  let r = 0;
  let g = 0;
  let b = 0;
  let r2 = 0;
  let g2 = 0;
  let b2 = 0;
  let sat = 0;
  let lum = 0;

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const R = data[o];
    const G = data[o + 1];
    const B = data[o + 2];
    r += R;
    g += G;
    b += B;
    r2 += R * R;
    g2 += G * G;
    b2 += B * B;

    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    sat += max === 0 ? 0 : (max - min) / max;
    lum += 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  const n = Math.max(1, count);
  const mean: [number, number, number] = [r / n, g / n, b / n];
  const std: [number, number, number] = [
    Math.sqrt(Math.max(0, r2 / n - mean[0] * mean[0])),
    Math.sqrt(Math.max(0, g2 / n - mean[1] * mean[1])),
    Math.sqrt(Math.max(0, b2 / n - mean[2] * mean[2])),
  ];

  return { mean, std, sat: sat / n, lum: lum / n };
}

async function decodeAt(uri: string, width: number) {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!resized.base64) throw new Error('无法读取像素数据');
  return jpeg.decode(toByteArray(resized.base64), { useTArray: true });
}

export async function loadColorStats(uri: string): Promise<ColorStats> {
  const decoded = await decodeAt(uri, 72);
  return statsOf(decoded.data, decoded.width * decoded.height);
}

function buildLut(ref: ColorStats, target: ColorStats, strength: number): Float32Array {
  const lut = new Float32Array(LUT_SIZE * LUT_SIZE * LUT_SIZE * 3);
  const gain: [number, number, number] = [
    ref.std[0] / Math.max(8, target.std[0]),
    ref.std[1] / Math.max(8, target.std[1]),
    ref.std[2] / Math.max(8, target.std[2]),
  ];
  const satScale = clamp(1 + (ref.sat - target.sat) * 0.85, 0.6, 1.7);
  const step = 255 / (LUT_SIZE - 1);

  for (let bi = 0; bi < LUT_SIZE; bi++) {
    const b = bi * step;
    for (let gi = 0; gi < LUT_SIZE; gi++) {
      const g = gi * step;
      for (let ri = 0; ri < LUT_SIZE; ri++) {
        const r = ri * step;

        let tr = (r - target.mean[0]) * gain[0] + ref.mean[0];
        let tg = (g - target.mean[1]) * gain[1] + ref.mean[1];
        let tb = (b - target.mean[2]) * gain[2] + ref.mean[2];

        const l = 0.2126 * tr + 0.7152 * tg + 0.0722 * tb;
        tr = l + (tr - l) * satScale;
        tg = l + (tg - l) * satScale;
        tb = l + (tb - l) * satScale;

        const off = ((bi * LUT_SIZE + gi) * LUT_SIZE + ri) * 3;
        lut[off] = r + (clamp(tr, 0, 255) - r) * strength;
        lut[off + 1] = g + (clamp(tg, 0, 255) - g) * strength;
        lut[off + 2] = b + (clamp(tb, 0, 255) - b) * strength;
      }
    }
  }

  return lut;
}

function applyLut(data: Uint8Array, count: number, lut: Float32Array) {
  const step = 255 / (LUT_SIZE - 1);
  const last = LUT_SIZE - 1;

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const fr = data[o] / step;
    const fg = data[o + 1] / step;
    const fb = data[o + 2] / step;

    const r0 = Math.min(last, Math.floor(fr));
    const g0 = Math.min(last, Math.floor(fg));
    const b0 = Math.min(last, Math.floor(fb));
    const r1 = Math.min(last, r0 + 1);
    const g1 = Math.min(last, g0 + 1);
    const b1 = Math.min(last, b0 + 1);

    const dr = fr - r0;
    const dg = fg - g0;
    const db = fb - b0;

    for (let c = 0; c < 3; c++) {
      const c000 = lut[((b0 * LUT_SIZE + g0) * LUT_SIZE + r0) * 3 + c];
      const c100 = lut[((b0 * LUT_SIZE + g0) * LUT_SIZE + r1) * 3 + c];
      const c010 = lut[((b0 * LUT_SIZE + g1) * LUT_SIZE + r0) * 3 + c];
      const c110 = lut[((b0 * LUT_SIZE + g1) * LUT_SIZE + r1) * 3 + c];
      const c001 = lut[((b1 * LUT_SIZE + g0) * LUT_SIZE + r0) * 3 + c];
      const c101 = lut[((b1 * LUT_SIZE + g0) * LUT_SIZE + r1) * 3 + c];
      const c011 = lut[((b1 * LUT_SIZE + g1) * LUT_SIZE + r0) * 3 + c];
      const c111 = lut[((b1 * LUT_SIZE + g1) * LUT_SIZE + r1) * 3 + c];

      const x00 = c000 + (c100 - c000) * dr;
      const x10 = c010 + (c110 - c010) * dr;
      const x01 = c001 + (c101 - c001) * dr;
      const x11 = c011 + (c111 - c011) * dr;
      const y0 = x00 + (x10 - x00) * dg;
      const y1 = x01 + (x11 - x01) * dg;
      data[o + c] = Math.round(clamp(y0 + (y1 - y0) * db, 0, 255));
    }
  }
}

export async function transferPhoto(
  source: string,
  reference: ColorStats,
  strength = 0.85
): Promise<string> {
  const resized = await ImageManipulator.manipulateAsync(
    source,
    [{ resize: { width: TRANSFER_WIDTH } }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!resized.base64) throw new Error('无法处理照片');

  const decoded = jpeg.decode(toByteArray(resized.base64), { useTArray: true });
  const count = decoded.width * decoded.height;
  const target = statsOf(decoded.data, count);
  applyLut(decoded.data, count, buildLut(reference, target, strength));

  const encoded = jpeg.encode(
    { data: decoded.data, width: decoded.width, height: decoded.height },
    88
  );
  return `data:image/jpeg;base64,${fromByteArray(encoded.data)}`;
}
