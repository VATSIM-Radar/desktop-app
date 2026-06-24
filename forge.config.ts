import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import VitePlugin from '@electron-forge/plugin-vite';
import { version } from './package.json' with { type: 'json' };

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        name: 'VATSIM Radar',
        executableName: 'vatsim-radar',
        overwrite: true,
        prune: false,
        icon: './src/assets/icon.png',
    },
    outDir: 'out',
    buildIdentifier: 'test',
    rebuildConfig: {
        force: true,
    },
    plugins: [
        new VitePlugin({
            build: [
                {
                    entry: 'src/app.ts',
                    config: 'vite.main.config.ts',
                    target: 'main',
                },
                {
                    entry: 'src/preload.ts',
                    config: 'vite.main.config.ts',
                    target: 'preload',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
    ],
    makers: [
        new MakerSquirrel({
            title: 'VATSIM Radar',
            name: 'VATSIM Radar',
            description: 'VATSIM Radar',
            authors: 'Danila Rodichkin, VATSIM Radar Contributors',
            owners: 'Danila Rodichkin',
            iconUrl: 'https://next.vatsim-radar.com/web-app-manifest-192x192.png',
            version,
        }),
        // new MakerZIP({}, ['darwin']),
        // new MakerDeb({}, ['linux']),
    ],
};

export default config;
