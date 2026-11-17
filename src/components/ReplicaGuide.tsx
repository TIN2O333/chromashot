import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { Skeleton } from '../lib/skeleton';
import { colors } from '../theme';

type Props = {
  image: ImageSourcePropType;
  skeleton: Skeleton | null;
  mode: 'skeleton' | 'photo';
  opacity: number;
  alignment: number | null;
  locked: boolean;
};

export function ReplicaGuide({ image, skeleton, mode, opacity, alignment, locked }: Props) {
  const breath = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 0.85, duration: 1400, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0.28, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const steady = alignment === null ? 0.5 : 0.18 + 0.8 * (alignment / 100);
  const edgeOpacity = locked ? steady : breath;
  const skeletonOpacity = locked ? 0.45 + 0.55 * ((alignment ?? 100) / 100) : 0.88;

  return (
    <>
      {mode === 'photo' ? (
        <Image
          pointerEvents="none"
          source={image}
          style={[StyleSheet.absoluteFill, { opacity }]}
          resizeMode="cover"
        />
      ) : skeleton ? (
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${skeleton.width} ${skeleton.height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <Path
            d={skeleton.path}
            stroke={colors.accent}
            strokeWidth={0.42}
            strokeLinecap="round"
            fill="none"
            opacity={skeletonOpacity}
          />
        </Svg>
      ) : null}

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: edgeOpacity }]}>
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
      </Animated.View>
    </>
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
