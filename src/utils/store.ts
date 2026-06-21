import Store from 'electron-store';

export const store = new Store<{ width: number; height: number; x: number; y: number; maximized: boolean }>();
