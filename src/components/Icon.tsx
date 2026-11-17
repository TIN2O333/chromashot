import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

export type IconName =
  | 'camera'
  | 'grid'
  | 'sparkles'
  | 'layers'
  | 'sliders'
  | 'flash'
  | 'timer'
  | 'flip'
  | 'gallery'
  | 'plus'
  | 'check'
  | 'chevron'
  | 'trash'
  | 'close'
  | 'image'
  | 'crown'
  | 'target'
  | 'dna';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.7 }: Props) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'camera' && (
        <>
          <Rect x={2.8} y={6.6} width={18.4} height={13.2} rx={4} {...stroke} />
          <Circle cx={12} cy={13.2} r={3.6} {...stroke} />
          <Path d="M8.4 6.6l1.3-2.2h4.6l1.3 2.2" {...stroke} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x={3.2} y={3.2} width={7.4} height={7.4} rx={2.2} {...stroke} />
          <Rect x={13.4} y={3.2} width={7.4} height={7.4} rx={2.2} {...stroke} />
          <Rect x={3.2} y={13.4} width={7.4} height={7.4} rx={2.2} {...stroke} />
          <Rect x={13.4} y={13.4} width={7.4} height={7.4} rx={2.2} {...stroke} />
        </>
      )}
      {name === 'sparkles' && (
        <>
          <Path
            d="M11 3.6l1.7 4.2 4.2 1.7-4.2 1.7L11 15.4 9.3 11.2 5.1 9.5l4.2-1.7z"
            fill={color}
          />
          <Path d="M17.6 14.4l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill={color} />
        </>
      )}
      {name === 'layers' && (
        <>
          <Path d="M12 3.4l8.4 4.6-8.4 4.6L3.6 8z" {...stroke} />
          <Path d="M3.6 12.4l8.4 4.6 8.4-4.6" {...stroke} />
          <Path d="M3.6 16.6l8.4 4.6 8.4-4.6" {...stroke} />
        </>
      )}
      {name === 'sliders' && (
        <>
          <Line x1={3.4} y1={7} x2={20.6} y2={7} {...stroke} />
          <Line x1={3.4} y1={12} x2={20.6} y2={12} {...stroke} />
          <Line x1={3.4} y1={17} x2={20.6} y2={17} {...stroke} />
          <Circle cx={9} cy={7} r={2.3} {...stroke} fill={colors.bg} />
          <Circle cx={15.6} cy={12} r={2.3} {...stroke} fill={colors.bg} />
          <Circle cx={7.4} cy={17} r={2.3} {...stroke} fill={colors.bg} />
        </>
      )}
      {name === 'flash' && (
        <Path d="M13.2 2.4L5.4 13.1h4.9l-1.1 8.5 8.4-11.2h-5.2l.8-8z" {...stroke} />
      )}
      {name === 'timer' && (
        <>
          <Circle cx={12} cy={13.4} r={7.2} {...stroke} />
          <Path d="M12 9.8v3.8l2.4 1.6" {...stroke} />
          <Path d="M9.6 2.6h4.8" {...stroke} />
        </>
      )}
      {name === 'flip' && (
        <>
          <Path d="M4.4 9.4a7.8 7.8 0 0113.4-2.6" {...stroke} />
          <Path d="M18.4 3.6v3.6h-3.6" {...stroke} />
          <Path d="M19.6 14.6A7.8 7.8 0 016.2 17.2" {...stroke} />
          <Path d="M5.6 20.4v-3.6H9.2" {...stroke} />
        </>
      )}
      {name === 'gallery' && (
        <>
          <Rect x={3.2} y={4.6} width={17.6} height={14.8} rx={3} {...stroke} />
          <Circle cx={8.6} cy={9.8} r={1.5} {...stroke} />
          <Path d="M3.6 16.4l4.8-4.2 3.6 3.2 3-2.6 5.4 4.6" {...stroke} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...stroke} />
          <Line x1={5} y1={12} x2={19} y2={12} {...stroke} />
        </>
      )}
      {name === 'check' && <Path d="M5 12.6l4.6 4.4L19 6.8" {...stroke} />}
      {name === 'chevron' && <Path d="M9.4 5.6L16 12l-6.6 6.4" {...stroke} />}
      {name === 'trash' && (
        <>
          <Path d="M4.6 6.8h14.8" {...stroke} />
          <Path d="M9.4 6.8V4.6h5.2v2.2" {...stroke} />
          <Path d="M6.6 6.8l.9 12.2a1.8 1.8 0 001.8 1.6h5.4a1.8 1.8 0 001.8-1.6l.9-12.2" {...stroke} />
        </>
      )}
      {name === 'close' && (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...stroke} />
          <Line x1={18} y1={6} x2={6} y2={18} {...stroke} />
        </>
      )}
      {name === 'image' && (
        <>
          <Rect x={3.2} y={4.6} width={17.6} height={14.8} rx={3} {...stroke} />
          <Path d="M3.6 16.4l4.8-4.2 3.6 3.2 3-2.6 5.4 4.6" {...stroke} />
          <Circle cx={8.6} cy={9.8} r={1.5} {...stroke} />
        </>
      )}
      {name === 'crown' && (
        <Path d="M3.4 7.6l4 3.2 4.6-5.4 4.6 5.4 4-3.2-1.6 10.4H5l-1.6-10.4z" {...stroke} />
      )}
      {name === 'target' && (
        <>
          <Circle cx={12} cy={12} r={7.6} {...stroke} />
          <Circle cx={12} cy={12} r={2.6} {...stroke} />
          <Line x1={12} y1={2.6} x2={12} y2={6} {...stroke} />
          <Line x1={12} y1={18} x2={12} y2={21.4} {...stroke} />
          <Line x1={2.6} y1={12} x2={6} y2={12} {...stroke} />
          <Line x1={18} y1={12} x2={21.4} y2={12} {...stroke} />
        </>
      )}
      {name === 'dna' && (
        <>
          <Path d="M8.2 3.4c0 5.4 7.6 5.6 7.6 11 0 3.2-2 5.6-3.8 6.2" {...stroke} />
          <Path d="M15.8 3.4c0 5.4-7.6 5.6-7.6 11 0 3.2 2 5.6 3.8 6.2" {...stroke} />
          <Line x1={9.4} y1={7.2} x2={14.6} y2={7.2} {...stroke} />
          <Line x1={8.4} y1={12} x2={15.6} y2={12} {...stroke} />
          <Line x1={9.4} y1={16.8} x2={14.6} y2={16.8} {...stroke} />
        </>
      )}
    </Svg>
  );
}
