import React, { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  height?: number;
  activeColor?: string;
};

export function Slider({
  value,
  onChange,
  minimumValue = 0,
  maximumValue = 1,
  height = 32,
  activeColor = colors.accent,
}: Props) {
  const widthRef = useRef(0);
  const ratio = Math.max(0, Math.min(1, (value - minimumValue) / (maximumValue - minimumValue)));

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          const r = Math.max(0, Math.min(1, x / Math.max(1, widthRef.current)));
          onChange(minimumValue + r * (maximumValue - minimumValue));
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const r = Math.max(0, Math.min(1, x / Math.max(1, widthRef.current)));
          onChange(minimumValue + r * (maximumValue - minimumValue));
        },
      }),
    [maximumValue, minimumValue, onChange]
  );

  return (
    <View
      style={[styles.hit, { height }]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
      }}
      {...responder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: activeColor }]} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: `${ratio * 100}%`, borderColor: activeColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
