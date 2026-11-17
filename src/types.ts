export type GradeParams = {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  fade: number;
};

export type Overlay = {
  highlight: string;
  mid: string;
  shadow: string;
  wash: string;
  amount: number;
};

export type Lut = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  palette: string[];
  params: GradeParams;
  overlay: Overlay;
  builtin?: boolean;
  createdAt: string;
};

export type TabKey = 'camera' | 'library' | 'extract' | 'myluts' | 'settings';

export type Analysis = {
  palette: string[];
  params: GradeParams;
  overlay: Overlay;
  tags: string[];
  name: string;
};
