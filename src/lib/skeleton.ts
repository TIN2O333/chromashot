import { ImageSourcePropType } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import * as jpeg from 'jpeg-js';

import { resolveImageUri } from './image';

export type Skeleton = {
  path: string;
  detailPath: string;
  width: number;
  height: number;
  box: { x: number; y: number; w: number; h: number };
};

const TARGET_WIDTH = 128;

function percentile(values: number[], ratio: number): number {
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * ratio)));
  return values[index];
}

function energyBox(mag: Float32Array, width: number, height: number) {
  const cols = new Float32Array(width);
  const rows = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = mag[y * width + x];
      cols[x] += v;
      rows[y] += v;
    }
  }

  const pick = (weights: Float32Array, total: number) => {
    let acc = 0;
    let start = 0;
    let end = weights.length - 1;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (acc >= total * 0.12) {
        start = i;
        break;
      }
    }
    acc = 0;
    for (let i = weights.length - 1; i >= 0; i--) {
      acc += weights[i];
      if (acc >= total * 0.12) {
        end = i;
        break;
      }
    }
    return [start, end];
  };

  const totalCols = cols.reduce((a, b) => a + b, 0) || 1;
  const totalRows = rows.reduce((a, b) => a + b, 0) || 1;
  const [x0, x1] = pick(cols, totalCols);
  const [y0, y1] = pick(rows, totalRows);

  return {
    x: x0 / width,
    y: y0 / height,
    w: Math.max(0.2, (x1 - x0) / width),
    h: Math.max(0.2, (y1 - y0) / height),
  };
}

export async function extractSkeleton(uri: string): Promise<Skeleton> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: TARGET_WIDTH } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!resized.base64) throw new Error('无法读取图片像素');

  const { width, height, data } = jpeg.decode(toByteArray(resized.base64), { useTArray: true });
  const total = width * height;

  const gray = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const o = i * 4;
    gray[i] = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  }

  const gx = new Float32Array(total);
  const gy = new Float32Array(total);
  const mag = new Float32Array(total);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const tl = gray[i - width - 1];
      const t = gray[i - width];
      const tr = gray[i - width + 1];
      const l = gray[i - 1];
      const r = gray[i + 1];
      const bl = gray[i + width - 1];
      const b = gray[i + width];
      const br = gray[i + width + 1];
      const dx = -tl - 2 * l - bl + tr + 2 * r + br;
      const dy = -tl - 2 * t - tr + bl + 2 * b + br;
      gx[i] = dx;
      gy[i] = dy;
      mag[i] = Math.sqrt(dx * dx + dy * dy);
    }
  }

  const sorted = Array.from(mag).sort((a, b) => a - b);
  const strong = Math.max(72, percentile(sorted, 0.9));
  const weak = Math.max(38, percentile(sorted, 0.74));

  const build = (min: number, max: number, stride: number) => {
    let path = '';
    for (let y = 1; y < height - 1; y += stride) {
      for (let x = 1; x < width - 1; x += stride) {
        const i = y * width + x;
        const m = mag[i];
        if (m < min || m > max) continue;

        const dx = gx[i];
        const dy = gy[i];
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = Math.round(dx / len);
        const ny = Math.round(dy / len);

        if (m < mag[(y + ny) * width + (x + nx)] || m < mag[(y - ny) * width + (x - nx)]) {
          continue;
        }

        const ex = -dy / len;
        const ey = dx / len;
        const half = 0.55;

        path += `M${(x - ex * half).toFixed(1)} ${(y - ey * half).toFixed(1)}l${(ex * half * 2).toFixed(1)} ${(ey * half * 2).toFixed(1)}`;
      }
    }
    return path;
  };

  return {
    path: build(strong, Number.POSITIVE_INFINITY, 1),
    detailPath: build(weak, strong, 2),
    width,
    height,
    box: energyBox(mag, width, height),
  };
}

export async function loadSkeleton(source: ImageSourcePropType): Promise<Skeleton> {
  return extractSkeleton(await resolveImageUri(source));
}
