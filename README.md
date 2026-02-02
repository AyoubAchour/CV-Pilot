# VITA

A cross-platform desktop app for drafting and maintaining a clean, ATS-friendly CV.

Built with Electron Forge + Vite + TypeScript.

## Features

- **Local CV projects**: create and edit multiple CV “projects” stored on your machine.
- **PDF export**: export your CV to an A4 PDF.
- **GitHub import (optional)**: connect GitHub and pull repo context (including README) to help populate CV content.
- **AI assist (optional)**:
  - Generate CV improvement suggestions from selected GitHub repos.
  - Generate a role-focused, professional “Summary” section from your CV content.

## Quick start

### Prerequisites

- Node.js + npm

### Install

```bash
npm install
```

### Configure GitHub import (optional)

GitHub import uses GitHub OAuth **Device Flow** and requires an OAuth App Client ID.

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Create a GitHub OAuth App and set the Client ID:

- Create an OAuth App: https://github.com/settings/developers
- Set `VITA_GITHUB_CLIENT_ID` in `.env` (or legacy `CV_PILOT_GITHUB_CLIENT_ID`)

Note: The **Client ID is not a secret** and can be shipped with the app. VITA uses OAuth **Device Flow**, so users will authenticate in their browser and paste a short code.

### Run the app

```bash
npm start
```

## Build & package

```bash
# Create an unpacked build
npm run package

# Create distributables (platform-dependent)
npm run make
```

## Icons

See [assets/README.md](assets/README.md) for icon placement.

## CI builds

GitHub Actions workflow: [.github/workflows/build.yml](.github/workflows/build.yml)

It builds on Windows, macOS, and Linux and uploads the Forge outputs from `out/` as workflow artifacts.

## Release publishing

Pushing a Git tag starting with `v` (example: `v1.0.0`) will:

- Run the same multi-OS builds
- Create a GitHub Release
- Attach the built artifacts to the Release

Example:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Windows MSI builds (WiX)

Windows MSI builds use the WiX Toolset v3 (traditional installer / wizard).

- Install WiX Toolset v3 via Chocolatey (pin recommended):

```powershell
choco install wixtoolset --version=3.14.0
```

Notes:

- The installer can optionally allow choosing an install directory (configured in `forge.config.ts`).
- Windows app icons require `assets/icon.ico` (we generate it from `assets/icon.png` on Windows during `npm run make`).

## Code signing (optional)

- **Windows (Squirrel)**: provide a PFX certificate via GitHub Actions secrets `WINDOWS_CERT_PFX_BASE64` and `WINDOWS_CERT_PASSWORD`.
- **macOS (sign + notarize)**: provide `MACOS_CERT_P12_BASE64`, `MACOS_CERT_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.

## Configuration

### Environment variables

- `VITA_GITHUB_CLIENT_ID` (optional, required only for GitHub import; legacy `CV_PILOT_GITHUB_CLIENT_ID` still supported)

In packaged builds, VITA can embed a default GitHub OAuth Client ID at build time (so end users don't need a `.env`). A runtime environment variable still overrides the embedded value.

OpenAI is configured inside the app UI (OpenAI Settings) and stored securely on the local machine.

## Data storage (local)

VITA stores all data locally using Electron’s `userData` directory:

- CV projects: `userData/projects/<projectId>/`
  - `cv.json`
  - `project.json`
- Secrets/config (encrypted when available): `userData/secrets.json`

If you want to back up your CVs, back up the `projects` directory.

## Security & privacy

- **GitHub token and OpenAI API key** are stored locally using Electron `safeStorage` encryption.
- If secure storage is unavailable on your system, the app will refuse to save secrets (and AI/GitHub features that require saved secrets will not work until fixed).
- **GitHub import**: the app requests GitHub access via OAuth Device Flow. You can disconnect at any time.
- **OpenAI features**: when you use AI actions, a minimized CV/GitHub context is sent to the OpenAI API endpoint configured by the app.

## Development scripts

- `npm start` — run Electron Forge in dev
- `npm run lint` — run ESLint
- `npm run package` — package the app
- `npm run make` — build installers / distributables

## Troubleshooting

### GitHub import says the client id is missing

Set `VITA_GITHUB_CLIENT_ID` in `.env` (see `.env.example`).

### OpenAI settings say secure storage is unavailable

Electron `safeStorage` depends on OS-level facilities. Until encryption is available, VITA won’t store API keys.

## License

MIT — see LICENSE.
