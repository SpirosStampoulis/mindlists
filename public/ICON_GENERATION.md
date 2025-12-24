# PWA Icon Generation

To generate the required PWA icons, you have two options:

## Option 1: Using the HTML Generator (Recommended)

1. Open `public/pwa-icon-generator.html` in your web browser
2. Click "Generate Icons" (they should generate automatically)
3. Click "Download 192x192" and save as `pwa-192x192.png` in the `public` folder
4. Click "Download 512x512" and save as `pwa-512x512.png` in the `public` folder

## Option 2: Using ImageMagick

If you have ImageMagick installed:

```bash
cd public
./generate-icons.sh
```

Or manually:

```bash
convert -size 192x192 xc:#3b82f6 -gravity center -pointsize 60 -fill white -annotate +0+0 "ML" pwa-192x192.png
convert -size 512x512 xc:#3b82f6 -gravity center -pointsize 160 -fill white -annotate +0+0 "ML" pwa-512x512.png
```

## Option 3: Replace with Custom Icons

You can replace the generated icons with your own custom icons:
- `pwa-192x192.png` - 192x192 pixels
- `pwa-512x512.png` - 512x512 pixels

Make sure they are PNG format and match the exact dimensions.

## Note

The PWA will work without these icons, but they are recommended for a better user experience when installing the app.



