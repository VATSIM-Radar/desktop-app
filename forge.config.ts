import type { ForgeConfig } from '@electron-forge/shared-types';
import { existsSync, readFileSync, renameSync } from 'node:fs';
import { dirname, extname, join } from 'path';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { PublisherGithub } from '@electron-forge/publisher-github';
import VitePlugin from '@electron-forge/plugin-vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const squirrelName = 'vatsim_radar_desktop';
const releaseChannel = process.env.RELEASE_CHANNEL === 'next' ? 'next' : 'prod';
const isNextRelease = releaseChannel === 'next';
const appDomain = process.env.VITE_DOMAIN ?? (isNextRelease ? 'https://next.vatsim-radar.com' : 'https://vatsim-radar.com');
const packagerIcon = process.env.PACKAGER_ICON ?? './src/assets/favicon.ico';
const macInstallerIcon = process.env.MAC_INSTALLER_ICON ?? join('src', 'assets', 'icon.png');

const getArtifactName = (artifactPath: string, platform: string, arch: string) => {
    const extension = extname(artifactPath);

    if (extension === '.exe') return 'vatsim-radar-setup.exe';
    if (extension === '.dmg') return `vatsim-radar-${ platform }-${ arch }.dmg`;
    if (extension === '.deb') return `vatsim-radar-${ platform }-${ arch }.deb`;
    if (extension === '.zip') return `vatsim-radar-${ platform }-${ arch }.zip`;

    return undefined;
};

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        name: 'VATSIM Radar',
        executableName: 'vatsim-radar',
        overwrite: true,
        prune: false,
        icon: packagerIcon,
        extraResource: ['./src/assets'],
    },
    outDir: 'out',
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
            iconUrl: `${ appDomain }/favicon.ico`,
            setupIcon: join('src', 'assets', 'favicon.ico'),
            setupExe: 'vatsim-radar-setup.exe',
            version,
        }, ['win32']),
        new MakerDMG({
            name: `VATSIM Radar-${ version }`,
            icon: macInstallerIcon,
            format: 'ULFO',
        }, ['darwin']),
        new MakerZIP({}, ['win32', 'darwin', 'linux']),
        new MakerDeb({
            options: {
                name: 'vatsim-radar',
                productName: 'VATSIM Radar',
                genericName: 'VATSIM Radar',
                description: 'VATSIM Radar desktop application',
                productDescription: 'Desktop wrapper for VATSIM Radar.',
                maintainer: 'Danila Rodichkin',
                homepage: appDomain,
                icon: join('src', 'assets', 'icon.png'),
                categories: ['Network'],
            },
        }),
    ],
    hooks: {
        postMake: async (_config, makeResults) => {
            for (const makeResult of makeResults) {
                makeResult.artifacts = makeResult.artifacts.map(artifactPath => {
                    const artifactName = getArtifactName(artifactPath, makeResult.platform, makeResult.arch);
                    if (!artifactName) return artifactPath;

                    const renamedPath = join(dirname(artifactPath), artifactName);
                    if (artifactPath === renamedPath) return artifactPath;

                    if (existsSync(renamedPath)) {
                        return renamedPath;
                    }

                    renameSync(artifactPath, renamedPath);
                    return renamedPath;
                });
            }

            return makeResults;
        },
    },
    publishers: [
        new PublisherGithub({
            repository: {
                owner: 'VATSIM-Radar',
                name: 'desktop-app',
            },
            prerelease: isNextRelease,
            draft: false,
            tagPrefix: isNextRelease ? 'next-v' : 'v',
            force: true,
            generateReleaseNotes: true,
        }),
    ],
};

export default config;
