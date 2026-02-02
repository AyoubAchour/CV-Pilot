import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerWix } from '@electron-forge/maker-wix';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'node:fs';
import path from 'node:path';

const BUNDLE_ID = 'com.ayoubachour.vita';

// NOTE: This must remain stable across releases so MSI upgrades work properly.
const WIX_UPGRADE_CODE = 'd49d4815-c427-4ae9-90ab-3b6d5a84f4db';

const iconBasePath = path.resolve(process.cwd(), 'assets', 'icon');
const iconForCurrentPlatform = (() => {
  if (process.platform === 'win32') {
    return fs.existsSync(`${iconBasePath}.ico`) ? iconBasePath : undefined;
  }
  if (process.platform === 'darwin') {
    return fs.existsSync(`${iconBasePath}.icns`) ? iconBasePath : undefined;
  }
  return fs.existsSync(`${iconBasePath}.png`) ? iconBasePath : undefined;
})();

const enableMacSigning = process.env.MACOS_SIGN === '1';
const appleId = process.env.APPLE_ID;
const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
const appleTeamId = process.env.APPLE_TEAM_ID;

const windowsCertificateFile = process.env.WINDOWS_CERT_FILE;
const windowsCertificatePassword = process.env.WINDOWS_CERT_PASSWORD;

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: BUNDLE_ID,
    icon: iconForCurrentPlatform,
    extraResource: ['assets'],
    ...(enableMacSigning
      ? {
          osxSign: {},
          ...(appleId && appleIdPassword && appleTeamId
            ? {
                osxNotarize: {
                  appleId,
                  appleIdPassword,
                  teamId: appleTeamId,
                },
              }
            : {}),
        }
      : {}),
  },
  rebuildConfig: {},
  makers: [
    new MakerWix({
      manufacturer: 'Ayoub Achour',
      language: 1033,
      upgradeCode: WIX_UPGRADE_CODE,
      programFilesFolderName: 'VITA',
      shortcutFolderName: 'VITA',
      appUserModelId: BUNDLE_ID,
      ui: {
        // Traditional installer UX: allow users to choose install directory.
        chooseDirectory: true,
      },
      ...(windowsCertificateFile && windowsCertificatePassword
        ? {
            certificateFile: windowsCertificateFile,
            certificatePassword: windowsCertificatePassword,
          }
        : {}),
      icon: path.resolve(process.cwd(), 'assets', 'icon.ico'),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        // Linux filesystems are case-sensitive; our packaged executable is "VITA"
        // while the Debian/RPM package name (and /usr/bin symlink) remains "vita".
        bin: 'VITA',
      },
    }),
    new MakerDeb({
      options: {
        bin: 'VITA',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
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
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
