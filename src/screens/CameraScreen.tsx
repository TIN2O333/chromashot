import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { Icon, IconName } from '../components/Icon';
import { ReplicaGuide } from '../components/ReplicaGuide';
import { ReplicaHud } from '../components/ReplicaHud';
import { ReplicaResult } from '../components/ReplicaResult';
import { Slider } from '../components/Slider';
import { AlignAdvice, alignImages, describeAlign, GrayImage, loadGrayFromSource, loadGrayFromUri } from '../lib/align';
import { analyzeImage } from '../lib/palette';
import { loadSkeleton, Skeleton } from '../lib/skeleton';
import { ColorStats, loadColorStats, transferPhoto } from '../lib/transfer';
import { resolveImageUri } from '../lib/image';
import { colors, font, radius, space } from '../theme';
import { Lut } from '../types';

const DEG = 180 / Math.PI;
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

type ShotResult = {
  uri: string;
  score: number | null;
  transferred: boolean;
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

  const [ghostOpacity, setGhostOpacity] = useState(0.42);
  const [ghostMode, setGhostMode] = useState<'skeleton' | 'photo'>('skeleton');
  const [ghostMirror, setGhostMirror] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  const [look, setLook] = useState<Lut | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [advice, setAdvice] = useState<AlignAdvice | null>(null);
  const [scanning, setScanning] = useState(false);
  const [autoAlign, setAutoAlign] = useState(true);
  const [locked, setLocked] = useState(false);
  const [colorPreview, setColorPreview] = useState(true);
  const [roll, setRoll] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ShotResult | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const refGray = useRef<GrayImage | null>(null);
  const colorStats = useRef<ColorStats | null>(null);
  const smoothScore = useRef<number | null>(null);
  const hapticBucket = useRef(0);
  const successFired = useRef(false);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const shutterPulse = useRef(new Animated.Value(1)).current;

  const cameraOn = permission?.granted === true;
  const ghostSource = replicaSource ?? SAMPLE_TARGET;

  useEffect(() => {
    if (!replicaOn) {
      setSkeleton(null);
      setLook(null);
      refGray.current = null;
      colorStats.current = null;
      setScore(null);
      setAdvice(null);
      setLocked(false);
      setResult(null);
      smoothScore.current = null;
      hapticBucket.current = 0;
      successFired.current = false;
      return;
    }

    let cancelled = false;
    loadSkeleton(ghostSource)
      .then((value) => {
        if (!cancelled) setSkeleton(value);
      })
      .catch(() => {
        if (!cancelled) setSkeleton(null);
      });

    loadGrayFromSource(ghostSource)
      .then((value) => {
        if (!cancelled) refGray.current = value;
      })
      .catch(() => {
        refGray.current = null;
      });

    resolveImageUri(ghostSource)
      .then(async (uri) => {
        const [analysis, stats] = await Promise.all([analyzeImage(uri), loadColorStats(uri)]);
        if (cancelled) return;
        colorStats.current = stats;
        setLook({
          id: 'replica-look',
          name: '参考色',
          category: '复刻',
          tags: analysis.tags,
          palette: analysis.palette,
          params: analysis.params,
          overlay: analysis.overlay,
          createdAt: new Date().toISOString(),
        });
      })
      .catch(() => {
        colorStats.current = null;
        setLook(null);
      });

    return () => {
      cancelled = true;
    };
  }, [replicaOn, ghostSource]);

  useEffect(() => {
    if (!replicaOn) {
      setRoll(0);
      return;
    }
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;
    DeviceMotion.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        DeviceMotion.setUpdateInterval(180);
        subscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          setRoll(rotation.gamma * DEG);
        });
      })
      .catch(() => {
        // 传感器不可用时仅依赖视觉对齐
      });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [replicaOn]);

  useEffect(() => {
    if (!replicaOn) return;
    if (!autoAlign) {
      setScore(null);
      setAdvice(null);
      setScanning(false);
      return;
    }
    if (!cameraOn || result || busy) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      const camera = cameraRef.current;
      if (!camera || !refGray.current) {
        timer = setTimeout(tick, 900);
        return;
      }

      try {
        setScanning(true);
        const shot = await camera.takePictureAsync({
          quality: 0.18,
          exif: false,
          shutterSound: false,
        });
        if (cancelled) return;
        if (!shot?.uri) throw new Error('no-frame');
        const frame = await loadGrayFromUri(shot.uri);
        if (cancelled) return;

        const aligned = alignImages(refGray.current, frame);
        const next =
          smoothScore.current === null
            ? aligned.score
            : Math.round(smoothScore.current * 0.35 + aligned.score * 0.65);
        smoothScore.current = next;

        setScore(next);
        setAdvice(describeAlign({ ...aligned, score: next }));

        const bucket = next >= 88 ? 2 : next >= 62 ? 1 : 0;
        if (bucket > hapticBucket.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        hapticBucket.current = bucket;

        if (next >= 90 && !successFired.current) {
          successFired.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
            () => undefined
          );
        }
        if (next < 82) successFired.current = false;
      } catch {
        if (!cancelled) {
          setScanning(false);
          timer = setTimeout(tick, 1400);
        }
        return;
      }

      if (cancelled) return;
      setScanning(false);
      timer = setTimeout(tick, 1500);
    };

    timer = setTimeout(tick, 600);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [replicaOn, autoAlign, cameraOn, result, busy]);

  useEffect(() => {
    if (!replicaOn) {
      shutterPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shutterPulse, { toValue: 1.05, duration: 1250, useNativeDriver: true }),
        Animated.timing(shutterPulse, { toValue: 1, duration: 1250, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [replicaOn, shutterPulse]);

  const displayAdvice = useMemo(() => {
    if (!advice) return null;
    if (Math.abs(roll) < 5) return advice;
    const tilt = `${roll > 0 ? '手机右倾' : '手机左倾'} ${Math.round(Math.abs(roll))}°`;
    if (advice.detail.includes('保持住')) return { ...advice, detail: tilt };
    return { ...advice, detail: `${advice.detail} · ${tilt}` };
  }, [advice, roll]);

  const previewLut = replicaOn && colorPreview ? look ?? activeLut : activeLut;
  const previewStrength = replicaOn && colorPreview ? 0.82 : strength;

  const handleManualAdjust = useCallback(() => {
    setAutoAlign(false);
    setScore(null);
    setAdvice(null);
    smoothScore.current = null;
    hapticBucket.current = 0;
  }, []);

  const resetGhost = useCallback(() => {
    setResetToken((v) => v + 1);
    setAutoAlign(true);
    setScore(null);
    setAdvice(null);
    smoothScore.current = null;
    hapticBucket.current = 0;
    Haptics.selectionAsync().catch(() => undefined);
    onToast('参考图已复位 · 恢复自动对位');
  }, [onToast]);

  const lockGhost = () => {
    setLocked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onToast('参考图已锁定 · 只能移动手机来贴合');
  };

  const unlockGhost = () => {
    setLocked(false);
    Haptics.selectionAsync().catch(() => undefined);
  };

  const flash = () => {
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 190, useNativeDriver: true }),
    ]).start();
  };

  const fireShutter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    flash();

    if (!replicaOn) {
      onToast('已拍摄 · 演示版未写入相册');
      return;
    }

    if (busy) return;
    if (!cameraOn) {
      onToast('示例画面无法拍摄 · 点击上方提示开启相机');
      return;
    }
    const camera = cameraRef.current;
    if (!camera) {
      onToast('相机尚未就绪');
      return;
    }

    setBusy(true);
    try {
      const shot = await camera.takePictureAsync({ quality: 0.85, exif: false });
      let finalScore = score;
      let uri = shot.uri;

      if (refGray.current) {
        try {
          const frame = await loadGrayFromUri(shot.uri);
          finalScore = alignImages(refGray.current, frame).score;
        } catch {
          finalScore = score;
        }
      }

      let transferred = false;
      if (colorPreview && colorStats.current) {
        try {
          uri = await transferPhoto(shot.uri, colorStats.current, 0.85);
          transferred = true;
        } catch {
          transferred = false;
        }
      }

      setResult({ uri, score: finalScore, transferred });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      onToast('拍摄失败，请重试');
    } finally {
      setBusy(false);
    }
  };

  const toggleReplica = () => {
    if (replicaOn) {
      Haptics.selectionAsync().catch(() => undefined);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setAutoAlign(true);
      setScore(null);
      setAdvice(null);
      smoothScore.current = null;
      hapticBucket.current = 0;
    }
    onReplicaToggle();
    onToast(replicaOn ? '已退出复刻模式' : '复刻模式：对准骨架，一键仿色');
  };

  const pickLut = (id: string | null) => {
    Haptics.selectionAsync().catch(() => undefined);
    onSelectLut(id);
  };

  const ghostLabel = colorPreview && look ? '参考色' : activeLut?.name ?? '原图';

  return (
    <View style={styles.root}>
      {cameraOn ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          animateShutter={false}
        />
      ) : (
        <Image source={SAMPLE_TARGET} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      <GradeOverlay lut={previewLut} strength={previewStrength} />

      {replicaOn && (
        <ReplicaGuide
          image={ghostSource}
          skeleton={skeleton}
          mode={ghostMode}
          opacity={ghostOpacity}
          alignment={score}
          locked={locked}
          mirror={ghostMirror}
          resetToken={resetToken}
          onManualAdjust={handleManualAdjust}
          onReset={resetGhost}
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
                backgroundColor: replicaOn && colorPreview ? look?.overlay.wash ?? colors.accent : activeLut ? activeLut.overlay.wash : colors.textDim,
              }}
            />
          </View>
          <Text style={styles.lutPillText} numberOfLines={1}>
            {replicaOn ? ghostLabel : activeLut ? activeLut.name : '原图'}
          </Text>
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
            score={score}
            advice={displayAdvice}
            scanning={scanning}
            locked={locked}
            mode={ghostMode}
            auto={autoAlign}
            onToggleMode={() => setGhostMode((m) => (m === 'skeleton' ? 'photo' : 'skeleton'))}
            onToggleAuto={() => setAutoAlign((v) => !v)}
            onLock={lockGhost}
            onUnlock={unlockGhost}
          />
        </View>
      )}

      {!cameraOn && (
        <Pressable
          style={[styles.cameraHint, { top: insets.top + (replicaOn ? 182 : 66) }]}
          onPress={requestPermission}
        >
          <Text style={styles.cameraHintText}>
            {replicaOn ? '示例画面 · 点击开启相机实时对齐' : '示例画面 · 点击开启相机'}
          </Text>
        </Pressable>
      )}

      <View style={styles.bottom}>
        {replicaOn ? (
          <View style={styles.replicaPanel}>
            <View style={styles.toolsRow}>
              <ToolButton
                icon="layers"
                label={ghostMode === 'skeleton' ? '轮廓' : '彩色'}
                onPress={() => setGhostMode((m) => (m === 'skeleton' ? 'photo' : 'skeleton'))}
              />
              <ToolButton
                icon="flip"
                label="镜像"
                active={ghostMirror}
                onPress={() => setGhostMirror((v) => !v)}
              />
              <ToolButton icon="target" label="复位" onPress={resetGhost} />
              <ToolButton
                icon="sparkles"
                label="仿色"
                active={colorPreview}
                onPress={() => setColorPreview((v) => !v)}
              />
            </View>

            <View style={styles.strengthRow}>
              <Text style={styles.strengthLabel}>参考</Text>
              <View style={styles.strengthSlider}>
                <Slider
                  value={ghostOpacity}
                  minimumValue={0.08}
                  maximumValue={0.85}
                  onChange={setGhostOpacity}
                  activeColor={colors.accent}
                />
              </View>
              <Text style={styles.strengthValue}>{Math.round(ghostOpacity * 100)}</Text>
            </View>

            <Text style={styles.tip}>单指拖动 · 双指缩放旋转 · 双击复位</Text>
          </View>
        ) : (
          <>
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
          </>
        )}

        <View style={styles.controls}>
          <Pressable style={styles.sideBtn} onPress={onOpenLibrary} hitSlop={8}>
            <View style={styles.galleryThumb}>
              <Image source={SAMPLE_TARGET} style={styles.stripImage} resizeMode="cover" />
            </View>
          </Pressable>

          <Animated.View style={{ transform: [{ scale: shutterPulse }] }}>
            <Pressable onPress={fireShutter} style={styles.shutterOuter}>
              <View style={[styles.shutterInner, replicaOn && styles.shutterInnerReplica]} />
            </Pressable>
          </Animated.View>

          <Pressable style={styles.sideBtn} onPress={toggleReplica} hitSlop={8}>
            <View style={[styles.replicaBtn, replicaOn && styles.replicaBtnActive]}>
              <Icon name="target" size={21} color={replicaOn ? colors.accentText : colors.text} />
            </View>
          </Pressable>
        </View>
      </View>

      {busy && (
        <View style={styles.busy} pointerEvents="auto">
          <View style={styles.busyCard}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.busyText}>正在生成仿色结果…</Text>
          </View>
        </View>
      )}

      {result && (
        <ReplicaResult
          photoUri={result.uri}
          reference={ghostSource}
          skeleton={skeleton}
          score={result.score}
          transferred={result.transferred}
          onRetake={() => {
            setResult(null);
            onToast('已回到取景 · 可以重新拍摄');
          }}
          onClose={() => {
            setResult(null);
            onToast('复刻完成 · 演示版未写入相册');
          }}
        />
      )}
    </View>
  );
}

function ToolButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tool, active && styles.toolActive]} onPress={onPress} hitSlop={4}>
      <Icon name={icon} size={17} color={active ? colors.accent : colors.text} />
      <Text style={[styles.toolText, active && styles.toolTextActive]}>{label}</Text>
    </Pressable>
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
  replicaPanel: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: 6,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(14,14,16,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,182,90,0.24)',
    gap: 4,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tool: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  toolActive: {
    backgroundColor: colors.accentSoft,
  },
  toolText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  toolTextActive: {
    color: colors.accent,
  },
  tip: {
    color: colors.textDim,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
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
  shutterInnerReplica: {
    backgroundColor: colors.accent,
  },
  busy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  busyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(14,14,16,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,182,90,0.3)',
  },
  busyText: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '600',
  },
});
