import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SAMPLE_TARGET } from '../assets';
import { GradeOverlay } from '../components/GradeOverlay';
import { Icon } from '../components/Icon';
import { colors, font, radius, space } from '../theme';
import { Lut } from '../types';

type Props = {
  luts: Lut[];
  activeLut: Lut | null;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenExtract: () => void;
  onOpenDna: (lut: Lut) => void;
};

export function MyLutsScreen({ luts, activeLut, onApply, onDelete, onOpenExtract, onOpenDna }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>我的滤镜</Text>
            <Text style={styles.subtitle}>{luts.length} 个已保存的风格</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={onOpenExtract}>
            <Icon name="plus" size={18} color={colors.accentText} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {luts.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="layers" size={26} color={colors.textDim} />
          </View>
          <Text style={styles.emptyTitle}>还没有自定义滤镜</Text>
          <Text style={styles.emptySub}>从一张参考图提取，几秒就能生成</Text>
          <Pressable style={styles.emptyBtn} onPress={onOpenExtract}>
            <Text style={styles.emptyBtnText}>去提取一个</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.list}>
        {luts.map((lut) => {
          const active = activeLut?.id === lut.id;
          return (
            <Pressable
              key={lut.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => onApply(lut.id)}
            >
              <View style={styles.thumb}>
                <Image source={SAMPLE_TARGET} style={styles.thumbImage} resizeMode="cover" />
                <GradeOverlay lut={lut} strength={0.9} />
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {lut.name}
                  </Text>
                  {active && <Text style={styles.activeTag}>使用中</Text>}
                </View>
                <Text style={styles.meta}>
                  {lut.category} · {lut.createdAt}
                </Text>
                <View style={styles.swatches}>
                  {lut.palette.slice(0, 5).map((hex, i) => (
                    <View key={`${hex}-${i}`} style={[styles.swatch, { backgroundColor: hex }]} />
                  ))}
                </View>
              </View>

              <Pressable
                style={styles.iconBtn}
                hitSlop={10}
                onPress={() => onOpenDna(lut)}
              >
                <Icon name="dna" size={17} color={colors.accent} />
              </Pressable>

              <Pressable
                style={styles.iconBtn}
                hitSlop={10}
                onPress={() => onDelete(lut.id)}
              >
                <Icon name="trash" size={17} color={colors.textDim} />
              </Pressable>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 4,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 6,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: font.caption,
  },
  emptyBtn: {
    marginTop: space.md,
    paddingHorizontal: space.xl,
    height: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  emptyBtnText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowActive: {
    borderColor: 'rgba(242,182,90,0.5)',
  },
  thumb: {
    width: 62,
    height: 78,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
    flexShrink: 1,
  },
  activeTag: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
  },
  meta: {
    color: colors.textMuted,
    fontSize: font.caption,
  },
  swatches: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  swatch: {
    width: 22,
    height: 8,
    borderRadius: 4,
  },
  iconBtn: {
    width: 32,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
