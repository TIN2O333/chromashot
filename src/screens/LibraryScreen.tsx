import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SAMPLE_TARGET } from '../assets';
import { GradeOverlay } from '../components/GradeOverlay';
import { Icon } from '../components/Icon';
import { CATEGORIES } from '../lib/presets';
import { colors, font, radius, space } from '../theme';
import { Lut } from '../types';

type Props = {
  luts: Lut[];
  activeLut: Lut | null;
  onApply: (id: string) => void;
  onOpenExtract: () => void;
};

export function LibraryScreen({ luts, activeLut, onApply, onOpenExtract }: Props) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('全部');

  const list = category === '全部' ? luts : luts.filter((l) => l.category === category);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>滤镜库</Text>
        <Text style={styles.subtitle}>{luts.length} 种风格 · 实时套用</Text>
      </View>

      <Pressable style={styles.banner} onPress={onOpenExtract}>
        <LinearGradient
          colors={['#3A2A16', '#241C14']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerIcon}>
          <Icon name="sparkles" size={18} color={colors.accent} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>用参考图生成专属滤镜</Text>
          <Text style={styles.bannerSub}>导入一张喜欢的照片，提取它的颜色</Text>
        </View>
        <Icon name="chevron" size={16} color={colors.accent} strokeWidth={2.2} />
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.grid}>
        {list.map((lut) => {
          const active = activeLut?.id === lut.id;
          return (
            <Pressable key={lut.id} style={styles.card} onPress={() => onApply(lut.id)}>
              <View style={styles.cardImageWrap}>
                <Image source={SAMPLE_TARGET} style={styles.cardImage} resizeMode="cover" />
                <GradeOverlay lut={lut} strength={0.92} />
                {active && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>使用中</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{lut.name}</Text>
                <Text style={styles.cardMeta}>{lut.tags.join(' · ')}</Text>
                <View style={styles.swatches}>
                  {lut.palette.slice(0, 5).map((hex, i) => (
                    <View key={`${hex}-${i}`} style={[styles.swatch, { backgroundColor: hex }]} />
                  ))}
                </View>
              </View>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,182,90,0.28)',
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242,182,90,0.16)',
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  bannerSub: {
    color: colors.textMuted,
    fontSize: font.caption,
  },
  chips: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  chip: {
    paddingHorizontal: 14,
    height: 32,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.accentText,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    rowGap: space.lg,
  },
  card: {
    width: '48%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardImageWrap: {
    aspectRatio: 0.86,
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  activeBadgeText: {
    color: colors.accentText,
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: space.md,
    gap: 4,
  },
  cardTitle: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: font.caption,
  },
  swatches: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  swatch: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
});
