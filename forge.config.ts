import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        name: 'vatsim-radar-desktop',
        executableName: 'vatsim-radar-desktop',
        overwrite: true,
        prune: false,
    },
    outDir: 'out',
    buildIdentifier: 'test',
    rebuildConfig: {
        force: true,
    },
    makers: [
        new MakerSquirrel({
            description: 'VR Desktop',
            authors: 'Electron contributors',
        }),
        // new MakerZIP({}, ['darwin']),
        // new MakerDeb({}, ['linux']),
    ]
};

export default config;