import { ImageSourcePropType } from 'react-native';
import { Asset } from 'expo-asset';

export async function resolveImageUri(source: ImageSourcePropType): Promise<string> {
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri;
  }
  const withUri = source as { uri?: string };
  if (!withUri.uri) throw new Error('无法解析图片地址');
  return withUri.uri;
}
