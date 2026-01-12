import { create } from 'zustand';
import { createStore, setMany, delMany, entries } from 'idb-keyval';
import type { BinaryFileData, BinaryFiles } from '@excalidraw/excalidraw/types';

const excalidrawFilesStore = createStore('excalidraw-db', 'files');

interface ExcalidrawFilesStoreState {
  files: BinaryFiles;
  setFiles: (files: BinaryFiles) => Promise<void>;
  getFiles: () => Promise<BinaryFiles>;
}

export const useExcalidrawFilesStore = create<ExcalidrawFilesStoreState>()((
  set,
  get,
) => {
  const loadInitialFiles = async (): Promise<BinaryFiles> => {
    const allEntries = await entries(excalidrawFilesStore);
    const files = Object.fromEntries(allEntries) as BinaryFiles;
    return files;
  };

  const initialFiles = {};

  const getFiles = async () => {
    const state = get();
    if (state.files && Object.keys(state.files).length > 0) {
      return state.files;
    }

    const loadedFiles = await loadInitialFiles();
    set({ files: loadedFiles });
    return loadedFiles;
  }

  const setFiles = async (files: BinaryFiles) => {
    const currentKeys = Object.keys(get().files)
    const newKeys = Object.keys(files);

    const keysToAdd = newKeys.filter((k) => !currentKeys.includes(k));
    const keysToDelete = currentKeys.filter((k) => !newKeys.includes(k));

    if (keysToAdd.length === 0 && keysToDelete.length === 0) {
      return;
    }

    const entriesToAdd = keysToAdd.map(
      (id) => [id, files[id]] as [string, BinaryFileData],
    );

    if (entriesToAdd.length > 0) {
      await setMany(entriesToAdd, excalidrawFilesStore);
    }

    if (keysToDelete.length > 0) {
      await delMany(keysToDelete, excalidrawFilesStore);
    }

    set({ files });
  }

  return {
    files: initialFiles,

    getFiles,
    setFiles,
  };
});
