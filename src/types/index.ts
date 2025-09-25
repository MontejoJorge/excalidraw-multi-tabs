import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';

export interface ITab {
  id: number;
  title: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
}

export interface AppData {
  tabs: ITab[];
  currentTabId: number;
}
