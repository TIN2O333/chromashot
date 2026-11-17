import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '../theme';

type Props = {
  message: string | null;
  bottom?: number;
};

export function Toast({ message, bottom = 96 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (message) {
      opacity.setValue(0);
      translate.setValue(8);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(translate, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [message, opacity, translate]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { bottom, opacity, transform: [{ translateY: translate }] }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28,28,32,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  text: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '500',
  },
});
