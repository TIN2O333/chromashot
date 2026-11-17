import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SAMPLE_REFERENCE, SAMPLE_TARGET } from '../assets';
import { GradeOverlay } from '../components/GradeOverlay';
import { Icon } from '../components/Icon';
import { resolveImageUri } from '../lib/image';
import { analyzeImage } from '../lib/palette';
import { FALLBACK_ANALYSIS } from '../lib/presets';
import { colors, font, radius, space } from '../theme';
import { Analysis, Lut } from '../types';

type Stage = 'idle' | 'analyzing' | 'result';

type Props = {
  count: number;
  onSave: (lut: Lut) => void;
  onToast: (message: string) => void;
  onOpenDna: (lut: Lut) => void;
  onReplica: (source: ImageSourcePropType) => void;
};

const STEPS = ['分析色彩分布', '计算影调曲线', '生成风格参数'];

function ParamRow({ label, value }: { label: string; value: number }) {
  const magnitude = Math.min(1, Math.abs(value)) * 50;
  return (
    <View style={styles.paramRow}>
      <Text style={styles.paramLabel}>{label}</Text>
      <View style={styles.paramBar}>
        <View style={styles.paramCenter} />
        <View
          style={[
            styles.paramFill,
            value >= 0
              ? { left: '50%', width: `${magnitude}%` }
              : { left: `${50 - magnitude}%`, width: `${magnitude}%` },
          ]}
        />
      </View>
      <Text style={styles.paramValue}>
        {value > 0 ? '+' : ''}
        {Math.round(value * 100)}
      </Text>
    </View>
  );
}

