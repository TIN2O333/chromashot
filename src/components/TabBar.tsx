import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space } from '../theme';
import { TabKey } from '../types';
import { Icon, IconName } from './Icon';

const ITEMS: { key: TabKey; icon: IconName; label: string }[] = [
  { key: 'camera', icon: 'camera', label: '相机' },
  { key: 'library', icon: 'grid', label: '滤镜库' },
  { key: 'extract', icon: 'sparkles', label: '提取' },
  { key: 'myluts', icon: 'layers', label: '我的' },
  { key: 'settings', icon: 'sliders', label: '设置' },
];

type Props = {
  tab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function TabBar({ tab, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(6, insets.bottom) }]}>
      {ITEMS.map((item) => {
        const active = item.key === tab;
        return (
          <Pressable
            key={item.key}
            style={styles.item}
            onPress={() => onChange(item.key)}
            hitSlop={6}
          >
            <Icon
              name={item.icon}
              size={22}
              color={active ? colors.accent : colors.textDim}
              strokeWidth={active ? 1.9 : 1.6}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
    paddingTop: 9,
    paddingBottom: 6,
    backgroundColor: '#0D0D0F',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    color: colors.textDim,
    fontSize: font.caption,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.accent,
  },
});
