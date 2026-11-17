import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SAMPLE_TARGET } from '../assets';
import { GradeOverlay } from '../components/GradeOverlay';
import { Icon } from '../components/Icon';
import { RadarChart } from '../components/RadarChart';
import { Slider } from '../components/Slider';
import { colors, font, radius, space } from '../theme';
import { GradeParams, Lut } from '../types';

type Props = {
  base: Lut;
  onClose: () => void;
  onSave: (lut: Lut) => void;
};

type Gene = {
  key: keyof GradeParams;
  label: string;
  min: number;
  max: number;
};

const GENES: Gene[] = [
  { key: 'exposure', label: '曝光', min: -1, max: 1 },
  { key: 'contrast', label: '对比', min: -1, max: 1 },
  { key: 'saturation', label: '饱和', min: -1, max: 1 },
  { key: 'temperature', label: '色温', min: -1, max: 1 },
  { key: 'tint', label: '色调', min: -1, max: 1 },
  { key: 'fade', label: '褪色', min: 0, max: 1 },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const norm = (v: number, min: number, max: number) => clamp((v - min) / (max - min), 0, 1);

function describeDna(p: GradeParams) {
  const parts: string[] = [];
  parts.push(p.exposure > 0.12 ? '整体提亮' : p.exposure < -0.12 ? '整体压暗' : '曝光中性');
  parts.push(p.temperature > 0.15 ? '画面偏暖' : p.temperature < -0.15 ? '画面偏冷' : '色温居中');
  parts.push(
    p.saturation > 0.12 ? '色彩浓郁' : p.saturation < -0.12 ? '色彩克制' : '饱和度适中'
  );
  parts.push(p.contrast > 0.14 ? '反差硬朗' : p.contrast < -0.08 ? '影调柔和' : '反差适中');
  if (p.tint > 0.12) parts.push('高光带一点洋红');
  if (p.tint < -0.12) parts.push('暗部偏青绿');
  if (p.fade > 0.16) parts.push('带胶片式的褪色灰雾');
  return `${parts.join('，')}。`;
}

export function DnaScreen({ base, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [params, setParams] = useState<GradeParams>({ ...base.params });

  const liveLut = useMemo<Lut>(() => ({ ...base, params }), [base, params]);

  const radarValues = useMemo(
    () => [
      norm(params.exposure, -1, 1),
      norm(params.contrast, -1, 1),
      norm(params.saturation, -1, 1),
      norm(params.temperature, -1, 1),
      norm(params.tint, -1, 1),
      norm(params.fade, 0, 1),
    ],
    [params]
  );

  const reading = useMemo(() => describeDna(params), [params]);

  const update = (key: keyof GradeParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // ignore
    }
    setParams({ ...base.params });
  };

  const save = () => {
    const lut: Lut = {
      id: `lut-${Date.now()}`,
      name: `${base.name} · 变体`,
      category: '自定义',
      tags: base.tags,
      palette: base.palette,
      params,
      overlay: base.overlay,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onSave(lut);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <Icon name="close" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>风格 DNA</Text>
          <Text style={styles.subtitle}>{base.name}</Text>
        </View>
        <Pressable style={styles.resetBtn} onPress={reset} hitSlop={8}>
          <Text style={styles.resetText}>重置</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrap}>
          <Image source={SAMPLE_TARGET} style={styles.previewImage} resizeMode="cover" />
          <GradeOverlay lut={liveLut} strength={0.92} />
          <View style={styles.previewChip}>
            <View style={styles.previewDot} />
            <Text style={styles.previewChipText}>实时预览</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>风格指纹</Text>
            <Text style={styles.cardHint}>六项基因决定它的气质</Text>
          </View>
          <View style={styles.radarWrap}>
            <RadarChart values={radarValues} labels={['曝光', '对比', '饱和', '色温', '色调', '褪色']} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>它在说什么</Text>
          <Text style={styles.reading}>{reading}</Text>
          <View style={styles.paletteRow}>
            {base.palette.slice(0, 5).map((hex, i) => (
              <View key={`${hex}-${i}`} style={[styles.paletteChip, { backgroundColor: hex }]} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>拖动基因</Text>
          <Text style={styles.cardHint}>任何一项变化都会实时反映到上面的画面</Text>

          <View style={styles.geneList}>
            {GENES.map((gene) => {
              const value = params[gene.key];
              const display =
                gene.key === 'fade'
                  ? Math.round(value * 100)
                  : `${value > 0 ? '+' : ''}${Math.round(value * 100)}`;
              return (
                <View key={gene.key} style={styles.geneRow}>
                  <Text style={styles.geneLabel}>{gene.label}</Text>
                  <View style={styles.geneSlider}>
                    <Slider
                      value={value}
                      minimumValue={gene.min}
                      maximumValue={gene.max}
                      activeColor={colors.accent}
                      onChange={(v) => update(gene.key, v)}
                    />
                  </View>
                  <Text style={styles.geneValue}>{display}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.saveBtn} onPress={save}>
          <Icon name="check" size={17} color={colors.accentText} strokeWidth={2.4} />
          <Text style={styles.saveText}>保存为我的滤镜</Text>
        </Pressable>

        <Text style={styles.note}>
          演示版用整体色调层近似表达基因变化；正式版会把这些基因烘焙成 3D LUT 逐像素渲染。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.md,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.caption,
    marginTop: 1,
  },
  resetBtn: {
    paddingHorizontal: 12,
    height: 30,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  resetText: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '600',
  },
  previewWrap: {
    marginHorizontal: space.lg,
    aspectRatio: 1.25,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewChip: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,10,11,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  previewDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  previewChipText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: space.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
  },
  cardHint: {
    color: colors.textDim,
    fontSize: font.caption,
    flexShrink: 1,
    textAlign: 'right',
  },
  radarWrap: {
    alignItems: 'center',
    paddingTop: space.sm,
  },
  reading: {
    color: colors.text,
    fontSize: font.body,
    lineHeight: 22,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xs,
  },
  paletteChip: {
    flex: 1,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  geneList: {
    gap: 2,
    marginTop: space.xs,
  },
  geneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  geneLabel: {
    color: colors.textMuted,
    fontSize: font.small,
    width: 32,
  },
  geneSlider: {
    flex: 1,
  },
  geneValue: {
    color: colors.text,
    fontSize: font.caption,
    fontWeight: '600',
    width: 34,
    textAlign: 'right',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: space.lg,
    marginTop: space.lg,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  saveText: {
    color: colors.accentText,
    fontSize: font.body,
    fontWeight: '700',
  },
  note: {
    color: colors.textDim,
    fontSize: font.caption,
    lineHeight: 18,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
});
