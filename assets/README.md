# Icons

Place your app icon source here.

## Source icon (required)

- `assets/icon.png` (1024×1024)

This repo is wired so Electron Forge will automatically pick up `assets/icon.*` during packaging if the files exist.

## Platform-specific icons 

If you add these, packaging will use them automatically:

- `assets/icon.ico` (Windows)
- `assets/icon.icns` (macOS)

If you only provide `assets/icon.png`, builds will still work, but Windows/macOS installers may fall back to a generic icon until you add the `.ico` / `.icns` files.
