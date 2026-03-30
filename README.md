# NotAcrobat

The free, offline, open-source PDF Swiss Army Knife. Built with Tauri + React + TypeScript.

## Downloads

Grab the latest build from [Releases](../../releases) or the **Artifacts** section of the latest [Actions run](../../actions).

| Platform | Formats |
|----------|---------|
| Windows  | `.msi`, `.exe` (NSIS) |
| Linux (Debian/Ubuntu) | `.deb` |
| Linux (Fedora/RHEL) | `.rpm` |
| Linux (Arch/Hyprland) | `.pkg.tar.zst` |
| Linux (other) | `.AppImage` |

## Linux: AppImage on Wayland

If you're on a non-Arch distro and must use the AppImage, you may hit:

```
Could not create default EGL display: EGL_BAD_PARAMETER
```

Fix it by preloading your system's libwayland:

```bash
LD_PRELOAD=/usr/lib/libwayland-client.so ./notacrobat_*.AppImage
```

> **Arch/Hyprland users:** Use the `.pkg.tar.zst` instead — it links against your system libraries and works natively on Wayland with no workarounds needed.

## Development

```bash
npm install
npm run tauri dev
```

## Building

```bash
npm run tauri build
```

## License

See [LICENSE](LICENSE).
