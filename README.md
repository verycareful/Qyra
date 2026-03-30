# NotAcrobat

The free, offline, open-source PDF Swiss Army Knife. Built with Tauri + React + TypeScript.

## Downloads

Grab the latest build from [Releases](../../releases) or the **Artifacts** section of the latest [Actions run](../../actions).

| Platform | Formats |
|----------|---------|
| Windows  | `.msi`, `.exe` (NSIS) |
| Linux    | `.deb`, `.rpm`, `.AppImage` |

## Linux on Wayland (Arch, Hyprland, etc.)

The AppImage is pre-patched to use your system's `libwayland-client.so` instead of the bundled copy, and the app disables WebKitGTK's DMA-buf renderer at startup. Both fixes are baked in, no `LD_PRELOAD` or env var workarounds needed.

If you prefer a managed pacman install, you can convert the `.deb` using `debtap` (available in the AUR):

```bash
sudo debtap -u
debtap notacrobat_*.deb
sudo pacman -U notacrobat-*.pkg.tar.zst
```

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
