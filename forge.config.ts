import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'node:fs';
import path from 'node:path';

const BUNDLE_ID = 'com.ayoubachour.vita';

const iconBasePath = path.resolve(process.cwd(), 'assets', 'icon');
const hasIcon =
  fs.existsSync(`${iconBasePath}.png`) ||
  fs.existsSync(`${iconBasePath}.ico`) ||
  fs.existsSync(`${iconBasePath}.icns`);

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
    icon: hasIcon ? iconBasePath : undefined,
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
    new MakerSquirrel(
      windowsCertificateFile && windowsCertificatePassword
        ? {
            certificateFile: windowsCertificateFile,
            certificatePassword: windowsCertificatePassword,
          }
        : {},
    ),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
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
