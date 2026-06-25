import type { ForgeConfig } from '@electron-forge/shared-types';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync } from 'node:fs';
import { dirname, extname, join } from 'path';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { PublisherGithub } from '@electron-forge/publisher-github';
import VitePlugin from '@electron-forge/plugin-vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const releaseChannel = process.env.RELEASE_CHANNEL === 'next' ? 'next' : 'prod';
const isNextRelease = releaseChannel === 'next';
const appDomain = process.env.VITE_DOMAIN ?? (isNextRelease ? 'https://next.vatsim-radar.com' : 'https://vatsim-radar.com');
const appDisplayName = isNextRelease ? 'VATSIM Radar Next' : 'VATSIM Radar';

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
        name: appDisplayName,
        executableName: 'vatsim-radar',
        overwrite: true,
        prune: false,
        icon: process.env.PACKAGER_ICON ?? './src/assets/favicon.ico',
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
            name: 'vatsim_radar_desktop',
            title: appDisplayName,
            description: appDisplayName,
            authors: 'Danila Rodichkin, VATSIM Radar Contributors',
            owners: 'Danila Rodichkin',
            iconUrl: `${ appDomain }/favicon.ico`,
            setupIcon: join('src', 'assets', 'favicon.ico'),
            setupExe: 'vatsim-radar-setup.exe',
            version,
        }, ['win32']),
        new MakerDMG({
            name: `${ appDisplayName }-${ version }`,
            icon: process.env.MAC_INSTALLER_ICON ?? join('src', 'assets', 'icon.png'),
            format: 'ULFO',
        }, ['darwin']),
        new MakerZIP({}, ['win32', 'darwin', 'linux']),
        new MakerDeb({
            options: {
                name: 'vatsim-radar',
                productName: appDisplayName,
                genericName: appDisplayName,
                description: `${ appDisplayName } desktop application`,
                productDescription: `Desktop wrapper for ${ appDisplayName }.`,
                maintainer: 'Danila Rodichkin',
                homepage: appDomain,
                bin: 'vatsim-radar',
                icon: join('src', 'assets', 'icon.png'),
                categories: ['Network'],
            },
        }),
    ],
    hooks: {
        postPackage: async (_config, packageResult) => {
            if (packageResult.platform !== 'darwin') return;

            for (const outputPath of packageResult.outputPaths) {
                execFileSync('codesign', ['--force', '--deep', '--sign', '-', outputPath], {
                    stdio: 'inherit',
                });
            }
        },
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
