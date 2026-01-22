# PWA Assets

This directory contains Progressive Web App assets.

## Required Icons

For the PWA to work properly, you need to add the following icon files:

- `pwa-192x192.png` - 192x192 pixels icon
- `pwa-512x512.png` - 512x512 pixels icon

You can generate these icons from your app logo using tools like:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Any image editor (Photoshop, GIMP, etc.)

The icons will be used when users install the app on their devices.

## Temporary Solution

If you don't have icons yet, the app will still work, but users won't see a custom icon when installing.
The vite-plugin-pwa will generate default icons if these files are missing.
