import { ImageSourcePropType } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import * as jpeg from 'jpeg-js';

import { resolveImageUri } from './image';

export type GrayImage = {
  data: Float32Array;
  w: number;
  h: number;
};

export type AlignResult = {
  score: number;
  dx: number;
  dy: number;
  rotation: number;
  overlap: number;
};

export type AlignAdvice = {
  score: number;
  title: string;
  detail: string;
  dir: { left: number; right: number; up: number; down: number };
  rotate: number;
};

const GRID_W = 96;
const GRID_H = 128;

function decodeGray(base64: string): GrayImage {
  const { width, height, data } = jpeg.decode(toByteArray(base64), { useTArray: true });
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    out[i] = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  }
  return { data: out, w: width, h: height };
}

async function grayFromUri(uri: string): Promise<GrayImage> {
  const resized = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: GRID_W } }], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!resized.base64) throw new Error('无法读取像素数据');
  return decodeGray(resized.base64);
}

export async function loadGrayFromUri(uri: string): Promise<GrayImage> {
  return grayFromUri(uri);
}

export async function loadGrayFromSource(source: ImageSourcePropType): Promise<GrayImage> {
  return grayFromUri(await resolveImageUri(source));
}

function sample(img: GrayImage, x: number, y: number): number {
  const cx = Math.min(img.w - 1, Math.max(0, x));
  const cy = Math.min(img.h - 1, Math.max(0, y));
  return img.data[cy * img.w + cx];
}

function rotateRef(ref: GrayImage, degrees: number): GrayImage {
  if (!degrees) return ref;
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = ref.w / 2;
  const cy = ref.h / 2;
  const out = new Float32Array(ref.w * ref.h);
  for (let y = 0; y < ref.h; y++) {
    for (let x = 0; x < ref.w; x++) {
      const sx = (x - cx) * cos + (y - cy) * sin + cx;
      const sy = -(x - cx) * sin + (y - cy) * cos + cy;
      out[y * ref.w + x] = sample(ref, Math.round(sx), Math.round(sy));
    }
  }
  return { data: out, w: ref.w, h: ref.h };
}

function zncc(ref: GrayImage, frame: GrayImage, ox: number, oy: number): number {
  let sumR = 0;
  let sumF = 0;
  let sumRR = 0;
  let sumFF = 0;
  let sumRF = 0;
  let n = 0;
  const step = 2;
  for (let y = 0; y < ref.h; y += step) {
    const fy = y + oy;
    if (fy < 0 || fy >= frame.h) continue;
    for (let x = 0; x < ref.w; x += step) {
      const fx = x + ox;
      if (fx < 0 || fx >= frame.w) continue;
      const a = ref.data[y * ref.w + x];
      const b = frame.data[fy * frame.w + fx];
      sumR += a;
      sumF += b;
      sumRR += a * a;
      sumFF += b * b;
      sumRF += a * b;
      n++;
    }
  }
  if (n < 200) return -1;
  const cov = sumRF / n - (sumR / n) * (sumF / n);
  const varR = sumRR / n - (sumR / n) ** 2;
  const varF = sumFF / n - (sumF / n) ** 2;
  const denom = Math.sqrt(Math.max(1e-6, varR) * Math.max(1e-6, varF));
  return cov / denom;
}

function bestOffset(ref: GrayImage, frame: GrayImage, range: number, step: number, cx: number, cy: number) {
  let best = { ox: 0, oy: 0, value: -2 };
  for (let oy = -range; oy <= range; oy += step) {
    for (let ox = -range; ox <= range; ox += step) {
      const v = zncc(ref, frame, cx + ox, cy + oy);
      if (v > best.value) best = { ox, oy, value: v };
    }
  }
  return best;
}

export function alignImages(ref: GrayImage, frame: GrayImage): AlignResult {
  const rotations = [0, -6, 6, -12, 12];
  let best = { rotation: 0, ox: 0, oy: 0, value: -2, overlap: 0 };

  for (const rotation of rotations) {
    const rotated = rotateRef(ref, rotation);
    const coarse = bestOffset(rotated, frame, 18, 3, 0, 0);
    const fine = bestOffset(rotated, frame, 3, 1, coarse.ox, coarse.oy);
    if (fine.value > best.value) {
      const covered = 1 - Math.min(1, (Math.abs(fine.ox) / ref.w + Math.abs(fine.oy) / ref.h) * 1.6);
      best = {
        rotation,
        ox: fine.ox,
        oy: fine.oy,
        value: fine.value,
        overlap: Math.max(0, Math.min(1, covered)),
      };
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(((best.value - 0.08) / 0.72) * 100)));
  return {
    score,
    dx: best.ox / ref.w,
    dy: best.oy / ref.h,
    rotation: best.rotation,
    overlap: best.overlap,
  };
}

export function describeAlign(result: AlignResult): AlignAdvice {
  const pctX = Math.round(Math.abs(result.dx) * 100);
  const pctY = Math.round(Math.abs(result.dy) * 100);
  const parts: string[] = [];

  const dir = { left: 0, right: 0, up: 0, down: 0 };
  if (pctX >= 4) {
    const side = result.dx > 0 ? '右' : '左';
    dir[result.dx > 0 ? 'right' : 'left'] = Math.min(1, pctX / 20);
    parts.push(`向${side}平移 ${pctX}%`);
  }
  if (pctY >= 4) {
    const side = result.dy > 0 ? '下' : '上';
    dir[result.dy > 0 ? 'down' : 'up'] = Math.min(1, pctY / 20);
    parts.push(`向${side}移动 ${pctY}%`);
  }

  let rotate = 0;
  if (Math.abs(result.rotation) >= 6) {
    rotate = result.rotation;
    parts.push(`${result.rotation > 0 ? '逆' : '顺'}时针转 ${Math.abs(result.rotation)}°`);
  }

  const title =
    result.score >= 88
      ? '构图吻合'
      : result.score >= 70
        ? '接近了，再微调'
        : result.score >= 45
          ? '方向对了，继续调整'
          : '还没对上，先找主体';

  return {
    score: result.score,
    title,
    detail: parts.length ? parts.join(' · ') : '保持住，按下快门',
    dir,
    rotate,
  };
}

export function composeAdviceFromGyro(deviation: number, hint: string): AlignAdvice {
  const score = Math.max(0, Math.min(100, Math.round(100 - deviation)));
  return {
    score,
    title: score >= 88 ? '构图吻合' : score >= 70 ? '接近了，再微调' : '还没对上',
    detail: hint || '移动手机，让骨架贴住画面',
    dir: { left: 0, right: 0, up: 0, down: 0 },
    rotate: 0,
  };
}
