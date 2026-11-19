import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

import { Skeleton } from '../lib/skeleton';
import { colors } from '../theme';

type Props = {
  image: ImageSourcePropType;
  skeleton: Skeleton | null;
  mode: 'skeleton' | 'photo';
  opacity: number;
  alignment: number | null;
  locked: boolean;
  mirror: boolean;
  resetToken: number;
  onManualAdjust: () => void;
  onReset: () => void;
};

type Transform = { x: number; y: number; scale: number; rotate: number };

const IDENTITY: Transform = { x: 0, y: 0, scale: 1, rotate: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type Touch = { pageX: number; pageY: number };

const distance = (touches: readonly Touch[]) =>
  Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

const angleOf = (touches: readonly Touch[]) =>
  (Math.atan2(touches[1].pageY - touches[0].pageY, touches[1].pageX - touches[0].pageX) * 180) /
  Math.PI;

export function ReplicaGuide({
  image,
  skeleton,
  mode,
  opacity,
  alignment,
  locked,
  mirror,
  resetToken,
  onManualAdjust,
  onReset,
}: Props) {
  const [xform, setXform] = useState<Transform>(IDENTITY);
  const xformRef = useRef<Transform>(IDENTITY);
  const pinchRef = useRef<{ dist: number; angle: number; scale: number; rotate: number } | null>(
    null
  );
  const dragStart = useRef({ x: 0, y: 0 });
  const grantAt = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    xformRef.current = IDENTITY;
    pinchRef.current = null;
    setXform(IDENTITY);
  }, [resetToken]);

  const commit = (next: Transform) => {
    xformRef.current = next;
    setXform(next);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !locked,
        onMoveShouldSetPanResponder: (_, g) =>
          !locked && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          grantAt.current = Date.now();
          dragStart.current = { x: xformRef.current.x, y: xformRef.current.y };
          pinchRef.current =
            touches.length >= 2
              ? {
                  dist: distance(touches),
                  angle: angleOf(touches),
                  scale: xformRef.current.scale,
                  rotate: xformRef.current.rotate,
                }
              : null;
        },
        onPanResponderMove: (evt, g) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const base =
              pinchRef.current ??
              {
                dist: distance(touches),
                angle: angleOf(touches),
                scale: xformRef.current.scale,
                rotate: xformRef.current.rotate,
              };
            pinchRef.current = base;
            commit({
              ...xformRef.current,
              scale: clamp(base.scale * (distance(touches) / Math.max(1, base.dist)), 0.45, 2.8),
              rotate: clamp(base.rotate + angleOf(touches) - base.angle, -50, 50),
            });
            return;
          }

          if (touches.length === 1) {
            if (pinchRef.current) {
              pinchRef.current = null;
              dragStart.current = {
                x: xformRef.current.x - g.dx,
                y: xformRef.current.y - g.dy,
              };
            }
            commit({
              ...xformRef.current,
              x: dragStart.current.x + g.dx,
              y: dragStart.current.y + g.dy,
            });
          }
        },
        onPanResponderRelease: (_, g) => {
          const moved = Math.abs(g.dx) + Math.abs(g.dy) > 6;
          pinchRef.current = null;

          if (moved) {
            lastTap.current = 0;
            onManualAdjust();
            return;
          }

          if (Date.now() - grantAt.current > 240) return;
          if (Date.now() - lastTap.current < 320) {
            lastTap.current = 0;
            commit(IDENTITY);
            onReset();
            return;
          }
          lastTap.current = Date.now();
        },
        onPanResponderTerminate: () => {
          pinchRef.current = null;
        },
      }),
    [locked, onManualAdjust, onReset]
  );

  const edgeOpacity =
    alignment === null ? 0.34 : locked ? 0.7 : 0.26 + 0.48 * (alignment / 100);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: xform.x },
                { translateY: xform.y },
                { rotate: `${xform.rotate}deg` },
                { scale: xform.scale },
                { scaleX: mirror ? -1 : 1 },
              ],
            },
          ]}
        >
          {mode === 'photo' ? (
            <Image
              source={image}
              style={[StyleSheet.absoluteFill, { opacity }]}
              resizeMode="cover"
            />
          ) : skeleton ? (
            <Svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${skeleton.width} ${skeleton.height}`}
              preserveAspectRatio="xMidYMid slice"
            >
              <Path
                d={skeleton.detailPath}
                stroke={colors.accent}
                strokeWidth={0.26}
                strokeLinecap="round"
                fill="none"
                opacity={0.5 * (opacity + 0.35)}
              />
              <Path
                d={skeleton.path}
                stroke={colors.accent}
                strokeWidth={0.46}
                strokeLinecap="round"
                fill="none"
                opacity={0.35 + 0.65 * opacity}
              />
              <Rect
                x={skeleton.box.x * skeleton.width}
                y={skeleton.box.y * skeleton.height}
                width={skeleton.box.w * skeleton.width}
                height={skeleton.box.h * skeleton.height}
                stroke={colors.accent}
                strokeWidth={0.34}
                strokeDasharray="2.4 2.4"
                fill="none"
                opacity={0.32}
              />
            </Svg>
          ) : null}
        </View>

        <View style={[StyleSheet.absoluteFill, { opacity: edgeOpacity }]}>
          <LinearGradient
            colors={['rgba(242,182,90,0.5)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.edge, styles.top]}
          />
          <LinearGradient
            colors={['rgba(242,182,90,0.5)', 'transparent']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={[styles.edge, styles.bottom]}
          />
          <LinearGradient
            colors={['rgba(242,182,90,0.4)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.edge, styles.left]}
          />
          <LinearGradient
            colors={['rgba(242,182,90,0.4)', 'transparent']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            style={[styles.edge, styles.right]}
          />
        </View>
      </View>

      <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />
    </View>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
  },
  top: {
    top: 0,
    left: 0,
    right: 0,
    height: 96,
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
  },
  left: {
    top: 0,
    bottom: 0,
    left: 0,
    width: 64,
  },
  right: {
    top: 0,
    bottom: 0,
    right: 0,
    width: 64,
  },
});
