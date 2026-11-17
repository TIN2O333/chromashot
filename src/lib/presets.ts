import { Analysis, Lut } from '../types';

export const CATEGORIES = ['全部', '胶片', 'CCD', '拍立得', '电影感', '黑白', '自定义'];

const now = '2026-11-17';

export const PRESET_LUTS: Lut[] = [
  {
    id: 'builtin-golden',
    name: '暖阳胶片',
    category: '胶片',
    tags: ['暖调', '柔光', '胶片感'],
    palette: ['#F7D9A8', '#D9A268', '#8C6B4A', '#3B3029', '#E8A055'],
    params: { exposure: 0.12, contrast: -0.05, saturation: 0.12, temperature: 0.45, tint: 0.05, fade: 0.18 },
    overlay: { highlight: '#FFD9A0', mid: '#D8A06A', shadow: '#2B2622', wash: '#E8A055', amount: 0.95 },
    builtin: true,
    createdAt: now,
  },
  {
    id: 'builtin-ccd',
    name: '冷调 CCD',
    category: 'CCD',
    tags: ['冷调', '高对比', '清透感'],
    palette: ['#DDEBF2', '#A7C2D2', '#6E8CA0', '#2A343B', '#1B2226'],
    params: { exposure: -0.05, contrast: 0.22, saturation: 0.05, temperature: -0.42, tint: -0.06, fade: 0.02 },
    overlay: { highlight: '#DDEBF2', mid: '#8FA9B8', shadow: '#1B2226', wash: '#6FA8C4', amount: 0.9 },
    builtin: true,
    createdAt: now,
  },
  {
    id: 'builtin-polaroid',
    name: '奶油拍立得',
    category: '拍立得',
    tags: ['中性', '柔光', '胶片感'],
    palette: ['#FFF4E2', '#F0E1CC', '#D6C0A6', '#8A7663', '#3A342E'],
    params: { exposure: 0.18, contrast: -0.28, saturation: -0.06, temperature: 0.14, tint: 0.04, fade: 0.3 },
    overlay: { highlight: '#FFF4E2', mid: '#E6D6C2', shadow: '#3A342E', wash: '#EBD3B6', amount: 0.85 },
    builtin: true,
    createdAt: now,
  },
  {
    id: 'builtin-cinema',
    name: '电影青橙',
    category: '电影感',
    tags: ['暖调', '硬朗', '高饱和'],
    palette: ['#FFC07A', '#C98A55', '#5E6F6A', '#1C3A40', '#0E1F24'],
    params: { exposure: -0.08, contrast: 0.3, saturation: 0.2, temperature: 0.28, tint: -0.12, fade: 0.04 },
    overlay: { highlight: '#FFC07A', mid: '#B07A55', shadow: '#10262B', wash: '#E8823C', amount: 1 },
    builtin: true,
    createdAt: now,
  },
  {
    id: 'builtin-silver',
    name: '银盐黑白',
    category: '黑白',
    tags: ['中性', '硬朗', '清透感'],
    palette: ['#F2F2F0', '#C4C4C0', '#8A8A86', '#4A4A48', '#141414'],
    params: { exposure: 0.02, contrast: 0.24, saturation: -0.9, temperature: 0, tint: 0, fade: 0.06 },
    overlay: { highlight: '#F2F2F0', mid: '#9A9A96', shadow: '#141414', wash: '#8C8C8C', amount: 0.8 },
    builtin: true,
    createdAt: now,
  },
  {
    id: 'builtin-haze',
    name: '雾霾蓝',
    category: '电影感',
    tags: ['冷调', '柔光', '清透感'],
    palette: ['#DCE6F0', '#B3C4D4', '#7E95AA', '#3A4753', '#232A33'],
    params: { exposure: 0.06, contrast: -0.18, saturation: -0.12, temperature: -0.3, tint: -0.04, fade: 0.2 },
    overlay: { highlight: '#DCE6F0', mid: '#8FA3B8', shadow: '#232A33', wash: '#7E9BBE', amount: 0.8 },
    builtin: true,
    createdAt: now,
  },
];

export const FALLBACK_ANALYSIS: Analysis = {
  palette: ['#F7D9A8', '#D9A268', '#8C6B4A', '#3B3029', '#E8A055'],
  params: { exposure: 0.1, contrast: -0.06, saturation: 0.14, temperature: 0.4, tint: 0.06, fade: 0.16 },
  overlay: { highlight: '#FFD9A0', mid: '#D8A06A', shadow: '#2B2622', wash: '#E8A055', amount: 0.95 },
  tags: ['暖调', '柔光', '胶片感'],
  name: '暖调柔光胶片',
};
