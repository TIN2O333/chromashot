declare module 'jpeg-js' {
  export type RawImageData = {
    width: number;
    height: number;
    data: Uint8Array;
  };

  export function decode(
    data: Uint8Array | Buffer,
    opts?: { useTArray?: boolean; formatAsRGBA?: boolean; maxMemoryUsageInMB?: number }
  ): RawImageData;

  export function encode(
    imgData: { data: Uint8Array; width: number; height: number },
    quality?: number
  ): { data: Uint8Array; width: number; height: number };
}
