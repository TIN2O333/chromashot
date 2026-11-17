import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from './src/components/TabBar';
import { Toast } from './src/components/Toast';
import { PRESET_LUTS } from './src/lib/presets';
import { CameraScreen } from './src/screens/CameraScreen';
import { DnaScreen } from './src/screens/DnaScreen';
import { ExtractScreen } from './src/screens/ExtractScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { MyLutsScreen } from './src/screens/MyLutsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme';
import { Lut, TabKey } from './src/types';

function Root() {
  const [tab, setTab] = useState<TabKey>('camera');
  const [luts, setLuts] = useState<Lut[]>(PRESET_LUTS);
  const [activeId, setActiveId] = useState<string | null>('builtin-golden');
  const [strength, setStrength] = useState(0.78);
  const [toast, setToast] = useState<string | null>(null);
  const [dnaLut, setDnaLut] = useState<Lut | null>(null);
  const [replicaOn, setReplicaOn] = useState(false);
  const [replicaSource, setReplicaSource] = useState<ImageSourcePropType | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const activeLut = luts.find((l) => l.id === activeId) ?? null;
  const customLuts = luts.filter((l) => !l.builtin);

  const applyLut = (id: string) => {
    const target = luts.find((l) => l.id === id);
    setActiveId(id);
    setTab('camera');
    if (target) showToast(`已套用「${target.name}」`);
  };

  const saveLut = (lut: Lut) => {
    setLuts((prev) => [lut, ...prev]);
    setActiveId(lut.id);
    setStrength(0.85);
    setTab('camera');
    showToast('已保存并套用到相机');
  };

  const deleteLut = (id: string) => {
    setLuts((prev) => prev.filter((l) => l.id !== id));
    if (activeId === id) setActiveId(null);
    showToast('已从我的滤镜中删除');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {tab === 'camera' && (
          <CameraScreen
            luts={luts}
            activeLut={activeLut}
            strength={strength}
            onStrengthChange={setStrength}
            onSelectLut={(id) => setActiveId(id)}
            onOpenLibrary={() => setTab('library')}
            onToast={showToast}
            replicaOn={replicaOn}
            replicaSource={replicaSource}
            onReplicaToggle={() => setReplicaOn((v) => !v)}
          />
        )}
        {tab === 'library' && (
          <LibraryScreen
            luts={luts}
            activeLut={activeLut}
            onApply={applyLut}
            onOpenExtract={() => setTab('extract')}
          />
        )}
        {tab === 'extract' && (
          <ExtractScreen
            count={customLuts.length}
            onSave={saveLut}
            onToast={showToast}
            onOpenDna={setDnaLut}
            onReplica={(source) => {
              setReplicaSource(source);
              setReplicaOn(true);
              setTab('camera');
              showToast('复刻模式已开启 · 带着这张参考去拍');
            }}
          />
        )}
        {tab === 'myluts' && (
          <MyLutsScreen
            luts={customLuts}
            activeLut={activeLut}
            onApply={applyLut}
            onDelete={deleteLut}
            onOpenExtract={() => setTab('extract')}
            onOpenDna={setDnaLut}
          />
        )}
        {tab === 'settings' && <SettingsScreen onToast={showToast} />}
      </View>
      <TabBar tab={tab} onChange={setTab} />
      <Toast message={toast} bottom={96} />
      {dnaLut && (
        <DnaScreen
          base={dnaLut}
          onClose={() => setDnaLut(null)}
          onSave={(lut) => {
            saveLut(lut);
            setDnaLut(null);
          }}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
});
