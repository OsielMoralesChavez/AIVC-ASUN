/** Puente expuesto por electron/preload.ts — solo existe cuando la app corre dentro de
 * Electron (empaquetada o vía `npm run dev:electron`); `undefined` en un navegador normal. */
export interface ElectronBridge {
  isElectron: true;
  chooseDirectory: () => Promise<string | null>;
  saveFile: (directory: string, fileName: string, data: ArrayBuffer) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}

export {};
