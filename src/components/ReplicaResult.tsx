import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '../lib/skeleton';
import { colors, font, radius, space } from '../theme';
import { Icon } from './Icon';
import { Slider } from './Slider';

type Props = {
  photoUri: string;
  reference: ImageSourcePropType;
  skeleton: Skeleton | null;
  score: number | null;
  transferred: boolean;
  onRetake: () => void;
  onClose: () => void;
};

type ViewMode = 'split' | 'overlay' | 'edge';

const TABS: { key: ViewMode; label: string }[] = [
  { key: 'split', label: '并排' },
  { key: 'overlay', label: '叠合' },
  { key: 'edge', label: '骨架' },
];

export function ReplicaResult({
  photoUri,
  reference,
  skeleton,
  score,
  transferred,
  onRetake,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewMode>('split');
  const [blend, setBlend] = useState(0.5);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
          <Icon name="close" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>复刻结果</Text>
          <Text style={styles.subtitle}>对照参考检查构图与色调</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      <View style={styles.stage}>
        {view === 'split' ? (
          <View style={styles.split}>
            <View style={styles.half}>
              <Image source={reference} style={styles.fill} resizeMode="cover" />
              <View style={styles.tag}>
                <Text style={styles.tagText}>参考</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.half}>
              <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
              <View style={styles.tag}>
                <Text style={styles.tagText}>你的</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.fill}>
            <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
            {view === 'overlay' && (
              <Image
                source={reference}
                style={[styles.fill, { opacity: blend }]}
                resizeMode="cover"
              />
            )}
            {view === 'edge' && skeleton && (
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${skeleton.width} ${skeleton.height}`}
                preserveAspectRatio="xMidYMid slice"
                style={StyleSheet.absoluteFill}
              >
                <Path
                  d={skeleton.detailPath}
                  stroke={colors.accent}
                  strokeWidth={0.26}
                  fill="none"
                  opacity={0.4}
                />
                <Path
                  d={skeleton.path}
                  stroke={colors.accent}
                  strokeWidth={0.5}
                  fill="none"
                  opacity={0.92}
                />
              </Svg>
            )}
          </View>
        )}

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>构图相似</Text>
            <Text style={styles.badgeValue}>{score === null ? '--' : Math.round(score)}</Text>
          </View>
          {transferred && (
            <View style={[styles.badge, styles.badgeAccent]}>
              <Icon name="sparkles" size={11} color={colors.accent} />
              <Text style={styles.badgeAccentText}>已套参考色</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = view === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setView(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {view === 'overlay' && (
        <View style={styles.blendRow}>
          <Text style={styles.blendLabel}>参考</Text>
          <View style={styles.blendSlider}>
            <Slider
              value={blend}
              minimumValue={0}
              maximumValue={1}
              onChange={setBlend}
              activeColor={colors.accent}
            />
          </View>
          <Text style={styles.blendValue}>{Math.round(blend * 100)}</Text>
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
        <Pressable style={styles.ghostBtn} onPress={onRetake}>
          <Icon name="camera" size={17} color={colors.text} />
          <Text style={styles.ghostBtnText}>重拍</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onClose}>
          <Icon name="check" size={17} color={colors.accentText} strokeWidth={2.4} />
          <Text style={styles.primaryBtnText}>完成</Text>
        </Pressable>
      </View>
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
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  title: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 10,
  },
  stage: {
    flex: 1,
    marginHorizontal: space.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
    overflow: 'hidden',
  },
  divider: {
    width: 2,
    backgroundColor: colors.bg,
  },
  tag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,10,11,0.66)',
  },
  tagText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },
  badges: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,10,11,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  badgeLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  badgeValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeAccent: {
    borderColor: 'rgba(242,182,90,0.4)',
    backgroundColor: 'rgba(242,182,90,0.16)',
  },
  badgeAccentText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.md,
    marginHorizontal: space.lg,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: 'rgba(242,182,90,0.18)',
  },
  tabText: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent,
  },
  blendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    marginTop: space.sm,
  },
  blendLabel: {
    color: colors.textMuted,
    fontSize: font.caption,
    width: 26,
  },
  blendSlider: {
    flex: 1,
  },
  blendValue: {
    color: colors.text,
    fontSize: font.caption,
    fontWeight: '600',
    width: 26,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  ghostBtn: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ghostBtnText: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1.3,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  primaryBtnText: {
    color: colors.accentText,
    fontSize: font.small,
    fontWeight: '700',
  },
});
