import type { AppData } from '../types';

const STORAGE_KEY = 'excalidraw-tabs-data';

export const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getAppData = (): AppData | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};
