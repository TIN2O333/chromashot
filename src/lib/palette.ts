import * as ImageManipulator from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import * as jpeg from 'jpeg-js';

import { Analysis, GradeParams, Overlay } from '../types';

type RGB = [number, number, number];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const toHex = (rgb: RGB) =>
  '#' +
  rgb
    .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

const luminance = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const saturationOf = ([r, g, b]: RGB) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

const dist2 = (a: RGB, b: RGB) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
};

function samplePixels(width: number, height: number, data: Uint8Array): RGB[] {
  const total = width * height;
  const step = Math.max(1, Math.floor(total / 3000));
  const out: RGB[] = [];
  for (let i = 0; i < total; i += step) {
    const offset = i * 4;
    if (data[offset + 3] < 128) continue;
    out.push([data[offset], data[offset + 1], data[offset + 2]]);
  }
  return out;
}

function kmeans(pixels: RGB[], k: number, iterations = 9) {
  const sorted = [...pixels].sort((a, b) => luminance(a) - luminance(b));
  const centers: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centers.push(sorted[Math.min(sorted.length - 1, Math.floor(((i + 0.5) * sorted.length) / k))]);
  }

  const assignment = new Array<number>(pixels.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = dist2(pixels[i], centers[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      assignment[i] = best;
    }

    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < pixels.length; i++) {
      const bucket = sums[assignment[i]];
      const p = pixels[i];
      bucket[0] += p[0];
      bucket[1] += p[1];
      bucket[2] += p[2];
      bucket[3] += 1;
    }
    for (let c = 0; c < centers.length; c++) {
      const [r, g, b, n] = sums[c];
      if (n > 0) centers[c] = [r / n, g / n, b / n];
    }
  }

  const counts = centers.map(() => 0);
  for (const a of assignment) counts[a]++;

  return centers
    .map((rgb, i) => ({ rgb, weight: counts[i] / pixels.length }))
    .filter((s) => s.weight > 0.008)
    .sort((a, b) => b.weight - a.weight);
}

function describe(params: GradeParams) {
  const temperature =
    params.temperature > 0.16 ? '暖调' : params.temperature < -0.16 ? '冷调' : '中性';
  const contrast =
    params.contrast < -0.08 ? '柔光' : params.contrast > 0.14 ? '硬朗' : '标准';
  const texture = params.fade > 0.16 ? '胶片' : params.saturation > 0.12 ? '浓郁' : '通透';

  const tags: string[] = [temperature];
  tags.push(contrast === '标准' ? '自然影调' : contrast);
  tags.push(texture === '胶片' ? '胶片感' : texture === '浓郁' ? '高饱和' : '清透感');
  if (params.tint > 0.12) tags.push('偏洋红');
  if (params.tint < -0.12) tags.push('偏青绿');

  return { name: `${temperature}${contrast}${texture}`, tags: tags.slice(0, 3) };
}

export async function analyzeImage(uri: string): Promise<Analysis> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 84 } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!resized.base64) {
    throw new Error('无法读取图片像素');
  }

  const decoded = jpeg.decode(toByteArray(resized.base64), { useTArray: true });
  const pixels = samplePixels(decoded.width, decoded.height, decoded.data);

  if (pixels.length < 24) {
    throw new Error('图片有效像素过少');
  }

  const swatches = kmeans(pixels, 5);

  const meanLum =
    pixels.reduce((acc, p) => acc + luminance(p), 0) / pixels.length / 255;
  const variance =
    pixels.reduce((acc, p) => acc + Math.pow(luminance(p) / 255 - meanLum, 2), 0) /
    pixels.length;
  const contrast = Math.sqrt(variance);

  const meanSat = pixels.reduce((acc, p) => acc + saturationOf(p), 0) / pixels.length;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  for (const p of pixels) {
    rSum += p[0];
    gSum += p[1];
    bSum += p[2];
  }
  const n = pixels.length;
  const warmth = (rSum / n - bSum / n) / 255;
  const tint = ((rSum / n + bSum / n) / 2 - gSum / n) / 255;

  const params: GradeParams = {
    exposure: clamp((meanLum - 0.5) * 1.1, -0.8, 0.8),
    contrast: clamp((contrast - 0.19) * 2.4, -0.7, 0.7),
    saturation: clamp((meanSat - 0.33) * 1.9, -0.7, 0.7),
    temperature: clamp(warmth * 2.6, -0.8, 0.8),
    tint: clamp(tint * 2.2, -0.6, 0.6),
    fade: clamp(0.34 - contrast, 0, 0.5),
  };

  const byLum = [...swatches].sort((a, b) => luminance(a.rgb) - luminance(b.rgb));
  const darkest = byLum[0]?.rgb ?? ([28, 28, 32] as RGB);
  const brightest = byLum[byLum.length - 1]?.rgb ?? ([236, 232, 226] as RGB);
  const dominant = swatches[0]?.rgb ?? ([128, 120, 110] as RGB);
  const vivid = [...swatches].sort((a, b) => saturationOf(b.rgb) - saturationOf(a.rgb))[0];
  const wash = vivid?.rgb ?? dominant;

  const overlay: Overlay = {
    highlight: toHex(brightest),
    mid: toHex(dominant),
    shadow: toHex(darkest),
    wash: toHex(wash),
    amount: clamp(0.55 + meanSat * 0.9, 0.5, 1),
  };

  const { name, tags } = describe(params);

  return {
    palette: swatches.slice(0, 5).map((s) => toHex(s.rgb)),
    params,
    overlay,
    tags,
    name,
  };
}
