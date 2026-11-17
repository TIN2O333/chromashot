import React from 'react';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { colors } from '../theme';

type Props = {
  values: number[];
  labels: string[];
  size?: number;
};

const RINGS = [0.25, 0.5, 0.75, 1];

export function RadarChart({ values, labels, size = 232 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;
  const count = values.length;
  const step = (Math.PI * 2) / count;

  const angleOf = (i: number) => -Math.PI / 2 + i * step;
  const pointAt = (i: number, ratio: number) => {
    const a = angleOf(i);
    return [cx + Math.cos(a) * radius * ratio, cy + Math.sin(a) * radius * ratio] as const;
  };

  const ringPoints = (ratio: number) =>
    values.map((_, i) => pointAt(i, ratio).join(',')).join(' ');

  const shape = values
    .map((v, i) => pointAt(i, Math.max(0.04, Math.min(1, v))).join(','))
    .join(' ');

  return (
    <Svg width={size} height={size}>
      {RINGS.map((ring) => (
        <Polygon
          key={`ring-${ring}`}
          points={ringPoints(ring)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {values.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return (
          <Line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      <Polygon points={shape} fill="rgba(242,182,90,0.22)" stroke={colors.accent} strokeWidth={1.6} />

      {values.map((v, i) => {
        const [x, y] = pointAt(i, Math.max(0.04, Math.min(1, v)));
        return <Circle key={`dot-${i}`} cx={x} cy={y} r={2.8} fill={colors.accent} />;
      })}

      {labels.map((label, i) => {
        const a = angleOf(i);
        const x = cx + Math.cos(a) * (radius + 18);
        const y = cy + Math.sin(a) * (radius + 18);
        const anchor = Math.abs(Math.cos(a)) < 0.25 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        return (
          <SvgText
            key={`label-${label}`}
            x={x}
            y={y + 3.5}
            fill={colors.textMuted}
            fontSize={10}
            fontWeight="500"
            textAnchor={anchor}
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
