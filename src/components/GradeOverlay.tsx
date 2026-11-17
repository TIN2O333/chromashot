import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Lut } from '../types';

type Props = {
  lut: Lut | null;
  strength: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function GradeOverlay({ lut, strength }: Props) {
  if (!lut) return null;

  const s = clamp01(strength);
  if (s < 0.01) return null;

  const amount = lut.overlay.amount;
  const { exposure, fade, temperature, saturation, tint } = lut.params;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[lut.overlay.highlight, lut.overlay.mid, lut.overlay.shadow]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.24 * s * amount }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: lut.overlay.wash, opacity: 0.1 * s * amount },
        ]}
      />
      {temperature > 0.12 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#FF8A3D', opacity: 0.12 * s * Math.min(1, temperature) },
          ]}
        />
      )}
      {temperature < -0.12 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#3D7BFF', opacity: 0.12 * s * Math.min(1, -temperature) },
          ]}
        />
      )}
      {saturation > 0.12 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: lut.overlay.wash, opacity: 0.1 * s * Math.min(1, saturation) },
          ]}
        />
      )}
      {saturation < -0.12 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#9AA0A6', opacity: 0.15 * s * Math.min(1, -saturation) },
          ]}
        />
      )}
      {tint > 0.12 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#E85AB4', opacity: 0.08 * s * Math.min(1, tint) },
          ]}
        />
      )}
      {tint < -0.12 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#4ACB8E', opacity: 0.08 * s * Math.min(1, -tint) },
          ]}
        />
      )}
      {exposure > 0.02 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#FFFFFF', opacity: 0.1 * s * exposure },
          ]}
        />
      )}
      {exposure < -0.02 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000000', opacity: 0.16 * s * -exposure },
          ]}
        />
      )}
      {fade > 0.02 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: lut.overlay.highlight, opacity: 0.12 * s * fade },
          ]}
        />
      )}
    </View>
  );
}