export function ExtractScreen({ count, onSave, onToast, onOpenDna, onReplica }: Props) {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('idle');
  const [step, setStep] = useState(0);
  const [refSource, setRefSource] = useState<ImageSourcePropType | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage !== 'analyzing') {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      return;
    }
    setStep(0);
    timer.current = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 520);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [stage]);

  const runAnalysis = async (source: ImageSourcePropType) => {
    setRefSource(source);
    setStage('analyzing');
    setResult(null);
    const startedAt = Date.now();

    let analysis: Analysis;
    try {
      const uri = await resolveImageUri(source);
      analysis = await analyzeImage(uri);
    } catch {
      analysis = FALLBACK_ANALYSIS;
    }

    const remaining = Math.max(0, 1600 - (Date.now() - startedAt));
    setTimeout(() => {
      setResult(analysis);
      setStage('result');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // ignore
      }
    }, remaining);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onToast('需要相册权限才能导入参考图');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!picked.canceled && picked.assets[0]) {
      runAnalysis({ uri: picked.assets[0].uri });
    }
  };

  const buildLut = (): Lut | null => {
    if (!result) return null;
    return {
      id: `lut-${Date.now()}`,
      name: `${result.name} ${String(count + 1).padStart(2, '0')}`,
      category: '自定义',
      tags: result.tags,
      palette: result.palette,
      params: result.params,
      overlay: result.overlay,
      createdAt: new Date().toISOString().slice(0, 10),
    };
  };

  const save = () => {
    const lut = buildLut();
    if (lut) onSave(lut);
  };

  const openDna = () => {
    const lut = buildLut();
    if (lut) onOpenDna(lut);
  };

  const reset = () => {
    setStage('idle');
    setResult(null);
    setRefSource(null);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>提取风格</Text>
        <Text style={styles.subtitle}>从一张参考图还原它的颜色</Text>
      </View>

      {stage === 'idle' && (
        <>
          <Pressable style={styles.dropZone} onPress={pickFromLibrary}>
            <View style={styles.dropIcon}>
              <Icon name="image" size={26} color={colors.textMuted} />
            </View>
            <Text style={styles.dropTitle}>导入参考图</Text>
            <Text style={styles.dropSub}>相册里任何一张喜欢的照片都可以</Text>
          </Pressable>

          <View style={styles.actionRow}>
            <Pressable style={styles.primaryBtn} onPress={pickFromLibrary}>
              <Icon name="gallery" size={18} color={colors.accentText} />
              <Text style={styles.primaryBtnText}>从相册选择</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => runAnalysis(SAMPLE_REFERENCE)}>
              <Icon name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.secondaryBtnText}>使用示例图</Text>
            </Pressable>
          </View>

          <View style={styles.howCard}>
            <Text style={styles.howTitle}>它会做什么</Text>
            {[
              ['01', '读取参考图的像素，聚类出主色'],
              ['02', '推导曝光、对比、色温等参数'],
              ['03', '生成可套用到相机的风格滤镜'],
            ].map(([no, text]) => (
              <View key={no} style={styles.howRow}>
                <Text style={styles.howNo}>{no}</Text>
                <Text style={styles.howText}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            当前为简化演示：只做整体色调映射，正式版会生成 3D LUT 做逐像素还原。
          </Text>
        </>
      )}

      {stage === 'analyzing' && (
        <View style={styles.analyzing}>
          {refSource && (
            <View style={styles.analyzeImageWrap}>
              <Image source={refSource} style={styles.analyzeImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,11,0.9)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.scanLine} />
            </View>
          )}
          <ActivityIndicator color={colors.accent} style={{ marginTop: space.xl }} />
          <Text style={styles.analyzeTitle}>{STEPS[step]}…</Text>
          <View style={styles.stepDots}>
            {STEPS.map((s, i) => (
              <View key={s} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
            ))}
          </View>
        </View>
      )}

      {stage === 'result' && result && (
        <>
          <View style={styles.compareRow}>
            <View style={styles.compareCol}>
              <View style={styles.compareTile}>
                {refSource && (
                  <Image source={refSource} style={styles.compareImage} resizeMode="cover" />
                )}
              </View>
              <Text style={styles.compareLabel}>参考图</Text>
            </View>
            <View style={styles.compareCol}>
              <View style={styles.compareTile}>
                <Image source={SAMPLE_TARGET} style={styles.compareImage} resizeMode="cover" />
                <GradeOverlay lut={{ ...result, id: 'preview', category: '', createdAt: '' }} strength={0.9} />
              </View>
              <Text style={styles.compareLabel}>效果预览</Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultHead}>
              <View>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.resultMeta}>端侧分析完成 · 5 个主色</Text>
              </View>
              <View style={styles.successChip}>
                <Icon name="check" size={13} color={colors.accent} strokeWidth={2.4} />
                <Text style={styles.successChipText}>已生成</Text>
              </View>
            </View>

            <View style={styles.paletteRow}>
              {result.palette.map((hex, i) => (
                <View key={`${hex}-${i}`} style={styles.paletteItem}>
                  <View style={[styles.paletteChip, { backgroundColor: hex }]} />
                  <Text style={styles.paletteHex}>{hex}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>色彩参数</Text>
            <ParamRow label="曝光" value={result.params.exposure} />
            <ParamRow label="对比度" value={result.params.contrast} />
            <ParamRow label="饱和度" value={result.params.saturation} />
            <ParamRow label="色温" value={result.params.temperature} />
            <ParamRow label="色调" value={result.params.tint} />
            <ParamRow label="褪色" value={result.params.fade} />

            <View style={styles.tagRow}>
              {result.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.insightRow}>
            <Pressable style={styles.insightBtn} onPress={openDna}>
              <Icon name="dna" size={17} color={colors.accent} />
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>调整风格 DNA</Text>
                <Text style={styles.insightSub}>看它由哪些基因组成</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.insightBtn}
              onPress={() => {
                if (refSource) onReplica(refSource);
              }}
            >
              <Icon name="target" size={17} color={colors.accent} />
              <View style={styles.insightText}>
                <Text style={styles.insightTitle}>去复刻拍摄</Text>
                <Text style={styles.insightSub}>带着这张参考取景</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.primaryBtn} onPress={save}>
              <Icon name="plus" size={17} color={colors.accentText} strokeWidth={2.2} />
              <Text style={styles.primaryBtnText}>保存并套用</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={reset}>
              <Text style={styles.secondaryBtnText}>重新选择</Text>
            </Pressable>
          </View>

          <Text style={styles.note}>
            简化演示：仅用主色做整体色调偏移，不涉及神经网络与 3D LUT 训练。
          </Text>
        </>
      )}
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
  dropZone: {
    marginHorizontal: space.lg,
    height: 210,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  dropIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    marginBottom: 6,
  },
  dropTitle: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
  },
  dropSub: {
    color: colors.textMuted,
    fontSize: font.caption,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  insightRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  insightBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 11,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  insightText: {
    flex: 1,
    gap: 1,
  },
  insightTitle: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '600',
  },
  insightSub: {
    color: colors.textDim,
    fontSize: 9,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  primaryBtnText: {
    color: colors.accentText,
    fontSize: font.body,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
  howCard: {
    margin: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: space.md,
  },
  howTitle: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  howNo: {
    color: colors.accent,
    fontSize: font.caption,
    fontWeight: '700',
    width: 22,
  },
  howText: {
    color: colors.text,
    fontSize: font.body,
    flex: 1,
  },
  note: {
    color: colors.textDim,
    fontSize: font.caption,
    lineHeight: 18,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
  },
  analyzing: {
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  analyzeImageWrap: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  analyzeImage: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '46%',
    height: 1.5,
    backgroundColor: colors.accent,
    opacity: 0.9,
  },
  analyzeTitle: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '600',
    marginTop: space.md,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.md,
  },
  stepDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceHi,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  compareRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  compareCol: {
    flex: 1,
    gap: 6,
  },
  compareTile: {
    aspectRatio: 0.78,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  compareImage: {
    width: '100%',
    height: '100%',
  },
  compareLabel: {
    color: colors.textMuted,
    fontSize: font.caption,
    textAlign: 'center',
  },
  resultCard: {
    margin: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: space.md,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultName: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '700',
  },
  resultMeta: {
    color: colors.textMuted,
    fontSize: font.caption,
    marginTop: 2,
  },
  successChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  successChipText: {
    color: colors.accent,
    fontSize: font.caption,
    fontWeight: '600',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  paletteItem: {
    flex: 1,
    gap: 4,
  },
  paletteChip: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  paletteHex: {
    color: colors.textDim,
    fontSize: 9,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  paramLabel: {
    color: colors.textMuted,
    fontSize: font.small,
    width: 48,
  },
  paramBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  paramCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  paramFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
  paramValue: {
    color: colors.text,
    fontSize: font.caption,
    fontWeight: '600',
    width: 34,
    textAlign: 'right',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '500',
  },
});
