import type { ForgeConfig } from '@electron-forge/shared-types';
import { readFileSync } from 'node:fs';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { PublisherGithub } from '@electron-forge/publisher-github';
import VitePlugin from '@electron-forge/plugin-vite';
import { MakerZIP } from '@electron-forge/maker-zip';
import { join } from 'path';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const squirrelName = 'vatsim_radar_desktop';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        name: 'VATSIM Radar',
        executableName: 'vatsim-radar',
        overwrite: true,
        prune: false,
        icon: './src/assets/favicon.ico',
        extraResource: ['./src/assets'],
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
            renderer: [],
        }),
    ],
    makers: [
        new MakerSquirrel({
            name: squirrelName,
            title: 'VATSIM Radar',
            description: 'VATSIM Radar',
            authors: 'Danila Rodichkin, VATSIM Radar Contributors',
            owners: 'Danila Rodichkin',
            iconUrl: 'https://next.vatsim-radar.com/favicon.ico',
            setupIcon: join('src', 'assets', 'favicon.ico'),
            version,
        }),
        new MakerZIP({}),
        // new MakerDeb({}, ['linux']),
    ],
    publishers: [
        new PublisherGithub({
            repository: {
                owner: 'VATSIM-Radar',
                name: 'desktop-app',
            },
            prerelease: true,
        }),
    ],
};

export default config;
