import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AlignAdvice } from '../lib/align';
import { colors, font, radius } from '../theme';
import { Icon } from './Icon';

type Props = {
  score: number | null;
  advice: AlignAdvice | null;
  scanning: boolean;
  locked: boolean;
  mode: 'skeleton' | 'photo';
  auto: boolean;
  onToggleMode: () => void;
  onToggleAuto: () => void;
  onLock: () => void;
  onUnlock: () => void;
};

const SIZE = 92;
const CX = SIZE / 2;
const R = 33;
const CIRC = 2 * Math.PI * R;

export function ReplicaHud({
  score,
  advice,
  scanning,
  locked,
  mode,
  auto,
  onToggleMode,
  onToggleAuto,
  onLock,
  onUnlock,
}: Props) {
  const percent = score === null ? 0 : Math.max(0, Math.min(100, Math.round(score)));
  const done = percent >= 88;
  const dir = advice?.dir ?? { left: 0, right: 0, up: 0, down: 0 };

  const title = advice?.title ?? (scanning ? '正在识别画面' : auto ? '对准参考构图' : '手动对位中');
  const detail =
    advice?.detail ??
    (scanning ? '保持手机稳定，正在比对构图…' : auto ? '移动手机，让画面贴合参考骨架' : '拖动或双指缩放参考图，手动贴合');

  const arrow = (value: number) => 0.14 + 0.86 * Math.min(1, value);

  return (
    <View style={styles.card}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={CX} cy={CX} r={R} stroke="rgba(255,255,255,0.12)" strokeWidth={5} fill="none" />
          <Circle
            cx={CX}
            cy={CX}
            r={R}
            stroke={done ? '#8FE3A8' : colors.accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={CIRC * (1 - percent / 100)}
            fill="none"
            transform={`rotate(-90 ${CX} ${CX})`}
          />
          {score !== null && (
            <>
              <Path
                d={`M${CX - 4} 7L${CX + 4} 7L${CX} 0Z`}
                fill={colors.accent}
                opacity={arrow(dir.up)}
              />
              <Path
                d={`M${CX - 4} ${SIZE - 7}L${CX + 4} ${SIZE - 7}L${CX} ${SIZE}Z`}
                fill={colors.accent}
                opacity={arrow(dir.down)}
              />
              <Path
                d={`M7 ${CX - 4}L7 ${CX + 4}L0 ${CX}Z`}
                fill={colors.accent}
                opacity={arrow(dir.left)}
              />
              <Path
                d={`M${SIZE - 7} ${CX - 4}L${SIZE - 7} ${CX + 4}L${SIZE} ${CX}Z`}
                fill={colors.accent}
                opacity={arrow(dir.right)}
              />
            </>
          )}
        </Svg>

        <View pointerEvents="none" style={styles.scoreWrap}>
          <Text style={[styles.score, done && styles.scoreDone]}>
            {score === null ? '--' : percent}
          </Text>
          <Text style={styles.scoreUnit}>相似</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.detail} numberOfLines={2}>
          {detail}
        </Text>

        <View style={styles.chips}>
          <Pressable style={styles.chip} onPress={onToggleMode} hitSlop={4}>
            <Text style={styles.chipText}>{mode === 'skeleton' ? '轮廓' : '彩色'}</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, auto && styles.chipActive]}
            onPress={onToggleAuto}
            hitSlop={4}
          >
            <Text style={[styles.chipText, auto && styles.chipTextActive]}>
              {auto ? '自动对位' : '手动对位'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.lock, locked && styles.lockActive]}
        onPress={locked ? onUnlock : onLock}
        hitSlop={6}
      >
        <Icon name="target" size={16} color={locked ? colors.accentText : colors.accent} />
        <Text style={[styles.lockText, locked && styles.lockTextActive]}>
          {locked ? '已锁' : '锁定'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(14,14,16,0.78)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,182,90,0.28)',
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scoreDone: {
    color: '#8FE3A8',
  },
  scoreUnit: {
    color: colors.textDim,
    fontSize: 9,
    marginTop: -1,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '700',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    height: 21,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent,
  },
  lock: {
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
  },
  lockActive: {
    backgroundColor: colors.accent,
  },
  lockText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '700',
  },
  lockTextActive: {
    color: colors.accentText,
  },
});
