import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '../theme';

type Props = {
  alignment: number | null;
  hint: string;
  locked: boolean;
  mode: 'skeleton' | 'photo';
  onToggleMode: () => void;
  onLock: () => void;
  onUnlock: () => void;
};

export function ReplicaHud({
  alignment,
  hint,
  locked,
  mode,
  onToggleMode,
  onLock,
  onUnlock,
}: Props) {
  const percent = alignment === null ? 0 : Math.round(alignment);
  const status = alignment === null ? (locked ? '已锁定' : '待锁定') : `对齐 ${percent}%`;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.dot, locked && styles.dotLocked]} />
        <Text style={styles.status}>{status}</Text>

        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>

        <Pressable style={styles.modeChip} onPress={onToggleMode} hitSlop={6}>
          <Text style={styles.modeText}>{mode === 'skeleton' ? '轮廓' : '彩色'}</Text>
        </Pressable>

        <Pressable
          style={[styles.lockBtn, locked && styles.lockBtnActive]}
          onPress={locked ? onUnlock : onLock}
          hitSlop={6}
        >
          <Text style={[styles.lockText, locked && styles.lockTextActive]}>
            {locked ? '解锁' : '锁定'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(18,18,20,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,182,90,0.35)',
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(242,182,90,0.5)',
  },
  dotLocked: {
    backgroundColor: colors.accent,
  },
  status: {
    color: colors.text,
    fontSize: font.caption,
    fontWeight: '600',
    minWidth: 56,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  modeChip: {
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  lockBtn: {
    height: 24,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  lockBtnActive: {
    backgroundColor: colors.accent,
  },
  lockText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  lockTextActive: {
    color: colors.accentText,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
});
