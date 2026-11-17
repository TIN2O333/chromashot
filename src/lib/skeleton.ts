import { ImageSourcePropType } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import * as jpeg from 'jpeg-js';

import { resolveImageUri } from './image';

export type Skeleton = {
  path: string;
  width: number;
  height: number;
};

const TARGET_WIDTH = 96;

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
  const threshold = Math.max(64, sorted[Math.floor(sorted.length * 0.86)] || 0);

  let path = '';
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const m = mag[i];
      if (m < threshold) continue;

      const dx = gx[i];
      const dy = gy[i];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = Math.round(dx / len);
      const ny = Math.round(dy / len);

      // 沿梯度方向做非极大值抑制，把边缘收成细线
      if (m < mag[(y + ny) * width + (x + nx)] || m < mag[(y - ny) * width + (x - nx)]) {
        continue;
      }

      const ex = -dy / len;
      const ey = dx / len;
      const half = 0.6;

      path += `M${(x - ex * half).toFixed(1)} ${(y - ey * half).toFixed(1)}l${(ex * half * 2).toFixed(1)} ${(ey * half * 2).toFixed(1)}`;
    }
  }

  return { path, width, height };
}

export async function loadSkeleton(source: ImageSourcePropType): Promise<Skeleton> {
  return extractSkeleton(await resolveImageUri(source));
}
