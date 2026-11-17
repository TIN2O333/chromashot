import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DeviceMotion } from 'expo-sensors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SAMPLE_TARGET } from '../assets';
import { GradeOverlay } from '../components/GradeOverlay';
import { Icon } from '../components/Icon';
import { ReplicaGuide } from '../components/ReplicaGuide';
import { ReplicaHud } from '../components/ReplicaHud';
import { Slider } from '../components/Slider';
import { loadSkeleton, Skeleton } from '../lib/skeleton';
import { colors, font, radius, space } from '../theme';
import { Lut } from '../types';

type Rotation = { alpha: number; beta: number; gamma: number };

const DEG = 180 / Math.PI;
const wrapDeg = (deg: number) => (((deg + 180) % 360) + 360) % 360 - 180;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));


type Props = {
  luts: Lut[];
  activeLut: Lut | null;
  strength: number;
  onStrengthChange: (value: number) => void;
  onSelectLut: (id: string | null) => void;
  onOpenLibrary: () => void;
  onToast: (message: string) => void;
  replicaOn: boolean;
  replicaSource: ImageSourcePropType | null;
  onReplicaToggle: () => void;
};

export function CameraScreen({
  luts,
  activeLut,
  strength,
  onStrengthChange,
  onSelectLut,
  onOpenLibrary,
  onToast,
  replicaOn,
  replicaSource,
  onReplicaToggle,
}: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [ghostOpacity, setGhostOpacity] = useState(0.34);
  const [ghostMode, setGhostMode] = useState<'skeleton' | 'photo'>('skeleton');
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  const [pose, setPose] = useState<Rotation | null>(null);
  const [locked, setLocked] = useState(false);
  const lockedPose = useRef<Rotation | null>(null);
  const successFired = useRef(false);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const shutterPulse = useRef(new Animated.Value(1)).current;

  const cameraOn = permission?.granted === true;
  const ghostSource = replicaSource ?? SAMPLE_TARGET;

  useEffect(() => {
    if (!replicaOn) return;
    let cancelled = false;
    setSkeleton(null);
    loadSkeleton(ghostSource)
      .then((result) => {
        if (!cancelled) setSkeleton(result);
      })
      .catch(() => {
        if (!cancelled) setSkeleton(null);
      });
    return () => {
      cancelled = true;
    };
  }, [replicaOn, ghostSource]);

  useEffect(() => {
    if (!replicaOn) {
      setPose(null);
      return;
    }
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;
    let lastPose: Rotation | null = null;
    DeviceMotion.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        DeviceMotion.setUpdateInterval(100);
        subscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const next = { alpha: rotation.alpha, beta: rotation.beta, gamma: rotation.gamma };
          if (
            lastPose &&
            Math.abs(next.alpha - lastPose.alpha) < 0.004 &&
            Math.abs(next.beta - lastPose.beta) < 0.004 &&
            Math.abs(next.gamma - lastPose.gamma) < 0.004
          ) {
            return;
          }
          lastPose = next;
          setPose(next);
        });
      })
      .catch(() => {
        // 传感器不可用时退化为纯视觉对位
      });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [replicaOn]);

  const { alignment, hint } = useMemo(() => {
    if (!replicaOn) return { alignment: null, hint: '' };
    if (!locked) return { alignment: null, hint: '转动手机，让骨架贴住画面后点锁定' };
    const base = lockedPose.current;
    if (!base || !pose) return { alignment: null, hint: '已锁定构图' };

    const dYaw = wrapDeg((pose.alpha - base.alpha) * DEG);
    const dPitch = wrapDeg((pose.beta - base.beta) * DEG);
    const dRoll = wrapDeg((pose.gamma - base.gamma) * DEG);
    const error = Math.sqrt((dYaw * dYaw + dPitch * dPitch + 0.6 * dRoll * dRoll) / 2.6);
    const value = Math.round(clamp(100 - error * 4.5, 0, 100));

    const parts: string[] = [];
    if (Math.abs(dYaw) > 1.5) {
      parts.push(`${dYaw > 0 ? '向右' : '向左'}转 ${Math.round(Math.abs(dYaw))}°`);
    }
    if (Math.abs(dPitch) > 1.5) {
      parts.push(`${dPitch > 0 ? '抬高' : '放低'} ${Math.round(Math.abs(dPitch))}°`);
    }
    if (Math.abs(dRoll) > 2) {
      parts.push(dRoll > 0 ? '手机向右歪了' : '手机向左歪了');
    }

    return { alignment: value, hint: parts.length ? parts.join(' · ') : '保持住，按下快门' };
  }, [replicaOn, locked, pose]);

  const bucket = alignment === null ? -1 : alignment >= 90 ? 2 : alignment >= 60 ? 1 : 0;

  useEffect(() => {
    if (!replicaOn) {
      shutterPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shutterPulse, { toValue: 1.06, duration: 1150, useNativeDriver: true }),
        Animated.timing(shutterPulse, { toValue: 1, duration: 1150, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [replicaOn, shutterPulse]);

  useEffect(() => {
    if (!replicaOn || !locked) return;
    const interval = bucket === 2 ? 700 : bucket === 1 ? 1300 : 2100;
    const timer = setInterval(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // 演示版忽略震动失败
      }
    }, interval);
    return () => clearInterval(timer);
  }, [replicaOn, locked, bucket]);

  useEffect(() => {
    if (!replicaOn || !locked || alignment === null) return;
    if (alignment >= 92 && !successFired.current) {
      successFired.current = true;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // ignore
      }
    }
  }, [replicaOn, locked, alignment]);

  const lockPose = () => {
    lockedPose.current = pose;
    setLocked(true);
    successFired.current = false;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
    onToast(pose ? '构图已锁定 · 手机会提醒你保持' : '姿态感应不可用，已进入锁定演示');
  };

  const unlockPose = () => {
    lockedPose.current = null;
    setLocked(false);
    try {
      Haptics.selectionAsync();
    } catch {
      // ignore
    }
  };

  const fireShutter = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // 演示版忽略震动失败
    }
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    if (!replicaOn) {
      onToast('已拍摄 · 演示版未写入相册');
    } else if (!locked || alignment === null) {
      onToast('已复刻拍摄 · 未锁定构图');
    } else if (alignment >= 90) {
      onToast('已复刻拍摄 · 构图保持得很好');
    } else {
      onToast(`已复刻拍摄 · 偏离锁定构图 ${Math.round(100 - alignment)}%`);
    }
  };

  const toggleReplica = () => {
    try {
      if (replicaOn) {
        Haptics.selectionAsync();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // ignore
    }
    if (replicaOn) {
      setLocked(false);
      lockedPose.current = null;
    }
    onReplicaToggle();
    onToast(replicaOn ? '已退出复刻模式' : '复刻模式：先对上骨架，再锁定构图');
  };

  const pickLut = (id: string | null) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // ignore
    }
    onSelectLut(id);
  };

  return (
    <View style={styles.root}>
      {cameraOn ? (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <Image source={SAMPLE_TARGET} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      <GradeOverlay lut={activeLut} strength={strength} />

      {replicaOn && (
        <ReplicaGuide
          image={ghostSource}
          skeleton={skeleton}
          mode={ghostMode}
          opacity={ghostOpacity}
          alignment={alignment}
          locked={locked}
        />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.18)', 'transparent']}
        style={styles.topShade}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        style={styles.bottomShade}
      />

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flashOpacity }]}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={[styles.circleBtn, flashOn && styles.circleBtnActive]}
          onPress={() => setFlashOn((v) => !v)}
          hitSlop={8}
        >
          <Icon name="flash" size={19} color={flashOn ? colors.accentText : colors.text} />
        </Pressable>

        <Pressable style={styles.lutPill} onPress={onOpenLibrary}>
          <View style={styles.lutDot}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: activeLut ? activeLut.overlay.wash : colors.textDim,
              }}
            />
          </View>
          <Text style={styles.lutPillText}>{activeLut ? activeLut.name : '原图'}</Text>
          <Icon name="chevron" size={13} color={colors.textMuted} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          style={styles.circleBtn}
          onPress={() => (cameraOn ? setFacing(facing === 'back' ? 'front' : 'back') : requestPermission())}
          hitSlop={8}
        >
          <Icon name="flip" size={19} color={colors.text} />
        </Pressable>
      </View>

      {replicaOn && (
        <View style={[styles.hudWrap, { top: insets.top + 54 }]}>
          <ReplicaHud
            alignment={alignment}
            hint={hint}
            locked={locked}
            mode={ghostMode}
            onToggleMode={() => setGhostMode((m) => (m === 'skeleton' ? 'photo' : 'skeleton'))}
            onLock={lockPose}
            onUnlock={unlockPose}
          />
        </View>
      )}

      {!cameraOn && !replicaOn && (
        <Pressable style={[styles.cameraHint, { top: insets.top + 66 }]} onPress={requestPermission}>
          <Text style={styles.cameraHintText}>示例画面 · 点击开启相机</Text>
        </Pressable>
      )}

      <View style={styles.bottom}>
        {replicaOn && ghostMode === 'photo' && (
          <View style={styles.strengthRow}>
            <Text style={styles.strengthLabel}>鬼影</Text>
            <View style={styles.strengthSlider}>
              <Slider
                value={ghostOpacity}
                minimumValue={0.05}
                maximumValue={0.75}
                onChange={setGhostOpacity}
                activeColor={colors.accent}
              />
            </View>
            <Text style={styles.strengthValue}>{Math.round(ghostOpacity * 100)}</Text>
          </View>
        )}

        <View style={styles.strengthRow}>
          <Text style={styles.strengthLabel}>强度</Text>
          <View style={styles.strengthSlider}>
            <Slider
              value={strength}
              onChange={onStrengthChange}
              activeColor={colors.accent}
            />
          </View>
          <Text style={styles.strengthValue}>{Math.round(strength * 100)}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
        >
          <Pressable style={styles.stripItem} onPress={() => pickLut(null)}>
            <View style={[styles.stripThumb, !activeLut && styles.stripThumbActive]}>
              <Image source={SAMPLE_TARGET} style={styles.stripImage} resizeMode="cover" />
            </View>
            <Text style={[styles.stripName, !activeLut && styles.stripNameActive]}>原图</Text>
          </Pressable>

          {luts.map((lut) => {
            const active = activeLut?.id === lut.id;
            return (
              <Pressable key={lut.id} style={styles.stripItem} onPress={() => pickLut(lut.id)}>
                <View style={[styles.stripThumb, active && styles.stripThumbActive]}>
                  <Image source={SAMPLE_TARGET} style={styles.stripImage} resizeMode="cover" />
                  <GradeOverlay lut={lut} strength={0.9} />
                </View>
                <Text style={[styles.stripName, active && styles.stripNameActive]} numberOfLines={1}>
                  {lut.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.controls}>
          <Pressable style={styles.sideBtn} onPress={onOpenLibrary} hitSlop={8}>
            <View style={styles.galleryThumb}>
              <Image source={SAMPLE_TARGET} style={styles.stripImage} resizeMode="cover" />
            </View>
          </Pressable>

          <Animated.View style={{ transform: [{ scale: shutterPulse }] }}>
            <Pressable onPress={fireShutter} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </Pressable>
          </Animated.View>

          <Pressable style={styles.sideBtn} onPress={toggleReplica} hitSlop={8}>
            <View style={[styles.replicaBtn, replicaOn && styles.replicaBtnActive]}>
              <Icon name="target" size={21} color={replicaOn ? colors.accentText : colors.text} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 330,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,22,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  circleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  lutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 10,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20,20,22,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  lutDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  lutPillText: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '600',
    maxWidth: 130,
  },
  cameraHint: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20,20,22,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cameraHintText: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: '500',
  },
  hudWrap: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
  },
  replicaBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,22,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  replicaBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: space.sm,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
    marginBottom: space.xs,
  },
  strengthLabel: {
    color: colors.textMuted,
    fontSize: font.caption,
    width: 26,
  },
  strengthSlider: {
    flex: 1,
  },
  strengthValue: {
    color: colors.text,
    fontSize: font.caption,
    fontWeight: '600',
    width: 26,
    textAlign: 'right',
  },
  stripContent: {
    paddingHorizontal: space.lg,
    gap: 10,
    paddingVertical: space.sm,
  },
  stripItem: {
    alignItems: 'center',
    width: 58,
    gap: 5,
  },
  stripThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceAlt,
  },
  stripThumbActive: {
    borderColor: colors.accent,
  },
  stripImage: {
    width: '100%',
    height: '100%',
  },
  stripName: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 56,
  },
  stripNameActive: {
    color: colors.accent,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
    paddingTop: space.sm,
  },
  sideBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },
});
