# Plane Desktop App — Linux Setup

## Prerequisites

- A Linux distribution with a Wayland or X11 desktop environment
- The Plane `.AppImage` file downloaded to `~/Downloads`

## 1. Install AppImageLauncher

AppImageLauncher handles desktop integration (menu entries, icons) for AppImage files.

**Arch Linux (AUR):**

```bash
yay -S appimagelauncher
```

**Ubuntu/Debian:**

Download the latest `.deb` from [AppImageLauncher releases](https://github.com/TheAssassin/AppImageLauncher/releases) and install:

```bash
sudo dpkg -i appimagelauncher_*.deb
sudo apt-get install -f
```

**Fedora:**

Download the latest `.rpm` from [AppImageLauncher releases](https://github.com/TheAssassin/AppImageLauncher/releases) and install:

```bash
sudo rpm -i appimagelauncher-*.rpm
```

## 2. Install the Plane AppImage

1. Make the AppImage executable:

   ```bash
   chmod +x ~/Downloads/Plane-*.AppImage
   ```

2. Run the AppImage:

   ```bash
   ~/Downloads/Plane-*.AppImage
   ```

3. AppImageLauncher will show a dialog asking to **Integrate and run** or **Run once**. Choose **Integrate and run**.

   This moves the AppImage to `~/Applications/` and creates a `.desktop` entry so Plane appears in your application launcher.

## 3. Register the `plane://` Protocol Handler

To enable deep links (e.g., `plane://` URLs that open directly in the desktop app), you need to register a protocol handler.

1. Find the Plane `.desktop` file:

   ```bash
   ls ~/.local/share/applications/ | grep -i plane
   ```

   You should see something like `appimagekit_...-Plane.desktop`.

2. Add the protocol handler to the `.desktop` file:

   ```bash
   DESKTOP_FILE=$(ls ~/.local/share/applications/appimagekit_*-Plane.desktop 2>/dev/null | head -1)

   # Check it doesn't already have MimeType for plane
   if ! grep -q "x-scheme-handler/plane" "$DESKTOP_FILE"; then
     sed -i '/^Categories=/i MimeType=x-scheme-handler/plane;' "$DESKTOP_FILE"
   fi
   ```

3. Register the handler with your desktop environment:

   ```bash
   DESKTOP_FILENAME=$(basename "$DESKTOP_FILE")
   xdg-mime default "$DESKTOP_FILENAME" x-scheme-handler/plane
   update-desktop-database ~/.local/share/applications/
   ```

4. Verify it works:

   ```bash
   xdg-open plane://test
   ```

   The Plane desktop app should launch (or come to focus if already running).

## Troubleshooting

### AppImageLauncher dialog doesn't appear

Make sure the AppImageLauncher daemon is running:

```bash
# Check if the service is active
systemctl --user status appimagelauncherd

# Start it if needed
systemctl --user enable --now appimagelauncherd
```

### `plane://` links don't open the app

Verify the handler is registered:

```bash
xdg-mime query default x-scheme-handler/plane
```

This should print the Plane `.desktop` filename. If it doesn't, re-run step 3 above.

### App doesn't launch on Wayland

If the app fails to start or shows a blank window, try launching with the Ozone flag:

```bash
~/Applications/Plane-*.AppImage --ozone-platform-hint=auto
```

To make this permanent, edit the `Exec` line in the `.desktop` file to include the flag before `%U`.

### Updating the AppImage

When you download a new version:

1. Remove the old version via the application launcher (right-click → "Delete this AppImage") or delete it from `~/Applications/`.
2. Run the new `.AppImage` from `~/Downloads/` — AppImageLauncher will prompt to integrate it again.
3. Re-run the protocol handler registration (step 3) since the `.desktop` file will be recreated.
