# CV Pilot

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
- Set `CV_PILOT_GITHUB_CLIENT_ID` in `.env`

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

## Configuration

### Environment variables

- `CV_PILOT_GITHUB_CLIENT_ID` (optional, required only for GitHub import)

OpenAI is configured inside the app UI (OpenAI Settings) and stored securely on the local machine.

## Data storage (local)

CV Pilot stores all data locally using Electron’s `userData` directory:

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

Set `CV_PILOT_GITHUB_CLIENT_ID` in `.env` (see `.env.example`).

### OpenAI settings say secure storage is unavailable

Electron `safeStorage` depends on OS-level facilities. Until encryption is available, CV Pilot won’t store API keys.

## License

MIT — see LICENSE.
