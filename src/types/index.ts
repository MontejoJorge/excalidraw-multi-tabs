import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';

export type AppTheme = 'light' | 'dark';

export type TabColor =
  | 'default'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'cyan';
export const TAB_COLORS: TabColor[] = [
  'default',
  'blue',
  'emerald',
  'amber',
  'purple',
  'rose',
  'cyan',
];

export const getRandomTabColor = (): TabColor => {
  return TAB_COLORS[Math.floor(Math.random() * TAB_COLORS.length)];
};

export interface ITab {
  id: number;
  title: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  color?: TabColor;
}

export interface AppData {
  tabs: ITab[];
  currentTabId: number;
  theme?: AppTheme;
}
