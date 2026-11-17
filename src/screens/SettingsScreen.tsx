import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '../components/Icon';
import { colors, font, radius, space } from '../theme';

type RowProps = {
  icon: IconName;
  label: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
};

function Row({ icon, label, value, badge, onPress, right, last }: RowProps) {
  return (
    <Pressable
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress && !right}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={17} color={colors.textMuted} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {badge && (
        <View style={styles.proBadge}>
          <Icon name="crown" size={11} color={colors.accentText} strokeWidth={2} />
          <Text style={styles.proText}>{badge}</Text>
        </View>
      )}
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right}
      {onPress && <Icon name="chevron" size={14} color={colors.textDim} strokeWidth={2} />}
    </Pressable>
  );
}

export function SettingsScreen({ onToast }: { onToast: (message: string) => void }) {
  const insets = useSafeAreaInsets();
  const [grid, setGrid] = useState(true);
  const [keepOriginal, setKeepOriginal] = useState(false);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>设置</Text>
      </View>

      <View style={styles.proCard}>
        <View style={styles.proIcon}>
          <Icon name="crown" size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.proTitle}>ChromaShot Pro</Text>
          <Text style={styles.proSub}>无限 LUT · 4K 直出 · 云端同步</Text>
        </View>
        <Pressable style={styles.proBtn} onPress={() => onToast('订阅流程待接入')}>
          <Text style={styles.proBtnText}>了解</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>账户</Text>
      <View style={styles.group}>
        <Row icon="crown" label="订阅管理" badge="PRO" onPress={() => onToast('订阅流程待接入')} />
        <Row icon="layers" label="恢复购买" onPress={() => onToast('暂无历史购买')} last />
      </View>

      <Text style={styles.sectionTitle}>拍摄</Text>
      <View style={styles.group}>
        <Row icon="image" label="照片画质" value="1080P" onPress={() => onToast('画质选项待接入')} />
        <Row
          icon="grid"
          label="取景网格"
          right={
            <Switch
              value={grid}
              onValueChange={setGrid}
              trackColor={{ false: '#3A3A40', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <Row
          icon="gallery"
          label="同时保存原图"
          right={
            <Switch
              value={keepOriginal}
              onValueChange={setKeepOriginal}
              trackColor={{ false: '#3A3A40', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          }
          last
        />
      </View>

      <Text style={styles.sectionTitle}>关于</Text>
      <View style={styles.group}>
        <Row icon="sparkles" label="版本" value="0.1.0 · UI 小样" last />
      </View>

      <Text style={styles.footer}>
        这是用于验证交互与视觉的 UI 小样，设置项暂不持久化。
      </Text>
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
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,182,90,0.3)',
  },
  proIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  proTitle: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: '700',
  },
  proSub: {
    color: colors.textMuted,
    fontSize: font.caption,
    marginTop: 2,
  },
  proBtn: {
    paddingHorizontal: 14,
    height: 32,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  proBtnText: {
    color: colors.accentText,
    fontSize: font.small,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: font.caption,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
  group: {
    marginHorizontal: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 26,
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
  },
  rowValue: {
    color: colors.textMuted,
    fontSize: font.small,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  proText: {
    color: colors.accentText,
    fontSize: 9,
    fontWeight: '800',
  },
  footer: {
    color: colors.textDim,
    fontSize: font.caption,
    lineHeight: 18,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
  },
});
